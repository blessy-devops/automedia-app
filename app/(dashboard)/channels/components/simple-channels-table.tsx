"use client"

import { useMemo, useState, lazy, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatLargeNumber } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { ChannelDataTableToolbar, ViewMode } from "./channel-data-table-toolbar"

// Lazy load ChannelGalleryView
const ChannelGalleryView = lazy(() => import("./channel-gallery-view").then(mod => ({ default: mod.ChannelGalleryView })))

/**
 * Channel Type for the DataTable
 * Based on the BenchmarkChannel Drizzle schema + Baseline Stats
 */
export type Channel = {
  id: number
  channelId: string
  channelName: string | null
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
  isVerified: boolean | null
  country: string | null
  // Baseline stats from LEFT JOIN
  avgViewsPerVideoHistorical: number | null
  medianViewsPerVideoHistorical: number | null
}

interface SimpleChannelsTableProps {
  data: Channel[]
}

type SortField = 'channelName' | 'subscriberCount' | 'totalViews' | 'videoUploadCount' | 'avgViewsPerVideoHistorical' | 'medianViewsPerVideoHistorical'
type SortOrder = 'asc' | 'desc'

export function SimpleChannelsTable({ data }: SimpleChannelsTableProps) {
  const [view, setView] = useState<ViewMode>("table")
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("subscriberCount")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return data
    const searchLower = search.toLowerCase()
    return data.filter(channel =>
      channel.channelName?.toLowerCase().includes(searchLower) ||
      channel.categorization?.niche?.toLowerCase().includes(searchLower) ||
      channel.categorization?.category?.toLowerCase().includes(searchLower)
    )
  }, [data, search])

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
      <ChannelDataTableToolbar view={view} onViewChange={setView} />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search channels by name or niche..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1) // Reset to first page on search
          }}
          className="h-9 pl-8"
        />
      </div>

      {/* Conditional rendering: Table or Gallery */}
      {view === "gallery" ? (
        <Suspense fallback={<div className="flex items-center justify-center h-64">Loading gallery...</div>}>
          <ChannelGalleryView channels={paginated} />
        </Suspense>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Thumb</TableHead>
                <TableHead>
                  <SortButton field="channelName">Channel</SortButton>
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortButton field="subscriberCount">Subscribers</SortButton>
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortButton field="totalViews">Total Views</SortButton>
                </TableHead>
                <TableHead className="w-[100px]">
                  <SortButton field="videoUploadCount">Videos</SortButton>
                </TableHead>
                <TableHead className="w-[140px]">
                  <SortButton field="avgViewsPerVideoHistorical">Avg Views</SortButton>
                </TableHead>
                <TableHead className="w-[200px]">Niche</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length > 0 ? (
                paginated.map((channel) => (
                  <TableRow
                    key={channel.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      {channel.thumbnailUrl && (
                        <Image
                          src={channel.thumbnailUrl}
                          alt={channel.channelName || "Channel thumbnail"}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/channels/${channel.channelId}`}
                        className="hover:underline flex items-center gap-2"
                      >
                        {channel.channelName || "Unnamed Channel"}
                        {channel.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>{formatLargeNumber(channel.subscriberCount)}</TableCell>
                    <TableCell>{formatLargeNumber(channel.totalViews)}</TableCell>
                    <TableCell>{formatLargeNumber(channel.videoUploadCount)}</TableCell>
                    <TableCell>{formatLargeNumber(channel.avgViewsPerVideoHistorical)}</TableCell>
                    <TableCell>
                      {channel.categorization?.niche && (
                        <Badge variant="outline">
                          {channel.categorization.niche}
                        </Badge>
                      )}
                      {channel.categorization?.category && (
                        <Badge variant="secondary" className="ml-1">
                          {channel.categorization.category}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No channels found.
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
          {sorted.length} channel(s) total
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
