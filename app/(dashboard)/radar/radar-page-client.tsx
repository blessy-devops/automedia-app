'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, Grid3x3, Plus, Activity, Info, TrendingUp, RefreshCw, Clock } from 'lucide-react'
import { RadarChannelsTable, RadarChannel } from './components/radar-channels-table'
import { RadarChannelsGallery } from './components/radar-channels-gallery'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

type ViewMode = 'table' | 'gallery'

interface RadarPageClientProps {
  initialChannels: RadarChannel[]
}

export function RadarPageClient({ initialChannels }: RadarPageClientProps) {
  const [view, setView] = useState<ViewMode>('table')
  const [channels, setChannels] = useState<RadarChannel[]>(initialChannels)

  // Real-time subscription to channel_radar updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('radar-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'channel_radar',
        },
        async (payload) => {
          console.log('[Radar] Realtime update:', payload)

          if (payload.eventType === 'INSERT') {
            // Fetch the full channel data (including benchmark_channels join)
            const { data, error } = await supabase
              .from('channel_radar')
              .select(
                `
                id,
                channel_id,
                added_at,
                last_update_at,
                next_update_at,
                update_frequency,
                is_active,
                has_10x_outlier,
                notes,
                benchmark_channels (
                  id,
                  channel_name,
                  thumbnail_url,
                  subscriber_count,
                  total_views,
                  video_upload_count
                )
              `
              )
              .eq('id', payload.new.id)
              .single()

            if (data) {
              const newChannel: RadarChannel = {
                id: data.id,
                channel_id: data.channel_id,
                channel_database_id: (data.benchmark_channels as any)?.id || 0,
                channel_name: (data.benchmark_channels as any)?.channel_name || 'Unknown',
                thumbnail_url: (data.benchmark_channels as any)?.thumbnail_url || null,
                subscriber_count: (data.benchmark_channels as any)?.subscriber_count || null,
                total_views: (data.benchmark_channels as any)?.total_views || null,
                video_upload_count: (data.benchmark_channels as any)?.video_upload_count || null,
                added_at: data.added_at,
                last_update_at: data.last_update_at,
                next_update_at: data.next_update_at,
                update_frequency: data.update_frequency,
                is_active: data.is_active,
                has_10x_outlier: data.has_10x_outlier,
                notes: data.notes,
              }

              setChannels((prev) => [newChannel, ...prev])
              toast.success('Channel added to radar', {
                description: newChannel.channel_name,
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            // Fetch updated channel data with benchmark_channels join to get latest metrics
            const { data } = await supabase
              .from('channel_radar')
              .select(
                `
                id,
                channel_id,
                added_at,
                last_update_at,
                next_update_at,
                update_frequency,
                is_active,
                has_10x_outlier,
                notes,
                benchmark_channels (
                  id,
                  channel_name,
                  thumbnail_url,
                  subscriber_count,
                  total_views,
                  video_upload_count
                )
              `
              )
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setChannels((prev) =>
                prev.map((ch) =>
                  ch.id === payload.new.id
                    ? {
                        ...ch,
                        last_update_at: data.last_update_at,
                        next_update_at: data.next_update_at,
                        is_active: data.is_active,
                        has_10x_outlier: data.has_10x_outlier,
                        notes: data.notes,
                        // Also update benchmark_channels metrics
                        subscriber_count: (data.benchmark_channels as any)?.subscriber_count ?? ch.subscriber_count,
                        video_upload_count: (data.benchmark_channels as any)?.video_upload_count ?? ch.video_upload_count,
                        total_views: (data.benchmark_channels as any)?.total_views ?? ch.total_views,
                      }
                    : ch
                )
              )

              // Show toast if last_update_at changed (indicates update completed)
              if (
                payload.old.last_update_at !== data.last_update_at &&
                data.last_update_at
              ) {
                const channelName = channels.find((ch) => ch.id === payload.new.id)?.channel_name
                toast.success('Channel updated', {
                  description: channelName || 'Channel data refreshed',
                })
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const removedChannel = channels.find((ch) => ch.id === payload.old.id)
            setChannels((prev) => prev.filter((ch) => ch.id !== payload.old.id))
            toast.info('Channel removed from radar', {
              description: removedChannel?.channel_name || 'Channel removed',
            })
          }
        }
      )
      .subscribe()

    // Also subscribe to benchmark_channels for direct metric updates
    const benchmarkChannel = supabase
      .channel('benchmark-channels-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'benchmark_channels',
        },
        (payload) => {
          console.log('[Radar] Benchmark channels update:', payload)
          // Update metrics when benchmark_channels changes
          setChannels((prev) =>
            prev.map((ch) =>
              ch.channel_id === payload.new.channel_id
                ? {
                    ...ch,
                    subscriber_count: payload.new.subscriber_count,
                    video_upload_count: payload.new.video_upload_count,
                    total_views: payload.new.total_views,
                  }
                : ch
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(benchmarkChannel)
    }
  }, [channels])

  const handleChannelRemoved = () => {
    // Channels are already updated via real-time subscription
    // This is just a callback for any additional logic needed
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Channel Radar</h1>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-sm p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-1">What is Channel Radar?</h4>
                        <p className="text-sm text-muted-foreground">
                          Automated monitoring system that tracks YouTube channels with daily updates at 6 AM.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Key Features:</h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          <li className="flex gap-2">
                            <Activity className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>Daily automated updates at 6 AM</span>
                          </li>
                          <li className="flex gap-2">
                            <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>Detects 10x outlier videos (viral content)</span>
                          </li>
                          <li className="flex gap-2">
                            <RefreshCw className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>Manual update triggers available</span>
                          </li>
                          <li className="flex gap-2">
                            <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>Real-time status updates</span>
                          </li>
                        </ul>
                      </div>

                      <Separator />

                      <p className="text-xs text-muted-foreground">
                        💡 Add channels from the Channels page to start monitoring.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Badge variant="outline" className="text-base">
                {channels.length} {channels.length === 1 ? 'channel' : 'channels'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              Monitor channels with daily automated updates at 6 AM
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={view === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
              >
                <Table className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Table</span>
              </Button>
              <Button
                variant={view === 'gallery' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('gallery')}
              >
                <Grid3x3 className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Gallery</span>
              </Button>
            </div>

            {/* Add Channel Button */}
            <Button asChild>
              <Link href="/channels">
                <Plus className="h-4 w-4 mr-2" />
                Add Channels
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span>Active Monitoring</span>
            </div>
            <p className="text-2xl font-bold">
              {channels.filter((ch) => ch.is_active).length}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span>10x Outliers</span>
            </div>
            <p className="text-2xl font-bold">
              {channels.filter((ch) => ch.has_10x_outlier).length}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span>Total Subscribers</span>
            </div>
            <p className="text-2xl font-bold">
              {(
                channels.reduce((sum, ch) => sum + (ch.subscriber_count || 0), 0) / 1000000
              ).toFixed(1)}
              M
            </p>
          </div>
        </div>

        {/* Conditional View */}
        {channels.length === 0 ? (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">No channels in radar yet</p>
              <Button asChild>
                <Link href="/channels">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Channel
                </Link>
              </Button>
            </div>
          </div>
        ) : view === 'table' ? (
          <RadarChannelsTable data={channels} onChannelRemoved={handleChannelRemoved} />
        ) : (
          <RadarChannelsGallery channels={channels} onChannelRemoved={handleChannelRemoved} />
        )}
      </div>
    </div>
  )
}
