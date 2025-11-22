// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
 * 3. Calculate base metrics (avgHistorical, medianHistorical, avgViewsPerDay for channel)
 * 4. For each video, calculate 7 metrics:
 *    - video_age_days
 *    - views_per_day
 *    - performance_vs_avg_historical
 *    - performance_vs_median_historical
 *    - performance_vs_recent_14d (video's views_per_day vs channel's avg views_per_day)
 *    - performance_vs_recent_30d (placeholder for future implementation)
 *    - performance_vs_recent_90d (placeholder for future implementation)
 * 5. Batch update all videos
 * 6. Mark task and overall status as 'completed'
 */
Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  let taskId: number | null = null

  try {
    console.log('[Step 5: Outlier Calc] Starting outlier calculation')

    const { channelId, taskId: reqTaskId, radarUpdate } = await req.json()
    taskId = reqTaskId

    if (!channelId || !taskId) {
      throw new Error('Missing required parameters: channelId or taskId')
    }

    console.log(`[Step 5: Outlier Calc] Processing channel: ${channelId}, task: ${taskId}`)

    if (radarUpdate) {
      console.log('[Step 5: Outlier Calc] 🔄 Running in RADAR UPDATE mode (Step 4 was skipped)')
    }

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
    // STEP 2: Find videos needing calculation (optimization) using Supabase Client
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Finding videos needing calculation...')

    const { data: videosToProcess, error: videosError } = await supabase
      .from('benchmark_videos')
      .select('youtube_video_id, views, upload_date')
      .eq('channel_id', channelId)
      .is('performance_vs_avg_historical', null)

    if (videosError) {
      throw new Error(`Failed to fetch videos: ${videosError.message}`)
    }

    console.log(`[Step 5: Outlier Calc] Found ${videosToProcess?.length || 0} videos needing calculation`)

    if (!videosToProcess || videosToProcess.length === 0) {
      console.log('[Step 5: Outlier Calc] No videos to process, marking as completed')

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
    // STEP 3: Collect base data (once per execution) using Supabase Client
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Collecting base data...')

    const [baselineStatsResult, channelDataResult, allVideosViewsResult] = await Promise.all([
      // Baseline stats (with availability flag)
      supabase
        .from('benchmark_channels_baseline_stats')
        .select('total_views_14d, is_available')
        .eq('channel_id', channelId)
        .single(),

      // Channel data
      supabase
        .from('benchmark_channels')
        .select('total_views, video_upload_count')
        .eq('channel_id', channelId)
        .single(),

      // All videos views for median calculation
      supabase
        .from('benchmark_videos')
        .select('views')
        .eq('channel_id', channelId),
    ])

    const baselineStats = baselineStatsResult.data || {}
    const channelData = channelDataResult.data || {}
    const allVideosViews = (allVideosViewsResult.data || [])
      .map((v) => v.views || 0)
      .filter((v) => v > 0)

    const socialBladeAvailable = baselineStats.is_available ?? false

    console.log('[Step 5: Outlier Calc] Base data collected:', {
      socialBladeAvailable,
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

    // Metric: dailyAvg14d - Channel's average daily views in last 14 days
    // This is used for momentum calculation (matches Python original methodology)
    const dailyAvg14d = baselineStats.total_views_14d
      ? baselineStats.total_views_14d / 14
      : null

    // Metric: dailyMedian14d - Channel's median daily views in last 14 days
    // New metric for more robust outlier detection
    const dailyMedian14d = baselineStats.mediana_diaria_views_14d || null

    console.log('[Step 5: Outlier Calc] Base metrics:', {
      avgHistoricalViews: avgHistoricalViews?.toFixed(0),
      medianHistoricalViews: medianHistoricalViews?.toFixed(0),
      dailyAvg14d: dailyAvg14d?.toFixed(0),
      dailyMedian14d: dailyMedian14d?.toFixed(0) || 'null',
    })

    // Warn if Social Blade metrics are unavailable
    if (!dailyAvg14d || !dailyMedian14d || !socialBladeAvailable) {
      console.log('[Step 5: Outlier Calc] ⚠️  Social Blade metrics unavailable - 14d performance ratios will be NULL for all videos')
      console.log('[Step 5: Outlier Calc] This is expected for very new channels not yet indexed in Social Blade')
    }

    // ========================================================================
    // STEP 4: Process videos and batch update using Supabase Client
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Processing videos...')

    const now = new Date()
    let successCount = 0
    let errorCount = 0

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

      // Metric 5: performance_vs_recent_14d (CORRECTED - matches Python methodology)
      // Compare this video's views_per_day to the channel's RECENT 14-day average
      // This measures if this video is performing better/worse than the channel's current momentum
      const performanceVsRecent14d =
        dailyAvg14d && dailyAvg14d > 0
          ? Number((viewsPerDay / dailyAvg14d).toFixed(2))
          : null

      // Metric 6: performance_vs_avg_14d (NEW)
      // Compare video's views_per_day to channel's average daily views (14d)
      // Same as performanceVsRecent14d but with explicit naming for UI
      const performanceVsAvg14d =
        dailyAvg14d && dailyAvg14d > 0
          ? Number((viewsPerDay / dailyAvg14d).toFixed(2))
          : null

      // Metric 7: performance_vs_median_14d (NEW)
      // Compare video's views_per_day to channel's median daily views (14d)
      // More robust against outliers than average
      const performanceVsMedian14d =
        dailyMedian14d && dailyMedian14d > 0
          ? Number((viewsPerDay / dailyMedian14d).toFixed(2))
          : null

      // Metric 8 & 9: performance_vs_recent_30d and 90d (placeholders for future)
      // These would require collecting actual 30d/90d data per video
      const performanceVsRecent30d = null
      const performanceVsRecent90d = null

      // Execute UPDATE and check for errors
      const { error: updateError } = await supabase
        .from('benchmark_videos')
        .update({
          video_age_days: videoAgeDays,
          views_per_day: viewsPerDay,
          performance_vs_avg_historical: performanceVsAvg,
          performance_vs_median_historical: performanceVsMedian,
          performance_vs_recent_14d: performanceVsRecent14d,
          performance_vs_avg_14d: performanceVsAvg14d,
          performance_vs_median_14d: performanceVsMedian14d,
          performance_vs_recent_30d: performanceVsRecent30d,
          performance_vs_recent_90d: performanceVsRecent90d,
          updated_at: now.toISOString(),
        })
        .eq('youtube_video_id', video.youtube_video_id)

      if (updateError) {
        console.error(`[Step 5: Outlier Calc] Error updating video ${video.youtube_video_id}:`, updateError)
        errorCount++
      } else {
        successCount++
        if (successCount <= 5 || successCount % 10 === 0) {
          console.log(`[Step 5: Outlier Calc] Updated video ${video.youtube_video_id} [${successCount}/${videosToProcess.length}]`)
        }
      }
    }

    console.log(`[Step 5: Outlier Calc] Batch update complete: ${successCount} success, ${errorCount} errors`)

    // ========================================================================
    // STEP 7: Save channel-level median to baseline_stats
    // ========================================================================
    console.log('[Step 5: Outlier Calc] Saving channel median to baseline_stats...')

    const { error: medianError } = await supabase
      .from('benchmark_channels_baseline_stats')
      .update({
        median_views_per_video_historical: medianHistoricalViews,
        updated_at: new Date().toISOString(),
      })
      .eq('channel_id', channelId)

    if (medianError) {
      console.error('[Step 5: Outlier Calc] Error saving median:', medianError)
    } else {
      console.log(`[Step 5: Outlier Calc] ✓ Saved median: ${medianHistoricalViews?.toFixed(0) || 'null'}`)
    }

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
          videos_processed: successCount,
          videos_with_errors: errorCount,
          metrics_calculated: 9, // Updated: added performance_vs_avg_14d and performance_vs_median_14d
          timestamp: completedAt.toISOString(),
        }),
        overall_status: 'completed', // FINAL STATUS
        completed_at: completedAt.toISOString(),
      })
      .eq('id', taskId)

    console.log('[Step 5: Outlier Calc] ✅ Pipeline completed successfully!')
    console.log(`[Step 5: Outlier Calc] Duration: ${durationSeconds}s, Videos processed: ${successCount}/${successCount + errorCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Outlier calculation completed - Pipeline finished!',
        channelId,
        taskId,
        stats: {
          videos_processed: successCount,
          videos_with_errors: errorCount,
          duration_seconds: durationSeconds,
          metrics_calculated: ['video_age_days', 'views_per_day', 'performance_vs_avg', 'performance_vs_median', 'performance_vs_recent_14d', 'performance_vs_recent_30d', 'performance_vs_recent_90d'],
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Step 5: Outlier Calc] Error:', error)

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
