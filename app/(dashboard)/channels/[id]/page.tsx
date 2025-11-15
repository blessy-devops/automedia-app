import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChannelDetailHeader } from './components/channel-detail-header'
import { SimpleVideosTableNew } from '../../videos/components/simple-videos-table-new'
import { parseVideoFilters, applyVideoFiltersToQuery } from '@/lib/video-filters'

/**
 * Channel Details Page
 *
 * Dynamic route that displays comprehensive information about a single channel:
 * - Channel metadata and statistics
 * - AI categorization results
 * - Baseline performance metrics
 * - Complete list of channel's videos with performance analysis
 * - Filterable video list (Upload Date, Min Views, Min Outlier Score)
 */
export default async function ChannelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { id } = await params
  const channelId = parseInt(id, 10)

  if (isNaN(channelId)) {
    notFound()
  }

  // 1. First, fetch channel metadata to get the channel_id
  const { data: channelResult, error: channelError } = await supabase
    .from('benchmark_channels')
    .select('*')
    .eq('id', channelId)
    .limit(1)
    .single()

  // Handle channel not found
  if (channelError || !channelResult) {
    console.error('Error fetching channel:', channelError)
    notFound()
  }

  const youtubeChannelId = channelResult.channel_id

  // Parse URL filters
  const searchParamsData = await searchParams
  const filters = parseVideoFilters(searchParamsData)

  // Build videos query with filters
  let videosQuery = supabase
    .from('benchmark_videos')
    .select('*')
    .eq('channel_id', youtubeChannelId)

  // Apply filters (minViews, minOutlierScore, dateRange, sortBy)
  videosQuery = applyVideoFiltersToQuery(videosQuery, filters)

  // 2. Fetch baseline statistics and videos in parallel using the channel_id
  const [baselineStatsResult, videosResult] = await Promise.all([
    // Fetch baseline statistics (14d, 30d, 90d) - get the most recent one
    supabase
      .from('benchmark_channels_baseline_stats')
      .select('*')
      .eq('channel_id', youtubeChannelId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Fetch videos with filters applied
    videosQuery
  ])

  // Transform channel data to camelCase
  const channelData = {
    id: channelResult.id,
    channelId: channelResult.channel_id,
    channelName: channelResult.channel_name,
    subscriberCount: channelResult.subscriber_count,
    totalViews: channelResult.total_views,
    videoUploadCount: channelResult.video_upload_count,
    categorization: channelResult.categorization,
    thumbnailUrl: channelResult.thumbnail_url,
    isVerified: channelResult.is_verified,
    country: channelResult.country,
    description: channelResult.description,
    customUrl: channelResult.custom_url,
    inRadar: channelResult.in_radar || false,
  }

  // Transform baseline stats to camelCase (may be null)
  const baselineStats = baselineStatsResult.data
    ? {
        id: baselineStatsResult.data.id,
        channelId: baselineStatsResult.data.channel_id,
        // 14-day metrics (populated by SocialBlade)
        totalViews14d: baselineStatsResult.data.total_views_14d,
        videosCount14d: baselineStatsResult.data.videos_count_14d,
        avgViewsPerVideo14d: baselineStatsResult.data.avg_views_per_video_14d,
        medianViewsPerVideo14d: baselineStatsResult.data.median_views_per_video_14d,
        // Historical metrics
        avgViewsPerVideoHistorical: baselineStatsResult.data.avg_views_per_video_historical,
        medianViewsPerVideoHistorical: baselineStatsResult.data.median_views_per_video_historical,
        calculatedAt: baselineStatsResult.data.calculated_at,
      }
    : null

  // Debug: Check what we got from the query
  console.log('Videos query result:', {
    hasData: !!videosResult.data,
    count: videosResult.data?.length || 0,
    error: videosResult.error,
    channelId: youtubeChannelId
  })

  // Transform videos data to camelCase and calculate video age
  const videos = (videosResult.data || []).map((video: any) => {
    const uploadDate = video.upload_date ? new Date(video.upload_date) : null
    const now = new Date()
    const videoAgeDays = uploadDate
      ? Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      id: video.id,
      youtubeVideoId: video.youtube_video_id,
      channelId: video.channel_id,
      channelName: channelData.channelName,
      title: video.title,
      views: video.views,
      likes: video.likes,
      comments: video.comments,
      uploadDate: uploadDate,
      thumbnailUrl: video.thumbnail_url,
      performanceVsAvgHistorical: video.performance_vs_avg_historical,
      performanceVsMedianHistorical: video.performance_vs_median_historical,
      performanceVsRecent14d: video.performance_vs_recent_14d,
      performanceVsRecent30d: video.performance_vs_recent_30d,
      performanceVsRecent90d: video.performance_vs_recent_90d,
      isOutlier: video.is_outlier,
      videoAgeDays,
    }
  })

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Channel Header with all metadata and statistics */}
      <ChannelDetailHeader
        channel={channelData}
        baselineStats={baselineStats}
      />

      {/* Channel Videos Section */}
      <div className="mt-10">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Videos do Canal
          </h2>
          <p className="text-muted-foreground">
            {videos.length} vídeo(s) encontrado(s)
          </p>
        </div>

        <SimpleVideosTableNew data={videos} />
      </div>
    </div>
  )
}
