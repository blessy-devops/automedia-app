"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"

interface VideoDetailHeaderProps {
  video: {
    youtubeVideoId: string
    title: string | null
    description: string | null
    tags: string[] | null
    isOutlier: boolean | null
  }
}

/**
 * Video Detail Header Component
 *
 * Displays the main video information:
 * - Video title with outlier badge
 * - YouTube embedded player
 * - Video description
 * - Tags
 */
export function VideoDetailHeader({ video }: VideoDetailHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Video Title */}
      <div>
        <div className="flex items-start gap-3">
          <h1 className="text-3xl font-bold tracking-tight flex-1">
            {video.title || "Untitled Video"}
          </h1>
          {video.isOutlier && (
            <Badge variant="destructive" className="text-sm">
              Outlier
            </Badge>
          )}
        </div>
      </div>

      {/* YouTube Player */}
      <Card>
        <CardContent className="p-0">
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeVideoId}`}
              title={video.title || "YouTube video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </AspectRatio>
        </CardContent>
      </Card>

      {/* Video Description */}
      {video.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {video.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {video.tags && video.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tags</CardTitle>
            <CardDescription>
              {video.tags.length} tag(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
