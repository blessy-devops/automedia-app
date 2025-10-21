import { notFound } from 'next/navigation'
import { db } from '@/lib/drizzle'
import {
  benchmarkChannelsTable,
  benchmarkChannelsBaselineStatsTable,
  benchmarkVideosTable
} from '@/lib/drizzle'
import { eq, desc, sql } from 'drizzle-orm'
import { ChannelDetailHeader } from './components/channel-detail-header'
import { VideosDataTable } from '../../videos/components/videos-data-table'
import { columns as videoColumns } from '../../videos/components/columns'

/**
 * Channel Details Page
 *
 * Dynamic route that displays comprehensive information about a single channel:
 * - Channel metadata and statistics
 * - AI categorization results
 * - Baseline performance metrics
 * - Complete list of channel's videos with performance analysis
 */
export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const channelId = parseInt(id, 10)

  if (isNaN(channelId)) {
    notFound()
  }

  // Fetch all channel data in parallel for optimal performance
  const [channelData, baselineStats, videos] = await Promise.all([
    // 1. Fetch channel metadata
    db
      .select()
      .from(benchmarkChannelsTable)
      .where(eq(benchmarkChannelsTable.id, channelId))
      .limit(1)
      .then((rows) => rows[0]),

    // 2. Fetch baseline statistics (14d, 30d, 90d)
    db
      .select()
      .from(benchmarkChannelsBaselineStatsTable)
      .where(
        eq(
          benchmarkChannelsBaselineStatsTable.channelId,
          sql`(SELECT channel_id FROM benchmark_channels WHERE id = ${channelId})`
        )
      )
      .orderBy(desc(benchmarkChannelsBaselineStatsTable.calculatedAt))
      .limit(1)
      .then((rows) => rows[0]),

    // 3. Fetch all videos from this channel
    db
      .select({
        id: benchmarkVideosTable.id,
        youtubeVideoId: benchmarkVideosTable.youtubeVideoId,
        channelId: benchmarkVideosTable.channelId,
        title: benchmarkVideosTable.title,
        views: benchmarkVideosTable.views,
        likes: benchmarkVideosTable.likes,
        comments: benchmarkVideosTable.comments,
        uploadDate: benchmarkVideosTable.uploadDate,
        thumbnailUrl: benchmarkVideosTable.thumbnailUrl,
        performanceVsAvgHistorical: benchmarkVideosTable.performanceVsAvgHistorical,
        performanceVsMedianHistorical: benchmarkVideosTable.performanceVsMedianHistorical,
        performanceVsRecent14d: benchmarkVideosTable.performanceVsRecent14d,
        performanceVsRecent30d: benchmarkVideosTable.performanceVsRecent30d,
        performanceVsRecent90d: benchmarkVideosTable.performanceVsRecent90d,
        isOutlier: benchmarkVideosTable.isOutlier,
        videoAgeDays: sql<number>`EXTRACT(DAY FROM NOW() - ${benchmarkVideosTable.uploadDate})`.as('video_age_days'),
      })
      .from(benchmarkVideosTable)
      .where(
        eq(
          benchmarkVideosTable.channelId,
          sql`(SELECT channel_id FROM benchmark_channels WHERE id = ${channelId})`
        )
      )
      .orderBy(desc(benchmarkVideosTable.uploadDate))
  ])

  // Handle channel not found
  if (!channelData) {
    notFound()
  }

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

        <VideosDataTable
          columns={videoColumns}
          data={videos}
        />
      </div>
    </div>
  )
}
