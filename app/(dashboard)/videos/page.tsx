import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { SimpleVideosTableNew } from './components/simple-videos-table-new'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { Video, Eye, TrendingUp } from 'lucide-react'
import { formatLargeNumber } from '@/lib/utils'
import { getFolderTree } from './actions'
import { parseVideoFilters, applyVideoFiltersToQuery } from '@/lib/video-filters'
import { MetricCard } from '@/components/metric-card'

// Force dynamic rendering to prevent stale cache after folder mutations
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Videos Listing Page (New Design)
 *
 * Server Component that fetches benchmark videos from the database
 * with the redesigned UI from Figma/automedia-new-design.
 *
 * Maintains all backend logic (Supabase queries, filters, sorting)
 * but with enhanced visual presentation.
 */
export default async function VideosPageNew({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  // Await searchParams (Next.js 15+)
  const params = await searchParams

  // Parse filters using helper
  const filters = parseVideoFilters(params)
  const folderId = params.folderId ? Number(params.folderId) : undefined

  // Build base query
  let query = supabase
    .from('benchmark_videos')
    .select('*')

  // Apply filters using helper
  query = applyVideoFiltersToQuery(query, filters)

  // Fetch videos and related data in parallel (first wave)
  const folderItemsQuery = folderId !== undefined && !isNaN(folderId)
    ? supabase.from('video_folder_items').select('video_id').eq('folder_id', folderId)
    : Promise.resolve({ data: null })

  const [
    { data: videosData, error },
    { data: folderItemsData },
    { data: allChannelsData },
    { data: metricsData },
    foldersResult
  ] = await Promise.all([
    // Query 1: Videos with filters/sorting
    query,
    // Query 2: Folder items (if filtering by folder)
    folderItemsQuery,
    // Query 3: All channels for dropdown
    supabase
      .from('benchmark_channels')
      .select('channel_id, channel_name')
      .not('channel_name', 'is', null)
      .order('channel_name'),
    // Query 4: All videos for metrics
    supabase
      .from('benchmark_videos')
      .select('views, performance_vs_median_historical'),
    // Query 5: Folder tree
    getFolderTree()
  ])

  if (error) {
    console.error('Error fetching videos:', error)
  }

  const folderVideoIds: number[] = (folderItemsData || []).map((item: any) => item.video_id)

  // Get channel names for displayed videos (second wave - depends on videosData)
  const channelIds = [...new Set((videosData || []).map((v: any) => v.channel_id))]
  const { data: channelsData } = await supabase
    .from('benchmark_channels')
    .select('id, channel_id, channel_name')
    .in('channel_id', channelIds)

  const channelMap = new Map(
    (channelsData || []).map((c: any) => [c.channel_id, { id: c.id, name: c.channel_name }])
  )

  // Transform data to match expected format
  let videos = (videosData || []).map((video: any) => {
    const channelInfo = channelMap.get(video.channel_id)
    return {
      id: video.id,
      youtubeVideoId: video.youtube_video_id,
      channelId: video.channel_id,
      channelName: channelInfo?.name || null,
      channelDbId: channelInfo?.id || null,
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
      performanceVsMedian14d: video.performance_vs_median_14d,
      performanceVsAvg14d: video.performance_vs_avg_14d,
      isOutlier: video.is_outlier,
      videoAgeDays: video.upload_date
        ? Math.floor((Date.now() - new Date(video.upload_date).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }
  })

  // Filter by folder if needed
  if (folderVideoIds.length > 0) {
    videos = videos.filter(v => folderVideoIds.includes(v.id))
  }

  const allChannels = (allChannelsData || []).map((c: any) => ({
    channelId: c.channel_id,
    channelName: c.channel_name,
  }))

  const totalVideos = metricsData?.length || 0
  const totalViews = metricsData?.reduce((sum, v) => sum + (v.views || 0), 0) || 0
  const averageViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0
  const outliersCount = metricsData?.filter(v => (v.performance_vs_median_historical || 0) >= 5).length || 0

  const folders = foldersResult.success ? foldersResult.folders : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Exact clone from new design */}
      <div className="bg-card border-b border-border px-8 py-5">
        <h1 className="text-foreground">YouTube Videos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and organize enriched YouTube video data across channels
        </p>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Total Videos"
            value={totalVideos.toLocaleString()}
            subtitle="Videos in database"
          />

          <MetricCard
            label="Average Views"
            value={formatLargeNumber(averageViews)}
            subtitle="Per video average"
          />

          <MetricCard
            label="Total Views"
            value={formatLargeNumber(totalViews)}
            subtitle="Across all videos"
          />

          <MetricCard
            label="Outliers (5x+)"
            value={outliersCount.toLocaleString()}
            subtitle={totalVideos > 0 ? `${((outliersCount / totalVideos) * 100).toFixed(1)}% of total` : '0% of total'}
          />
        </div>

        <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
          <SimpleVideosTableNew data={videos} folders={folders} currentFolderId={folderId} />
        </Suspense>
      </div>
    </div>
  )
}
