// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Video Queue Processor
 *
 * Processes videos from the video_enrichment_queue by triggering
 * the existing enrichment pipeline for each video's channel.
 *
 * Process:
 * 1. Fetch pending videos from queue (LIMIT 10)
 * 2. For each video:
 *    - Create enrichment task
 *    - Invoke enrichment-pipeline-starter
 *    - Mark queue item as processing
 * 3. Pipeline handles all downstream processing:
 *    - Channel UPSERT
 *    - Video UPSERT
 *    - Metrics calculation
 *    - Outlier analysis
 */
Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    console.log('[Queue Processor] Starting video queue processing')

    // ========================================================================
    // STEP 1: Fetch pending videos from queue (with row-level locking)
    // ========================================================================
    const { data: queueItems, error: queueError } = await supabase
      .rpc('get_pending_queue_items', { p_limit: 10 })

    if (queueError) {
      throw new Error(`Failed to fetch queue items: ${queueError.message}`)
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('[Queue Processor] No pending videos in queue')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending videos to process',
          processed: 0,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`[Queue Processor] Found ${queueItems.length} pending videos`)

    // ========================================================================
    // STEP 2: Process each video
    // ========================================================================
    const results = []

    for (const item of queueItems) {
      try {
        console.log(`[Queue Processor] Processing video: ${item.youtube_video_id} (Channel: ${item.channel_id})`)

        // Create enrichment task
        const { data: task, error: taskError } = await supabase
          .from('channel_enrichment_tasks')
          .insert({
            channel_id: item.channel_id,
            overall_status: 'pending',
            source: 'video_queue',
            metadata: {
              queue_item_id: item.id,
              youtube_video_id: item.youtube_video_id,
              video_title: item.video_title,
              channel_name: item.channel_name,
            },
          })
          .select('id')
          .single()

        if (taskError) {
          throw new Error(`Failed to create task: ${taskError.message}`)
        }

        console.log(`[Queue Processor] Created task #${task.id} for video ${item.youtube_video_id}`)

        // Mark queue item as processing
        await supabase
          .from('video_enrichment_queue')
          .update({
            status: 'processing',
            enrichment_task_id: task.id,
            processing_started_at: new Date().toISOString(),
          })
          .eq('id', item.id)

        // Invoke enrichment pipeline (fire-and-forget)
        // The pipeline will handle:
        // - Channel data fetch and UPSERT
        // - Categorization
        // - SocialBlade metrics
        // - Recent videos fetch and UPSERT
        // - Outlier calculation
        supabase.functions
          .invoke('enrichment-pipeline-starter', {
            body: {
              channelId: item.channel_id,
              taskId: task.id,
            },
          })
          .then(({ error: invokeError }) => {
            if (invokeError) {
              console.error(`[Queue Processor] Error invoking pipeline for video ${item.youtube_video_id}:`, invokeError)
              // Mark queue item as failed
              supabase
                .from('video_enrichment_queue')
                .update({
                  status: 'failed',
                  error_message: invokeError.message || 'Pipeline invocation failed',
                  processing_completed_at: new Date().toISOString(),
                })
                .eq('id', item.id)
            } else {
              console.log(`[Queue Processor] Successfully invoked pipeline for video ${item.youtube_video_id}`)
            }
          })
          .catch((error) => {
            console.error(`[Queue Processor] Exception invoking pipeline for video ${item.youtube_video_id}:`, error)
          })

        results.push({
          queue_item_id: item.id,
          youtube_video_id: item.youtube_video_id,
          channel_id: item.channel_id,
          task_id: task.id,
          status: 'processing',
        })
      } catch (error) {
        console.error(`[Queue Processor] Error processing video ${item.youtube_video_id}:`, error)

        // Mark queue item as failed
        await supabase
          .from('video_enrichment_queue')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            processing_completed_at: new Date().toISOString(),
          })
          .eq('id', item.id)

        results.push({
          queue_item_id: item.id,
          youtube_video_id: item.youtube_video_id,
          channel_id: item.channel_id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(`[Queue Processor] Processed ${results.length} videos`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Started processing ${results.length} videos`,
        processed: results.length,
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Queue Processor] Error:', error)

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
