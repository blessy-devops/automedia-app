"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowUpDown, BarChart3, RefreshCw, Trash2, X } from "lucide-react"
import { formatLargeNumber, formatDate } from "@/lib/utils"
import { DeleteChannelDialog } from "./delete-channel-dialog"
import { BulkDeleteChannelsDialog } from "./bulk-delete-channels-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { triggerManualUpdate } from "@/app/(dashboard)/benchmark/radar/actions"
import { toast } from "sonner"

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
  createdAt?: Date | null
}

interface ChannelsTableProps {
  channels: Channel[]
}

type SortField = "subscribers" | "videos" | "views" | "benchDate"
type SortDirection = "asc" | "desc"

export function ChannelsTable({ channels }: ChannelsTableProps) {
  const router = useRouter()
  const [sortBy, setSortBy] = useState<SortField>("benchDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    channel: { id: number; channelName: string | null; channelId: string } | null
  }>({ open: false, channel: null })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)

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
      if (sortBy === "benchDate") {
        // Sort by created date
        const aTime = a.createdAt?.getTime() || 0
        const bTime = b.createdAt?.getTime() || 0

        if (sortDirection === "asc") {
          return aTime > bTime ? 1 : -1
        } else {
          return aTime < bTime ? 1 : -1
        }
      }

      // Numeric sorting for other fields
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
    router.push(`/benchmark/channels/${channelId}`)
  }

  const handleAnalyze = (channelId: number) => {
    router.push(`/benchmark/channels/${channelId}`)
  }

  const [updatingChannelId, setUpdatingChannelId] = useState<string | null>(null)

  const handleUpdateMetrics = async (channel: Channel) => {
    setUpdatingChannelId(channel.channelId)
    const displayName = channel.channelName || channel.channelId

    try {
      toast.loading(`Updating metrics for ${displayName}...`, { id: `update-${channel.channelId}` })

      const result = await triggerManualUpdate(channel.channelId)

      if (result.success) {
        if (result.warning) {
          toast.warning(`${displayName}: ${result.warning}`, { id: `update-${channel.channelId}` })
        } else {
          toast.success(`Metrics updated for ${displayName}`, { id: `update-${channel.channelId}` })
        }
      } else {
        toast.error(`Failed to update ${displayName}: ${result.error}`, { id: `update-${channel.channelId}` })
      }
    } catch (error) {
      toast.error(`Error updating ${displayName}`, { id: `update-${channel.channelId}` })
    } finally {
      setUpdatingChannelId(null)
    }
  }

  // Selection handlers
  const handleToggleSelect = (channelId: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId)
    } else {
      newSelected.add(channelId)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === sortedChannels.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedChannels.map((c) => c.id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const isAllSelected = sortedChannels.length > 0 && selectedIds.size === sortedChannels.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < sortedChannels.length

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium">
              {selectedIds.size} channel{selectedIds.size > 1 ? 's' : ''} selected
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-7 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteDialog(true)}
            className="h-7 text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            <th className="p-3 w-12">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isSomeSelected || undefined}
                onCheckedChange={handleSelectAll}
                aria-label="Select all channels"
              />
            </th>
            <th className="text-left p-3 text-sm text-muted-foreground font-normal">
              Channel
            </th>
            <th className="text-left p-3 text-sm text-muted-foreground font-normal">
              Category
            </th>
            <th className="text-left p-3 text-sm text-muted-foreground font-normal">
              <button
                onClick={() => handleSort("benchDate")}
                className="hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Bench Date
                <ArrowUpDown className="w-3 h-3" />
              </button>
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
                className="border-b border-border hover:bg-accent/50 transition-colors"
              >
                {/* Checkbox */}
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(channel.id)}
                    onCheckedChange={() => handleToggleSelect(channel.id)}
                    aria-label={`Select ${channel.channelName || 'channel'}`}
                  />
                </td>

                {/* Channel Info: avatar + name + @handle */}
                <td className="p-3 cursor-pointer" onClick={() => handleRowClick(channel.id)}>
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
                <td className="p-3 cursor-pointer" onClick={() => handleRowClick(channel.id)}>
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

                {/* Bench Date */}
                <td className="p-3 text-left text-sm text-muted-foreground cursor-pointer" onClick={() => handleRowClick(channel.id)}>
                  {channel.createdAt ? formatDate(channel.createdAt) : "—"}
                </td>

                {/* Subscribers */}
                <td className="p-3 text-right text-sm text-foreground cursor-pointer" onClick={() => handleRowClick(channel.id)}>
                  {formatLargeNumber(channel.subscriberCount)}
                </td>

                {/* Videos */}
                <td className="p-3 text-right text-sm text-foreground cursor-pointer" onClick={() => handleRowClick(channel.id)}>
                  {channel.videoUploadCount?.toLocaleString() || "—"}
                </td>

                {/* Avg Views */}
                <td className="p-3 text-right text-sm text-foreground cursor-pointer" onClick={() => handleRowClick(channel.id)}>
                  {formatLargeNumber(channel.avgViewsPerVideoHistorical)}
                </td>

                {/* Actions: 3 icon buttons */}
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
                      onClick={() => handleUpdateMetrics(channel)}
                      disabled={updatingChannelId === channel.channelId}
                      className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      title="Update Metrics"
                    >
                      <RefreshCw className={`w-4 h-4 ${updatingChannelId === channel.channelId ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          channel: {
                            id: channel.id,
                            channelName: channel.channelName,
                            channelId: channel.channelId,
                          },
                        })
                      }
                      className="text-destructive hover:text-destructive/80 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="p-8 text-center text-muted-foreground">
                No channels found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <DeleteChannelDialog
        channel={deleteDialog.channel}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, channel: null })}
        onSuccess={() => {
          // Refresh the page to show updated data
          window.location.reload()
        }}
      />

      <BulkDeleteChannelsDialog
        channelIds={Array.from(selectedIds)}
        open={bulkDeleteDialog}
        onOpenChange={setBulkDeleteDialog}
        onSuccess={() => {
          setSelectedIds(new Set())
          window.location.reload()
        }}
      />
      </div>
    </div>
  )
}
