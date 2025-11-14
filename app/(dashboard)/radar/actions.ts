'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Server Actions for Channel Radar
 *
 * Provides CRUD operations for managing channels in the radar monitoring system.
 */

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  warning?: string
  details?: any
}

/**
 * Add a single channel to radar monitoring
 */
export async function addChannelToRadar(
  channelId: string,
  notes?: string
): Promise<ActionResult<{ id: number }>> {
  try {
    const supabase = createAdminClient()

    // Check if channel exists
    const { data: channel, error: channelError } = await supabase
      .from('benchmark_channels')
      .select('channel_id')
      .eq('channel_id', channelId)
      .single()

    if (channelError || !channel) {
      return {
        success: false,
        error: 'Channel not found in benchmark_channels',
      }
    }

    // Calculate next update (tomorrow at 6 AM)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(6, 0, 0, 0)

    // Insert into channel_radar (trigger will auto-update benchmark_channels.in_radar)
    const { data, error } = await supabase
      .from('channel_radar')
      .insert({
        channel_id: channelId,
        next_update_at: tomorrow.toISOString(),
        notes: notes || null,
      })
      .select('id')
      .single()

    if (error) {
      // Check if already exists
      if (error.code === '23505') {
        // Unique constraint violation
        return {
          success: false,
          error: 'Channel is already in radar',
        }
      }
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/radar')
    revalidatePath('/channels')

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error('[addChannelToRadar] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Remove a channel from radar monitoring
 */
export async function removeChannelFromRadar(channelId: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from('channel_radar').delete().eq('channel_id', channelId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/radar')
    revalidatePath('/channels')

    return { success: true }
  } catch (error) {
    console.error('[removeChannelFromRadar] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Bulk add multiple channels to radar
 */
export async function bulkAddChannelsToRadar(
  channelIds: string[],
  notes?: string
): Promise<ActionResult<{ count: number }>> {
  try {
    const supabase = createAdminClient()

    // Calculate next update
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(6, 0, 0, 0)

    // Prepare insert data
    const insertData = channelIds.map((id) => ({
      channel_id: id,
      next_update_at: tomorrow.toISOString(),
      notes: notes || null,
    }))

    const { data, error } = await supabase
      .from('channel_radar')
      .insert(insertData)
      .select('id')

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/radar')
    revalidatePath('/channels')

    return {
      success: true,
      data: { count: data?.length || 0 },
    }
  } catch (error) {
    console.error('[bulkAddChannelsToRadar] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get all channels in radar with their metadata
 */
export async function getRadarChannels(): Promise<
  ActionResult<
    Array<{
      id: number
      channel_id: string
      channel_database_id: number
      channel_name: string
      thumbnail_url: string | null
      subscriber_count: number | null
      total_views: number | null
      video_upload_count: number | null
      added_at: string
      last_update_at: string | null
      next_update_at: string | null
      update_frequency: string
      is_active: boolean
      has_10x_outlier: boolean
      notes: string | null
    }>
  >
> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('channel_radar')
      .select(
        `
        id,
        channel_id,
        added_at,
        last_update_at,
        next_update_at,
        update_frequency,
        is_active,
        has_10x_outlier,
        notes,
        benchmark_channels (
          id,
          channel_name,
          thumbnail_url,
          subscriber_count,
          total_views,
          video_upload_count
        )
      `
      )
      .eq('is_active', true)
      .order('added_at', { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Flatten the data structure
    const flattenedData = data.map((item: any) => ({
      id: item.id,
      channel_id: item.channel_id,
      channel_database_id: item.benchmark_channels?.id || 0,
      channel_name: item.benchmark_channels?.channel_name || 'Unknown',
      thumbnail_url: item.benchmark_channels?.thumbnail_url || null,
      subscriber_count: item.benchmark_channels?.subscriber_count || null,
      total_views: item.benchmark_channels?.total_views || null,
      video_upload_count: item.benchmark_channels?.video_upload_count || null,
      added_at: item.added_at,
      last_update_at: item.last_update_at,
      next_update_at: item.next_update_at,
      update_frequency: item.update_frequency,
      is_active: item.is_active,
      has_10x_outlier: item.has_10x_outlier,
      notes: item.notes,
    }))

    return {
      success: true,
      data: flattenedData,
    }
  } catch (error) {
    console.error('[getRadarChannels] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Trigger manual update for a specific channel
 */
export async function triggerManualUpdate(channelId: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    // Invoke radar updater Edge Function for single channel
    const { data, error } = await supabase.functions.invoke('enrichment-radar-updater', {
      body: {
        channelId,
        trigger: 'manual',
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/radar')

    // Check if there were partial failures in the Edge Function response
    if (data?.partialFailures && Array.isArray(data.partialFailures) && data.partialFailures.length > 0) {
      const failedSteps = data.partialFailures.map((f: any) => f.step || 'unknown').join(', ')
      return {
        success: true,
        warning: `Update completed with some failures: ${failedSteps}`,
        details: data.partialFailures,
        data,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[triggerManualUpdate] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Toggle radar active status for a channel
 */
export async function toggleRadarActive(
  channelId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('channel_radar')
      .update({ is_active: isActive })
      .eq('channel_id', channelId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/radar')

    return { success: true }
  } catch (error) {
    console.error('[toggleRadarActive] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update channel radar notes
 */
export async function updateRadarNotes(channelId: string, notes: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('channel_radar')
      .update({ notes })
      .eq('channel_id', channelId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/radar')

    return { success: true }
  } catch (error) {
    console.error('[updateRadarNotes] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get radar execution logs
 */
export async function getRadarExecutionLogs(limit: number = 10): Promise<
  ActionResult<
    Array<{
      id: number
      execution_started_at: string
      execution_completed_at: string | null
      status: string
      channels_processed: number
      channels_failed: number
      error_message: string | null
    }>
  >
> {
  try {
    const supabase = createAdminClient()

    const { data, error} = await supabase
      .from('channel_radar_cron_log')
      .select('id, execution_started_at, execution_completed_at, status, channels_processed, channels_failed, error_message')
      .order('execution_started_at', { ascending: false })
      .limit(limit)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('[getRadarExecutionLogs] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get approximate update statistics for radar logs
 * This provides estimates based on timestamps since we don't have per-channel update logs yet
 */
export async function getApproximateUpdateStats(
  executionId: number,
  executionStartedAt: string,
  executionCompletedAt: string | null
): Promise<
  ActionResult<{
    approximateNewVideos: number
    approximateViralVideos: number
    channelsWithOutliers: number
  }>
> {
  try {
    const supabase = createAdminClient()

    // Define time window for this execution (with 5min buffer)
    const startTime = new Date(executionStartedAt)
    startTime.setMinutes(startTime.getMinutes() - 5)

    const endTime = executionCompletedAt
      ? new Date(executionCompletedAt)
      : new Date() // If still running, use current time
    endTime.setMinutes(endTime.getMinutes() + 5)

    // Count videos created/updated during this execution window
    const { count: newVideosCount } = await supabase
      .from('benchmark_videos')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', startTime.toISOString())
      .lte('updated_at', endTime.toISOString())

    // Count videos with high performance ratios (viral - ratio >= 5)
    const { count: viralCount } = await supabase
      .from('benchmark_videos')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', startTime.toISOString())
      .lte('updated_at', endTime.toISOString())
      .or('performance_vs_avg_historical.gte.5,performance_vs_median_historical.gte.5')

    // Count channels with 10x outliers
    const { count: outlierChannelsCount } = await supabase
      .from('channel_radar')
      .select('*', { count: 'exact', head: true })
      .eq('has_10x_outlier', true)

    return {
      success: true,
      data: {
        approximateNewVideos: newVideosCount || 0,
        approximateViralVideos: viralCount || 0,
        channelsWithOutliers: outlierChannelsCount || 0,
      },
    }
  } catch (error) {
    console.error('[getApproximateUpdateStats] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
