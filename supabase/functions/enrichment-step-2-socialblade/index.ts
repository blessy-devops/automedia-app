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
    // STEP 2: Scrape Social Blade using V2 scraper
    // ========================================================================
    console.log('[Step 2: SocialBlade] Calling SocialBlade scraper V2...')

    const scrapedData = await scrapeSocialBladeV2(channelId)

    console.log(`[Step 2: SocialBlade] Received ${scrapedData.dailyStats.length} days of data`)

    // ========================================================================
    // STEP 3: Extract metrics from scraped data (already calculated by V2)
    // ========================================================================
    const { aggregated, dailyStats } = scrapedData

    if (dailyStats.length === 0) {
      throw new Error('No daily stats returned from scraper')
    }

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
    console.error('[Step 2: SocialBlade] Error:', error)

    // Update task status to failed
    if (taskId) {
      try {
        await supabase
          .from('channel_enrichment_tasks')
          .update({
            socialblade_status: 'failed',
            socialblade_error: error instanceof Error ? error.message : 'Unknown error',
            socialblade_completed_at: new Date().toISOString(),
          })
          .eq('id', taskId)
      } catch (updateError) {
        console.error('[Step 2: SocialBlade] Failed to update error status:', updateError)
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
