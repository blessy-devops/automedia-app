'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { RelativeTimestamp } from './RelativeTimestamp'
import { Undo2, RotateCcw } from 'lucide-react'

// ============================================================================
// Type Definitions
// ============================================================================

interface VideoData {
  id: number
  title: string
  youtube_video_id: string
}

interface ChannelData {
  unique_profile_id: string
  placeholder: string
}

export interface DistributionRecord {
  id: string
  video: VideoData
  channels: ChannelData[]
  timestamp: Date
  jobCount: number
  productionJobIds?: number[] // IDs dos production jobs criados (para deletar no undo)
}

export interface RemovedRecord {
  id: string
  video: VideoData
  timestamp: Date
  reason: 'manual' | 'no_match'
}

// ============================================================================
// Props
// ============================================================================

interface VideoHistoryCardProps {
  record: DistributionRecord | RemovedRecord
  type: 'distributed' | 'removed'
  onUndo?: (recordId: string) => void
  onRestore?: (recordId: string) => void
  disabled?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function VideoHistoryCard({
  record,
  type,
  onUndo,
  onRestore,
  disabled = false
}: VideoHistoryCardProps) {
  const getThumbnailUrl = (youtubeVideoId: string) =>
    `https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <ImageWithFallback
          src={getThumbnailUrl(record.video.youtube_video_id)}
          alt={record.video.title}
          className="w-32 h-18 rounded object-cover flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          {/* Header with Title and Action Button */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm text-foreground line-clamp-2 mb-1">
                {record.video.title}
              </h3>
              <RelativeTimestamp date={record.timestamp} />
            </div>

            {/* Action Button */}
            {type === 'distributed' && onUndo && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUndo(record.id)}
                disabled={disabled}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Undo
              </Button>
            )}

            {type === 'removed' && onRestore && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRestore(record.id)}
                disabled={disabled}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </Button>
            )}
          </div>

          {/* Additional Info */}
          {type === 'distributed' && 'channels' in record && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Distributed to {record.jobCount} channel{record.jobCount !== 1 ? 's' : ''}:
              </p>
              <div className="flex flex-wrap gap-1">
                {record.channels.slice(0, 5).map((channel) => (
                  <Badge key={channel.unique_profile_id} variant="secondary" className="text-xs">
                    {channel.placeholder}
                  </Badge>
                ))}
                {record.channels.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{record.channels.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {type === 'removed' && 'reason' in record && (
            <Badge variant="outline" className="text-xs">
              Reason: {record.reason === 'manual' ? 'Manually removed' : 'No matching channels'}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
