import { createClient } from '@/lib/supabase/server'
import { SimpleVideosTableNew } from './simple-videos-table-new'
import { getFolderTree } from '../actions'
import { parseVideoFilters, applyVideoFiltersToQuery } from '@/lib/video-filters'

interface VideosTableWrapperProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

const PAGE_SIZE = 1000

/**
 * Fetch all videos using pagination (Supabase has 1000 row limit per request)
 */
async function fetchAllVideosWithFilters(supabase: any, filters: any) {
  let allData: any[] = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from('benchmark_videos')
      .select('*')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    // Apply filters using helper
    query = applyVideoFiltersToQuery(query, filters)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching videos page', page, error)
      break
    }

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allData = allData.concat(data)
      hasMore = data.length === PAGE_SIZE
      page++
    }
  }

  return allData
}

/**
 * Async Server Component that fetches videos and renders the table.
 * Wrapped in Suspense by parent to enable streaming.
 */
export async function VideosTableWrapper({ searchParams }: VideosTableWrapperProps) {
  const supabase = await createClient()

  // Parse filters using helper
  const filters = parseVideoFilters(searchParams)
  const folderId = searchParams.folderId ? Number(searchParams.folderId) : undefined

  // Fetch videos and related data in parallel
  const folderItemsQuery = folderId !== undefined && !isNaN(folderId)
    ? supabase.from('video_folder_items').select('video_id').eq('folder_id', folderId)
    : Promise.resolve({ data: null })

  const [
    videosData,
    { data: folderItemsData },
    foldersResult
  ] = await Promise.all([
    // Fetch all videos with pagination
    fetchAllVideosWithFilters(supabase, filters),
    folderItemsQuery,
    getFolderTree()
  ])

  const folderVideoIds: number[] = (folderItemsData || []).map((item: any) => item.video_id)

  // Get channel names for displayed videos
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
      isProduced: video.status === 'used',
    }
  })

  // Filter by folder if needed
  if (folderVideoIds.length > 0) {
    videos = videos.filter(v => folderVideoIds.includes(v.id))
  }

  const folders = foldersResult.success ? foldersResult.folders : []

  return (
    <SimpleVideosTableNew data={videos} folders={folders} currentFolderId={folderId} />
  )
}
