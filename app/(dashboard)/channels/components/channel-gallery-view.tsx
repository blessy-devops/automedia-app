"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { formatLargeNumber } from "@/lib/utils"
import { StatCard } from "@/components/stat-card"
import { Channel } from "./simple-channels-table"
import { BadgeCheck, Users, Eye, Video, TrendingUp } from "lucide-react"

interface ChannelGalleryViewProps {
  channels: Channel[]
}

/**
 * Channel Gallery View Component
 *
 * Professional channel cards with clean design following shadcn/ui best practices:
 * - Elegant avatar with fallback
 * - Clear visual hierarchy
 * - Organized metrics display
 * - Proper spacing and separators
 */
export function ChannelGalleryView({ channels }: ChannelGalleryViewProps) {
  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground text-sm">No channels found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {channels.map((channel) => (
        <Link
          key={channel.id}
          href={`/channels/${channel.channelId}`}
          className="group"
        >
          <Card className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-xl">
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar className="h-12 w-12 border-2">
                  <AvatarImage src={channel.thumbnailUrl || undefined} alt={channel.channelName || ""} />
                  <AvatarFallback className="text-lg font-semibold">
                    {channel.channelName?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                {/* Name & Niche */}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {channel.channelName || "Unknown Channel"}
                    </h3>
                    {channel.isVerified && (
                      <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  {channel.categorization?.niche && (
                    <Badge variant="secondary" className="text-xs">
                      {channel.categorization.niche}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-4 space-y-4">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={Users}
                  label="Subscribers"
                  value={formatLargeNumber(channel.subscriberCount)}
                  variant="primary"
                />
                <StatCard
                  icon={Eye}
                  label="Total Views"
                  value={formatLargeNumber(channel.totalViews)}
                />
              </div>

              {/* Video Count */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="h-4 w-4" />
                <span>{channel.videoUploadCount?.toLocaleString() || 0} videos</span>
              </div>

              {/* Average Views (if available) */}
              {channel.avgViewsPerVideoHistorical !== null &&
               channel.avgViewsPerVideoHistorical !== undefined && (
                <>
                  <Separator />
                  <StatCard
                    icon={TrendingUp}
                    label="Avg Views/Video"
                    value={formatLargeNumber(channel.avgViewsPerVideoHistorical)}
                    variant="success"
                  />
                </>
              )}

              {/* Country */}
              {channel.country && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    📍 {channel.country}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
