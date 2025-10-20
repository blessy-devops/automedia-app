// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Enrichment Step 3: Video Fetching (STUB)
 *
 * This Edge Function will fetch all channel videos via YouTube Data API.
 *
 * TODO: Implement YouTube Data API integration
 * TODO: Fetch all channel videos (paginated)
 * TODO: Store videos in benchmark_videos table
 * TODO: Update task with video count and IDs
 */
Deno.serve(async (req) => {
  try {
    console.log('[Step 3: Video Fetching] Starting video fetch (STUB)')

    const { channelId, taskId } = await req.json()

    if (!channelId || !taskId) {
      throw new Error('Missing required parameters: channelId or taskId')
    }

    console.log(`[Step 3: Video Fetching] Processing channel: ${channelId}, task: ${taskId}`)

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Update task status to 'processing'
    console.log('[Step 3: Video Fetching] Updating task status to processing')
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        fetch_videos_status: 'processing',
        fetch_videos_started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // TODO: Implement video fetching via YouTube Data API
    console.log('[Step 3: Video Fetching] STUB - Video fetching not implemented yet')

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For now, just mark as completed with placeholder data
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        fetch_videos_status: 'completed',
        fetch_videos_completed_at: new Date().toISOString(),
        fetch_videos_result: {
          stub: true,
          message: 'Video fetching not implemented yet',
          total_videos_fetched: 0,
        },
      })
      .eq('id', taskId)

    // Invoke next step
    console.log('[Step 3: Video Fetching] Invoking Step 4: Baseline Statistics')
    await supabase.functions.invoke('enrichment-step-4-baseline-stats', {
      body: { channelId, taskId },
    })

    console.log('[Step 3: Video Fetching] STUB completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video fetching completed (STUB)',
        stub: true,
        channelId,
        taskId,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Step 3: Video Fetching] Error:', error)

    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey)
      const { taskId } = await req.json()

      if (taskId) {
        await supabase
          .from('channel_enrichment_tasks')
          .update({
            fetch_videos_status: 'failed',
            fetch_videos_error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', taskId)
      }
    } catch (updateError) {
      console.error('[Step 3: Video Fetching] Failed to update error status:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
