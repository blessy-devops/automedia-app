"use client"

import { useMemo, useState, lazy, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatLargeNumber } from "@/lib/utils"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SortableTableHeader } from "@/components/ui/sortable-table-header"
import { PaginationNumbered } from "@/components/ui/pagination-numbered"
import { EmptyState } from "@/components/empty-state"
import { EnhancedToolbar, ViewMode } from "./enhanced-toolbar"
import { MoreVertical, TrendingUp, Pencil, Trash2, FolderSearch } from "lucide-react"

// Lazy load ChannelGalleryView
const ChannelGalleryView = lazy(() =>
  import("./channel-gallery-view").then((mod) => ({ default: mod.ChannelGalleryView }))
)

/**
 * Channel Type for the DataTable
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
  createdAt: Date | null
  avgViewsPerVideoHistorical: number | null
  medianViewsPerVideoHistorical: number | null
}

interface EnhancedChannelsTableProps {
  data: Channel[]
}

type SortField =
  | "channelName"
  | "subscriberCount"
  | "totalViews"
  | "videoUploadCount"
  | "avgViewsPerVideoHistorical"
type SortOrder = "asc" | "desc"

export function EnhancedChannelsTable({ data }: EnhancedChannelsTableProps) {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>("table")
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("subscriberCount")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)
  const [minSubscribers, setMinSubscribers] = useState("")
  const [maxSubscribers, setMaxSubscribers] = useState("")
  const [nicheFilter, setNicheFilter] = useState("")
  const [subnicheFilter, setSubnicheFilter] = useState("")
  const [benchmarkDate, setBenchmarkDate] = useState("all")

  const pageSize = 10

  // Extract unique niches and subniches
  const { availableNiches, availableSubniches } = useMemo(() => {
    const niches = new Set<string>()
    const subniches = new Set<string>()

    data.forEach((channel) => {
      if (channel.categorization?.niche) {
        niches.add(channel.categorization.niche)
      }
      if (channel.categorization?.subniche) {
        subniches.add(channel.categorization.subniche)
      }
    })

    return {
      availableNiches: Array.from(niches).sort(),
      availableSubniches: Array.from(subniches).sort(),
    }
  }, [data])

  // Filter by search
  const filtered = useMemo(() => {
    let result = data

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (channel) =>
          channel.channelName?.toLowerCase().includes(searchLower) ||
          channel.categorization?.niche?.toLowerCase().includes(searchLower) ||
          channel.categorization?.subniche?.toLowerCase().includes(searchLower) ||
          channel.categorization?.category?.toLowerCase().includes(searchLower)
      )
    }

    // Subscriber range filter
    if (minSubscribers) {
      const min = Number(minSubscribers)
      result = result.filter(
        (channel) => channel.subscriberCount !== null && channel.subscriberCount >= min
      )
    }
    if (maxSubscribers) {
      const max = Number(maxSubscribers)
      result = result.filter(
        (channel) => channel.subscriberCount !== null && channel.subscriberCount <= max
      )
    }

    // Niche filter
    if (nicheFilter) {
      result = result.filter((channel) => channel.categorization?.niche === nicheFilter)
    }

    // Subniche filter
    if (subnicheFilter) {
      result = result.filter((channel) => channel.categorization?.subniche === subnicheFilter)
    }

    // Benchmark date filter (simplified for now)
    if (benchmarkDate !== "all" && benchmarkDate !== "latest") {
      const now = new Date()
      const days = benchmarkDate === "30days" ? 30 : 90

      result = result.filter((channel) => {
        if (!channel.createdAt) return false
        const channelDate = new Date(channel.createdAt)
        const diffTime = Math.abs(now.getTime() - channelDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= days
      })
    }

    return result
  }, [data, search, minSubscribers, maxSubscribers, nicheFilter, subnicheFilter, benchmarkDate])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      let comparison = 0
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal)
      } else {
        comparison = (aVal as number) - (bVal as number)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })
  }, [filtered, sortField, sortOrder])

  // Paginate
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  const totalPages = Math.ceil(sorted.length / pageSize)

  const handleSort = (field: string) => {
    const typedField = field as SortField
    if (sortField === typedField) {
      setSortOrder((order) => (order === "asc" ? "desc" : "asc"))
    } else {
      setSortField(typedField)
      setSortOrder("desc")
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setPage(1) // Reset to first page
    switch (key) {
      case "minSubscribers":
        setMinSubscribers(value)
        break
      case "maxSubscribers":
        setMaxSubscribers(value)
        break
      case "niche":
        setNicheFilter(value)
        break
      case "subniche":
        setSubnicheFilter(value)
        break
    }
  }

  const handleRowClick = (channelId: number) => {
    router.push(`/channels/${channelId}`)
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Toolbar */}
      <EnhancedToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        minSubscribers={minSubscribers}
        maxSubscribers={maxSubscribers}
        niche={nicheFilter}
        subniche={subnicheFilter}
        onFilterChange={handleFilterChange}
        benchmarkDate={benchmarkDate}
        onBenchmarkDateChange={setBenchmarkDate}
        view={view}
        onViewChange={setView}
        availableNiches={availableNiches}
        availableSubniches={availableSubniches}
      />

      {/* Conditional rendering: Table or Gallery */}
      {view === "gallery" ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">Loading gallery...</div>
          }
        >
          <ChannelGalleryView channels={paginated} />
        </Suspense>
      ) : (
        <>
          {paginated.length > 0 ? (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[300px]">
                        <SortableTableHeader
                          label="Channel"
                          sortKey="channelName"
                          currentSortKey={sortField}
                          sortDirection={sortOrder}
                          onSort={handleSort}
                          align="left"
                        />
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <SortableTableHeader
                          label="Subscribers"
                          sortKey="subscriberCount"
                          currentSortKey={sortField}
                          sortDirection={sortOrder}
                          onSort={handleSort}
                          align="right"
                        />
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <SortableTableHeader
                          label="Total Views"
                          sortKey="totalViews"
                          currentSortKey={sortField}
                          sortDirection={sortOrder}
                          onSort={handleSort}
                          align="right"
                        />
                      </TableHead>
                      <TableHead className="w-[100px]">
                        <SortableTableHeader
                          label="Videos"
                          sortKey="videoUploadCount"
                          currentSortKey={sortField}
                          sortDirection={sortOrder}
                          onSort={handleSort}
                          align="right"
                        />
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <SortableTableHeader
                          label="Avg Views"
                          sortKey="avgViewsPerVideoHistorical"
                          currentSortKey={sortField}
                          sortDirection={sortOrder}
                          onSort={handleSort}
                          align="right"
                        />
                      </TableHead>
                      <TableHead className="w-[140px]">Benchmark Date</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((channel, index) => (
                      <TableRow
                        key={channel.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/70 ${
                          index % 2 === 0 ? "bg-background" : "bg-muted/50"
                        }`}
                        onClick={() => handleRowClick(channel.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {channel.thumbnailUrl && (
                              <Image
                                src={channel.thumbnailUrl}
                                alt={channel.channelName || "Channel thumbnail"}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                              />
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {channel.channelName || "Unnamed Channel"}
                              </span>
                              <div className="flex gap-1 mt-1">
                                {channel.categorization?.niche && (
                                  <Badge variant="secondary" className="text-xs">
                                    {channel.categorization.niche}
                                  </Badge>
                                )}
                                {channel.categorization?.subniche && (
                                  <Badge variant="outline" className="text-xs">
                                    {channel.categorization.subniche}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatLargeNumber(channel.subscriberCount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatLargeNumber(channel.totalViews)}
                        </TableCell>
                        <TableCell className="text-right">
                          {channel.videoUploadCount?.toLocaleString() || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatLargeNumber(channel.avgViewsPerVideoHistorical)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {channel.createdAt
                            ? format(new Date(channel.createdAt), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => router.push(`/channels/${channel.id}`)}
                            >
                              <FolderSearch className="h-3.5 w-3.5 mr-1" />
                              Analyze
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/channels/${channel.id}`)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <PaginationNumbered
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={sorted.length}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState
              icon={FolderSearch}
              title="No channels found"
              description="Try adjusting your search or filter criteria"
              action={{
                label: "Clear Filters",
                onClick: () => {
                  setSearch("")
                  setMinSubscribers("")
                  setMaxSubscribers("")
                  setNicheFilter("")
                  setSubnicheFilter("")
                  setBenchmarkDate("all")
                  setPage(1)
                },
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
