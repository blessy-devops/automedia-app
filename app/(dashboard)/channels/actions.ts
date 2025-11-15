'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface ChannelDependencies {
  videosCount: number
  baselineStatsCount: number
  radarEntriesCount: number
  hasAnyDependencies: boolean
}

/**
 * Get channel dependencies (videos, baseline stats, radar entries)
 * Used to show warnings before deletion
 */
export async function getChannelDependencies(
  channelId: string
): Promise<ActionResult<ChannelDependencies>> {
  try {
    const supabase = await createClient()

    // Count dependencies in parallel
    const [videosResult, statsResult, radarResult] = await Promise.all([
      // Count videos
      supabase
        .from('benchmark_videos')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId),

      // Count baseline stats
      supabase
        .from('benchmark_channels_baseline_stats')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId),

      // Count radar entries
      supabase
        .from('channel_radar')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId),
    ])

    const videosCount = videosResult.count || 0
    const baselineStatsCount = statsResult.count || 0
    const radarEntriesCount = radarResult.count || 0

    return {
      success: true,
      data: {
        videosCount,
        baselineStatsCount,
        radarEntriesCount,
        hasAnyDependencies: videosCount > 0 || baselineStatsCount > 0 || radarEntriesCount > 0,
      },
    }
  } catch (error) {
    console.error('[getChannelDependencies] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get channel dependencies',
    }
  }
}

/**
 * Delete a single channel and optionally its related data
 *
 * @param id - Channel database ID
 * @param cascade - If true, deletes videos, baseline stats, and radar entries
 */
export async function deleteChannel(
  id: number,
  cascade: boolean = false
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get the channel first to retrieve channel_id
    const { data: channel, error: fetchError } = await supabase
      .from('benchmark_channels')
      .select('channel_id, channel_name')
      .eq('id', id)
      .single()

    if (fetchError || !channel) {
      return {
        success: false,
        error: 'Channel not found',
      }
    }

    const channelId = channel.channel_id

    // Check dependencies
    const depsResult = await getChannelDependencies(channelId)
    if (!depsResult.success || !depsResult.data) {
      return {
        success: false,
        error: 'Failed to check channel dependencies',
      }
    }

    const deps = depsResult.data

    // If has dependencies and cascade is false, return error
    if (deps.hasAnyDependencies && !cascade) {
      return {
        success: false,
        error: `Cannot delete channel with ${deps.videosCount} videos, ${deps.baselineStatsCount} baseline stats, and ${deps.radarEntriesCount} radar entries. Enable cascade delete to remove all related data.`,
      }
    }

    // If cascade is true, delete related data first (in order)
    if (cascade) {
      // 1. Delete videos
      if (deps.videosCount > 0) {
        const { error: videosError } = await supabase
          .from('benchmark_videos')
          .delete()
          .eq('channel_id', channelId)

        if (videosError) {
          console.error('[deleteChannel] Error deleting videos:', videosError)
          return {
            success: false,
            error: 'Failed to delete channel videos',
          }
        }
      }

      // 2. Delete baseline stats
      if (deps.baselineStatsCount > 0) {
        const { error: statsError } = await supabase
          .from('benchmark_channels_baseline_stats')
          .delete()
          .eq('channel_id', channelId)

        if (statsError) {
          console.error('[deleteChannel] Error deleting baseline stats:', statsError)
          return {
            success: false,
            error: 'Failed to delete channel baseline stats',
          }
        }
      }

      // 3. Delete radar entries (has CASCADE on FK, but delete explicitly for consistency)
      if (deps.radarEntriesCount > 0) {
        const { error: radarError } = await supabase
          .from('channel_radar')
          .delete()
          .eq('channel_id', channelId)

        if (radarError) {
          console.error('[deleteChannel] Error deleting radar entries:', radarError)
          // Not critical, FK cascade should handle it
        }
      }
    }

    // 4. Finally, delete the channel itself
    const { error: deleteError } = await supabase
      .from('benchmark_channels')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[deleteChannel] Error deleting channel:', deleteError)
      return {
        success: false,
        error: 'Failed to delete channel',
      }
    }

    // Revalidate the channels page
    revalidatePath('/channels')

    return {
      success: true,
      data: {
        channelName: channel.channel_name,
        deletedDependencies: cascade ? deps : null,
      },
    }
  } catch (error) {
    console.error('[deleteChannel] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete channel',
    }
  }
}

/**
 * Delete multiple channels in bulk
 *
 * @param ids - Array of channel database IDs
 * @param cascade - If true, deletes all related data for each channel
 */
export async function bulkDeleteChannels(
  ids: number[],
  cascade: boolean = false
): Promise<ActionResult<{ deleted: number; failed: number; errors: string[] }>> {
  try {
    if (!ids || ids.length === 0) {
      return {
        success: false,
        error: 'No channels selected for deletion',
      }
    }

    let deleted = 0
    let failed = 0
    const errors: string[] = []

    // Delete channels one by one (could be optimized with batch operations)
    for (const id of ids) {
      const result = await deleteChannel(id, cascade)
      if (result.success) {
        deleted++
      } else {
        failed++
        errors.push(`Channel ID ${id}: ${result.error}`)
      }
    }

    // Revalidate once at the end
    revalidatePath('/channels')

    return {
      success: true,
      data: {
        deleted,
        failed,
        errors,
      },
    }
  } catch (error) {
    console.error('[bulkDeleteChannels] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk delete channels',
    }
  }
}
