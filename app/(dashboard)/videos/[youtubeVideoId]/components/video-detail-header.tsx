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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Image from "next/image"
import { ChevronDown, FileText, Image as ImageIcon, Video } from "lucide-react"
import { useState } from "react"

interface VideoDetailHeaderProps {
  video: {
    youtubeVideoId: string
    title: string | null
    description: string | null
    tags: string[] | null
    isOutlier: boolean | null
    thumbnailUrl?: string | null
    videoTranscript?: string | null
  }
}

/**
 * Video Detail Header Component
 *
 * Displays the main video information:
 * - Video title with outlier badge
 * - YouTube embedded player
 * - Video thumbnail
 * - Video transcript (collapsible)
 * - YouTube Video ID
 * - Video description
 * - Tags
 */
export function VideoDetailHeader({
  video
}: VideoDetailHeaderProps) {
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)

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

      {/* Thumbnail */}
      {video.thumbnailUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Video Thumbnail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
              <Image
                src={video.thumbnailUrl}
                alt={video.title || "Video thumbnail"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </AspectRatio>
          </CardContent>
        </Card>
      )}

      {/* Video Transcript (Collapsible) */}
      {video.videoTranscript && (
        <Card>
          <Collapsible open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
            <CardHeader>
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-70 transition-opacity">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle className="text-lg">Video Transcript</CardTitle>
                </div>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    isTranscriptOpen ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
                  {video.videoTranscript}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* YouTube Video ID */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">YouTube Video ID:</p>
            <Badge variant="secondary" className="font-mono text-xs">
              {video.youtubeVideoId}
            </Badge>
          </div>
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
