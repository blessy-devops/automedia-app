"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Sparkles, Loader2 } from "lucide-react"
import { enrichVideo } from "../actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface VideoDetailHeaderProps {
  video: {
    id: number
    youtubeVideoId: string
    title: string | null
    description: string | null
    tags: string[] | null
    isOutlier: boolean | null
    lastEnrichedAt: Date | null
  }
}

/**
 * Video Detail Header Component
 *
 * Displays the main video information:
 * - Video title with outlier badge and enrich button
 * - YouTube embedded player
 * - Video description
 * - Tags
 */
export function VideoDetailHeader({ video }: VideoDetailHeaderProps) {
  const router = useRouter()
  const [isEnriching, setIsEnriching] = useState(false)

  const handleEnrich = async () => {
    setIsEnriching(true)

    try {
      const result = await enrichVideo(video.id, video.youtubeVideoId)

      if (result.success) {
        toast.success("Video Enriched Successfully", {
          description: `Found ${result.keywords?.length || 0} keywords and ${result.relatedVideosCount || 0} related videos.`,
        })
        router.refresh()
      } else {
        toast.error("Enrichment Failed", {
          description: result.error || "An error occurred while enriching the video",
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      })
    } finally {
      setIsEnriching(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Video Title */}
      <div>
        <div className="flex items-start gap-3">
          <h1 className="text-3xl font-bold tracking-tight flex-1">
            {video.title || "Untitled Video"}
          </h1>
          <div className="flex items-center gap-2">
            {video.isOutlier && (
              <Badge variant="destructive" className="text-sm">
                Outlier
              </Badge>
            )}
            <Button
              onClick={handleEnrich}
              disabled={isEnriching}
              size="sm"
              variant={video.lastEnrichedAt ? "outline" : "default"}
            >
              {isEnriching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {video.lastEnrichedAt ? "Re-Enrich" : "Enrich Video"}
                </>
              )}
            </Button>
          </div>
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
