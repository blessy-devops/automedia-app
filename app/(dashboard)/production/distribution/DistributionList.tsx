'use client'

import { useState, useTransition } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { distributeVideoToChannels, removeVideoFromQueue } from './actions'
import { useRouter } from 'next/navigation'

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

interface DistributionListProps {
  initialVideos: VideoWithChannels[]
}

// ============================================================================
// Main Component
// ============================================================================

export function DistributionList({ initialVideos }: DistributionListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // UI State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<VideoWithChannels | null>(null)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDistributing, setIsDistributing] = useState(false)
  const [showAllChannels, setShowAllChannels] = useState(false)

  // Filter videos by search term
  const filteredVideos = initialVideos.filter(
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

    const result = await removeVideoFromQueue(selectedVideo.id)

    if (result.success) {
      toast.success('Video removed from distribution queue', {
        description: `"${selectedVideo.title}" has been removed`,
      })
      setIsDrawerOpen(false)
      setSelectedVideo(null)
      router.refresh()
    } else {
      toast.error('Failed to remove video', {
        description: result.error || 'An error occurred',
      })
    }

    setIsDistributing(false)
  }

  const handleDistribute = async () => {
    if (!selectedVideo || selectedChannels.length === 0) return

    setIsDistributing(true)

    const result = await distributeVideoToChannels({
      benchmarkVideoId: selectedVideo.id,
      selectedChannelIds: selectedChannels,
    })

    if (result.success) {
      toast.success(`${result.jobsCreated} production job(s) created successfully`, {
        description: `Video "${selectedVideo.title}" distributed`,
      })
      setIsDrawerOpen(false)
      setSelectedVideo(null)
      setSelectedChannels([])
      router.refresh()
    } else {
      toast.error('Failed to distribute video', {
        description: result.error || 'An error occurred',
      })
    }

    setIsDistributing(false)
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

      {/* Table */}
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
                  Category
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

                    {/* Column 4: Category (Niche + Subniche) */}
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

                    {/* Column 5: Eligible Channels Status */}
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
                      No eligible channels found for this video's niche/subniche
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
                  <p className="text-sm text-muted-foreground">
                    {selectedChannels.length > 0
                      ? `${selectedChannels.length} job${selectedChannels.length !== 1 ? 's' : ''} will be created`
                      : 'No channels selected'}
                  </p>
                  <div className="flex gap-2">
                    {eligibleChannels.length === 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveFromQueue}
                        disabled={isDistributing}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
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
