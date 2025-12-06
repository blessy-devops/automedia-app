'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Search,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Lock,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import {
  distributeVideoToChannels,
  removeVideoFromQueue,
  undoDistribution,
  restoreVideoToQueue,
  getDistributedVideos,
  getVideosAwaitingDistribution,
} from './actions'
import { useRouter } from 'next/navigation'
import {
  VideoHistoryCard,
  type DistributionRecord,
  type RemovedRecord
} from '@/components/shared/VideoHistoryCard'
import { formatNumber } from '@/lib/utils'

// ============================================================================
// Type Definitions
// ============================================================================

interface VideoWithChannels {
  id: number
  title: string
  description: string | null
  categorization: {
    niche: string
    subniche: string
    microniche?: string
    category?: string
    format?: string
  }
  video_transcript: string | null
  youtube_video_id: string
  youtube_url: string
  upload_date: string | null
  performance_vs_median_14d: number | null
  performance_vs_avg_14d: number | null
  median_metric_source?: '14d' | 'historical'
  avg_metric_source?: '14d' | 'historical'
  benchmark_channels?: {
    channel_title: string
    channel_handle: string
  }
  eligibleChannels: EligibleChannel[]
}

interface EligibleChannel {
  unique_profile_id: string
  placeholder: string
  niche: string
  subniche: string
  language: string
  structure_brand_bible?: Array<{
    brand_identity?: Record<string, any>
    production_workflow_id?: string
    visual_style?: Record<string, any>
    narrative_tone?: Record<string, any>
  }>
}

interface DistributedVideo {
  id: number
  title: string
  youtube_video_id: string
  youtube_url: string
  distributed_at: string
  can_undo: boolean // True if all production jobs are still in 'queued' status
  status_summary: {
    queued: number
    processing: number
    completed: number
    failed: number
  }
  channels: Array<{
    placeholder: string
    production_video_id: number
    status: string
  }>
}

