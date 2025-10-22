"use client"

import { useMemo, useState, lazy, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatLargeNumber, formatDate } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { DataTableToolbar, ViewMode } from "./data-table-toolbar"
import { PerformanceBadge } from "./performance-badge"

// Lazy load GalleryView - só carrega quando usuário trocar para gallery
const GalleryView = lazy(() => import("./gallery-view").then(mod => ({ default: mod.GalleryView })))

/**
 * Video Type for the DataTable
 * Based on the BenchmarkVideo Drizzle schema with calculated fields
 */
export type Video = {
  id: number
  youtubeVideoId: string
  channelId: string
  channelName: string | null
  title: string | null
  views: number | null
  likes: number | null
  comments: number | null
  uploadDate: Date | null
  thumbnailUrl: string | null
  performanceVsAvgHistorical: number | null
  performanceVsMedianHistorical: number | null
  performanceVsRecent14d: number | null
  performanceVsRecent30d: number | null
  performanceVsRecent90d: number | null
  isOutlier: boolean | null
  videoAgeDays: number | null
}

interface SimpleVideosTableProps {
  data: Video[]
}

type SortField = 'title' | 'views' | 'likes' | 'uploadDate' | 'performanceVsMedianHistorical'
type SortOrder = 'asc' | 'desc'

export function SimpleVideosTable({ data }: SimpleVideosTableProps) {
  const [view, setView] = useState<ViewMode>("table")
  const [search, setSearch] = useState("")
  const [selectedChannel, setSelectedChannel] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("uploadDate")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Get unique channels for the filter
  const channels = useMemo(() => {
    const uniqueChannels = new Map<string, string>()
    data.forEach(video => {
      if (video.channelId && video.channelName) {
        uniqueChannels.set(video.channelId, video.channelName)
      }
    })
    return Array.from(uniqueChannels.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  // Filter by search and channel
  const filtered = useMemo(() => {
    let result = data

    // Filter by channel
    if (selectedChannel !== "all") {
      result = result.filter(video => video.channelId === selectedChannel)
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(video =>
        video.title?.toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [data, search, selectedChannel])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      let comparison = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal)
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime()
      } else {
        comparison = (aVal as number) - (bVal as number)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filtered, sortField, sortOrder])

  // Paginate
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  const totalPages = Math.ceil(sorted.length / pageSize)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortButton = ({ field, children }: { field: SortField, children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="-ml-4 h-8 hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === field ? 'opacity-100' : 'opacity-50'}`} />
    </Button>
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <DataTableToolbar view={view} onViewChange={setView} />

      {/* Filters */}
      <div className="flex gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos by title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            className="h-9 pl-8"
          />
        </div>

        {/* Channel Filter */}
        <Select
          value={selectedChannel}
          onValueChange={(value) => {
            setSelectedChannel(value)
            setPage(1) // Reset to first page on filter
          }}
        >
          <SelectTrigger className="h-9 w-[250px]">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels ({data.length})</SelectItem>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                {channel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conditional rendering: Table or Gallery */}
      {view === "gallery" ? (
        <Suspense fallback={<div className="flex items-center justify-center h-64">Loading gallery...</div>}>
          <GalleryView videos={paginated} />
        </Suspense>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Thumb</TableHead>
                <TableHead>
                  <SortButton field="title">Title</SortButton>
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortButton field="views">Views</SortButton>
                </TableHead>
                <TableHead className="w-[150px]">
                  <SortButton field="uploadDate">Upload Date</SortButton>
                </TableHead>
                <TableHead className="w-[150px]">
                  <SortButton field="performanceVsMedianHistorical">Performance</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length > 0 ? (
                paginated.map((video) => (
                  <TableRow
                    key={video.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      {video.thumbnailUrl && (
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title || "Video thumbnail"}
                          width={80}
                          height={45}
                          className="rounded object-cover"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/videos/${video.youtubeVideoId}`}
                        className="hover:underline line-clamp-2"
                      >
                        {video.title || "Untitled"}
                      </Link>
                    </TableCell>
                    <TableCell>{formatLargeNumber(video.views)}</TableCell>
                    <TableCell>
                      {video.uploadDate ? formatDate(video.uploadDate) : "-"}
                    </TableCell>
                    <TableCell>
                      <PerformanceBadge score={video.performanceVsMedianHistorical} />
                      {video.isOutlier && (
                        <Badge variant="secondary" className="ml-2">
                          Outlier
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No videos found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {sorted.length} video(s) total
          {search && ` (filtered from ${data.length})`}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {page} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
