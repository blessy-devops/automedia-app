// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Video Queue Callback
 *
 * Called by the enrichment pipeline when processing completes.
 * Updates the queue item status based on the task result.
 *
 * Expected payload:
 * {
 *   taskId: number,
 *   status: 'completed' | 'failed',
 *   error?: string
 * }
 */
Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const { taskId, status, error } = await req.json()

    if (!taskId || !status) {
      throw new Error('Missing required parameters: taskId or status')
    }

    console.log(`[Queue Callback] Updating queue for task #${taskId} with status: ${status}`)

    // Find the queue item associated with this task
    const { data: task, error: taskError } = await supabase
      .from('channel_enrichment_tasks')
      .select('metadata')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    const queueItemId = task.metadata?.queue_item_id

    if (!queueItemId) {
      console.log(`[Queue Callback] Task #${taskId} not associated with queue item, skipping`)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Task not associated with queue item',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Update queue item status
    const { error: updateError } = await supabase
      .from('video_enrichment_queue')
      .update({
        status,
        error_message: error || null,
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', queueItemId)

    if (updateError) {
      throw new Error(`Failed to update queue item: ${updateError.message}`)
    }

    console.log(`[Queue Callback] Updated queue item #${queueItemId} to status: ${status}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Queue item ${queueItemId} updated to ${status}`,
        queueItemId,
        taskId,
        status,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Queue Callback] Error:', error)

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
