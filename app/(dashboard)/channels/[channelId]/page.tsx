import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/drizzle'
import {
  benchmarkChannelsTable,
  benchmarkChannelsBaselineStatsTable,
  benchmarkVideosTable
} from '@/lib/drizzle'
import { eq, desc, sql } from 'drizzle-orm'
import { ChannelDetailHeader } from './components/channel-detail-header'
import { SimpleVideosTable } from '../../videos/components/simple-videos-table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ChevronRight, Home } from "lucide-react"

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
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = await params

  // Fetch all channel data in parallel for optimal performance
  const [channelData, baselineStats, videos] = await Promise.all([
    // 1. Fetch channel metadata
    db
      .select()
      .from(benchmarkChannelsTable)
      .where(eq(benchmarkChannelsTable.channelId, channelId))
      .limit(1)
      .then((rows) => rows[0]),

    // 2. Fetch baseline statistics (14d, 30d, 90d)
    db
      .select()
      .from(benchmarkChannelsBaselineStatsTable)
      .where(eq(benchmarkChannelsBaselineStatsTable.channelId, channelId))
      .orderBy(desc(benchmarkChannelsBaselineStatsTable.calculatedAt))
      .limit(1)
      .then((rows) => rows[0]),

    // 3. Fetch all videos from this channel
    db
      .select({
        id: benchmarkVideosTable.id,
        youtubeVideoId: benchmarkVideosTable.youtubeVideoId,
        channelId: benchmarkVideosTable.channelId,
        channelName: benchmarkChannelsTable.channelName,
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
      .leftJoin(
        benchmarkChannelsTable,
        eq(benchmarkVideosTable.channelId, benchmarkChannelsTable.channelId)
      )
      .where(eq(benchmarkVideosTable.channelId, channelId))
      .orderBy(desc(benchmarkVideosTable.uploadDate))
  ])

  // Handle channel not found
  if (!channelData) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="flex items-center gap-1.5">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/channels">Channels</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[200px] truncate">
              {channelData.channelName || channelId}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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

        <SimpleVideosTable data={videos} />
      </div>
    </div>
  )
}