interface DistributionListProps {
  initialVideos: VideoWithChannels[]
  initialPendingTotalCount: number
  initialDistributedVideos: DistributedVideo[]
  initialDistributedTotalCount: number
  initialDistributedHasMore: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get badge variant and label based on performance score
 * @param score - Performance ratio (e.g., 2.5 = 2.5x performance)
 * @returns Object with variant and label
 */
function getPerformanceBadge(score: number | null): {
  variant: 'destructive' | 'default' | 'secondary' | 'outline'
  label: string
} {
  if (score === null) {
    return { variant: 'outline', label: 'N/A' }
  }

  if (score >= 5) {
    return { variant: 'destructive', label: 'VIRAL' }
  } else if (score >= 2) {
    return { variant: 'default', label: 'HIGH' }
  } else if (score >= 1) {
    return { variant: 'secondary', label: 'GOOD' }
  } else {
    return { variant: 'outline', label: 'LOW' }
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function DistributionList({
  initialVideos,
  initialPendingTotalCount,
  initialDistributedVideos,
  initialDistributedTotalCount,
  initialDistributedHasMore,
}: DistributionListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // UI State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<VideoWithChannels | null>(null)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDistributing, setIsDistributing] = useState(false)
  const [showAllChannels, setShowAllChannels] = useState(false)
  const [videos, setVideos] = useState(initialVideos)

  // Pending Videos State (with pagination)
  const [pendingTotalCount, setPendingTotalCount] = useState(initialPendingTotalCount)
  const [pendingHasMore, setPendingHasMore] = useState(initialVideos.length < initialPendingTotalCount)
  const [isLoadingMorePending, setIsLoadingMorePending] = useState(false)

  // Distributed Videos State (with pagination)
  const [distributedVideos, setDistributedVideos] = useState<DistributedVideo[]>(
    initialDistributedVideos
  )
  const [distributedTotalCount, setDistributedTotalCount] = useState(initialDistributedTotalCount)
  const [distributedHasMore, setDistributedHasMore] = useState(initialDistributedHasMore)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // History & Undo State (for local session only - undo functionality)
  const [activeTab, setActiveTab] = useState<'pending' | 'distributed' | 'removed'>('pending')
  const [distributedHistory, setDistributedHistory] = useState<DistributionRecord[]>([])
  const [removedHistory, setRemovedHistory] = useState<RemovedRecord[]>([])

  // Sync local state when server data changes (after router.refresh())
  useEffect(() => {
    setVideos(initialVideos)
    setPendingTotalCount(initialPendingTotalCount)
    setPendingHasMore(initialVideos.length < initialPendingTotalCount)
    setDistributedVideos(initialDistributedVideos)
    setDistributedTotalCount(initialDistributedTotalCount)
    setDistributedHasMore(initialDistributedHasMore)
  }, [
    initialVideos,
    initialPendingTotalCount,
    initialDistributedVideos,
    initialDistributedTotalCount,
    initialDistributedHasMore,
  ])

  // Filter videos by search term
  const filteredVideos = videos.filter(
    (video) =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.benchmark_channels?.channel_title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      video.youtube_video_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get channels to show in drawer
  const eligibleChannels = selectedVideo?.eligibleChannels || []
  const channelsToShow = showAllChannels ? [] : eligibleChannels // Force selection disabled for now

  // Generate YouTube thumbnail URL
  const getThumbnailUrl = (youtubeVideoId: string) =>
    `https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`

  // Check if channel has brand bible
  const hasBrandBible = (channel: EligibleChannel) =>
    Boolean(channel.structure_brand_bible && channel.structure_brand_bible.length > 0)

  // Check if brand bible is complete
  const isBrandBibleComplete = (channel: EligibleChannel) => {
    if (!channel.structure_brand_bible || channel.structure_brand_bible.length === 0)
      return false
    const bible = channel.structure_brand_bible[0]
    if (!bible) return false
    return Boolean(bible.brand_identity && bible.production_workflow_id)
  }

  // Check if channel matches video niche/subniche
  const isChannelMatch = (channel: EligibleChannel, video: VideoWithChannels) => {
    return (
      channel.niche === video.categorization.niche &&
      channel.subniche === video.categorization.subniche
    )
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const handleVideoSelect = (video: VideoWithChannels) => {
    setSelectedVideo(video)
    setSelectedChannels([])
    setShowAllChannels(false)
    setIsDrawerOpen(true)
  }

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    )
  }

  const handleSelectAll = () => {
    if (!selectedVideo) return
    const channels = showAllChannels ? [] : eligibleChannels
    setSelectedChannels(channels.map((ch) => ch.unique_profile_id))
  }

  const handleSelectNone = () => {
    setSelectedChannels([])
  }

  const handleRemoveFromQueue = async () => {
    if (!selectedVideo) return

    setIsDistributing(true)

    // Capture data for history before state changes
    const videoId = selectedVideo.id
    const videoForHistory = selectedVideo
    const hasEligibleChannels = selectedVideo.eligibleChannels.length > 0

    // Optimistic update: remove video from list immediately
    setVideos((prev) => prev.filter((v) => v.id !== videoId))
    setIsDrawerOpen(false)
    setSelectedVideo(null)

    const result = await removeVideoFromQueue(videoId)

    if (result.success) {
      // Create removed record for history
      const removedRecord: RemovedRecord = {
        id: `removed-${Date.now()}-${videoId}`,
        video: {
          id: videoForHistory.id,
          title: videoForHistory.title,
          youtube_video_id: videoForHistory.youtube_video_id,
        },
        timestamp: new Date(),
        reason: hasEligibleChannels ? 'manual' : 'no_match',
      }

      // Add to removed history
      setRemovedHistory(prev => [removedRecord, ...prev])

      toast.success('Video removed from distribution queue', {
        description: `"${videoForHistory.title}" has been removed`,
        duration: 5000,
      })

      // Refresh to sync with server state
      router.refresh()
    } else {
      // Revert optimistic update on error
      setVideos(initialVideos)
      toast.error('Failed to remove video', {
        description: result.error || 'An error occurred',
      })
    }

    setIsDistributing(false)
  }

  const handleDistribute = async () => {
    if (!selectedVideo || selectedChannels.length === 0) return

    setIsDistributing(true)

    // Capture data for history before state changes
    const videoId = selectedVideo.id
    const videoTitle = selectedVideo.title
    const channelCount = selectedChannels.length
    const distributedChannels = eligibleChannels.filter(ch =>
      selectedChannels.includes(ch.unique_profile_id)
    )

    // Optimistic update: remove video from list immediately
    setVideos((prev) => prev.filter((v) => v.id !== videoId))
    setIsDrawerOpen(false)
    const videoForHistory = selectedVideo
    setSelectedVideo(null)
    setSelectedChannels([])

    const result = await distributeVideoToChannels({
      benchmarkVideoId: videoId,
      selectedChannelIds: selectedChannels,
    })

    if (result.success) {
      // Create distribution record for history
      const distributionRecord: DistributionRecord = {
        id: `dist-${Date.now()}-${videoId}`,
        video: {
          id: videoForHistory.id,
          title: videoForHistory.title,
          youtube_video_id: videoForHistory.youtube_video_id,
        },
        channels: distributedChannels.map(ch => ({
          unique_profile_id: ch.unique_profile_id,
          placeholder: ch.placeholder,
        })),
        timestamp: new Date(),
        jobCount: result.jobsCreated || channelCount,
        productionJobIds: result.productionJobIds || [],
      }

      // Add to distributed history
      setDistributedHistory(prev => [distributionRecord, ...prev])

      // Toast with Undo action
      toast.success(`${result.jobsCreated} production job(s) created successfully`, {
        description: `Video "${videoTitle}" distributed`,
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => handleUndoDistribution(distributionRecord.id),
        },
      })

      // Refresh to sync with server state
      router.refresh()
    } else {
      // Revert optimistic update on error
      setVideos(initialVideos)
      toast.error('Failed to distribute video', {
        description: result.error || 'An error occurred',
      })
    }

    setIsDistributing(false)
  }

  const handleUndoDistribution = async (recordId: string) => {
    const record = distributedHistory.find(r => r.id === recordId)
    if (!record) return

    setIsDistributing(true)

    const result = await undoDistribution(
      record.video.id,
      record.productionJobIds || []
    )

    if (result.success) {
      // Remove from distributed history
      setDistributedHistory(prev => prev.filter(r => r.id !== recordId))

      // Add back to pending list (optimistic)
      const fullVideo = initialVideos.find(v => v.id === record.video.id)
      if (fullVideo) {
        setVideos(prev => [fullVideo, ...prev])
      }

      toast.success('Distribution undone', {
        description: `"${record.video.title}" restored to pending queue`,
      })

      // Refresh to sync with server state
      router.refresh()
    } else {
      toast.error('Failed to undo distribution', {
        description: result.error || 'An error occurred',
      })
    }

    setIsDistributing(false)
  }

  const handleRestoreRemoved = async (recordId: string) => {
    const record = removedHistory.find(r => r.id === recordId)
    if (!record) return

    setIsDistributing(true)

    const result = await restoreVideoToQueue(record.video.id)

    if (result.success) {
      // Remove from removed history
      setRemovedHistory(prev => prev.filter(r => r.id !== recordId))

      // Add back to pending list (optimistic)
      const fullVideo = initialVideos.find(v => v.id === record.video.id)
      if (fullVideo) {
        setVideos(prev => [fullVideo, ...prev])
      }

      toast.success('Video restored', {
        description: `"${record.video.title}" restored to pending queue`,
      })

      // Refresh to sync with server state
      router.refresh()
    } else {
      toast.error('Failed to restore video', {
        description: result.error || 'An error occurred',
      })
    }

    setIsDistributing(false)
  }

  const handleLoadMorePending = async () => {
    if (isLoadingMorePending || !pendingHasMore) return

    setIsLoadingMorePending(true)

    try {
      const result = await getVideosAwaitingDistribution({
        offset: videos.length,
        limit: 50,
      })

      if (result.error) {
        toast.error('Failed to load more videos', {
          description: result.error,
        })
      } else {
        setVideos((prev) => [...prev, ...result.videos])
        setPendingHasMore(videos.length + result.videos.length < result.totalCount)
        // totalCount stays the same
      }
    } catch (error) {
      toast.error('Failed to load more videos')
    } finally {
      setIsLoadingMorePending(false)
    }
  }

  const handleLoadMoreDistributed = async () => {
    if (isLoadingMore || !distributedHasMore) return

    setIsLoadingMore(true)

    try {
      const result = await getDistributedVideos({
        offset: distributedVideos.length,
        limit: 20,
      })

      if (result.error) {
        toast.error('Failed to load more videos', {
          description: result.error,
        })
      } else {
        setDistributedVideos((prev) => [...prev, ...result.videos])
        setDistributedHasMore(result.hasMore)
        // totalCount stays the same
      }
    } catch (error) {
      toast.error('Failed to load more videos')
    } finally {
      setIsLoadingMore(false)
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Header with Search and Refresh */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Tabs: Pending / Distributed / Removed */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {videos.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {formatNumber(videos.length)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="distributed" className="relative">
            Distributed
            {distributedTotalCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {formatNumber(distributedTotalCount)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="removed" className="relative">
            Removed
            {removedHistory.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {formatNumber(removedHistory.length)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Pending */}
        <TabsContent value="pending" className="mt-6">
          {filteredVideos.length > 0 ? (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground w-20">
                  Thumb
                </th>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                  Video
                </th>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                  Published
                </th>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                  Performance
                </th>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                  Eligible
                </th>
                <th className="px-4 py-3 text-right text-sm text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVideos.map((video) => {
                const channelCount = video.eligibleChannels.length

                return (
                  <tr
                    key={video.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleVideoSelect(video)}
                  >
                    {/* Column 1: Thumbnail */}
                    <td className="px-4 py-3">
                      <ImageWithFallback
                        src={getThumbnailUrl(video.youtube_video_id)}
                        alt={video.title}
                        className="w-16 h-9 rounded object-cover"
                      />
                    </td>

                    {/* Column 2: Video (Title + IDs + YouTube Link) */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="text-sm text-foreground line-clamp-2 max-w-md">
                          {video.title}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-xs font-mono"
                          >
                            ID: {video.id}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-mono">
                            YT: {video.youtube_video_id}
                          </Badge>
                          <a
                            href={video.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver no YouTube
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Source (Origin Channel) */}
                    <td className="px-4 py-3">
                      {video.benchmark_channels ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="text-sm text-foreground">
                            {video.benchmark_channels.channel_title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {video.benchmark_channels.channel_handle}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Column 4: Published Date */}
                    <td className="px-4 py-3">
                      {video.upload_date ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="text-sm text-foreground">
                            {new Date(video.upload_date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(() => {
                              const days = Math.floor(
                                (Date.now() - new Date(video.upload_date).getTime()) / (1000 * 60 * 60 * 24)
                              )
                              if (days === 0) return 'Today'
                              if (days === 1) return '1 day ago'
                              return `${days} days ago`
                            })()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Column 5: Category (Niche + Subniche) */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {video.categorization.niche}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {video.categorization.subniche}
                        </Badge>
                      </div>
                    </td>

                    {/* Column 5: Performance (Outlier Scores) */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        {/* Median (14d or historical) */}
                        {video.performance_vs_median_14d !== null && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Median ({video.median_metric_source || '14d'})
                            </span>
                            <Badge
                              variant={getPerformanceBadge(video.performance_vs_median_14d).variant}
                              className="text-xs font-semibold w-fit"
                            >
                              {video.performance_vs_median_14d.toFixed(1)}x{' '}
                              {getPerformanceBadge(video.performance_vs_median_14d).label}
                            </Badge>
                          </div>
                        )}
                        {/* Average (14d or historical) */}
                        {video.performance_vs_avg_14d !== null && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Average ({video.avg_metric_source || '14d'})
                            </span>
                            <Badge
                              variant={getPerformanceBadge(video.performance_vs_avg_14d).variant}
                              className="text-xs font-semibold w-fit"
                            >
                              {video.performance_vs_avg_14d.toFixed(1)}x{' '}
                              {getPerformanceBadge(video.performance_vs_avg_14d).label}
                            </Badge>
                          </div>
                        )}
                        {/* No data available */}
                        {video.performance_vs_median_14d === null &&
                          video.performance_vs_avg_14d === null && (
                            <span className="text-xs text-muted-foreground">
                              No performance data
                            </span>
                          )}
                      </div>
                    </td>

                    {/* Column 6: Eligible Channels Status */}
                    <td className="px-4 py-3">
                      {channelCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-foreground">
                            {channelCount} channel{channelCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-muted-foreground">
                            No matches
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Column 6: Actions */}
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVideoSelect(video)
                        }}
                      >
                        Select Channels
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No videos found matching your search' : 'No videos awaiting distribution'}
            </div>
          )}

          {/* Load More Button for Pending Videos */}
          {!searchTerm && pendingHasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMorePending}
                disabled={isLoadingMorePending}
                className="min-w-[140px]"
              >
                {isLoadingMorePending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More Videos (${videos.length}/${pendingTotalCount})`
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Distributed Videos */}
        <TabsContent value="distributed" className="mt-6">
          {distributedVideos.length > 0 ? (
            <div className="space-y-4">
              {distributedVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <ImageWithFallback
                      src={getThumbnailUrl(video.youtube_video_id)}
                      alt={video.title}
                      className="w-40 h-[90px] rounded object-cover flex-shrink-0"
                    />

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      {/* Header with Title and Action Button */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                            {video.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>ID: {video.id}</span>
                            <span>•</span>
                            <span>
                              {new Date(video.distributed_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span>•</span>
                            <a
                              href={video.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              View on YouTube
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Conditional Undo Button or Locked Badge */}
                        {video.can_undo ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // TODO: Implement undo for distributed videos
                              toast.info('Undo feature coming soon for distributed videos')
                            }}
                            disabled={isDistributing}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Undo
                          </Button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-help">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Locked
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cannot undo: production has started</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {/* Status Summary Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {video.status_summary.queued > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {video.status_summary.queued} queued
                          </Badge>
                        )}
                        {video.status_summary.processing > 0 && (
                          <Badge variant="default" className="text-xs">
                            {video.status_summary.processing} in production
                          </Badge>
                        )}
                        {video.status_summary.completed > 0 && (
                          <Badge variant="outline" className="text-xs border-green-600 text-green-600">
                            {video.status_summary.completed} completed
                          </Badge>
                        )}
                        {video.status_summary.failed > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {video.status_summary.failed} failed
                          </Badge>
                        )}
                      </div>

                      {/* Distributed Channels */}
                      <div className="space-y-1.5">
                        <div className="text-xs text-muted-foreground">
                          Distributed to {video.channels.length} channel
                          {video.channels.length !== 1 ? 's' : ''}:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {video.channels.slice(0, 6).map((channel) => (
                            <Badge
                              key={channel.production_video_id}
                              variant="outline"
                              className="text-xs"
                            >
                              {channel.placeholder}
                            </Badge>
                          ))}
                          {video.channels.length > 6 && (
                            <Badge variant="secondary" className="text-xs">
                              +{video.channels.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {distributedHasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreDistributed}
                    disabled={isLoadingMore}
                    className="min-w-[140px]"
                  >
                    {isLoadingMore ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Videos'
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No distributed videos yet</p>
              <p className="text-sm mt-1">Videos will appear here after distribution</p>
            </div>
          )}
        </TabsContent>

        {/* TAB 3: Removed History */}
        <TabsContent value="removed" className="mt-6">
          {removedHistory.length > 0 ? (
            <div className="space-y-3">
              {removedHistory.map((record) => (
                <VideoHistoryCard
                  key={record.id}
                  record={record}
                  type="removed"
                  onRestore={handleRestoreRemoved}
                  disabled={isDistributing}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Trash2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No removed videos</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Drawer (Sheet) for Channel Selection */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-xl flex flex-col p-0">
          {selectedVideo && (
            <>
              {/* Sheet Header */}
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
                <SheetTitle>Select Destination Channels</SheetTitle>

                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="line-clamp-2">{selectedVideo.title}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedVideo.categorization.niche}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedVideo.categorization.subniche}
                    </Badge>
                    {selectedVideo.categorization.category && (
                      <Badge variant="outline" className="text-xs">
                        {selectedVideo.categorization.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </SheetHeader>

              {/* Sheet Content */}
              <div className="flex-1 overflow-hidden px-6 py-4">
                {eligibleChannels.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        {channelsToShow.length} eligible channel
                        {channelsToShow.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAll}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectNone}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="h-[calc(100vh-380px)]">
                      <div className="space-y-2">
                        {channelsToShow.map((channel) => {
                          const isSelected = selectedChannels.includes(
                            channel.unique_profile_id
                          )
                          const hasValidBible = hasBrandBible(channel)
                          const isBibleComplete = isBrandBibleComplete(channel)

                          return (
                            <div
                              key={channel.unique_profile_id}
                              className={`border rounded-lg p-4 transition-all cursor-pointer hover:border-primary/50 ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border'
                              }`}
                              onClick={() =>
                                handleChannelToggle(channel.unique_profile_id)
                              }
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center shrink-0 pt-0.5">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      handleChannelToggle(
                                        channel.unique_profile_id
                                      )
                                    }
                                    className="border-2 border-muted-foreground/30 data-[state=checked]:border-primary"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-foreground truncate">
                                        {channel.placeholder}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        @{channel.placeholder.toLowerCase().replace(/\s+/g, '')}
                                      </div>
                                    </div>
                                    {hasValidBible && (
                                      <Badge
                                        variant={
                                          isBibleComplete
                                            ? 'default'
                                            : 'secondary'
                                        }
                                        className="text-xs shrink-0"
                                      >
                                        {isBibleComplete
                                          ? '✓ Complete'
                                          : 'Partial'}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {channel.niche}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {channel.subniche}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {channel.language}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  // Empty State (No Eligible Channels)
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="w-12 h-12 mb-3 text-amber-600" />
                    <p className="text-muted-foreground mb-4">
                      No eligible channels found for this video&apos;s niche/subniche
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveFromQueue}
                        disabled={isDistributing}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove from Queue
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sheet Footer */}
              <SheetFooter className="px-6 py-4 border-t border-border mt-auto">
                <div className="flex items-center justify-between w-full">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFromQueue}
                      disabled={isDistributing}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove from Queue
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      {selectedChannels.length > 0
                        ? `${selectedChannels.length} job${selectedChannels.length !== 1 ? 's' : ''} will be created`
                        : eligibleChannels.length > 0
                        ? 'Select channels to distribute'
                        : 'No eligible channels'}
                    </p>
                    <Button
                      onClick={handleDistribute}
                      disabled={selectedChannels.length === 0 || isDistributing}
                    >
                      {isDistributing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Distributing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Distribute ({selectedChannels.length})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
