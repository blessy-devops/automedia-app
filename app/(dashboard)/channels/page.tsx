import { db } from '@/lib/drizzle'
import { benchmarkChannelsTable, benchmarkChannelsBaselineStatsTable, channelMetricsSummaryView } from '@/lib/drizzle'
import { desc, gte, and, eq, sql } from 'drizzle-orm'
import { Suspense } from 'react'
import { ChannelsContent } from './components/channels-content'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Eye, Video, TrendingUp } from 'lucide-react'
import { formatLargeNumber } from '@/lib/utils'

/**
 * Channels Listing Page
 *
 * Server Component that fetches benchmark channels from the database
 * with baseline statistics and displays them in an interactive data table
 * with advanced filtering, sorting, and gallery/table view options.
 *
 * Supports URL-based filtering and sorting:
 * - minSubscribers: Filter by minimum subscriber count
 * - minTotalViews: Filter by minimum total views
 * - minVideos: Filter by minimum video count
 * - minAvgViews: Filter by minimum average views per video (requires baseline stats)
 * - sortBy: Sort by 'subscribers' (default), 'total_views', 'avg_views', or 'median_views'
 */
export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await searchParams (Next.js 15+)
  const params = await searchParams

  // Extract filter and sort parameters from URL
  const minSubscribers = params.minSubscribers
    ? Number(params.minSubscribers)
    : undefined
  const minTotalViews = params.minTotalViews
    ? Number(params.minTotalViews)
    : undefined
  const minVideos = params.minVideos
    ? Number(params.minVideos)
    : undefined
  const minAvgViews = params.minAvgViews
    ? Number(params.minAvgViews)
    : undefined
  const sortBy = (params.sortBy as string) || 'subscribers'

  // Build WHERE clause conditions
  const whereConditions = []
  if (minSubscribers !== undefined && !isNaN(minSubscribers)) {
    whereConditions.push(gte(benchmarkChannelsTable.subscriberCount, minSubscribers))
  }
  if (minTotalViews !== undefined && !isNaN(minTotalViews)) {
    whereConditions.push(gte(benchmarkChannelsTable.totalViews, minTotalViews))
  }
  if (minVideos !== undefined && !isNaN(minVideos)) {
    whereConditions.push(gte(benchmarkChannelsTable.videoUploadCount, minVideos))
  }
  if (minAvgViews !== undefined && !isNaN(minAvgViews)) {
    whereConditions.push(
      gte(benchmarkChannelsBaselineStatsTable.avgViewsPerVideoHistorical, minAvgViews)
    )
  }

  // Build ORDER BY clause based on sortBy parameter
  let orderByClause
  if (sortBy === 'total_views') {
    orderByClause = desc(benchmarkChannelsTable.totalViews)
  } else if (sortBy === 'avg_views') {
    orderByClause = desc(benchmarkChannelsBaselineStatsTable.avgViewsPerVideoHistorical)
  } else if (sortBy === 'median_views') {
    orderByClause = desc(benchmarkChannelsBaselineStatsTable.medianViewsPerVideoHistorical)
  } else {
    // Default: subscribers
    orderByClause = desc(benchmarkChannelsTable.subscriberCount)
  }

  // Build and execute the query with LEFT JOIN
  let query = db
    .select({
      // Channel fields
      id: benchmarkChannelsTable.id,
      channelId: benchmarkChannelsTable.channelId,
      channelName: benchmarkChannelsTable.channelName,
      subscriberCount: benchmarkChannelsTable.subscriberCount,
      totalViews: benchmarkChannelsTable.totalViews,
      videoUploadCount: benchmarkChannelsTable.videoUploadCount,
      categorization: benchmarkChannelsTable.categorization,
      thumbnailUrl: benchmarkChannelsTable.thumbnailUrl,
      isVerified: benchmarkChannelsTable.isVerified,
      country: benchmarkChannelsTable.country,
      // Baseline stats fields (may be null if no stats calculated)
      avgViewsPerVideoHistorical: benchmarkChannelsBaselineStatsTable.avgViewsPerVideoHistorical,
      medianViewsPerVideoHistorical: benchmarkChannelsBaselineStatsTable.medianViewsPerVideoHistorical,
    })
    .from(benchmarkChannelsTable)
    .leftJoin(
      benchmarkChannelsBaselineStatsTable,
      eq(benchmarkChannelsTable.channelId, benchmarkChannelsBaselineStatsTable.channelId)
    )

  // Apply WHERE conditions if any
  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions)) as typeof query
  }

  // Apply ORDER BY and LIMIT
  const channels = await query.orderBy(orderByClause).limit(100)

  // Calculate metrics from ALL channels in database (not just the 100 displayed)
  const metricsResult = await db
    .select({
      totalChannels: sql<number>`COUNT(*)::int`,
      totalSubscribers: sql<number>`COALESCE(SUM(${benchmarkChannelsTable.subscriberCount}), 0)::bigint`,
      totalVideos: sql<number>`COALESCE(SUM(${benchmarkChannelsTable.videoUploadCount}), 0)::bigint`,
    })
    .from(benchmarkChannelsTable)
    .then(rows => rows[0])

  const totalChannels = metricsResult.totalChannels || 0
  const totalSubscribers = Number(metricsResult.totalSubscribers) || 0
  const averageSubscribers = totalChannels > 0 ? Math.round(totalSubscribers / totalChannels) : 0
  const totalVideos = Number(metricsResult.totalVideos) || 0
  const averageVideosPerChannel = totalChannels > 0 ? Math.round(totalVideos / totalChannels) : 0

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          YouTube Channels
        </h1>
        <p className="text-muted-foreground text-lg">
          Browse and analyze enriched YouTube channel data with performance metrics
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChannels.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Channels tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLargeNumber(totalSubscribers)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all channels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLargeNumber(averageSubscribers)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per channel average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageVideosPerChannel.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per channel average
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
        <ChannelsContent data={channels} />
      </Suspense>
    </div>
  )
}
