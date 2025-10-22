"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatLargeNumber } from "@/lib/utils"
import { BenchmarkChannel, BenchmarkChannelBaselineStats } from "@/lib/drizzle"
import Image from "next/image"
import { Users, Eye, Video, TrendingUp, Calendar, Globe } from "lucide-react"

interface ChannelDetailHeaderProps {
  channel: BenchmarkChannel
  baselineStats: BenchmarkChannelBaselineStats | undefined
}

/**
 * Parse banner URL JSON and select best resolution
 */
function getBannerUrl(bannerUrlJson: string | null): string | null {
  if (!bannerUrlJson) return null

  try {
    const banners = JSON.parse(bannerUrlJson) as Array<{ url: string; width: number; height: number }>

    if (!Array.isArray(banners) || banners.length === 0) return null

    // Select banner with width >= 2000px for best quality
    const highRes = banners.find(b => b.width >= 2000)
    if (highRes) return highRes.url

    // Fallback to largest available
    const largest = banners.reduce((prev, current) =>
      current.width > prev.width ? current : prev
    )
    return largest.url
  } catch (error) {
    console.error('Failed to parse banner URL JSON:', error)
    return null
  }
}

/**
 * Channel Detail Header Component
 *
 * Displays comprehensive channel information in organized cards:
 * - Channel banner (if available)
 * - Main statistics (subscribers, views, videos)
 * - AI categorization results
 * - Recent performance metrics (14d baseline)
 * - Channel description
 */
export function ChannelDetailHeader({
  channel,
  baselineStats,
}: ChannelDetailHeaderProps) {
  const categorization = channel.categorization as {
    niche?: string
    subniche?: string
    microniche?: string
    category?: string
    format?: string
  } | null

  const bannerUrl = getBannerUrl(channel.bannerUrl)

  return (
    <div className="space-y-6">
      {/* Channel Banner */}
      {bannerUrl && (
        <div className="relative w-full overflow-hidden rounded-xl bg-muted">
          <div className="aspect-[6/1] relative">
            <Image
              src={bannerUrl}
              alt={`${channel.channelName || 'Channel'} banner`}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Channel Header */}
      <div className="flex items-start gap-6">
        {channel.thumbnailUrl && (
          <Image
            src={channel.thumbnailUrl}
            alt={channel.channelName || "Channel"}
            width={120}
            height={120}
            className="rounded-full"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">
              {channel.channelName || "Unknown Channel"}
            </h1>
            {channel.isVerified && (
              <Badge variant="secondary" className="text-sm">
                Verified
              </Badge>
            )}
          </div>
          {channel.customUrl && (
            <p className="text-muted-foreground mt-2">
              @{channel.customUrl}
            </p>
          )}
          {channel.country && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{channel.country}</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Main Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Main Statistics</CardTitle>
            <CardDescription>Overall channel metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Subscribers</p>
                <p className="text-2xl font-bold">
                  {formatLargeNumber(channel.subscriberCount)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">
                  {formatLargeNumber(channel.totalViews)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Videos</p>
                <p className="text-2xl font-bold">
                  {channel.videoUploadCount?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Categorization Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Categorization</CardTitle>
            <CardDescription>Content classification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categorization?.niche && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Niche</p>
                <Badge variant="default" className="text-sm">
                  {categorization.niche}
                </Badge>
              </div>
            )}
            {categorization?.subniche && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Subniche</p>
                <Badge variant="secondary" className="text-sm">
                  {categorization.subniche}
                </Badge>
              </div>
            )}
            {categorization?.microniche && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Microniche</p>
                <Badge variant="outline" className="text-sm">
                  {categorization.microniche}
                </Badge>
              </div>
            )}
            {categorization?.category && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <Badge variant="outline" className="text-sm">
                  {categorization.category}
                </Badge>
              </div>
            )}
            {categorization?.format && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Format</p>
                <Badge variant="outline" className="text-sm">
                  {categorization.format}
                </Badge>
              </div>
            )}
            {!categorization && (
              <p className="text-sm text-muted-foreground">
                No categorization data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Performance (14 Days) Card */}
        {baselineStats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Performance
              </CardTitle>
              <CardDescription>Last 14 days metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-xl font-bold">
                  {formatLargeNumber(baselineStats.totalViews14d)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Videos Published</p>
                <p className="text-xl font-bold">
                  {baselineStats.videosCount14d || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Views/Video</p>
                <p className="text-xl font-bold">
                  {baselineStats.avgViewsPerVideo14d
                    ? formatLargeNumber(Math.round(baselineStats.avgViewsPerVideo14d))
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description Card */}
      {channel.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Channel Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {channel.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
