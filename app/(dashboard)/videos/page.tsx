import { db } from '@/lib/drizzle'
import { benchmarkVideosTable, benchmarkChannelsTable, videoMetricsSummaryView } from '@/lib/drizzle'
import { desc, sql, gte, and, eq } from 'drizzle-orm'
import { Suspense } from 'react'
import { VideosContent } from './components/videos-content'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Eye, TrendingUp } from 'lucide-react'
import { formatLargeNumber } from '@/lib/utils'

/**
 * Videos Listing Page
 *
 * Server Component that fetches benchmark videos from the database
 * and displays them in an interactive data table with advanced filtering,
 * sorting by performance metrics, and outlier analysis.
 *
 * Supports URL-based filtering and sorting:
 * - minViews: Filter by minimum number of views
 * - minOutlierScore: Filter by minimum outlier performance score
 * - sortBy: Sort by 'views', 'outlier_score', or 'upload_date' (default)
 */
export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await searchParams (Next.js 15+)
  const params = await searchParams

  // Extract filter and sort parameters from URL
  const minViews = params.minViews
    ? Number(params.minViews)
    : undefined
  const minOutlierScore = params.minOutlierScore
    ? Number(params.minOutlierScore)
    : undefined
  const sortBy = (params.sortBy as string) || 'upload_date'

  // Build WHERE clause conditions
  const whereConditions = []
  if (minViews !== undefined && !isNaN(minViews)) {
    whereConditions.push(gte(benchmarkVideosTable.views, minViews))
  }
  if (minOutlierScore !== undefined && !isNaN(minOutlierScore)) {
    whereConditions.push(
      gte(benchmarkVideosTable.performanceVsMedianHistorical, minOutlierScore)
    )
  }

  // Build ORDER BY clause based on sortBy parameter
  let orderByClause
  if (sortBy === 'views') {
    orderByClause = desc(benchmarkVideosTable.views)
  } else if (sortBy === 'outlier_score') {
    orderByClause = desc(benchmarkVideosTable.performanceVsMedianHistorical)
  } else {
    // Default: upload_date
    orderByClause = desc(benchmarkVideosTable.uploadDate)
  }

  // Build and execute the query with JOIN to get channel name
  let query = db
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
      // Outlier performance scores
      performanceVsAvgHistorical: benchmarkVideosTable.performanceVsAvgHistorical,
      performanceVsMedianHistorical: benchmarkVideosTable.performanceVsMedianHistorical,
      performanceVsRecent14d: benchmarkVideosTable.performanceVsRecent14d,
      performanceVsRecent30d: benchmarkVideosTable.performanceVsRecent30d,
      performanceVsRecent90d: benchmarkVideosTable.performanceVsRecent90d,
      isOutlier: benchmarkVideosTable.isOutlier,
      // Calculate video age in days
      videoAgeDays: sql<number>`EXTRACT(DAY FROM NOW() - ${benchmarkVideosTable.uploadDate})`.as('video_age_days'),
    })
    .from(benchmarkVideosTable)
    .leftJoin(
      benchmarkChannelsTable,
      eq(benchmarkVideosTable.channelId, benchmarkChannelsTable.channelId)
    )

  // Apply WHERE conditions if any
  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions)) as typeof query
  }

  // Apply ORDER BY and LIMIT
  const videos = await query.orderBy(orderByClause).limit(100)

  // Calculate metrics from ALL videos in database (not just the 100 displayed)
  const metricsResult = await db
    .select({
      totalVideos: sql<number>`COUNT(*)::int`,
      totalViews: sql<number>`COALESCE(SUM(${benchmarkVideosTable.views}), 0)::bigint`,
      outliersCount: sql<number>`COUNT(CASE WHEN ${benchmarkVideosTable.performanceVsMedianHistorical} >= 5 THEN 1 END)::int`,
    })
    .from(benchmarkVideosTable)
    .then(rows => rows[0])

  const totalVideos = metricsResult.totalVideos || 0
  const totalViews = Number(metricsResult.totalViews) || 0
  const averageViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0
  const outliersCount = metricsResult.outliersCount || 0

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          YouTube Videos
        </h1>
        <p className="text-muted-foreground text-lg">
          Analyze video performance and discover outliers with advanced metrics
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVideos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Videos in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLargeNumber(averageViews)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per video average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLargeNumber(totalViews)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outliers (5x+)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outliersCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalVideos > 0 ? `${((outliersCount / totalVideos) * 100).toFixed(1)}%` : '0%'} of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
        <VideosContent data={videos} />
      </Suspense>
    </div>
  )
}
