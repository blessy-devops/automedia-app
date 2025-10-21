"use client"

import { Row } from "@tanstack/react-table"
import { ExternalLink, Copy, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Video } from "./columns"
import Link from "next/link"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

/**
 * Row Actions Component for Videos
 *
 * Provides quick actions for each video:
 * - View video details page
 * - Open on YouTube
 * - Copy Video ID
 */
export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const video = row.original as Video

  const handleOpenYouTube = () => {
    const url = `https://www.youtube.com/watch?v=${video.youtubeVideoId}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleCopyVideoId = () => {
    navigator.clipboard.writeText(video.youtubeVideoId)
    console.log("Copied video ID:", video.youtubeVideoId)
    // TODO: Add toast notification
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/videos/${video.id}`}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenYouTube}
        className="h-8"
        title="Open on YouTube"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyVideoId}
        className="h-8"
        title="Copy Video ID"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}
