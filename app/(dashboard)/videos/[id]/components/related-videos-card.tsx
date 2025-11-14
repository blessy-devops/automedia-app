'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Film, Plus, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { addVideoToQueue, addVideosToQueue } from '../actions'
import { toast } from 'sonner'

interface RelatedVideo {
  videoId: string
  title: string
  channelTitle: string
  channelId: string
  viewCount: string
  publishedTimeText?: string
  lengthText?: string
  thumbnail: Array<{ url: string; width: number; height: number }>
}

interface RelatedVideosData {
  relatedVideos: RelatedVideo[]
  enrichmentData: any
}

interface RelatedVideosCardProps {
  videoId: number
  relatedVideosData: RelatedVideosData | null
}

export function RelatedVideosCard({ videoId, relatedVideosData }: RelatedVideosCardProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [queuedVideos, setQueuedVideos] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  const relatedVideos = relatedVideosData?.relatedVideos || []
  const hasRelatedVideos = relatedVideos.length > 0

  // Format view count
  const formatViews = (viewCount: string) => {
    const num = parseInt(viewCount, 10)
    if (isNaN(num)) return viewCount

    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toLocaleString()
  }

  // Handle single video queue addition
  const handleAddToQueue = async (video: RelatedVideo) => {
    setLoadingStates(prev => ({ ...prev, [video.videoId]: true }))

    try {
      const result = await addVideoToQueue(video.videoId, 'related', videoId)

      if (result.success) {
        setQueuedVideos(prev => new Set([...prev, video.videoId]))
        toast.success('Added to Queue', {
          description: `"${video.title}" has been added to the categorization queue.`,
        })
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to add video to queue',
        })
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred',
      })
    } finally {
      setLoadingStates(prev => ({ ...prev, [video.videoId]: false }))
    }
  }

  // Handle batch queue addition
  const handleAddAllToQueue = async () => {
    setBatchLoading(true)

    try {
      const videoIds = relatedVideos
        .filter(v => !queuedVideos.has(v.videoId))
        .map(v => v.videoId)

      if (videoIds.length === 0) {
        toast.info('No Videos to Add', {
          description: 'All videos are already queued or in the database.',
        })
        return
      }

      const result = await addVideosToQueue(videoIds, 'related', videoId)

      if (result.success) {
        // Mark all as queued
        setQueuedVideos(prev => new Set([...prev, ...videoIds]))

        toast.success('Batch Added to Queue', {
          description: `${result.queuedCount} video(s) added, ${result.skippedCount} skipped.`,
        })
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to add videos to queue',
        })
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred',
      })
    } finally {
      setBatchLoading(false)
    }
  }

  if (!hasRelatedVideos) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Related Videos</CardTitle>
          </div>
          <CardDescription>
            No related videos available. Click &quot;Enrich Video&quot; to discover related content.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Related Videos</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={handleAddAllToQueue}
            disabled={batchLoading || relatedVideos.every(v => queuedVideos.has(v.videoId))}
          >
            {batchLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add All to Queue
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          {relatedVideos.length} related video{relatedVideos.length === 1 ? '' : 's'} discovered
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {relatedVideos.slice(0, 10).map(video => {
            const isQueued = queuedVideos.has(video.videoId)
            const isLoading = loadingStates[video.videoId] || false
            const thumbnail = video.thumbnail.find(t => t.width >= 168) || video.thumbnail[0]

            return (
              <div
                key={video.videoId}
                className="flex gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group"
                  >
                    <img
                      src={thumbnail?.url}
                      alt={video.title}
                      className="w-32 h-18 object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                      <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {video.lengthText && (
                      <Badge
                        variant="secondary"
                        className="absolute bottom-1 right-1 text-xs bg-black/80 text-white"
                      >
                        {video.lengthText}
                      </Badge>
                    )}
                  </a>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{video.channelTitle}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatViews(video.viewCount)} views</span>
                    {video.publishedTimeText && <span>{video.publishedTimeText}</span>}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0 flex items-center">
                  {isQueued ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Queued
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToQueue(video)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}

          {relatedVideos.length > 10 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              Showing 10 of {relatedVideos.length} related videos
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
