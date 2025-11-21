"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PerformanceBadge } from "./performance-badge"
import { formatLargeNumber } from "@/lib/utils"
import { Video } from "./columns"
import { Eye, ThumbsUp, MessageSquare, Calendar } from "lucide-react"

interface GalleryViewProps {
  videos: Video[]
}

/**
 * Gallery View Component
 *
 * Professional video cards with clean design following shadcn/ui best practices:
 * - Elegant hover effects
 * - Floating performance badge
 * - Clear visual hierarchy
 * - Proper spacing and separators
 */
export function GalleryView({ videos }: GalleryViewProps) {
  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground text-sm">No videos found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/benchmark/videos/${video.youtubeVideoId}`}
          className="group"
        >
          <Card className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-200">
            {/* Thumbnail with aspect ratio */}
            <div className="aspect-video relative overflow-hidden bg-muted">
              {video.thumbnailUrl ? (
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title || "Video thumbnail"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No thumbnail
                </div>
              )}

              {/* Floating Performance Badge */}
              <div className="absolute top-2 right-2 shadow-lg">
                <PerformanceBadge score={video.performanceVsMedianHistorical} />
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Title & Channel */}
              <div className="space-y-1">
                <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {video.title || "Untitled Video"}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {video.channelId.substring(0, 25)}
                </p>
              </div>

              <Separator />

              {/* Views & Date */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{formatLargeNumber(video.views)}</span>
                </div>
                {video.uploadDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(video.uploadDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {/* Engagement Metrics */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  <span>{formatLargeNumber(video.likes)}</span>
                </div>
                <Separator orientation="vertical" className="h-3" />
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{video.comments?.toLocaleString() || 0}</span>
                </div>
                {video.videoAgeDays !== null && (
                  <>
                    <Separator orientation="vertical" className="h-3" />
                    <span>{Math.floor(video.videoAgeDays)}d old</span>
                  </>
                )}
              </div>

              {/* Outlier Badge */}
              {video.isOutlier && (
                <div className="pt-2 border-t">
                  <Badge variant="destructive" className="text-xs">
                    📊 Statistical Outlier
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
