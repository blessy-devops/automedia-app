// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'
import { scrapeSocialBladeV2 } from '../_shared/socialblade-scraper-v2.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Enrichment Step 2: SocialBlade Metrics
 *
 * Orchestrates the Social Blade scraping process:
 * 1. Calls Vercel Function to scrape Social Blade data
 * 2. Receives raw daily statistics (views, videos posted)
 * 3. Calculates metrics (total views, videos count, averages, growth rate)
 * 4. Queries historical data from benchmark_channels
 * 5. Performs UPSERT on benchmark_channels_baseline_stats
 * 6. Invokes next step in the pipeline
 */
Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  let taskId: number | null = null

  try {
    console.log('[Step 2: SocialBlade] Starting SocialBlade metrics orchestration')

    const { channelId, taskId: reqTaskId } = await req.json()
    taskId = reqTaskId

    if (!channelId || !taskId) {
      throw new Error('Missing required parameters: channelId or taskId')
    }

    console.log(`[Step 2: SocialBlade] Processing channel: ${channelId}, task: ${taskId}`)

    // ========================================================================
    // STEP 1: Update task status to 'processing'
    // ========================================================================
    console.log('[Step 2: SocialBlade] Updating task status to processing')
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        socialblade_status: 'processing',
        socialblade_started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // ========================================================================
    // STEP 2: Scrape Social Blade using V2 scraper (non-blocking on failure)
    // ========================================================================
    console.log('[Step 2: SocialBlade] Calling SocialBlade scraper V2...')

    let scrapedData = null
    let socialBladeAvailable = true

    try {
      scrapedData = await scrapeSocialBladeV2(channelId)
      if (scrapedData) {
        console.log(`[Step 2: SocialBlade] Received ${scrapedData.dailyStats.length} days of data`)
      } else {
        console.warn('[Step 2: SocialBlade] Scraper returned null - channel may be too small or not indexed')
        socialBladeAvailable = false
      }
    } catch (scrapeError) {
      console.warn('[Step 2: SocialBlade] ⚠️  Scraping failed - channel may be too new or not indexed in Social Blade')
      console.warn('[Step 2: SocialBlade] Error details:', scrapeError instanceof Error ? scrapeError.message : scrapeError)
      socialBladeAvailable = false
    }

    // ========================================================================
    // STEP 3: Handle Social Blade unavailability (skip but continue pipeline)
    // ========================================================================
    if (!socialBladeAvailable || !scrapedData || !scrapedData.dailyStats || scrapedData.dailyStats.length === 0) {
      console.log('[Step 2: SocialBlade] No Social Blade data available - creating empty baseline record and continuing pipeline')

      // Create empty baseline stats record to maintain data consistency
      const { error: emptyUpsertError } = await supabase
        .from('benchmark_channels_baseline_stats')
        .upsert({
          channel_id: channelId,
          is_available: false,
          total_views_14d: null,
          videos_count_14d: null,
          avg_views_per_video_14d: null,
          avg_views_per_video_historical: null,
          media_diaria_views_14d: null,
          taxa_crescimento: null,
          calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'channel_id'
        })

      if (emptyUpsertError) {
        console.error('[Step 2: SocialBlade] Error creating empty baseline record:', emptyUpsertError)
        // Don't throw - we can continue without baseline stats
      }

      // Mark task as 'skipped' (not failed - this is expected for new channels)
      await supabase
        .from('channel_enrichment_tasks')
        .update({
          socialblade_status: 'skipped',
          socialblade_available: false,
          socialblade_completed_at: new Date().toISOString(),
          socialblade_result: {
            message: 'Social Blade data not available (channel too new or not indexed)',
            skipped: true,
          },
        })
        .eq('id', taskId)

      // CRITICAL: Continue to Step 3 despite Social Blade failure
      console.log('[Step 2: SocialBlade] Invoking Step 3: Recent Videos (despite Social Blade skip)')

      const nextStepResponse = await supabase.functions.invoke('enrichment-step-3-recent-videos', {
        body: { channelId, taskId },
      })

      if (nextStepResponse.error) {
        console.error('[Step 2: SocialBlade] Error invoking Step 3:', nextStepResponse.error)
      }

      console.log('[Step 2: SocialBlade] Completed with Social Blade skipped - pipeline continues')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Social Blade skipped, pipeline continues',
          channelId,
          taskId,
          socialBladeAvailable: false,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // ========================================================================
    // STEP 4: Extract metrics from scraped data (already calculated by V2)
    // ========================================================================
    // Defensive null check to prevent crashes
    if (!scrapedData || !scrapedData.aggregated || !scrapedData.dailyStats) {
      console.error('[Step 2: SocialBlade] Invalid scraper response - missing required fields')
      throw new Error('Scraper returned invalid data structure')
    }

    const { aggregated, dailyStats } = scrapedData

    // Use aggregated metrics from V2 scraper
    const totalSubscribers14d = aggregated.totalSubscribers
    const totalViews14d = aggregated.totalViews
    const videosCount14d = aggregated.totalVideosPosted
    const mediaDiariaViews14d = aggregated.averageViewsPerDay
    const avgViewsPerVideo14d = aggregated.totalVideosPosted > 0
      ? aggregated.totalViews / aggregated.totalVideosPosted
      : 0

    // Calculate growth rate (taxa_crescimento)
    // Compare first half vs second half of the period
    let taxaCrescimento = 0
    if (dailyStats.length >= 6) {
      const meio = Math.floor(dailyStats.length / 2)
      const primeiraMetade = dailyStats.slice(0, meio)
      const segundaMetade = dailyStats.slice(meio)

      const mediaInicio = primeiraMetade.reduce((sum, day) => sum + day.views, 0) / primeiraMetade.length
      const mediaFim = segundaMetade.reduce((sum, day) => sum + day.views, 0) / segundaMetade.length

      if (mediaInicio > 0) {
        taxaCrescimento = ((mediaFim - mediaInicio) / mediaInicio) * 100
      }
    }

    console.log('[Step 2: SocialBlade] Calculated metrics:', {
      totalSubscribers14d,
      totalViews14d,
      videosCount14d,
      avgViewsPerVideo14d: avgViewsPerVideo14d.toFixed(2),
      mediaDiariaViews14d: mediaDiariaViews14d.toFixed(2),
      taxaCrescimento: taxaCrescimento.toFixed(2),
    })

    // ========================================================================
    // STEP 4: Query historical data from benchmark_channels
    // ========================================================================
    console.log('[Step 2: SocialBlade] Querying historical data...')

    const { data: channelData, error: channelError } = await supabase
      .from('benchmark_channels')
      .select('total_views, video_upload_count')
      .eq('channel_id', channelId)
      .single()

    if (channelError && channelError.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok
      console.warn('[Step 2: SocialBlade] Error fetching channel data:', channelError)
    }

    // Calculate average views per video (historical)
    let avgViewsPerVideoHistorical = 0
    if (channelData && channelData.total_views && channelData.video_upload_count) {
      avgViewsPerVideoHistorical = Number(channelData.total_views) / channelData.video_upload_count
    }

    console.log('[Step 2: SocialBlade] Historical average:', avgViewsPerVideoHistorical.toFixed(2))

    // ========================================================================
    // STEP 5: UPSERT baseline stats using Supabase Client
    // ========================================================================
    console.log('[Step 2: SocialBlade] Upserting baseline stats...')

    const { error: upsertError } = await supabase
      .from('benchmark_channels_baseline_stats')
      .upsert({
        channel_id: channelId,
        is_available: true, // Social Blade data successfully retrieved
        total_views_14d: totalViews14d,
        videos_count_14d: videosCount14d,
        avg_views_per_video_14d: avgViewsPerVideo14d,
        avg_views_per_video_historical: avgViewsPerVideoHistorical,
        media_diaria_views_14d: mediaDiariaViews14d,
        taxa_crescimento: taxaCrescimento,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'channel_id'
      })

    if (upsertError) {
      console.error('[Step 2: SocialBlade] Error upserting baseline stats:', upsertError)
      throw new Error(`Failed to upsert baseline stats: ${upsertError.message}`)
    }

    console.log('[Step 2: SocialBlade] Baseline stats upserted successfully')

    // ========================================================================
    // STEP 6: Update task status to 'completed'
    // ========================================================================
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        socialblade_status: 'completed',
        socialblade_available: true, // Data successfully retrieved
        socialblade_completed_at: new Date().toISOString(),
        socialblade_result: {
          totalSubscribers14d,
          totalViews14d,
          videosCount14d,
          avgViewsPerVideo14d,
          mediaDiariaViews14d,
          taxaCrescimento,
          avgViewsPerVideoHistorical,
          daysProcessed: dailyStats.length,
        },
      })
      .eq('id', taskId)

    // ========================================================================
    // STEP 7: Invoke next step in the pipeline
    // ========================================================================
    console.log('[Step 2: SocialBlade] Invoking Step 3: Recent Videos')

    const nextStepResponse = await supabase.functions.invoke('enrichment-step-3-recent-videos', {
      body: { channelId, taskId },
    })

    if (nextStepResponse.error) {
      console.error('[Step 2: SocialBlade] Error invoking next step:', nextStepResponse.error)
      // Don't throw - this step completed successfully
    }

    console.log('[Step 2: SocialBlade] Completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SocialBlade metrics orchestration completed',
        channelId,
        taskId,
        metrics: {
          totalSubscribers14d,
          totalViews14d,
          videosCount14d,
          avgViewsPerVideo14d,
          mediaDiariaViews14d,
          taxaCrescimento,
          avgViewsPerVideoHistorical,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Step 2: SocialBlade] Unexpected error:', error)

    // Update task status to skipped (not failed - we want pipeline to continue)
    if (taskId) {
      // Retry logic to ensure status update succeeds (prevents stuck "processing" state)
      let updateSuccess = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { error: updateError } = await supabase
            .from('channel_enrichment_tasks')
            .update({
              socialblade_status: 'skipped',
              socialblade_available: false,
              socialblade_error: error instanceof Error ? error.message : 'Unknown error',
              socialblade_completed_at: new Date().toISOString(),
            })
            .eq('id', taskId)

          if (!updateError) {
            console.log(`[Step 2: SocialBlade] Status updated to 'skipped' on attempt ${attempt}`)
            updateSuccess = true
            break
          }

          console.error(`[Step 2: SocialBlade] Update attempt ${attempt} failed:`, updateError)
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        } catch (updateError) {
          console.error(`[Step 2: SocialBlade] Update attempt ${attempt} threw error:`, updateError)
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
      }

      if (!updateSuccess) {
        console.error('[Step 2: SocialBlade] ⚠️  CRITICAL: Failed to update status after 3 attempts - task may be stuck!')
      }

      // Try to continue pipeline even after unexpected error
      console.log('[Step 2: SocialBlade] Attempting to continue pipeline despite error...')
      try {
        const nextStepResponse = await supabase.functions.invoke('enrichment-step-3-recent-videos', {
          body: { channelId, taskId },
        })
        if (nextStepResponse.error) {
          console.error('[Step 2: SocialBlade] Error invoking Step 3:', nextStepResponse.error)
        } else {
          console.log('[Step 2: SocialBlade] Successfully invoked Step 3 despite error')
        }
      } catch (invokeError) {
        console.error('[Step 2: SocialBlade] Could not invoke Step 3:', invokeError)
      }
    }

    // Return success (200) to prevent blocking - pipeline should continue
    return new Response(
      JSON.stringify({
        success: true, // Changed from false - we want pipeline to continue
        socialBladeAvailable: false,
        warning: 'Social Blade step encountered error but pipeline continues',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200, // Changed from 500 - non-blocking
      }
    )
  }
})
