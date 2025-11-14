import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { VideoDetailHeader } from './components/video-detail-header'
import { PerformanceMetricsCard } from './components/performance-metrics-card'
import { VideoStatsCard } from './components/video-stats-card'
import { CategorizationCard } from './components/categorization-card'
import { ChannelCard } from './components/channel-card'
import { KeywordsCard } from './components/keywords-card'
import { RelatedVideosCard } from './components/related-videos-card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

/**
 * Video Details Page
 *
 * Dynamic route that displays comprehensive information about a single video:
 * - Video player and metadata
 * - Performance analysis
 * - AI categorization results
 * - Basic statistics
 * - Channel information with link
 */
export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params
  const videoId = parseInt(id, 10)

  if (isNaN(videoId)) {
    notFound()
  }

  // Fetch video data
  const { data: result, error } = await supabase
    .from('benchmark_videos')
    .select(`
      id,
      youtube_video_id,
      channel_id,
      title,
      description,
      views,
      likes,
      comments,
      upload_date,
      video_length,
      thumbnail_url,
      tags,
      categorization,
      performance_vs_avg_historical,
      performance_vs_median_historical,
      performance_vs_recent_14d,
      performance_vs_recent_30d,
      performance_vs_recent_90d,
      is_outlier,
      outlier_threshold,
      keywords,
      related_video_ids,
      enrichment_data,
      last_enriched_at
    `)
    .eq('id', videoId)
    .limit(1)
    .single()

  if (error || !result) {
    console.error('Error fetching video:', error)
    notFound()
  }

  // Fetch channel information separately
  const { data: channelData } = await supabase
    .from('benchmark_channels')
    .select('channel_name, id')
    .eq('channel_id', result.channel_id)
    .single()

  // Calculate video age in days
  const uploadDate = new Date(result.upload_date)
  const now = new Date()
  const videoAgeDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24))

  // Transform data to camelCase format
  const video = {
    id: result.id,
    youtubeVideoId: result.youtube_video_id,
    channelId: result.channel_id,
    title: result.title,
    description: result.description,
    views: result.views,
    likes: result.likes,
    comments: result.comments,
    uploadDate: result.upload_date,
    videoLength: result.video_length,
    thumbnailUrl: result.thumbnail_url,
    tags: result.tags,
    categorization: result.categorization,
    performanceVsAvgHistorical: result.performance_vs_avg_historical,
    performanceVsMedianHistorical: result.performance_vs_median_historical,
    performanceVsRecent14d: result.performance_vs_recent_14d,
    performanceVsRecent30d: result.performance_vs_recent_30d,
    performanceVsRecent90d: result.performance_vs_recent_90d,
    isOutlier: result.is_outlier,
    outlierThreshold: result.outlier_threshold,
    keywords: result.keywords,
    relatedVideoIds: result.related_video_ids,
    enrichmentData: result.enrichment_data,
    lastEnrichedAt: result.last_enriched_at,
    channelName: channelData?.channel_name || null,
    channelDatabaseId: channelData?.id || null,
    videoAgeDays,
  }

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/videos">Videos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{video.title || 'Video Details'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column (Left - 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <VideoDetailHeader video={video} />
          <KeywordsCard keywords={video.keywords} lastEnrichedAt={video.lastEnrichedAt} />
        </div>

        {/* Sidebar Column (Right - 1/3 width) */}
        <div className="space-y-6">
          <PerformanceMetricsCard video={video} />
          <VideoStatsCard video={video} />
          <CategorizationCard video={video} />
          <ChannelCard
            channelName={video.channelName}
            channelDatabaseId={video.channelDatabaseId}
          />
        </div>
      </div>

      {/* Related Videos Section (Full Width) */}
      {video.enrichmentData?.relatedVideos && (
        <div className="mt-6">
          <RelatedVideosCard
            videoId={video.id}
            relatedVideosData={video.enrichmentData}
          />
        </div>
      )}
    </div>
  )
}
