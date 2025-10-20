// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Enrichment Step 2: SocialBlade Metrics (STUB)
 *
 * This Edge Function will scrape SocialBlade for additional channel metrics.
 *
 * TODO: Implement SocialBlade scraping logic
 * TODO: Update benchmark_channels with SocialBlade data
 * TODO: Store rank, grade, earnings estimates
 */
Deno.serve(async (req) => {
  try {
    console.log('[Step 2: SocialBlade] Starting SocialBlade metrics fetch (STUB)')

    const { channelId, taskId } = await req.json()

    if (!channelId || !taskId) {
      throw new Error('Missing required parameters: channelId or taskId')
    }

    console.log(`[Step 2: SocialBlade] Processing channel: ${channelId}, task: ${taskId}`)

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Update task status to 'processing'
    console.log('[Step 2: SocialBlade] Updating task status to processing')
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        socialblade_status: 'processing',
        socialblade_started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // TODO: Implement SocialBlade scraping
    console.log('[Step 2: SocialBlade] STUB - SocialBlade scraping not implemented yet')

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For now, just mark as completed with placeholder data
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        socialblade_status: 'completed',
        socialblade_completed_at: new Date().toISOString(),
        socialblade_result: {
          stub: true,
          message: 'SocialBlade scraping not implemented yet',
        },
      })
      .eq('id', taskId)

    // Invoke next step
    console.log('[Step 2: SocialBlade] Invoking Step 3: Video Fetching')
    await supabase.functions.invoke('enrichment-step-3-fetch-videos', {
      body: { channelId, taskId },
    })

    console.log('[Step 2: SocialBlade] STUB completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SocialBlade metrics fetch completed (STUB)',
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
    console.error('[Step 2: SocialBlade] Error:', error)

    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey)
      const { taskId } = await req.json()

      if (taskId) {
        await supabase
          .from('channel_enrichment_tasks')
          .update({
            socialblade_status: 'failed',
            socialblade_error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', taskId)
      }
    } catch (updateError) {
      console.error('[Step 2: SocialBlade] Failed to update error status:', updateError)
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
