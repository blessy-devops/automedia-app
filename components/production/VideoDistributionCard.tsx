'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ChannelSelectionList } from './ChannelSelectionList'
import { Video, ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { distributeVideoToChannels } from '@/app/(dashboard)/production/distribution/actions'

interface VideoDistributionCardProps {
  video: {
    id: number
    title: string
    description?: string | null
    categorization: {
      niche: string
      subniche: string
      microniche?: string
      category?: string
      format?: string
    }
    video_transcript?: string | null
    youtube_video_id: string
    youtube_url: string
    benchmark_channels?: {
      channel_title: string
      channel_handle: string
    }
    eligibleChannels: Array<{
      unique_profile_id: string
      placeholder: string
      niche: string
      subniche: string
      language?: string
      structure_brand_bible?: Array<{
        brand_identity?: Record<string, any>
        production_workflow_id?: string
      }>
    }>
  }
  onDistributeSuccess: () => void
}

export function VideoDistributionCard({ video, onDistributeSuccess }: VideoDistributionCardProps) {
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDistributing, setIsDistributing] = useState(false)

  const hasTranscript = video.video_transcript && video.video_transcript.length > 100

  const handleDistribute = async () => {
    if (selectedChannelIds.length === 0) {
      toast.error('No channels selected', {
        description: 'Please select at least one channel to distribute this video.',
      })
      return
    }

    setIsDistributing(true)

    try {
      const result = await distributeVideoToChannels({
        benchmarkVideoId: video.id,
        selectedChannelIds,
      })

      if (result.success) {
        toast.success('Video distributed successfully!', {
          description: `Created ${result.jobsCreated} production job${
            result.jobsCreated !== 1 ? 's' : ''
          } for: ${result.channels?.join(', ')}`,
        })
        onDistributeSuccess()
      } else {
        toast.error('Distribution failed', {
          description: result.error || 'Unknown error occurred',
        })
      }
    } catch (error) {
      toast.error('Distribution failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsDistributing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
            </div>

            {/* IDs visíveis */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span className="bg-muted px-2 py-1 rounded">
                ID: {video.id}
              </span>
              <span className="bg-muted px-2 py-1 rounded">
                YT: {video.youtube_video_id}
              </span>
            </div>

            {video.benchmark_channels && (
              <CardDescription className="flex items-center gap-2">
                <span>Source: {video.benchmark_channels.channel_title}</span>
                <span className="text-xs text-muted-foreground">
                  (@{video.benchmark_channels.channel_handle})
                </span>
              </CardDescription>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video metadata */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">🎯 {video.categorization.niche}</Badge>
          <Badge variant="outline">📊 {video.categorization.subniche}</Badge>
          {video.categorization.microniche && (
            <Badge variant="secondary">🔍 {video.categorization.microniche}</Badge>
          )}
          {video.categorization.category && (
            <Badge variant="secondary">📁 {video.categorization.category}</Badge>
          )}
        </div>

        {/* Expandable details */}
        {isExpanded && (
          <>
            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a
                  href={video.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Watch on YouTube
                </a>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {video.youtube_video_id}
                </code>
              </div>

              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <span className="text-muted-foreground">Transcript:</span>{' '}
                  {hasTranscript ? (
                    <span className="text-green-600">
                      ✓ Available ({video.video_transcript?.length} chars)
                    </span>
                  ) : (
                    <span className="text-amber-600">⚠ Not available</span>
                  )}
                </div>
              </div>

              {video.description && (
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Description:</span>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {video.description}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Channel selection */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Select Destination Channels</h4>
          <ChannelSelectionList
            channels={video.eligibleChannels}
            selectedIds={selectedChannelIds}
            onSelectionChange={setSelectedChannelIds}
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedChannelIds.length > 0 ? (
            <>
              Will create <span className="font-medium text-foreground">{selectedChannelIds.length}</span> production job
              {selectedChannelIds.length !== 1 ? 's' : ''}
            </>
          ) : (
            'No channels selected'
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={selectedChannelIds.length === 0 || isDistributing}
              className="gap-2"
            >
              {isDistributing ? (
                <>⏳ Distributing...</>
              ) : (
                <>Distribute ({selectedChannelIds.length})</>
              )}
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Distribution</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  You are about to distribute this video to{' '}
                  <span className="font-medium">{selectedChannelIds.length}</span> channel
                  {selectedChannelIds.length !== 1 ? 's' : ''}:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {video.eligibleChannels
                    .filter((ch) => selectedChannelIds.includes(ch.unique_profile_id))
                    .map((ch) => (
                      <li key={ch.unique_profile_id}>{ch.placeholder}</li>
                    ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-4">
                  This will create {selectedChannelIds.length} production job
                  {selectedChannelIds.length !== 1 ? 's' : ''} and mark the benchmark video as
                  &quot;used&quot;.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDistribute}>
                Confirm & Distribute
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
