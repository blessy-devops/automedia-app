import { notFound } from 'next/navigation'
import { db } from '@/lib/drizzle'
import {
  benchmarkVideosTable,
  benchmarkChannelsTable
} from '@/lib/drizzle'
import { eq, sql } from 'drizzle-orm'
import { VideoDetailHeader } from './components/video-detail-header'
import { PerformanceMetricsCard } from './components/performance-metrics-card'
import { VideoStatsCard } from './components/video-stats-card'
import { CategorizationCard } from './components/categorization-card'
import { ChannelCard } from './components/channel-card'

/**
 * Video Details Page
 *
 * Dynamic route that displays comprehensive information about a single video:
 * - Video player and metadata
 * - Complete performance analysis with all 5 scores
 * - AI categorization results
 * - Basic statistics
 * - Channel information with link
 */
export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const videoId = parseInt(id, 10)

  if (isNaN(videoId)) {
    notFound()
  }

  // Fetch video data with channel information via LEFT JOIN
  const result = await db
    .select({
      // Video fields
      id: benchmarkVideosTable.id,
      youtubeVideoId: benchmarkVideosTable.youtubeVideoId,
      channelId: benchmarkVideosTable.channelId,
      title: benchmarkVideosTable.title,
      description: benchmarkVideosTable.description,
      views: benchmarkVideosTable.views,
      likes: benchmarkVideosTable.likes,
      comments: benchmarkVideosTable.comments,
      uploadDate: benchmarkVideosTable.uploadDate,
      videoLength: benchmarkVideosTable.videoLength,
      thumbnailUrl: benchmarkVideosTable.thumbnailUrl,
      tags: benchmarkVideosTable.tags,
      categorization: benchmarkVideosTable.categorization,
      // Performance scores
      performanceVsAvgHistorical: benchmarkVideosTable.performanceVsAvgHistorical,
      performanceVsMedianHistorical: benchmarkVideosTable.performanceVsMedianHistorical,
      performanceVsRecent14d: benchmarkVideosTable.performanceVsRecent14d,
      performanceVsRecent30d: benchmarkVideosTable.performanceVsRecent30d,
      performanceVsRecent90d: benchmarkVideosTable.performanceVsRecent90d,
      isOutlier: benchmarkVideosTable.isOutlier,
      outlierThreshold: benchmarkVideosTable.outlierThreshold,
      // Channel fields
      channelName: benchmarkChannelsTable.channelName,
      channelDatabaseId: benchmarkChannelsTable.id,
      // Calculated fields
      videoAgeDays: sql<number>`EXTRACT(DAY FROM NOW() - ${benchmarkVideosTable.uploadDate})`.as('video_age_days'),
    })
    .from(benchmarkVideosTable)
    .leftJoin(
      benchmarkChannelsTable,
      eq(benchmarkVideosTable.channelId, benchmarkChannelsTable.channelId)
    )
    .where(eq(benchmarkVideosTable.id, videoId))
    .limit(1)

  const video = result[0]

  if (!video) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column (Left - 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <VideoDetailHeader video={video} />
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
    </div>
  )
}
