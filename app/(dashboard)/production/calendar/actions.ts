'use server'

import { gobbiClient, ensureServerSide } from '@/lib/gobbi-client'
import type { CalendarEvent, Channel, BenchmarkVideo } from './types'

// Color themes for channels (will cycle through these)
// Each theme has: colorTheme (for cards) and solidColor (for legend dots)
const CHANNEL_COLORS = [
  {
    theme: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900',
    solid: 'bg-blue-500',
  },
  {
    theme: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900',
    solid: 'bg-purple-500',
  },
  {
    theme: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900',
    solid: 'bg-emerald-500',
  },
  {
    theme: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900',
    solid: 'bg-orange-500',
  },
  {
    theme: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900',
    solid: 'bg-rose-500',
  },
]

// Cache for channel data (maps placeholder -> Channel)
const channelCache = new Map<string, Channel>()

/**
 * Fetch all structure_accounts and cache them
 */
async function getChannels(): Promise<Map<string, Channel>> {
  if (channelCache.size > 0) return channelCache

  const { data: accounts, error } = await gobbiClient
    .from('structure_accounts')
    .select('id, name, placeholder, platform, language, timezone')

  if (error) {
    console.error('[getChannels] Error:', error.message)
    return channelCache
  }

  accounts?.forEach((acc, index) => {
    const colorConfig = CHANNEL_COLORS[index % CHANNEL_COLORS.length]
    const channel: Channel = {
      id: acc.id.toString(),
      name: acc.name || acc.placeholder,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.placeholder}&backgroundColor=b6e3f4`,
      colorTheme: colorConfig.theme,
      solidColor: colorConfig.solid,
      timezone: acc.timezone || 'America/Sao_Paulo',
      placeholder: acc.placeholder,
    }
    channelCache.set(acc.placeholder, channel)
  })

  return channelCache
}

/**
 * Map Gobbi status to our VideoStatus type
 */
function mapStatus(gobbiStatus: string): 'Scheduled' | 'Posted' {
  if (gobbiStatus === 'published') return 'Posted'
  return 'Scheduled'
}

/**
 * Extract time from ISO date string
 */
function extractTime(isoDate: string | null): string {
  if (!isoDate) return '00:00'
  try {
    const date = new Date(isoDate)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '00:00'
  }
}

/**
 * Fetch calendar events for a specific month from production_videos
 */
export async function getCalendarEvents(year: number, month: number): Promise<CalendarEvent[]> {
  ensureServerSide()

  // Get channels first
  const channels = await getChannels()

  // Calculate date range for the month
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59)

  const { data: videos, error } = await gobbiClient
    .from('production_videos')
    .select(`
      id,
      title,
      description,
      status,
      planned_upload_date,
      placeholder,
      thumbnail_url,
      final_link,
      benchmark_id,
      benchmark_videos!production_videos_benchmark_id_fkey (
        id,
        title,
        thumbnail_url,
        youtube_video_id
      )
    `)
    .not('planned_upload_date', 'is', null)
    .gte('planned_upload_date', startDate.toISOString())
    .lte('planned_upload_date', endDate.toISOString())
    .order('planned_upload_date', { ascending: true })

  if (error) {
    console.error('[getCalendarEvents] Error:', error.message)
    return []
  }

  if (!videos) return []

  // Default channel for unknown placeholders
  const defaultChannel: Channel = {
    id: 'unknown',
    name: 'Unknown Channel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown&backgroundColor=cccccc',
    colorTheme: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-gray-900',
  }

  return videos.map((video): CalendarEvent => {
    const channel = channels.get(video.placeholder) || defaultChannel
    const benchmarkData = video.benchmark_videos as {
      id: number
      title: string
      thumbnail_url: string
      youtube_video_id: string
    } | null

    let benchmarkVideo: BenchmarkVideo | undefined
    if (benchmarkData) {
      benchmarkVideo = {
        id: benchmarkData.id.toString(),
        title: benchmarkData.title,
        thumbnail: benchmarkData.thumbnail_url,
        youtubeVideoId: benchmarkData.youtube_video_id,
      }
    }

    return {
      id: video.id.toString(),
      date: new Date(video.planned_upload_date),
      title: video.title || 'Untitled',
      channel,
      status: mapStatus(video.status),
      thumbnail: video.thumbnail_url || benchmarkData?.thumbnail_url || undefined,
      scheduledTime: extractTime(video.planned_upload_date),
      description: video.description || undefined,
      benchmarkVideo,
      youtubeUrl: video.final_link || undefined,
    }
  })
}

/**
 * Get all unique channels from the database
 */
export async function getAvailableChannels(): Promise<Channel[]> {
  ensureServerSide()
  const channels = await getChannels()
  return Array.from(channels.values())
}

/**
 * Update video schedule (reschedule)
 * Updates planned_upload_date and updated_at in production_videos
 *
 * @param videoId - The production_videos.id
 * @param newDateTime - ISO string of new planned upload date/time
 * @returns Success/error status
 *
 * TODO: After saving to database, call YouTube API to reschedule the video
 * This requires OAuth authentication and the YouTube Data API v3
 * Endpoint: PUT https://www.googleapis.com/youtube/v3/videos (with snippet.scheduledStartTime)
 */
export async function updateVideoSchedule(
  videoId: string,
  newDateTime: string
): Promise<{ success: boolean; error?: string }> {
  ensureServerSide()

  try {
    // Validate the date
    const parsedDate = new Date(newDateTime)
    if (isNaN(parsedDate.getTime())) {
      return { success: false, error: 'Invalid date format' }
    }

    // Update the production_videos record
    const { error } = await gobbiClient
      .from('production_videos')
      .update({
        planned_upload_date: newDateTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(videoId, 10))

    if (error) {
      console.error('[updateVideoSchedule] Error:', error.message)
      return { success: false, error: error.message }
    }

    // TODO: Call YouTube API to reschedule the video
    // This would involve:
    // 1. Getting the video's content_id_on_platform (YouTube video ID)
    // 2. Authenticating with OAuth using the channel's credentials
    // 3. Calling YouTube API to update the scheduled publish time
    // 4. Handling any errors from YouTube API

    return { success: true }
  } catch (err) {
    console.error('[updateVideoSchedule] Unexpected error:', err)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

/**
 * Check for schedule conflicts
 * Ensures minimum 5-minute gap between videos on the same channel
 *
 * @param placeholder - Channel placeholder
 * @param newDateTime - Proposed new date/time
 * @param excludeVideoId - Video ID to exclude from check (the one being rescheduled)
 * @returns Whether there's a conflict
 */
export async function checkScheduleConflict(
  placeholder: string,
  newDateTime: string,
  excludeVideoId: string
): Promise<{ hasConflict: boolean; conflictingTime?: string }> {
  ensureServerSide()

  const proposedTime = new Date(newDateTime)
  const fiveMinutesBefore = new Date(proposedTime.getTime() - 5 * 60 * 1000)
  const fiveMinutesAfter = new Date(proposedTime.getTime() + 5 * 60 * 1000)

  const { data: conflictingVideos, error } = await gobbiClient
    .from('production_videos')
    .select('id, planned_upload_date')
    .eq('placeholder', placeholder)
    .neq('id', parseInt(excludeVideoId, 10))
    .gte('planned_upload_date', fiveMinutesBefore.toISOString())
    .lte('planned_upload_date', fiveMinutesAfter.toISOString())
    .limit(1)

  if (error) {
    console.error('[checkScheduleConflict] Error:', error.message)
    return { hasConflict: false } // Don't block on error, just warn
  }

  if (conflictingVideos && conflictingVideos.length > 0) {
    return {
      hasConflict: true,
      conflictingTime: conflictingVideos[0].planned_upload_date
    }
  }

  return { hasConflict: false }
}
