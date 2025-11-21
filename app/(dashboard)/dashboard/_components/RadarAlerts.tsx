import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceBadge } from "@/components/ui/performance-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Clock } from "lucide-react"
import { RadarAlert } from "@/lib/dashboard-queries"
import { formatNumber, timeAgo } from "@/lib/utils"

interface RadarAlertsProps {
  alerts: RadarAlert[]
}

export function RadarAlerts({ alerts }: RadarAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎯 Radar Alerts</CardTitle>
          <CardDescription>
            New outliers detected from monitored channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No alerts yet. Add channels to your Radar to get notified about new viral videos!
            </p>
            <Button asChild variant="outline">
              <Link href="/radar">Go to Radar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Radar Alerts</CardTitle>
        <CardDescription>
          New outliers detected from monitored channels (last 30 days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.youtube_video_id}
              className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {/* Thumbnail */}
              <Link
                href={`/benchmark/videos/${alert.youtube_video_id}`}
                className="relative flex-shrink-0 w-24 h-14 rounded overflow-hidden bg-slate-100"
              >
                {alert.thumbnail_url ? (
                  <Image
                    src={alert.thumbnail_url}
                    alt={alert.title || "Video thumbnail"}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No img
                  </div>
                )}
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/benchmark/videos/${alert.youtube_video_id}`}
                    className="flex-1"
                  >
                    <h4 className="font-medium text-sm line-clamp-2 hover:underline">
                      {alert.title || "Untitled Video"}
                    </h4>
                  </Link>
                  <PerformanceBadge
                    performanceRatio={alert.performance_vs_avg_historical}
                    showLabel={false}
                    className="flex-shrink-0"
                  />
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  {alert.channel_name || "Unknown Channel"}
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs">
                  {alert.views !== null && (
                    <Badge variant="outline" className="font-mono">
                      {formatNumber(alert.views)} views
                    </Badge>
                  )}
                  {alert.upload_date && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {timeAgo(new Date(alert.upload_date))}
                    </span>
                  )}
                </div>
              </div>

              {/* YouTube Link */}
              <div className="flex items-center flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className="h-7 text-xs"
                >
                  <a
                    href={`https://youtube.com/watch?v=${alert.youtube_video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Button variant="outline" asChild>
            <Link href="/radar">View All Radar Channels</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
