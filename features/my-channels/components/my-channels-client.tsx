'use client'

/**
 * My Channels Client Component
 * Displays and manages user's YouTube channels with Grid and List views
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Plus,
  TrendingUp,
  Video,
  Users,
  Eye,
  Clock,
  Settings,
  ExternalLink,
  Grid3x3,
  List
} from 'lucide-react'
import type { Channel, ChannelStatus } from '../types'

interface MyChannelsClientProps {
  channels: Channel[]
}

type ViewMode = 'grid' | 'list'

export function MyChannelsClient({ channels }: MyChannelsClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Filter channels by search query
  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.handle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get status badge with correct colors
  const getStatusBadge = (status: ChannelStatus) => {
    const styles = {
      active: 'bg-green-500/10 text-green-500 border-green-500/20',
      paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
    const labels = {
      active: 'Active',
      paused: 'Paused',
      draft: 'Draft'
    }
    return <Badge variant="outline" className={styles[status]}>{labels[status]}</Badge>
  }

  const handleChannelClick = (channelId: number) => {
    router.push(`/channels/${channelId}`)
  }

  const handleNewChannel = () => {
    // TODO: Open new channel modal
    console.log('Create new channel')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground mb-2">My Channels</h1>
              <p className="text-muted-foreground">
                Manage your YouTube channels, brand bibles, and production settings
              </p>
            </div>
            <Button className="gap-2" onClick={handleNewChannel}>
              <Plus className="w-4 h-4" />
              New Channel
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Search and View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border w-[400px]"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 border border-border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <Grid3x3 className="w-4 h-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              List
            </Button>
          </div>
        </div>
        {filteredChannels.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No channels found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search query
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredChannels.map((channel) => (
              <Card
                key={channel.id}
                className="group hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleChannelClick(channel.id)}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <img
                      src={channel.avatar}
                      alt={channel.name}
                      className="w-12 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: channel.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground mb-0.5 truncate">
                        {channel.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {channel.handle}
                      </p>
                    </div>
                    {getStatusBadge(channel.status)}
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Subscribers
                      </span>
                      <span className="font-medium">{channel.subscribers}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" />
                        Videos
                      </span>
                      <span className="font-medium">{channel.totalVideos}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Total Views
                      </span>
                      <span className="font-medium">{channel.totalViews}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Avg Views
                      </span>
                      <span className="font-medium">{channel.avgViews}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Publishing</span>
                      <span className="font-medium">{channel.publishingFrequency}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last published
                      </span>
                      <span className="font-medium">{channel.lastPublished}</span>
                    </div>
                  </div>

                  {/* Actions (visible on hover) */}
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleChannelClick(channel.id)
                      }}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`https://youtube.com/${channel.handle}`, '_blank')
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChannels.map((channel) => (
              <Card
                key={channel.id}
                className="group hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleChannelClick(channel.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Avatar and Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img
                        src={channel.avatar}
                        alt={channel.name}
                        className="w-16 h-16 rounded-full flex-shrink-0"
                        style={{ backgroundColor: channel.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium text-foreground truncate">
                            {channel.name}
                          </h3>
                          {getStatusBadge(channel.status)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {channel.handle}
                        </p>
                      </div>
                    </div>

                    {/* Metrics - Horizontal */}
                    <div className="hidden lg:flex items-center gap-8">
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-xs">Subscribers</span>
                        </div>
                        <span className="text-sm font-medium">{channel.subscribers}</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <Video className="w-3.5 h-3.5" />
                          <span className="text-xs">Videos</span>
                        </div>
                        <span className="text-sm font-medium">{channel.totalVideos}</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-xs">Total Views</span>
                        </div>
                        <span className="text-sm font-medium">{channel.totalViews}</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="text-xs">Avg Views</span>
                        </div>
                        <span className="text-sm font-medium">{channel.avgViews}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleChannelClick(channel.id)
                        }}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Manage
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`https://youtube.com/${channel.handle}`, '_blank')
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
