'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { formatLargeNumber } from '@/lib/utils'
import { StatCard } from '@/components/stat-card'
import { RadarChannel } from './radar-channels-table'
import { Users, Clock, Calendar } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { MonitoringSinceBadge } from './monitoring-since-badge'
import { Outlier10xBadge } from './outlier-10x-badge'
import { RemoveFromRadarButton } from './remove-from-radar-button'
import { ManualUpdateButton } from './manual-update-button'
import { Button } from '@/components/ui/button'

interface RadarChannelsGalleryProps {
  channels: RadarChannel[]
  onChannelRemoved?: () => void
}

/**
 * Radar Channels Gallery View Component
 *
 * Professional channel cards with radar-specific metrics:
 * - Monitoring duration badge
 * - 10x outlier indicator
 * - Last/next update timestamps
 * - Quick action buttons
 */
export function RadarChannelsGallery({
  channels,
  onChannelRemoved,
}: RadarChannelsGalleryProps) {
  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground text-sm">No channels in radar yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {channels.map((channel) => (
        <Card
          key={channel.id}
          className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-xl"
        >
          <CardHeader className="pb-3 space-y-0">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Link href={`/channels/${channel.channel_database_id}`}>
                <Avatar className="h-12 w-12 border-2 cursor-pointer hover:border-primary transition-colors">
                  <AvatarImage
                    src={channel.thumbnail_url || undefined}
                    alt={channel.channel_name || ''}
                  />
                  <AvatarFallback className="text-lg font-semibold">
                    {channel.channel_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>

              {/* Name & Badges */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <Link href={`/channels/${channel.channel_database_id}`}>
                  <h3 className="font-semibold text-sm line-clamp-1 hover:text-primary transition-colors cursor-pointer">
                    {channel.channel_name || 'Unknown Channel'}
                  </h3>
                </Link>
                <div className="flex flex-wrap gap-1.5">
                  <MonitoringSinceBadge addedAt={channel.added_at} variant="secondary" />
                  <Outlier10xBadge has10xOutlier={channel.has_10x_outlier} />
                  {channel.is_active ? (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Paused
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-4 space-y-4">
            {/* Subscribers Stat */}
            <StatCard
              icon={Users}
              label="Subscribers"
              value={formatLargeNumber(channel.subscriber_count)}
              variant="primary"
            />

            <Separator />

            {/* Monitoring Info */}
            <div className="space-y-2">
              {/* Monitoring Since */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Added {format(new Date(channel.added_at), 'MMM dd, yyyy')}</span>
              </div>

              {/* Last Update */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Last update:{' '}
                  {channel.last_update_at
                    ? formatDistanceToNow(new Date(channel.last_update_at)) + ' ago'
                    : 'Never'}
                </span>
              </div>

              {/* Next Update */}
              {channel.next_update_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Next update: {formatDistanceToNow(new Date(channel.next_update_at))}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href={`/channels/${channel.channel_database_id}`}>View Channel</Link>
              </Button>
              <ManualUpdateButton
                channelId={channel.channel_id}
                channelName={channel.channel_name || 'Unknown Channel'}
                lastUpdateAt={channel.last_update_at}
                size="sm"
                variant="outline"
              />
              <RemoveFromRadarButton
                channelId={channel.channel_id}
                channelName={channel.channel_name || 'Unknown Channel'}
                onSuccess={onChannelRemoved}
                size="sm"
                variant="outline"
              />
            </div>

            {/* Notes (if any) */}
            {channel.notes && (
              <>
                <Separator />
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <span className="font-medium">Note:</span> {channel.notes}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
