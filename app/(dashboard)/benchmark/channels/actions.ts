'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dbDirect } from '@/lib/drizzle'
import { channelEnrichmentJobsTable, channelEnrichmentTasksTable } from '@/lib/drizzle'

/**
 * Server Action: Start Channel Benchmark
 *
 * Creates a new enrichment job and task, then triggers the Edge Function pipeline.
 *
 * This action:
 * 1. Creates an enrichment job record
 * 2. Creates an enrichment task with 'pending' status
 * 3. Invokes the enrichment-pipeline-starter Edge Function
 * 4. Returns immediately (non-blocking)
 *
 * @param channelId - The YouTube Channel ID to benchmark
 * @returns Object with success status, jobId, taskId, and optional error message
 */
export async function startChannelBenchmark(channelId: string) {
  try {
    // Validate channel ID
    if (!channelId || channelId.trim().length === 0) {
      return {
        success: false,
        error: 'Channel ID is required',
      }
    }

    // Sanitize channel ID
    const sanitizedChannelId = channelId.trim()

    console.log(`[Benchmark] Starting benchmark for channel: ${sanitizedChannelId}`)

    // Step 1: Create enrichment job using Supabase client
    const supabase = await createClient()

    const { data: job, error: jobError } = await (supabase as any)
      .from('channel_enrichment_jobs')
      .insert({
        channel_ids: [sanitizedChannelId],
        total_channels: 1,
        channels_completed: 0,
        channels_failed: 0,
        status: 'pending',
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('[Benchmark] Error creating job:', jobError)
      return {
        success: false,
        error: 'Failed to create enrichment job',
      }
    }

    console.log(`[Benchmark] Created job #${job.id}`)

    // Step 2: Create enrichment task
    const { data: task, error: taskError } = await (supabase as any)
      .from('channel_enrichment_tasks')
      .insert({
        enrichment_job_id: job.id,
        channel_id: sanitizedChannelId,
        overall_status: 'pending',
        retry_count: 0,
      })
      .select()
      .single()

    if (taskError || !task) {
      console.error('[Benchmark] Error creating task:', taskError)
      return {
        success: false,
        error: 'Failed to create enrichment task',
      }
    }

    console.log(`[Benchmark] Created task #${task.id} for channel ${sanitizedChannelId}`)

    // Step 3: Invoke Edge Function to start the pipeline
    try {
      const adminClient = createAdminClient()

      console.log(`[Benchmark] Invoking enrichment-pipeline-starter for task #${task.id}`)

      // Invoke Edge Function without waiting (fire and forget)
      const { error: invokeError } = await adminClient.functions.invoke(
        'enrichment-pipeline-starter',
        {
          body: {
            channelId: sanitizedChannelId,
            taskId: task.id,
          },
        }
      )

      if (invokeError) {
        console.error('[Benchmark] Error invoking Edge Function:', invokeError)
        // Don't fail the entire operation, just log it
        // The task is created and can be retried manually
      } else {
        console.log(`[Benchmark] Edge Function invoked successfully for task #${task.id}`)
      }
    } catch (invokeError) {
      console.error('[Benchmark] Exception invoking Edge Function:', invokeError)
      // Continue - task is created and can be processed later
    }

    return {
      success: true,
      jobId: job.id,
      taskId: task.id,
      message: `Benchmark pipeline started for channel ${sanitizedChannelId}`,
    }
  } catch (error) {
    console.error('[Benchmark] Error starting benchmark:', error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while starting the benchmark',
    }
  }
}

/**
 * Server Action: Get Enrichment Job Status
 *
 * Retrieves the current status of an enrichment job.
 *
 * @param jobId - The enrichment job ID
 * @returns Object with job details and status
 */
export async function getEnrichmentJobStatus(jobId: number) {
  try {
    const job = await dbDirect.query.channelEnrichmentJobsTable.findFirst({
      where: (jobs, { eq }) => eq(jobs.id, jobId),
    })

    if (!job) {
      return {
        success: false,
        error: 'Job not found',
      }
    }

    return {
      success: true,
      job,
    }
  } catch (error) {
    console.error('[Benchmark] Error fetching job status:', error)

    return {
      success: false,
      error: 'Failed to fetch job status',
    }
  }
}
