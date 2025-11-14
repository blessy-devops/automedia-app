"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowUpDown, BarChart3, Edit } from "lucide-react"
import { formatLargeNumber } from "@/lib/utils"

export type Channel = {
  id: number
  channelId: string
  channelName: string | null
  handle?: string | null
  subscriberCount: number | null
  totalViews: number | null
  videoUploadCount: number | null
  categorization: {
    niche?: string
    subniche?: string
    microniche?: string
    category?: string
    format?: string
  } | null
  thumbnailUrl: string | null
  avgViewsPerVideoHistorical: number | null
  engagementRate?: number | null
}

interface ChannelsTableProps {
  channels: Channel[]
}

type SortField = "subscribers" | "videos" | "views"
type SortDirection = "asc" | "desc"

export function ChannelsTable({ channels }: ChannelsTableProps) {
  const router = useRouter()
  const [sortBy, setSortBy] = useState<SortField>("subscribers")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(field)
      setSortDirection("desc")
    }
  }

  const sortedChannels = useMemo(() => {
    const sorted = [...channels]

    sorted.sort((a, b) => {
      let aVal: number
      let bVal: number

      if (sortBy === "subscribers") {
        aVal = a.subscriberCount || 0
        bVal = b.subscriberCount || 0
      } else if (sortBy === "videos") {
        aVal = a.videoUploadCount || 0
        bVal = b.videoUploadCount || 0
      } else {
        // views
        aVal = a.avgViewsPerVideoHistorical || 0
        bVal = b.avgViewsPerVideoHistorical || 0
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return sorted
  }, [channels, sortBy, sortDirection])

  const handleRowClick = (channelId: number) => {
    router.push(`/channels/${channelId}`)
  }

  const handleAnalyze = (channelId: number) => {
    router.push(`/channels/${channelId}`)
  }

  const handleEdit = (channelId: number) => {
    // TODO: Open edit modal or navigate to edit page
    console.log("Edit channel:", channelId)
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            <th className="text-left p-3 text-sm text-muted-foreground font-normal">
              Channel
            </th>
            <th className="text-left p-3 text-sm text-muted-foreground font-normal">
              Category
            </th>
            <th className="text-right p-3 text-sm text-muted-foreground font-normal">
              <button
                onClick={() => handleSort("subscribers")}
                className="hover:text-foreground flex items-center gap-1 ml-auto transition-colors"
              >
                Subscribers
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="text-right p-3 text-sm text-muted-foreground font-normal">
              <button
                onClick={() => handleSort("videos")}
                className="hover:text-foreground flex items-center gap-1 ml-auto transition-colors"
              >
                Videos
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="text-right p-3 text-sm text-muted-foreground font-normal">
              <button
                onClick={() => handleSort("views")}
                className="hover:text-foreground flex items-center gap-1 ml-auto transition-colors"
              >
                Avg. Views
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="text-right p-3 text-sm text-muted-foreground font-normal">
              Engagement
            </th>
            <th className="text-center p-3 text-sm text-muted-foreground font-normal">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedChannels.length > 0 ? (
            sortedChannels.map((channel) => (
              <tr
                key={channel.id}
                onClick={() => handleRowClick(channel.id)}
                className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
              >
                {/* Channel Info: avatar + name + @handle */}
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {channel.thumbnailUrl ? (
                      <Image
                        src={channel.thumbnailUrl}
                        alt={channel.channelName || "Channel"}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted" />
                    )}
                    <div>
                      <div className="text-sm text-foreground font-medium">
                        {channel.channelName || "Unnamed Channel"}
                      </div>
                      {channel.handle && (
                        <div className="text-xs text-muted-foreground">
                          @{channel.handle}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category Badge */}
                <td className="p-3">
                  {channel.categorization?.category ||
                  channel.categorization?.niche ? (
                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                      {channel.categorization.category ||
                        channel.categorization.niche}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>

                {/* Subscribers */}
                <td className="p-3 text-right text-sm text-foreground">
                  {formatLargeNumber(channel.subscriberCount)}
                </td>

                {/* Videos */}
                <td className="p-3 text-right text-sm text-foreground">
                  {channel.videoUploadCount?.toLocaleString() || "—"}
                </td>

                {/* Avg Views */}
                <td className="p-3 text-right text-sm text-foreground">
                  {formatLargeNumber(channel.avgViewsPerVideoHistorical)}
                </td>

                {/* Engagement Rate */}
                <td className="p-3 text-right text-sm text-foreground">
                  {channel.engagementRate ? `${channel.engagementRate}%` : "—"}
                </td>

                {/* Actions: 2 icon buttons */}
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleAnalyze(channel.id)}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Analyze"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(channel.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="p-8 text-center text-muted-foreground">
                No channels found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
