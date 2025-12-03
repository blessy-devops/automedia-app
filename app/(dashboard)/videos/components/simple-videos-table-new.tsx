"use client"

import { useMemo, useState, lazy, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { formatLargeNumber, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  FolderOpen,
  Settings,
  List,
  Grid3x3,
  ArrowUpDown,
  Trash2,
  EyeOff,
  Eye,
  CheckCircle2
} from "lucide-react"
import { PerformanceBadge } from "./performance-badge"
import { AddToFolderButton } from "./add-to-folder-button"
import { RemoveFromFolderButton } from "./remove-from-folder-button"
import { SendToProductionButton } from "./send-to-production-button"
import { CopyTitlesButton } from "./copy-titles-button"
import { ManageFoldersModal } from "./manage-folders-modal"
import { VideoFiltersPopover } from "./video-filters-popover"
import { DeleteVideoDialog } from "./delete-video-dialog"
import { BulkDeleteVideosDialog } from "./bulk-delete-videos-dialog"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Video } from "./columns"

// Lazy load GalleryView
const GalleryView = lazy(() => import("./gallery-view").then(mod => ({ default: mod.GalleryView })))

interface SimpleVideosTableNewProps {
  data: Video[]
  folders?: any[]
  currentFolderId?: number
}

type SortField = 'title' | 'views' | 'likes' | 'uploadDate' | 'performanceVsMedian14d' | 'performanceVsAvg14d'
type SortOrder = 'asc' | 'desc'

