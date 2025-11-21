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
import { LayoutList, LayoutGrid, X, SlidersHorizontal } from "lucide-react"
import { useCallback } from "react"

export type ViewMode = "table" | "gallery"

interface ChannelDataTableToolbarProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}

export function ChannelDataTableToolbar({ view, onViewChange }: ChannelDataTableToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const minSubscribers = searchParams.get("minSubscribers") || ""
  const minTotalViews = searchParams.get("minTotalViews") || ""
  const minVideos = searchParams.get("minVideos") || ""
  const minAvgViews = searchParams.get("minAvgViews") || ""
  const sortBy = searchParams.get("sortBy") || "subscribers"

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

  const hasActiveFilters = minSubscribers || minTotalViews || minVideos || minAvgViews || sortBy !== "subscribers"
  const filterCount = [minSubscribers, minTotalViews, minVideos, minAvgViews].filter(Boolean).length

  return (
    <div className="flex items-center justify-between space-x-2 py-4">
      <div className="flex flex-1 items-center space-x-2">
        <div className="text-sm text-muted-foreground" />
      </div>

      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {filterCount > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {filterCount}
                  </Badge>
                </>
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

              <div className="space-y-2">
                <Label htmlFor="min-subscribers" className="text-sm font-medium">
                  Minimum Subscribers
                </Label>
                <Input
                  id="min-subscribers"
                  type="number"
                  placeholder="e.g., 100000"
                  value={minSubscribers}
                  onChange={(e) => updateSearchParams("minSubscribers", e.target.value)}
                  className="h-9"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Filter channels with at least this many subscribers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-total-views" className="text-sm font-medium">
                  Minimum Total Views
                </Label>
                <Input
                  id="min-total-views"
                  type="number"
                  placeholder="e.g., 1000000"
                  value={minTotalViews}
                  onChange={(e) => updateSearchParams("minTotalViews", e.target.value)}
                  className="h-9"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-videos" className="text-sm font-medium">
                  Minimum Videos
                </Label>
                <Input
                  id="min-videos"
                  type="number"
                  placeholder="e.g., 50"
                  value={minVideos}
                  onChange={(e) => updateSearchParams("minVideos", e.target.value)}
                  className="h-9"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-avg-views" className="text-sm font-medium">
                  Minimum Avg Views
                </Label>
                <Input
                  id="min-avg-views"
                  type="number"
                  placeholder="e.g., 10000"
                  value={minAvgViews}
                  onChange={(e) => updateSearchParams("minAvgViews", e.target.value)}
                  className="h-9"
                  min="0"
                />
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

        <Select value={sortBy} onValueChange={(value) => updateSearchParams("sortBy", value)}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="subscribers">Subscribers</SelectItem>
            <SelectItem value="total_views">Total Views</SelectItem>
            <SelectItem value="avg_views">Avg Views/Video</SelectItem>
            <SelectItem value="median_views">Median Views/Video</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

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
