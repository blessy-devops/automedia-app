import { db } from '@/lib/drizzle'
import {
  benchmarkVideosTable,
  benchmarkChannelsTable,
  videoMetricsSummaryView,
  videoFolderItemsTable,
} from '@/lib/drizzle'
import { desc, asc, sql, gte, and, eq } from 'drizzle-orm'
import { Suspense } from 'react'
import { SimpleVideosTable } from './components/simple-videos-table'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Eye, TrendingUp } from 'lucide-react'
import { formatLargeNumber } from '@/lib/utils'
import { FolderSidebarWrapper } from './components/folder-sidebar-wrapper'
import { getFolderTree, getFolderPath } from './actions'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import Link from 'next/link'

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
  const folderId = params.folderId ? Number(params.folderId) : undefined

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

  // If folderId is specified, filter by folder
  if (folderId !== undefined && !isNaN(folderId)) {
    query = query
      .innerJoin(
        videoFolderItemsTable,
        and(
          eq(videoFolderItemsTable.videoId, benchmarkVideosTable.id),
          eq(videoFolderItemsTable.folderId, folderId)
        )
      ) as typeof query
  }

  // Apply WHERE conditions if any
  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions)) as typeof query
  }

  // Apply ORDER BY and LIMIT
  const videos = await query.orderBy(orderByClause).limit(100)

  // Fetch ALL unique channels that have videos (for the filter dropdown)
  const allChannels = await db
    .selectDistinct({
      channelId: benchmarkVideosTable.channelId,
      channelName: benchmarkChannelsTable.channelName,
    })
    .from(benchmarkVideosTable)
    .leftJoin(
      benchmarkChannelsTable,
      eq(benchmarkVideosTable.channelId, benchmarkChannelsTable.channelId)
    )
    .where(sql`${benchmarkChannelsTable.channelName} IS NOT NULL`)
    .orderBy(asc(benchmarkChannelsTable.channelName))

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

  // Fetch folder tree for sidebar
  const foldersResult = await getFolderTree()
  const folders = foldersResult.success ? foldersResult.folders : []

  // Fetch current folder path for breadcrumb
  let folderPath: Array<{ id: number; name: string }> = []
  let currentFolder = null
  if (folderId) {
    const pathResult = await getFolderPath(folderId)
    folderPath = pathResult.success ? pathResult.path : []
    if (folderPath.length > 0) {
      currentFolder = folderPath[folderPath.length - 1]
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Folder Sidebar */}
      <FolderSidebarWrapper folders={folders} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-10 px-4">
          {/* Breadcrumb */}
          {folderId && folderPath.length > 0 && (
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/videos">Todos os Vídeos</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {folderPath.map((folder, index) => (
                  <div key={folder.id} className="flex items-center">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {index === folderPath.length - 1 ? (
                        <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={`/videos?folderId=${folder.id}`}>{folder.name}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}

          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {currentFolder ? currentFolder.name : 'YouTube Videos'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {currentFolder
                ? `Vídeos na pasta "${currentFolder.name}"`
                : 'Analyze video performance and discover outliers with advanced metrics'}
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
            <SimpleVideosTable data={videos} folders={folders} currentFolderId={folderId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
