import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  // Await searchParams (Next.js 15+)
  const params = await searchParams

  // Extract filter and sort parameters from URL
  const minViews = params.minViews ? Number(params.minViews) : undefined
  const minOutlierScore = params.minOutlierScore ? Number(params.minOutlierScore) : undefined
  const sortBy = (params.sortBy as string) || 'upload_date'
  const folderId = params.folderId ? Number(params.folderId) : undefined

  // Build base query
  let query = supabase
    .from('benchmark_videos')
    .select('*')

  // Apply filters
  if (minViews !== undefined && !isNaN(minViews)) {
    query = query.gte('views', minViews)
  }
  if (minOutlierScore !== undefined && !isNaN(minOutlierScore)) {
    query = query.gte('performance_vs_median_historical', minOutlierScore)
  }

  // If folderId is specified, we'll filter after fetching
  // (because foreign keys aren't set up in Supabase)

  // Apply sorting
  if (sortBy === 'views') {
    query = query.order('views', { ascending: false })
  } else if (sortBy === 'outlier_score') {
    query = query.order('performance_vs_median_historical', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('upload_date', { ascending: false })
  }

  // Limit results
  const { data: videosData, error } = await query.limit(100)

  if (error) {
    console.error('Error fetching videos:', error)
  }

  // If filtering by folder, get video IDs in that folder
  let folderVideoIds: number[] = []
  if (folderId !== undefined && !isNaN(folderId)) {
    const { data: folderItems } = await supabase
      .from('video_folder_items')
      .select('video_id')
      .eq('folder_id', folderId)

    folderVideoIds = (folderItems || []).map((item: any) => item.video_id)
  }

  // Get channel names separately
  const channelIds = [...new Set((videosData || []).map((v: any) => v.channel_id))]
  const { data: channelsData } = await supabase
    .from('benchmark_channels')
    .select('channel_id, channel_name')
    .in('channel_id', channelIds)

  const channelMap = new Map(
    (channelsData || []).map((c: any) => [c.channel_id, c.channel_name])
  )

  // Transform data to match expected format
  let videos = (videosData || []).map((video: any) => ({
    id: video.id,
    youtubeVideoId: video.youtube_video_id,
    channelId: video.channel_id,
    channelName: channelMap.get(video.channel_id) || null,
    title: video.title,
    views: video.views,
    likes: video.likes,
    comments: video.comments,
    uploadDate: video.upload_date ? new Date(video.upload_date) : null,
    thumbnailUrl: video.thumbnail_url,
    performanceVsAvgHistorical: video.performance_vs_avg_historical,
    performanceVsMedianHistorical: video.performance_vs_median_historical,
    performanceVsRecent14d: video.performance_vs_recent_14d,
    performanceVsRecent30d: video.performance_vs_recent_30d,
    performanceVsRecent90d: video.performance_vs_recent_90d,
    isOutlier: video.is_outlier,
    videoAgeDays: video.upload_date
      ? Math.floor((Date.now() - new Date(video.upload_date).getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }))

  // Debug: Log first video to check performance data
  if (videos.length > 0) {
    console.log('First video performance data:', {
      title: videos[0].title,
      performanceVsMedianHistorical: videos[0].performanceVsMedianHistorical,
      performanceVsAvgHistorical: videos[0].performanceVsAvgHistorical,
      isOutlier: videos[0].isOutlier,
    })
  }

  // Filter by folder if needed
  if (folderVideoIds.length > 0) {
    videos = videos.filter(v => folderVideoIds.includes(v.id))
  }

  // Fetch ALL unique channels that have videos (for the filter dropdown)
  const { data: allChannelsData } = await supabase
    .from('benchmark_channels')
    .select('channel_id, channel_name')
    .not('channel_name', 'is', null)
    .order('channel_name')

  const allChannels = (allChannelsData || []).map((c: any) => ({
    channelId: c.channel_id,
    channelName: c.channel_name,
  }))

  // Calculate metrics from ALL videos in database (not just the 100 displayed)
  const { data: metricsData } = await supabase
    .from('benchmark_videos')
    .select('views, performance_vs_median_historical')

  const totalVideos = metricsData?.length || 0
  const totalViews = metricsData?.reduce((sum, v) => sum + (v.views || 0), 0) || 0
  const averageViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0
  const outliersCount = metricsData?.filter(v => (v.performance_vs_median_historical || 0) >= 5).length || 0

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
