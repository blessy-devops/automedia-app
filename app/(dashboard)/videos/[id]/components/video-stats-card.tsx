"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatLargeNumber } from "@/lib/utils"
import { Eye, ThumbsUp, MessageSquare, Calendar, Clock } from "lucide-react"

interface VideoStatsCardProps {
  video: {
    views: number | null
    likes: number | null
    comments: number | null
    uploadDate: Date | null
    videoLength: string | null
    videoAgeDays: number | null
  }
}

/**
 * Format PostgreSQL interval to readable duration
 * Example: "PT1H23M45S" -> "1:23:45"
 */
function formatDuration(interval: string | null): string {
  if (!interval) return "—"

  // PostgreSQL interval format: "HH:MM:SS" or "HH:MM:SS.microseconds"
  // Sometimes it's just a simple time format already
  if (interval.includes(':')) {
    const parts = interval.split(':')
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10)
      const minutes = parseInt(parts[1], 10)
      const seconds = Math.floor(parseFloat(parts[2]))

      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }
      return `${minutes}:${String(seconds).padStart(2, '0')}`
    }
  }

  return interval
}

/**
 * Format date to DD/MM/YYYY
 */
function formatDate(date: Date | null): string {
  if (!date) return "—"
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Video Stats Card Component
 *
 * Displays basic video statistics
 */
export function VideoStatsCard({ video }: VideoStatsCardProps) {
  const ageDays = video.videoAgeDays !== null ? Math.floor(video.videoAgeDays) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Statistics</CardTitle>
        <CardDescription>Video performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Views */}
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Views</p>
            <p className="text-lg font-semibold">
              {formatLargeNumber(video.views)}
            </p>
          </div>
        </div>

        {/* Likes */}
        <div className="flex items-center gap-3">
          <ThumbsUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Likes</p>
            <p className="text-lg font-semibold">
              {formatLargeNumber(video.likes)}
            </p>
          </div>
        </div>

        {/* Comments */}
        <div className="flex items-center gap-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Comments</p>
            <p className="text-lg font-semibold">
              {video.comments !== null ? video.comments.toLocaleString() : "—"}
            </p>
          </div>
        </div>

        {/* Upload Date */}
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Upload Date</p>
            <p className="text-sm font-medium">
              {formatDate(video.uploadDate)}
            </p>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-medium">
              {formatDuration(video.videoLength)}
            </p>
          </div>
        </div>

        {/* Video Age */}
        {ageDays !== null && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Age</p>
            <p className="text-sm font-medium">
              {ageDays} day{ageDays !== 1 ? 's' : ''} old
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
