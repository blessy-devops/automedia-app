'use server'

import { gobbiClient, ensureServerSide } from '@/lib/gobbi-client'
import type { CalendarEvent, Channel, BenchmarkVideo } from './types'

// Color themes for channels (will cycle through these)
const CHANNEL_COLOR_THEMES = [
  'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900',
  'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900',
  'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900',
  'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900',
  'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900',
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
    .select('id, name, placeholder, platform, language')

  if (error) {
    console.error('[getChannels] Error:', error.message)
    return channelCache
  }

  accounts?.forEach((acc, index) => {
    const channel: Channel = {
      id: acc.id.toString(),
      name: acc.name || acc.placeholder,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.placeholder}&backgroundColor=b6e3f4`,
      colorTheme: CHANNEL_COLOR_THEMES[index % CHANNEL_COLOR_THEMES.length],
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
