"use client"

import { useMemo, useState, lazy, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatLargeNumber, formatDate } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { DataTableToolbar, ViewMode } from "./data-table-toolbar"
import { PerformanceBadge } from "./performance-badge"
import { AddToFolderButton } from "./add-to-folder-button"
import { RemoveFromFolderButton } from "./remove-from-folder-button"
import type { Video } from "./columns"

// Lazy load GalleryView - só carrega quando usuário trocar para gallery
const GalleryView = lazy(() => import("./gallery-view").then(mod => ({ default: mod.GalleryView })))

interface SimpleVideosTableProps {
  data: Video[]
  folders?: any[]
  currentFolderId?: number
}

type SortField = 'title' | 'views' | 'likes' | 'uploadDate' | 'performanceVsMedian14d' | 'performanceVsAvg14d'
type SortOrder = 'asc' | 'desc'

export function SimpleVideosTable({ data, folders = [], currentFolderId }: SimpleVideosTableProps) {
  const [view, setView] = useState<ViewMode>("table")
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("uploadDate")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return data
    const searchLower = search.toLowerCase()
    return data.filter(video =>
      video.title?.toLowerCase().includes(searchLower)
    )
  }, [data, search])

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

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginated.map(v => v.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const allSelected = paginated.length > 0 && selectedIds.size === paginated.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < paginated.length

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleBulkActionSuccess = () => {
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <DataTableToolbar view={view} onViewChange={setView} />

      {/* Selection toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-muted p-3 rounded-lg flex items-center justify-between border">
          <span className="text-sm font-medium">
            {selectedIds.size} vídeo{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <AddToFolderButton
              videoIds={Array.from(selectedIds)}
              folders={folders}
              onSuccess={handleBulkActionSuccess}
            />
            {currentFolderId && (
              <RemoveFromFolderButton
                videoIds={Array.from(selectedIds)}
                folderId={currentFolderId}
                onSuccess={handleBulkActionSuccess}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
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
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                    ref={(el) => {
                      if (el) (el as any).indeterminate = someSelected
                    }}
                  />
                </TableHead>
                <TableHead className="w-[60px]">Thumb</TableHead>
                <TableHead>
                  <SortButton field="title">Title</SortButton>
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortButton field="views">Views</SortButton>
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortButton field="likes">Likes</SortButton>
                </TableHead>
                <TableHead className="w-[150px]">
                  <SortButton field="uploadDate">Upload Date</SortButton>
                </TableHead>
                <TableHead className="w-[130px]">
                  <SortButton field="performanceVsMedian14d">Median (14d)</SortButton>
                </TableHead>
                <TableHead className="w-[130px]">
                  <SortButton field="performanceVsAvg14d">Average (14d)</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length > 0 ? (
                paginated.map((video) => (
                  <TableRow
                    key={video.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(video.id)}
                        onCheckedChange={(checked) => handleSelectOne(video.id, checked as boolean)}
                        aria-label={`Selecionar ${video.title}`}
                      />
                    </TableCell>
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
                        href={`/benchmark/videos/${video.id}`}
                        className="hover:underline line-clamp-2"
                      >
                        {video.title || "Untitled"}
                      </Link>
                    </TableCell>
                    <TableCell>{formatLargeNumber(video.views)}</TableCell>
                    <TableCell>{formatLargeNumber(video.likes)}</TableCell>
                    <TableCell>
                      {video.uploadDate ? formatDate(video.uploadDate) : "-"}
                    </TableCell>
                    <TableCell>
                      <PerformanceBadge
                        score={video.performanceVsMedian14d || video.performanceVsMedianHistorical}
                        isFallback={!video.performanceVsMedian14d}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
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
