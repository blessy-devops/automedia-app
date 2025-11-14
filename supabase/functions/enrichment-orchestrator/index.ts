// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Enrichment Orchestrator
 *
 * This Edge Function orchestrates the entire enrichment pipeline after the initial
 * channel details have been fetched by enrichment-pipeline-starter.
 *
 * Pipeline Workflow:
 * 1. Channel Categorization (Claude AI) - enrichment-step-1-categorization
 * 2. SocialBlade Metrics - enrichment-step-2-socialblade
 * 3. Video Fetching (YouTube API) - enrichment-step-3-fetch-videos
 * 4. Baseline Statistics - enrichment-step-4-baseline-stats
 * 5. Outlier Analysis - enrichment-step-5-outlier-analysis
 *
 * For now, this orchestrator simply invokes the first step.
 * Future iterations may add more sophisticated orchestration logic.
 */
Deno.serve(async (req) => {
  try {
    console.log('[Orchestrator] Starting enrichment orchestration')

    const { channelId, taskId } = await req.json()

    if (!channelId || !taskId) {
      throw new Error('Missing required parameters: channelId or taskId')
    }

    console.log(`[Orchestrator] Processing channel: ${channelId}, task: ${taskId}`)

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Invoke Step 1: Channel Categorization
    console.log('[Orchestrator] Invoking Step 1: Channel Categorization')
    await supabase.functions.invoke('enrichment-step-1-categorization', {
      body: { channelId, taskId },
    })

    // TODO: Step 2 will be invoked by Step 1 upon completion
    // TODO: Step 3 will be invoked by Step 2 upon completion
    // TODO: Step 4 will be invoked by Step 3 upon completion
    // TODO: Step 5 will be invoked by Step 4 upon completion

    console.log('[Orchestrator] Successfully started enrichment pipeline')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Enrichment pipeline started',
        channelId,
        taskId,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Orchestrator] Error:', error)

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
