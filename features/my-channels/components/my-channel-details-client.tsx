'use client'

/**
 * My Channel Details Client Component
 * Shows detailed view of a channel with tabs for Overview, Analytics, Brand Bible, and Credentials
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Video,
  Key,
  TrendingUp,
  Clock,
  Settings as SettingsIcon,
  ExternalLink,
  Share2,
  Globe
} from 'lucide-react'
import type { Channel } from '../types'
import { BrandBibleTab } from './brand-bible-tab'
import { CredentialsTab } from './credentials-tab'

interface MyChannelDetailsClientProps {
  channel: Channel
}

export function MyChannelDetailsClient({ channel }: MyChannelDetailsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        {/* Back button */}
        <div className="px-8 pt-6 pb-4">
          <button
            onClick={() => router.push('/channels')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to my channels</span>
          </button>
        </div>

        {/* Channel Info Header */}
        <div className="px-8 pb-6">
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar + Basic Info */}
            <div className="flex items-start gap-4 flex-1">
              <img
                src={channel.avatar}
                alt={channel.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-border"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-semibold text-foreground">{channel.name}</h1>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: `${channel.color}20`,
                      color: channel.color,
                      borderColor: `${channel.color}40`
                    }}
                  >
                    {channel.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-muted-foreground">{channel.handle}</p>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Globe className="w-3.5 h-3.5" />
                    Brazil
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`https://youtube.com/${channel.handle}`, '_blank')}>
                <ExternalLink className="w-4 h-4" />
                View on YouTube
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <SettingsIcon className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="p-8">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">Total Subscribers</p>
            <p className="text-2xl font-semibold text-foreground">{channel.subscribers}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">Total Views</p>
            <p className="text-2xl font-semibold text-foreground">{channel.totalViews}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">Total Videos</p>
            <p className="text-2xl font-semibold text-foreground">{channel.totalVideos}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">Avg Views/Video</p>
            <p className="text-2xl font-semibold text-foreground">{channel.avgViews}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="brandbible" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Brand Bible
            </TabsTrigger>
            <TabsTrigger value="credentials" className="gap-2">
              <Key className="w-4 h-4" />
              Credentials
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Publishing Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Publishing Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Publishing Frequency</p>
                    <p className="text-lg font-semibold text-foreground">{channel.publishingFrequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Published</p>
                    <p className="text-lg font-semibold text-foreground">{channel.lastPublished}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Next Scheduled</p>
                    <p className="text-lg font-semibold text-foreground">Tomorrow, 10:00 AM</p>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recent Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last 7 Days Views</p>
                    <p className="text-lg font-semibold text-foreground">342.5K</p>
                    <p className="text-xs text-emerald-600">+12.3% vs previous week</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">New Subscribers (7d)</p>
                    <p className="text-lg font-semibold text-foreground">+2.4K</p>
                    <p className="text-xs text-emerald-600">+8.7% vs previous week</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Video className="w-4 h-4" />
                  Create Video
                </Button>
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                </Button>
                <Button variant="outline" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Edit Brand Bible
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed analytics and insights for {channel.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brand Bible Tab */}
          <TabsContent value="brandbible">
            <BrandBibleTab channelName={channel.name} />
          </TabsContent>

          {/* Credentials Tab */}
          <TabsContent value="credentials">
            <CredentialsTab channelId={channel.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
