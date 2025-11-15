"use server"

import { createClient } from "@/lib/supabase/server"

export interface DashboardKPIs {
  newOutliersThisWeek: number
  total10xVideos: number
  activeRadarChannels: number
  videosEnrichedToday: number
}

export interface CloneWorthyVideo {
  youtube_video_id: string
  title: string
  thumbnail_url: string | null
  views: number | null
  likes: number | null
  comments: number | null
  performance_vs_avg_historical: number | null
  upload_date: string | null
  video_age_days: number | null
  channel_id: string | null
  channel_name: string | null
  categorization: any
}

export interface TrendingNiche {
  niche: string
  outlier_count: number
  avg_performance: number
}

export interface RadarAlert {
  youtube_video_id: string
  title: string
  thumbnail_url: string | null
  views: number | null
  performance_vs_avg_historical: number | null
  upload_date: string | null
  channel_name: string | null
  detected_at: string | null
}

/**
 * Get main KPIs for home dashboard
 */
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase = await createClient()

  // New outliers this week (5x+ performance in last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count: newOutliersCount } = await supabase
    .from("benchmark_videos")
    .select("*", { count: "exact", head: true })
    .gte("performance_vs_avg_historical", 5)
    .gte("upload_date", sevenDaysAgo.toISOString())

  // Total 10x+ videos
  const { count: total10xCount } = await supabase
    .from("benchmark_videos")
    .select("*", { count: "exact", head: true })
    .gte("performance_vs_avg_historical", 10)

  // Active radar channels
  const { count: activeRadarCount } = await supabase
    .from("channel_radar")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  // Videos enriched today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: enrichedTodayCount } = await supabase
    .from("benchmark_videos")
    .select("*", { count: "exact", head: true })
    .gte("last_enriched_at", today.toISOString())

  return {
    newOutliersThisWeek: newOutliersCount ?? 0,
    total10xVideos: total10xCount ?? 0,
    activeRadarChannels: activeRadarCount ?? 0,
    videosEnrichedToday: enrichedTodayCount ?? 0,
  }
}

/**
 * Get top clone-worthy videos (highest outlier ratio, recent)
 */
export async function getCloneWorthyVideos(limit: number = 10): Promise<CloneWorthyVideo[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("benchmark_videos")
    .select(`
      youtube_video_id,
      title,
      thumbnail_url,
      views,
      likes,
      comments,
      performance_vs_avg_historical,
      upload_date,
      video_age_days,
      channel_id,
      categorization,
      benchmark_channels!inner(channel_name)
    `)
    .gte("performance_vs_avg_historical", 5)
    .not("performance_vs_avg_historical", "is", null)
    .order("performance_vs_avg_historical", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching clone-worthy videos:", error)
    return []
  }

  return (data ?? []).map((video: any) => ({
    youtube_video_id: video.youtube_video_id,
    title: video.title,
    thumbnail_url: video.thumbnail_url,
    views: video.views,
    likes: video.likes,
    comments: video.comments,
    performance_vs_avg_historical: video.performance_vs_avg_historical,
    upload_date: video.upload_date,
    video_age_days: video.video_age_days,
    channel_id: video.channel_id,
    channel_name: video.benchmark_channels?.channel_name ?? null,
    categorization: video.categorization,
  }))
}

/**
 * Get trending niches by outlier count
 */
export async function getTrendingNiches(limit: number = 10): Promise<TrendingNiche[]> {
  const supabase = await createClient()

  // Get all videos with 5x+ performance
  const { data, error } = await supabase
    .from("benchmark_videos")
    .select("categorization, performance_vs_avg_historical")
    .gte("performance_vs_avg_historical", 5)
    .not("categorization", "is", null)

  if (error || !data) {
    console.error("Error fetching trending niches:", error)
    return []
  }

  // Group by niche and calculate stats
  const nicheMap = new Map<string, { count: number; totalPerformance: number }>()

  data.forEach((video: any) => {
    const niche = video.categorization?.niche
    if (!niche) return

    const current = nicheMap.get(niche) || { count: 0, totalPerformance: 0 }
    nicheMap.set(niche, {
      count: current.count + 1,
      totalPerformance: current.totalPerformance + (video.performance_vs_avg_historical || 0),
    })
  })

  // Convert to array and calculate averages
  const niches = Array.from(nicheMap.entries()).map(([niche, stats]) => ({
    niche,
    outlier_count: stats.count,
    avg_performance: stats.totalPerformance / stats.count,
  }))

  // Sort by outlier count and limit
  return niches
    .sort((a, b) => b.outlier_count - a.outlier_count)
    .slice(0, limit)
}

/**
 * Get recent radar alerts (new outliers from monitored channels)
 */
export async function getRadarAlerts(limit: number = 10): Promise<RadarAlert[]> {
  const supabase = await createClient()

  // Get videos from channels in radar with 5x+ performance uploaded in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from("benchmark_videos")
    .select(`
      youtube_video_id,
      title,
      thumbnail_url,
      views,
      performance_vs_avg_historical,
      upload_date,
      channel_id,
      benchmark_channels!inner(
        channel_name,
        channel_radar!inner(is_active, last_update_at)
      )
    `)
    .gte("performance_vs_avg_historical", 5)
    .gte("upload_date", thirtyDaysAgo.toISOString())
    .order("upload_date", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching radar alerts:", error)
    return []
  }

  return (data ?? []).map((video: any) => ({
    youtube_video_id: video.youtube_video_id,
    title: video.title,
    thumbnail_url: video.thumbnail_url,
    views: video.views,
    performance_vs_avg_historical: video.performance_vs_avg_historical,
    upload_date: video.upload_date,
    channel_name: video.benchmark_channels?.channel_name ?? null,
    detected_at: video.benchmark_channels?.channel_radar?.[0]?.last_update_at ?? null,
  }))
}
