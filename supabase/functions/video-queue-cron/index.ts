// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Video Queue Cron Job
 *
 * Scheduled function that runs periodically to process the video enrichment queue.
 * Simply invokes the video-queue-processor to handle pending videos.
 *
 * Recommended schedule: Every 5-10 minutes
 * Example cron expression: every 5 minutes
 */
Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    console.log('[Queue Cron] Starting scheduled queue processing')

    // Invoke the queue processor
    const { data, error } = await supabase.functions.invoke('video-queue-processor', {
      body: {},
    })

    if (error) {
      console.error('[Queue Cron] Error invoking queue processor:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || 'Failed to invoke queue processor',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('[Queue Cron] Queue processor invoked successfully')
    console.log('[Queue Cron] Result:', data)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Queue processing triggered successfully',
        result: data,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Queue Cron] Error:', error)

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