export function SimpleVideosTableNew({ data, folders = [], currentFolderId }: SimpleVideosTableNewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("uploadDate")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [showManageFolders, setShowManageFolders] = useState(false)

  // View state (table or gallery)
  const [view, setView] = useState<"table" | "gallery">("table")

  // Produced videos filter: 'available' (default), 'all', or 'produced'
  type ProducedFilter = 'all' | 'available' | 'produced'
  const [producedFilter, setProducedFilter] = useState<ProducedFilter>('available')

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Delete dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    video: { id: number; title: string | null; youtubeVideoId: string } | null
  }>({ open: false, video: null })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)

  // Update URL params helper
  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Filter by search and produced status
  const filtered = useMemo(() => {
    let result = data

    // Filter by produced status
    if (producedFilter === 'available') {
      result = result.filter(video => !video.isProduced)
    } else if (producedFilter === 'produced') {
      result = result.filter(video => video.isProduced)
    }
    // 'all' shows everything

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(video =>
        video.title?.toLowerCase().includes(searchLower) ||
        video.channelName?.toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [data, search, producedFilter])

  // Count of produced videos (for display)
  const producedCount = useMemo(() => {
    return data.filter(video => video.isProduced).length
  }, [data])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      // Apply fallback for new 14d metrics (same as display logic)
      if (sortField === 'performanceVsMedian14d') {
        aVal = a.performanceVsMedian14d || a.performanceVsMedianHistorical
        bVal = b.performanceVsMedian14d || b.performanceVsMedianHistorical
      } else if (sortField === 'performanceVsAvg14d') {
        aVal = a.performanceVsAvg14d || a.performanceVsAvgHistorical
        bVal = b.performanceVsAvg14d || b.performanceVsAvgHistorical
      }

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

  // Selection handlers (only selectable videos - not produced)
  const selectableVideos = useMemo(() => {
    return sorted.filter(v => !v.isProduced)
  }, [sorted])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select non-produced videos
      setSelectedIds(new Set(selectableVideos.map(v => v.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    const video = sorted.find(v => v.id === id)
    // Don't allow selecting produced videos
    if (video?.isProduced) return

    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const allSelected = selectableVideos.length > 0 && selectedIds.size === selectableVideos.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < selectableVideos.length

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleBulkActionSuccess = () => {
    setSelectedIds(new Set())
  }

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)))
  }

  // Sort handler for table columns
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if clicking same field
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to desc
      setSortField(field)
      setSortOrder('desc')
    }
    setPage(1) // Reset to first page when sorting
  }

  // Get page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = page - 1; i <= page + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, sorted.length)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Folder Dropdown - Left side */}
          <Select
            value={currentFolderId?.toString() || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                router.push('/videos')
              } else {
                router.push(`/videos?folderId=${value}`)
              }
            }}
          >
            <SelectTrigger className="border border-border bg-card rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors shadow-sm w-[200px] h-auto">
              <FolderOpen className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select folder..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Videos ({data.length})
              </SelectItem>
              {folders.map((folder: any) => (
                <SelectItem key={folder.id} value={folder.id.toString()}>
                  {folder.name} ({folder.videoCount || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Manage Folders Button */}
          <button
            className="border border-border bg-card rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors shadow-sm"
            onClick={() => setShowManageFolders(!showManageFolders)}
          >
            <Settings className="w-4 h-4" />
            Manage Folders
          </button>

          {/* Produced Videos Filter */}
          <Select
            value={producedFilter}
            onValueChange={(value: 'all' | 'available' | 'produced') => {
              setProducedFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="border border-border bg-card rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors shadow-sm w-[180px] h-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4" />
                  <span>Available ({data.length - producedCount})</span>
                </div>
              </SelectItem>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>All Videos ({data.length})</span>
                </div>
              </SelectItem>
              <SelectItem value="produced">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-destructive" />
                  <span>Produced ({producedCount})</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Search - Right side */}
          <div className="relative" style={{ width: '320px' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search videos by title or channel..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full bg-card border border-border rounded-md pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Filters Popover - Reusable Component */}
          <VideoFiltersPopover />

          {/* Upload Date Select Dropdown */}
          <Select
            value={searchParams.get("sortBy") || "upload_date"}
            onValueChange={(value) => updateSearchParams("sortBy", value)}
          >
            <SelectTrigger className="border border-border bg-card rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors shadow-sm w-[160px] h-auto">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upload_date">Upload Date</SelectItem>
              <SelectItem value="views">Views</SelectItem>
              <SelectItem value="outlier_score">Outlier Score</SelectItem>
            </SelectContent>
          </Select>

          {/* List/Grid Toggle - ONLY ICONS */}
          <div className="flex border border-border rounded-md overflow-hidden shadow-sm">
            <button
              onClick={() => setView("table")}
              className={`px-3 py-2.5 transition-colors ${
                view === "table"
                  ? "bg-muted text-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("gallery")}
              className={`px-3 py-2.5 border-l border-border transition-colors ${
                view === "gallery"
                  ? "bg-muted text-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-900 dark:text-blue-100">
              {selectedIds.size} video{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SendToProductionButton
              videoIds={Array.from(selectedIds)}
              onSuccess={handleBulkActionSuccess}
            />
            <AddToFolderButton
              videoIds={Array.from(selectedIds)}
              folders={folders}
              onSuccess={handleBulkActionSuccess}
            />
            <CopyTitlesButton
              videoIds={Array.from(selectedIds)}
              videos={sorted}
            />
            {currentFolderId && (
              <RemoveFromFolderButton
                videoIds={Array.from(selectedIds)}
                folderId={currentFolderId}
                onSuccess={handleBulkActionSuccess}
              />
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialog(true)}
              className="h-8"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete Selected
            </Button>
            <button
              onClick={handleClearSelection}
              className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 px-3 py-1.5 text-sm transition-colors"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Conditional rendering: Table or Gallery */}
      {view === "gallery" ? (
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Loading gallery...</div>}>
          <GalleryView videos={paginated} />
        </Suspense>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wide">
                  Thumb
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Title
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'title' ? 'opacity-100' : 'opacity-40'}`} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wide">
                  Channel
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('views')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                  >
                    Views
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'views' ? 'opacity-100' : 'opacity-40'}`} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('uploadDate')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Upload Date
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'uploadDate' ? 'opacity-100' : 'opacity-40'}`} />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('performanceVsMedian14d')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                  >
                    Median (14d)
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'performanceVsMedian14d' ? 'opacity-100' : 'opacity-40'}`} />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('performanceVsAvg14d')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                  >
                    Average (14d)
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'performanceVsAvg14d' ? 'opacity-100' : 'opacity-40'}`} />
                  </button>
                </th>
                <th className="px-4 py-3 text-center text-xs text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((video, index) => (
                  <tr
                    key={video.id}
                    className={`border-b border-border transition-colors cursor-pointer ${
                      video.isProduced
                        ? 'bg-destructive/5 hover:bg-destructive/10 opacity-60'
                        : index % 2 === 0
                          ? 'hover:bg-accent'
                          : 'bg-muted/30 hover:bg-accent'
                    }`}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {video.isProduced ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-4 h-4 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-destructive" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>Already used in production</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(video.id)}
                          onChange={(e) => handleSelectOne(video.id, e.target.checked)}
                          className="w-4 h-4 rounded border-border"
                        />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative">
                        {video.thumbnailUrl && (
                          <Image
                            src={video.thumbnailUrl}
                            alt=""
                            width={80}
                            height={45}
                            className={`w-20 h-11 object-cover rounded ${video.isProduced ? 'grayscale' : ''}`}
                          />
                        )}
                        {video.isProduced && (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 text-[10px] px-1 py-0">
                            Used
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground max-w-xl">
                      <Link
                        href={`/benchmark/videos/${video.id}`}
                        className={`hover:underline line-clamp-2 ${video.isProduced ? 'text-muted-foreground' : ''}`}
                      >
                        {video.title || "Untitled"}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {video.channelDbId ? (
                        <Link
                          href={`/benchmark/channels/${video.channelDbId}`}
                          className="text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          @{video.channelName || "-"}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">@{video.channelName || "-"}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground text-right">
                      {formatLargeNumber(video.views)}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {video.uploadDate ? formatDate(video.uploadDate) : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground text-right">
                      <PerformanceBadge
                        score={video.performanceVsMedian14d || video.performanceVsMedianHistorical}
                        isFallback={!video.performanceVsMedian14d}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground text-right">
                      <div className="flex flex-col gap-1.5 items-end">
                        <PerformanceBadge
                          score={video.performanceVsAvg14d || video.performanceVsAvgHistorical}
                          isFallback={!video.performanceVsAvg14d}
                        />
                        {video.isOutlier && (
                          <Badge variant="secondary" className="text-xs">
                            Outlier
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              video: {
                                id: video.id,
                                title: video.title,
                                youtubeVideoId: video.youtubeVideoId,
                              },
                            })
                          }
                          className="text-destructive hover:text-destructive/80 transition-colors p-1"
                          title="Delete video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="h-24 text-center text-muted-foreground">
                    No videos found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-border px-6 py-5 flex items-center justify-between bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {endIndex} of {sorted.length} videos
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>|</span>
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="border border-border bg-card rounded px-2 py-1 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="border border-border rounded-md px-4 py-2.5 text-sm text-foreground hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 bg-card"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum, index) => (
                typeof pageNum === 'number' ? (
                  <button
                    key={index}
                    onClick={() => goToPage(pageNum)}
                    className={`min-w-[2.5rem] px-3 py-2.5 text-sm rounded-md transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-card border border-border bg-card'
                    }`}
                  >
                    {pageNum}
                  </button>
                ) : (
                  <span key={index} className="px-2 text-muted-foreground">
                    {pageNum}
                  </span>
                )
              ))}
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="border border-border rounded-md px-4 py-2.5 text-sm text-foreground hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 bg-card"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Manage Folders Modal */}
      {showManageFolders && (
        <ManageFoldersModal
          folders={folders}
          onClose={() => setShowManageFolders(false)}
        />
      )}

      {/* Delete Dialogs */}
      <DeleteVideoDialog
        video={deleteDialog.video}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, video: null })}
        onSuccess={() => {
          window.location.reload()
        }}
      />

      <BulkDeleteVideosDialog
        videoIds={Array.from(selectedIds)}
        open={bulkDeleteDialog}
        onOpenChange={setBulkDeleteDialog}
        onSuccess={() => {
          setSelectedIds(new Set())
          window.location.reload()
        }}
      />
    </div>
  )
}
