"use client"

import { Row } from "@tanstack/react-table"
import { ExternalLink, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Channel } from "./columns"
import Link from "next/link"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

/**
 * Row Actions Buttons
 *
 * Provides quick actions for each channel:
 * - View channel details page
 * - Open on YouTube
 */
export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const channel = row.original as Channel

  const handleOpenYouTube = () => {
    const url = `https://www.youtube.com/channel/${channel.channelId}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/channels/${channel.id}`}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          title="View Details"
        >
          <Eye className="h-4 w-4 mr-2" />
          Details
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
    </div>
  )
}
