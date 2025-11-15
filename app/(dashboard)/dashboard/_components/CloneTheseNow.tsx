import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceBadge } from "@/components/ui/performance-badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Eye, ThumbsUp, MessageCircle } from "lucide-react"
import { CloneWorthyVideo } from "@/lib/dashboard-queries"
import { formatNumber } from "@/lib/utils"

interface CloneTheseNowProps {
  videos: CloneWorthyVideo[]
}

export function CloneTheseNow({ videos }: CloneTheseNowProps) {
  if (videos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔥 Clone These Now</CardTitle>
          <CardDescription>
            Top viral videos to replicate based on performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No outlier videos found yet. Start enriching channels to discover viral content!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔥 Clone These Now</CardTitle>
        <CardDescription>
          Top {videos.length} viral videos to replicate based on performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.youtube_video_id}
              className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {/* Thumbnail */}
              <Link
                href={`/videos/${video.youtube_video_id}`}
                className="relative flex-shrink-0 w-32 h-18 rounded overflow-hidden bg-slate-100"
              >
                {video.thumbnail_url ? (
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title || "Video thumbnail"}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No thumbnail
                  </div>
                )}
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/videos/${video.youtube_video_id}`}
                  className="block"
                >
                  <h4 className="font-medium text-sm line-clamp-2 hover:underline">
                    {video.title || "Untitled Video"}
                  </h4>
                </Link>

                <p className="text-xs text-muted-foreground mt-1">
                  {video.channel_name || "Unknown Channel"}
                  {video.categorization?.niche && (
                    <span className="ml-2">• {video.categorization.niche}</span>
                  )}
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {video.views !== null && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(video.views)}
                    </span>
                  )}
                  {video.likes !== null && (
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {formatNumber(video.likes)}
                    </span>
                  )}
                  {video.comments !== null && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {formatNumber(video.comments)}
                    </span>
                  )}
                </div>
              </div>

              {/* Performance Badge */}
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <PerformanceBadge
                  performanceRatio={video.performance_vs_avg_historical}
                  showLabel={false}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className="h-7 text-xs"
                >
                  <a
                    href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    YouTube
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {videos.length >= 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link href="/outliers">View All Outliers</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
