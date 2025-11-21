"use client"

import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatLargeNumber, cn } from "@/lib/utils"
import Image from "next/image"
import { Users, Eye, Video, TrendingUp, Globe, Sparkles, AlertCircle } from "lucide-react"
import { AddToRadarButton } from "@/app/(dashboard)/benchmark/radar/components/add-to-radar-button"

// Types based on Supabase schema
interface BenchmarkChannel {
  channelId: string
  channelName: string | null
  thumbnailUrl: string | null
  isVerified: boolean | null
  customUrl: string | null
  country: string | null
  subscriberCount: number | null
  totalViews: number | null
  videoUploadCount: number | null
  description: string | null
  categorization: Record<string, any> | null
  inRadar?: boolean
}

interface BenchmarkChannelBaselineStats {
  totalViews14d: number
  videosCount14d: number | null
  avgViewsPerVideo14d: number | null
  medianViewsPerVideoHistorical: number | null
}

interface ChannelDetailHeaderProps {
  channel: BenchmarkChannel
  baselineStats: BenchmarkChannelBaselineStats | undefined
  socialBladeAvailable?: boolean
}

/**
 * Channel Detail Header Component
 *
 * Displays comprehensive channel information in organized cards:
 * - Main statistics (subscribers, views, videos)
 * - AI categorization results
 * - Recent performance metrics (14d baseline)
 * - Channel description
 */
export function ChannelDetailHeader({
  channel,
  baselineStats,
  socialBladeAvailable = true,
}: ChannelDetailHeaderProps) {
  const categorization = channel.categorization as {
    niche?: string
    subniche?: string
    microniche?: string
    category?: string
    format?: string
  } | null

  return (
    <div className="space-y-6">
      {/* Modern Channel Header with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 backdrop-blur-sm">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />

        <div className="relative p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-6">
              {channel.thumbnailUrl && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-50 group-hover:opacity-75 transition-opacity blur" />
                  <Image
                    src={channel.thumbnailUrl}
                    alt={channel.channelName || "Channel"}
                    width={120}
                    height={120}
                    className="relative rounded-full ring-4 ring-background"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {channel.channelName || "Unknown Channel"}
                  </h1>
                  {channel.isVerified && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                {channel.customUrl && (
                  <p className="text-muted-foreground mt-2 text-lg">
                    @{channel.customUrl}
                  </p>
                )}
                {channel.country && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>{channel.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Add to Radar Button */}
            <AddToRadarButton
              channelId={channel.channelId}
              channelName={channel.channelName || undefined}
              isInRadar={channel.inRadar}
            />
          </div>
        </div>
      </div>

      {/* Social Blade Warning Alert */}
      {!socialBladeAvailable && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/5">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Social Blade Metrics Unavailable</AlertTitle>
          <AlertDescription className="text-sm">
            Recent performance metrics (14-day data) could not be retrieved from Social Blade.
            This usually happens with very new channels or channels not yet indexed.
            Historical performance metrics based on YouTube data are still available.
          </AlertDescription>
        </Alert>
      )}

      {/* Modern Statistics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Main Statistics Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg p-2.5 bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Main Statistics</h3>
                <p className="text-xs text-muted-foreground">Overall channel metrics</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Subscribers</p>
                  <p className="text-2xl font-bold">
                    {formatLargeNumber(channel.subscriberCount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-purple-500/10">
                  <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">
                    {formatLargeNumber(channel.totalViews)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-pink-500/10">
                  <Video className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Total Videos</p>
                  <p className="text-2xl font-bold">
                    {channel.videoUploadCount?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* AI Categorization Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg p-2.5 bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI Categorization</h3>
                <p className="text-xs text-muted-foreground">Content classification</p>
              </div>
            </div>

            <div className="space-y-3">
              {categorization?.niche && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Niche</p>
                  <Badge variant="default" className="text-sm font-medium">
                    {categorization.niche}
                  </Badge>
                </div>
              )}
              {categorization?.subniche && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Subniche</p>
                  <Badge variant="secondary" className="text-sm font-medium">
                    {categorization.subniche}
                  </Badge>
                </div>
              )}
              {categorization?.microniche && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Microniche</p>
                  <Badge variant="outline" className="text-sm font-medium">
                    {categorization.microniche}
                  </Badge>
                </div>
              )}
              {categorization?.category && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Category</p>
                  <Badge variant="outline" className="text-sm font-medium">
                    {categorization.category}
                  </Badge>
                </div>
              )}
              {categorization?.format && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Format</p>
                  <Badge variant="outline" className="text-sm font-medium">
                    {categorization.format}
                  </Badge>
                </div>
              )}
              {!categorization && (
                <p className="text-sm text-muted-foreground">
                  No categorization data available
                </p>
              )}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Recent Performance (14 Days) Card - Only show if Social Blade available */}
        {baselineStats && socialBladeAvailable && (
          <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-lg p-2.5 bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Recent Performance</h3>
                  <p className="text-xs text-muted-foreground">Last 14 days metrics</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Views</p>
                  <p className="text-2xl font-bold">
                    {formatLargeNumber(baselineStats.totalViews14d)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Videos Published</p>
                  <p className="text-2xl font-bold">
                    {baselineStats.videosCount14d || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Avg Views/Video</p>
                  <p className="text-2xl font-bold">
                    {baselineStats.avgViewsPerVideo14d
                      ? formatLargeNumber(Math.round(baselineStats.avgViewsPerVideo14d))
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Median Views/Video</p>
                  <p className="text-2xl font-bold">
                    {baselineStats.medianViewsPerVideoHistorical
                      ? formatLargeNumber(Math.round(baselineStats.medianViewsPerVideoHistorical))
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        )}
      </div>

      {/* Description Card */}
      {channel.description && (
        <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-slate-500/5 via-gray-500/5 to-zinc-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative p-6">
            <h3 className="text-lg font-semibold mb-4">Channel Description</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {channel.description}
            </p>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      )}
    </div>
  )
}
