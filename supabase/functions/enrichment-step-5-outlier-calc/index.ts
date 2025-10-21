// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'
// @ts-ignore: Deno-specific imports
import { drizzle } from 'npm:drizzle-orm/postgres-js'
// @ts-ignore: Deno-specific imports
import postgres from 'npm:postgres'
// @ts-ignore: Deno-specific imports
import {
  pgTable,
  serial,
  varchar,
  text,
  bigint,
  integer,
  timestamp,
  real,
  pgEnum,
} from 'npm:drizzle-orm/pg-core'
// @ts-ignore: Deno-specific imports
import { eq, isNull, and } from 'npm:drizzle-orm'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const dbUrlDirect = Deno.env.get('DATABASE_URL_DIRECT')!

// Enums
const enrichmentTaskStatusEnum = pgEnum('enrichment_task_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

const enrichmentSubWorkflowStatusEnum = pgEnum('enrichment_sub_workflow_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

// Drizzle schema for benchmark_videos
const benchmarkVideosTable = pgTable('benchmark_videos', {
  id: serial('id').primaryKey(),
  youtubeVideoId: varchar('youtube_video_id', { length: 255 }).notNull().unique(),
  channelId: varchar('channel_id', { length: 255 }).notNull(),
  views: bigint('views', { mode: 'number' }),
  uploadDate: timestamp('upload_date', { withTimezone: true }),
  performanceVsAvgHistorical: real('performance_vs_avg_historical'),
  performanceVsMedianHistorical: real('performance_vs_median_historical'),
  performanceVsRecent14d: real('performance_vs_recent_14d'),
  performanceVsRecent30d: real('performance_vs_recent_30d'),
  performanceVsRecent90d: real('performance_vs_recent_90d'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
})

// Drizzle schema for benchmark_channels
const benchmarkChannelsTable = pgTable('benchmark_channels', {
  id: serial('id').primaryKey(),
  channelId: varchar('channel_id', { length: 255 }).notNull().unique(),
  totalViews: bigint('total_views', { mode: 'number' }),
  videoUploadCount: integer('video_upload_count'),
})

// Drizzle schema for benchmark_channels_baseline_stats
const benchmarkChannelsBaselineStatsTable = pgTable('benchmark_channels_baseline_stats', {
  id: serial('id').primaryKey(),
  channelId: varchar('channel_id', { length: 255 }).notNull(),
  totalViews14d: bigint('total_views_14d', { mode: 'number' }),
  totalViews30d: bigint('total_views_30d', { mode: 'number' }),
  totalViews90d: bigint('total_views_90d', { mode: 'number' }),
})

// Drizzle schema for channel_enrichment_tasks
const channelEnrichmentTasksTable = pgTable('channel_enrichment_tasks', {
  id: serial('id').primaryKey(),
  channelId: varchar('channel_id', { length: 255 }).notNull(),
  overallStatus: enrichmentTaskStatusEnum('overall_status').default('pending').notNull(),
  outlierAnalysisStatus: enrichmentSubWorkflowStatusEnum('outlier_analysis_status')
    .default('pending')
    .notNull(),
  outlierAnalysisResult: text('outlier_analysis_result'),
  outlierAnalysisError: text('outlier_analysis_error'),
  outlierAnalysisStartedAt: timestamp('outlier_analysis_started_at', { withTimezone: true }),
  outlierAnalysisCompletedAt: timestamp('outlier_analysis_completed_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

/**
 * Helper function to calculate median from array of numbers
 * @param values - Array of numeric values
 * @returns Median value or null if array is empty
 */
function calculateMedian(values: number[]): number | null {
  if (!values || values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    // Even number of elements - average of two middle values
    return (sorted[mid - 1] + sorted[mid]) / 2
  } else {
    // Odd number of elements - middle value
    return sorted[mid]
  }
}

/**
 * Enrichment Step 5: Outlier Calculation (FINAL STEP)
 *
 * Calculates performance metrics for videos that don't have them yet.
 * This is the final step of the enrichment pipeline.
 *
 * Process:
 * 1. Find videos needing calculation (performance_vs_avg_historical IS NULL)
 * 2. Collect base data (baseline stats, channel stats, all videos for median)
 * 3. Calculate base metrics (avgHistorical, medianHistorical, dailyAvg14d)
 * 4. For each video, calculate 5 metrics:
 *    - video_age_days
 *    - views_per_day
 *    - performance_vs_avg_historical
 *    - performance_vs_median_historical
 *    - momentum_vs_14d
 * 5. Batch update all videos
 * 6. Mark task and overall status as 'completed'
 */
Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  let taskId: number | null = null
  let sql: any = null

  try {
    console.log('[Step 5: Outlier Calc] Starting outlier calculation')

    const { channelId, taskId: reqTaskId } = await req.json()
    taskId = reqTaskId

    if (!channelId || !taskId) {
      throw new Error('Missing required parameters: channelId or taskId')
    }

    console.log(`[Step 5: Outlier Calc] Processing channel: ${channelId}, task: ${taskId}`)

    // ========================================================================
    // STEP 1: Update task status to 'processing'
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Updating task status to processing')
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        outlier_analysis_status: 'processing',
        outlier_analysis_started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // ========================================================================
    // STEP 2: Initialize direct database connection (for performance)
    // ========================================================================
    sql = postgres(dbUrlDirect, { prepare: false })
    const directDb = drizzle(sql)

    // ========================================================================
    // STEP 3: Find videos needing calculation (optimization)
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Finding videos needing calculation...')

    const videosToProcess = await directDb
      .select({
        youtube_video_id: benchmarkVideosTable.youtubeVideoId,
        views: benchmarkVideosTable.views,
        upload_date: benchmarkVideosTable.uploadDate,
      })
      .from(benchmarkVideosTable)
      .where(
        and(
          eq(benchmarkVideosTable.channelId, channelId),
          isNull(benchmarkVideosTable.performanceVsAvgHistorical) // Indicator that metrics not calculated
        )
      )

    console.log(`[Step 5: Outlier Calc] Found ${videosToProcess.length} videos needing calculation`)

    if (videosToProcess.length === 0) {
      console.log('[Step 5: Outlier Calc] No videos to process, marking as completed')
      await sql.end()

      // Mark as completed
      await supabase
        .from('channel_enrichment_tasks')
        .update({
          outlier_analysis_status: 'completed',
          outlier_analysis_completed_at: new Date().toISOString(),
          outlier_analysis_result: JSON.stringify({
            videos_processed: 0,
            message: 'No videos needed calculation',
          }),
          overall_status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No videos needed calculation',
          channelId,
          taskId,
          videosProcessed: 0,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // ========================================================================
    // STEP 4: Collect base data (once per execution)
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Collecting base data...')

    const [baselineStatsResult, channelDataResult, allVideosViewsResult] = await Promise.all([
      // Baseline stats
      directDb
        .select({
          total_views_14d: benchmarkChannelsBaselineStatsTable.totalViews14d,
          total_views_30d: benchmarkChannelsBaselineStatsTable.totalViews30d,
          total_views_90d: benchmarkChannelsBaselineStatsTable.totalViews90d,
        })
        .from(benchmarkChannelsBaselineStatsTable)
        .where(eq(benchmarkChannelsBaselineStatsTable.channelId, channelId)),

      // Channel data
      directDb
        .select({
          total_views: benchmarkChannelsTable.totalViews,
          video_upload_count: benchmarkChannelsTable.videoUploadCount,
        })
        .from(benchmarkChannelsTable)
        .where(eq(benchmarkChannelsTable.channelId, channelId)),

      // All videos views for median calculation
      directDb
        .select({
          views: benchmarkVideosTable.views,
        })
        .from(benchmarkVideosTable)
        .where(eq(benchmarkVideosTable.channelId, channelId)),
    ])

    const baselineStats = baselineStatsResult[0] || {}
    const channelData = channelDataResult[0] || {}
    const allVideosViews = allVideosViewsResult.map((v) => v.views || 0).filter((v) => v > 0)

    console.log('[Step 5: Outlier Calc] Base data collected:', {
      hasBaselineStats: !!baselineStats.total_views_14d,
      channelTotalViews: channelData.total_views,
      channelVideoCount: channelData.video_upload_count,
      totalVideosForMedian: allVideosViews.length,
    })

    // ========================================================================
    // STEP 5: Calculate base metrics (once per execution)
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Calculating base metrics...')

    // Metric: avgHistoricalViews
    const avgHistoricalViews =
      channelData.total_views && channelData.video_upload_count && channelData.video_upload_count > 0
        ? channelData.total_views / channelData.video_upload_count
        : null

    // Metric: medianHistoricalViews
    const medianHistoricalViews = calculateMedian(allVideosViews)

    // Metric: dailyAvg14d
    const dailyAvg14d = baselineStats.total_views_14d ? baselineStats.total_views_14d / 14 : null

    // Metric: dailyAvg30d
    const dailyAvg30d = baselineStats.total_views_30d ? baselineStats.total_views_30d / 30 : null

    // Metric: dailyAvg90d
    const dailyAvg90d = baselineStats.total_views_90d ? baselineStats.total_views_90d / 90 : null

    console.log('[Step 5: Outlier Calc] Base metrics:', {
      avgHistoricalViews: avgHistoricalViews?.toFixed(0),
      medianHistoricalViews: medianHistoricalViews?.toFixed(0),
      dailyAvg14d: dailyAvg14d?.toFixed(0),
      dailyAvg30d: dailyAvg30d?.toFixed(0),
      dailyAvg90d: dailyAvg90d?.toFixed(0),
    })

    // ========================================================================
    // STEP 6: Process videos in batch
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Processing videos...')

    const updatePromises: Promise<any>[] = []
    const now = new Date()

    for (const video of videosToProcess) {
      if (!video.upload_date || !video.views) {
        console.warn(`[Step 5: Outlier Calc] Skipping video ${video.youtube_video_id} - missing data`)
        continue
      }

      const uploadDate = new Date(video.upload_date)

      // Metric 1: video_age_days
      const videoAgeDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24))

      // Metric 2: views_per_day
      const viewsPerDay = Math.round(video.views / (videoAgeDays + 1))

      // Metric 3: performance_vs_avg_historical
      const performanceVsAvg =
        avgHistoricalViews && avgHistoricalViews > 0
          ? Number((video.views / avgHistoricalViews).toFixed(2))
          : null

      // Metric 4: performance_vs_median_historical
      const performanceVsMedian =
        medianHistoricalViews && medianHistoricalViews > 0
          ? Number((video.views / medianHistoricalViews).toFixed(2))
          : null

      // Metric 5: momentum_vs_14d (stored in performance_vs_recent_14d)
      const momentumVs14d =
        dailyAvg14d && dailyAvg14d > 0 ? Number((viewsPerDay / dailyAvg14d).toFixed(2)) : null

      // Metric 6: momentum_vs_30d (stored in performance_vs_recent_30d)
      const momentumVs30d =
        dailyAvg30d && dailyAvg30d > 0 ? Number((viewsPerDay / dailyAvg30d).toFixed(2)) : null

      // Metric 7: momentum_vs_90d (stored in performance_vs_recent_90d)
      const momentumVs90d =
        dailyAvg90d && dailyAvg90d > 0 ? Number((viewsPerDay / dailyAvg90d).toFixed(2)) : null

      // Build UPDATE promise
      const updatePromise = directDb
        .update(benchmarkVideosTable)
        .set({
          performanceVsAvgHistorical: performanceVsAvg,
          performanceVsMedianHistorical: performanceVsMedian,
          performanceVsRecent14d: momentumVs14d,
          performanceVsRecent30d: momentumVs30d,
          performanceVsRecent90d: momentumVs90d,
          updatedAt: now,
        })
        .where(eq(benchmarkVideosTable.youtubeVideoId, video.youtube_video_id))

      updatePromises.push(updatePromise)

      console.log(`[Step 5: Outlier Calc] Video ${video.youtube_video_id}:`, {
        age_days: videoAgeDays,
        views_per_day: viewsPerDay,
        vs_avg: performanceVsAvg,
        vs_median: performanceVsMedian,
        momentum_14d: momentumVs14d,
      })
    }

    // ========================================================================
    // STEP 7: Execute batch updates
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Executing batch updates...')
    await Promise.all(updatePromises)
    console.log(`[Step 5: Outlier Calc] Updated ${updatePromises.length} videos successfully`)

    // Close SQL connection
    await sql.end()
    sql = null

    // ========================================================================
    // STEP 8: Finalize pipeline (mark everything complete)
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Finalizing pipeline...')

    const completedAt = new Date()

    // Fetch task start time to calculate duration
    const { data: taskData } = await supabase
      .from('channel_enrichment_tasks')
      .select('started_at')
      .eq('id', taskId)
      .single()

    let durationSeconds = null
    if (taskData?.started_at) {
      const startedAt = new Date(taskData.started_at)
      durationSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)
    }

    await supabase
      .from('channel_enrichment_tasks')
      .update({
        outlier_analysis_status: 'completed',
        outlier_analysis_completed_at: completedAt.toISOString(),
        outlier_analysis_result: JSON.stringify({
          videos_processed: updatePromises.length,
          metrics_calculated: 5,
          timestamp: completedAt.toISOString(),
        }),
        overall_status: 'completed', // FINAL STATUS
        completed_at: completedAt.toISOString(),
      })
      .eq('id', taskId)

    console.log('[Step 5: Outlier Calc] ✅ Pipeline completed successfully!')
    console.log(`[Step 5: Outlier Calc] Duration: ${durationSeconds}s, Videos processed: ${updatePromises.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Outlier calculation completed - Pipeline finished!',
        channelId,
        taskId,
        stats: {
          videos_processed: updatePromises.length,
          duration_seconds: durationSeconds,
          metrics_calculated: ['performance_vs_avg', 'performance_vs_median', 'momentum_14d', 'momentum_30d', 'momentum_90d'],
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Step 5: Outlier Calc] Error:', error)

    // Close SQL connection if still open
    if (sql) {
      try {
        await sql.end()
      } catch (closeError) {
        console.error('[Step 5: Outlier Calc] Error closing SQL connection:', closeError)
      }
    }

    // Update task status to failed
    if (taskId) {
      try {
        await supabase
          .from('channel_enrichment_tasks')
          .update({
            outlier_analysis_status: 'failed',
            outlier_analysis_error: error instanceof Error ? error.message : 'Unknown error',
            outlier_analysis_completed_at: new Date().toISOString(),
            overall_status: 'failed',
          })
          .eq('id', taskId)
      } catch (updateError) {
        console.error('[Step 5: Outlier Calc] Failed to update error status:', updateError)
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
