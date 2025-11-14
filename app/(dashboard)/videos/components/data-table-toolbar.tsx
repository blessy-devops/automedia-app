"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroupSimple, ToggleGroupItem } from "@/components/ui/toggle-group-simple"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  LayoutList,
  LayoutGrid,
  X,
  SlidersHorizontal,
} from "lucide-react"
import { useCallback } from "react"

export type ViewMode = "table" | "gallery"

interface DataTableToolbarProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}

/**
 * Data Table Toolbar Component
 *
 * Professional toolbar with clean design following shadcn/ui best practices:
 * - Unified horizontal layout
 * - Filters hidden in popover
 * - Consistent spacing and visual hierarchy
 */
export function DataTableToolbar({ view, onViewChange }: DataTableToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get current filter/sort values from URL
  const minViews = searchParams.get("minViews") || ""
  const minOutlierScore = searchParams.get("minOutlierScore") || ""
  const sortBy = searchParams.get("sortBy") || "upload_date"

  const updateSearchParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const clearFilters = useCallback(() => {
    router.push(pathname)
  }, [pathname, router])

  const hasActiveFilters = minViews || minOutlierScore || sortBy !== "upload_date"
  const filterCount = [minViews, minOutlierScore].filter(Boolean).length

  return (
    <div className="flex items-center justify-between space-x-2 py-4">
      {/* Left: Search (handled separately in data table component) */}
      <div className="flex flex-1 items-center space-x-2">
        <div className="text-sm text-muted-foreground">
          {/* Search is implemented in the parent data table component */}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center space-x-2">
        {/* Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {filterCount > 0 && (
                <Separator orientation="vertical" className="mx-2 h-4" />
              )}
              {filterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {filterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Refine your search with advanced filters
                </p>
              </div>

              <Separator />

              {/* Min Views Filter */}
              <div className="space-y-2">
                <Label htmlFor="min-views" className="text-sm font-medium">
                  Minimum Views
                </Label>
                <Input
                  id="min-views"
                  type="number"
                  placeholder="e.g., 10000"
                  value={minViews}
                  onChange={(e) => updateSearchParams("minViews", e.target.value)}
                  className="h-9"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Filter videos with at least this many views
                </p>
              </div>

              {/* Min Outlier Score Filter */}
              <div className="space-y-2">
                <Label htmlFor="min-outlier-score" className="text-sm font-medium">
                  Minimum Outlier Score
                </Label>
                <Input
                  id="min-outlier-score"
                  type="number"
                  placeholder="e.g., 5.0"
                  value={minOutlierScore}
                  onChange={(e) =>
                    updateSearchParams("minOutlierScore", e.target.value)
                  }
                  className="h-9"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Filter videos with performance score above this threshold
                </p>
              </div>

              {hasActiveFilters && (
                <>
                  <Separator />
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full justify-center"
                    size="sm"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6" />

        {/* Sort Select */}
        <Select
          value={sortBy}
          onValueChange={(value) => updateSearchParams("sortBy", value)}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upload_date">Upload Date</SelectItem>
            <SelectItem value="views">Views</SelectItem>
            <SelectItem value="outlier_score">Outlier Score</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

        {/* View Toggle */}
        <ToggleGroupSimple
          type="single"
          value={view}
          onValueChange={(value) => {
            if (value) onViewChange(value as ViewMode)
          }}
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <LayoutList className="h-4 w-4" />
            List
          </ToggleGroupItem>
          <ToggleGroupItem value="gallery" aria-label="Gallery view">
            <LayoutGrid className="h-4 w-4" />
            Grid
          </ToggleGroupItem>
        </ToggleGroupSimple>
      </div>
    </div>
  )
}
