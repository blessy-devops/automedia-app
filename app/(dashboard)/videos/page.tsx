import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { SimpleVideosTableNew } from './components/simple-videos-table-new'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { Video, Eye, TrendingUp } from 'lucide-react'
import { formatLargeNumber } from '@/lib/utils'
import { getFolderTree } from './actions'

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

  // Extract filter and sort parameters from URL
  const minViews = params.minViews ? Number(params.minViews) : undefined
  const minOutlierScore = params.minOutlierScore ? Number(params.minOutlierScore) : undefined
  const dateRange = params.dateRange as string | undefined
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
  if (dateRange && dateRange !== 'all') {
    // Parse date range preset (e.g., "7d", "30d", "90d")
    if (dateRange.endsWith('d')) {
      const days = parseInt(dateRange)
      if (!isNaN(days)) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        query = query.gte('upload_date', cutoffDate.toISOString())
      }
    }
  }

  // Apply sorting
  if (sortBy === 'views') {
    query = query.order('views', { ascending: false })
  } else if (sortBy === 'outlier_score') {
    query = query.order('performance_vs_median_historical', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('upload_date', { ascending: false })
  }

  // Fetch all videos
  const { data: videosData, error } = await query

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

  // Fetch folder tree for dropdown
  const foldersResult = await getFolderTree()
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
        {/* Stats Cards - Exact clone from new design */}
        <div className="grid grid-cols-4 gap-5 mb-6">
          <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Video className="w-4 h-4" />
              <span className="text-sm">Total Videos</span>
            </div>
            <div className="text-foreground">{totalVideos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Videos in database</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Average Views</span>
            </div>
            <div className="text-foreground">{formatLargeNumber(averageViews)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per video average</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Total Views</span>
            </div>
            <div className="text-foreground">{formatLargeNumber(totalViews)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all videos</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Outliers (5x+)</span>
            </div>
            <div className="text-foreground">{outliersCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalVideos > 0 ? `${((outliersCount / totalVideos) * 100).toFixed(1)}%` : '0%'} of total
            </p>
          </div>
        </div>

        <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
          <SimpleVideosTableNew data={videos} folders={folders} currentFolderId={folderId} />
        </Suspense>
      </div>
    </div>
  )
}
