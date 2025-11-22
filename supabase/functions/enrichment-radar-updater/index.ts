// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Enrichment Radar Updater
 *
 * Daily automated update function for channels in the Channel Radar.
 * Runs every day at 6 AM via pg_cron scheduler.
 *
 * Process:
 * 1. Fetch all active channels from channel_radar
 * 2. For each channel:
 *    a. Fetch latest YouTube channel metrics (via YouTube API)
 *    b. Update benchmark_channels (subscribers, views, video_count)
 *    c. Create enrichment task (with categorization & trending pre-completed)
 *    d. Trigger enrichment pipeline: Step 2 → 3 → 4 → 5
 *       - Step 2: SocialBlade baseline stats
 *       - Step 3: Recent videos (UPSERT)
 *       - Step 4: Trending videos (sorted by views)
 *       - Step 5: Outlier calculation (marks task as completed)
 *    e. Update channel_radar with next_update_at
 * 3. Log execution to channel_radar_cron_log
 *
 * FLOW:
 * - Radar only invokes Step 2, which automatically chains to Step 3 → 4 → 5
 * - Step 5 marks the task as completed at the end
 * - Task has categorization_status='completed' (skip Step 1, already done)
 * - Continues on error (one channel failure doesn't stop batch)
 */

interface RadarChannel {
  id: number
  channel_id: string
  last_update_at: string | null
  update_frequency: string
}

Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  let logId: number | null = null

  try {
    console.log('[Radar Updater] Starting daily radar update')

    const { trigger, channelId } = await req.json()
    console.log(`[Radar Updater] Trigger: ${trigger || 'cron'}`)

    // ========================================================================
    // STEP 1: Create execution log
    // ========================================================================
    const { data: logEntry, error: logError } = await supabase
      .from('channel_radar_cron_log')
      .insert({
        execution_started_at: new Date().toISOString(),
        status: 'running',
      })
      .select()
      .single()

    if (!logError && logEntry) {
      logId = logEntry.id
    }

    // ========================================================================
    // STEP 2: Fetch channels to update
    // ========================================================================
    console.log('[Radar Updater] Fetching active radar channels...')

    let query = supabase
      .from('channel_radar')
      .select('id, channel_id, last_update_at, update_frequency')
      .eq('is_active', true)

    // If specific channelId provided (manual trigger), only update that channel
    if (channelId) {
      query = query.eq('channel_id', channelId)
      console.log(`[Radar Updater] Manual trigger for channel: ${channelId}`)
    }

    const { data: radarChannels, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch radar channels: ${fetchError.message}`)
    }

    if (!radarChannels || radarChannels.length === 0) {
      console.log('[Radar Updater] No channels to update')

      if (logId) {
        await supabase
          .from('channel_radar_cron_log')
          .update({
            execution_completed_at: new Date().toISOString(),
            status: 'completed',
            channels_processed: 0,
          })
          .eq('id', logId)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No channels to update',
          channels_processed: 0,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`[Radar Updater] Found ${radarChannels.length} channel(s) to update`)

    // ========================================================================
    // STEP 3: Process each channel
    // ========================================================================
    let successCount = 0
    let errorCount = 0
    const errors: Array<{ channel_id: string; error: string }> = []

    for (const channel of radarChannels) {
      try {
        console.log(`\n[Radar Updater] ========================================`)
        console.log(`[Radar Updater] Processing channel: ${channel.channel_id}`)
        console.log(`[Radar Updater] ========================================`)

        // Mark update as started
        await supabase
          .from('channel_radar')
          .update({
            last_update_at: new Date().toISOString(),
          })
          .eq('id', channel.id)

        // ====================================================================
        // 3a. Fetch latest YouTube channel metrics
        // ====================================================================
        console.log(`[Radar Updater] Fetching YouTube metrics...`)

        const { data: channelDetails, error: ytError } = await fetchYouTubeChannelDetails(
          channel.channel_id,
          supabase
        )

        if (ytError || !channelDetails) {
          throw new Error(`Failed to fetch YouTube metrics: ${ytError || 'No data'}`)
        }

        // ====================================================================
        // 3b. Update benchmark_channels with latest metrics
        // ====================================================================
        console.log(`[Radar Updater] Updating channel metrics in database...`)

        const { error: updateError } = await supabase
          .from('benchmark_channels')
          .update({
            subscriber_count: channelDetails.subscriberCount,
            total_views: channelDetails.viewCount,
            video_upload_count: channelDetails.videosCount,
            metric_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            updated_at: new Date().toISOString(),
          })
          .eq('channel_id', channel.channel_id)

        if (updateError) {
          throw new Error(`Failed to update channel metrics: ${updateError.message}`)
        }

        console.log(`[Radar Updater] ✓ Channel metrics updated`)

        // ====================================================================
        // 3c. Create enrichment task for tracking
        // ====================================================================
        console.log(`[Radar Updater] Creating enrichment task for radar update...`)

        const { data: task, error: taskError } = await supabase
          .from('channel_enrichment_tasks')
          .insert({
            enrichment_job_id: null, // Radar updates don't need a job
            channel_id: channel.channel_id,
            overall_status: 'processing',
            retry_count: 0,
            // Skip categorization and trending for radar updates
            categorization_status: 'completed',
            trending_videos_status: 'completed',
            // Set remaining steps to pending
            socialblade_status: 'pending',
            recent_videos_status: 'pending',
            outlier_analysis_status: 'pending',
          })
          .select()
          .single()

        if (taskError || !task) {
          throw new Error(`Failed to create enrichment task: ${taskError?.message}`)
        }

        const taskId = task.id
        console.log(`[Radar Updater] ✓ Created task #${taskId}`)

        // ====================================================================
        // 3d. Trigger enrichment pipeline (Step 2 → 3 → 4 → 5)
        // ====================================================================
        // Only invoke Step 2, which will automatically chain:
        // Step 2 → Step 3 → Step 5 (Step 4 skipped for radar) → Step 5 marks task as completed
        // Fire-and-forget pattern to avoid timeout issues
        console.log(`[Radar Updater] Triggering enrichment pipeline...`)

        supabase.functions.invoke(
          'enrichment-step-2-socialblade',
          {
            body: {
              channelId: channel.channel_id,
              taskId: taskId,
              radarUpdate: true,
            },
          }
        ).then(({ error: pipelineError }) => {
          if (pipelineError) {
            console.error(`[Radar Updater] ✗ Pipeline invocation error for ${channel.channel_id}:`, pipelineError)
          } else {
            console.log(`[Radar Updater] ✓ Pipeline invoked successfully for ${channel.channel_id}`)
          }
        }).catch((invokeError) => {
          console.error(`[Radar Updater] ✗ Exception invoking pipeline for ${channel.channel_id}:`, invokeError)
        })

        console.log(`[Radar Updater] ✓ Pipeline invocation sent (Step 2 → 3 → 5 will run in background, Step 4 skipped)`)

        // ====================================================================
        // 3e. Update channel_radar with next_update_at
        // ====================================================================
        const nextUpdate = calculateNextUpdate(channel.update_frequency)

        await supabase
          .from('channel_radar')
          .update({
            next_update_at: nextUpdate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', channel.id)

        console.log(`[Radar Updater] ✓ Channel ${channel.channel_id} completed successfully`)
        console.log(`[Radar Updater] Next update scheduled for: ${nextUpdate.toISOString()}`)

        successCount++
      } catch (error) {
        console.error(
          `[Radar Updater] ✗ Error processing channel ${channel.channel_id}:`,
          error
        )
        errorCount++
        errors.push({
          channel_id: channel.channel_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        // Mark channel with error but don't stop batch
        await supabase
          .from('channel_radar')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('id', channel.id)
      }
    }

    // ========================================================================
    // STEP 4: Update execution log
    // ========================================================================
    console.log('\n[Radar Updater] ========================================')
    console.log(`[Radar Updater] Batch update completed`)
    console.log(`[Radar Updater] Success: ${successCount}, Errors: ${errorCount}`)
    console.log('[Radar Updater] ========================================\n')

    if (logId) {
      await supabase
        .from('channel_radar_cron_log')
        .update({
          execution_completed_at: new Date().toISOString(),
          status: errorCount > 0 ? 'failed' : 'completed',
          channels_processed: successCount,
          channels_failed: errorCount,
          error_message: errors.length > 0 ? JSON.stringify(errors) : null,
          execution_details: {
            total_channels: radarChannels.length,
            success_count: successCount,
            error_count: errorCount,
            errors: errors,
          },
        })
        .eq('id', logId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Radar update completed',
        stats: {
          total_channels: radarChannels.length,
          success_count: successCount,
          error_count: errorCount,
          errors: errors.length > 0 ? errors : undefined,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Radar Updater] Fatal error:', error)

    // Update log with failure
    if (logId) {
      await supabase
        .from('channel_radar_cron_log')
        .update({
          execution_completed_at: new Date().toISOString(),
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', logId)
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

/**
 * Fetch YouTube channel details via RapidAPI
 */
async function fetchYouTubeChannelDetails(channelId: string, supabase: any) {
  try {
    // Get available API key from pool
    const { data: apiKeys, error: apiKeyError } = await supabase
      .from('structure_api_keys_pool')
      .select('api_key')
      .eq('service_provider', 'rapidapi')
      .eq('status', 'available')
      .limit(5)

    if (apiKeyError || !apiKeys || apiKeys.length === 0) {
      throw new Error('No available RapidAPI keys')
    }

    // Pick random key
    const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)].api_key

    // Fetch channel details
    const response = await fetch(`https://yt-api.p.rapidapi.com/channel/about?id=${channelId}`, {
      headers: {
        'x-rapidapi-host': 'yt-api.p.rapidapi.com',
        'x-rapidapi-key': randomKey,
      },
    })

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      data: {
        subscriberCount: data.subscriberCount || 0,
        viewCount: data.viewCount || 0,
        videosCount: data.videosCount || 0,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Calculate next update timestamp based on frequency
 */
function calculateNextUpdate(frequency: string): Date {
  const now = new Date()

  switch (frequency) {
    case 'daily':
      // Next day at 6 AM
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(6, 0, 0, 0)
      return tomorrow

    case 'weekly':
      // Next week, same day at 6 AM
      const nextWeek = new Date(now)
      nextWeek.setDate(nextWeek.getDate() + 7)
      nextWeek.setHours(6, 0, 0, 0)
      return nextWeek

    case 'manual':
      // Manual mode - set to far future
      const manual = new Date(now)
      manual.setFullYear(manual.getFullYear() + 10)
      return manual

    default:
      // Default to daily
      const defaultNext = new Date(now)
      defaultNext.setDate(defaultNext.getDate() + 1)
      defaultNext.setHours(6, 0, 0, 0)
      return defaultNext
  }
}
