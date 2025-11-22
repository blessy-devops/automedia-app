"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { SlidersHorizontal, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { countActiveFilters } from "@/lib/video-filters"

/**
 * Video Filters Popover Component (Enhanced)
 *
 * Reusable filter component for video tables with advanced range-based filters.
 * Supports:
 * - Views range (min/max)
 * - Outlier score range (min/max)
 * - Video age range (min/max days)
 * - Custom date range (from/to)
 * - Legacy preset date range (for backward compatibility)
 *
 * Uses URL parameters for state management.
 */
export function VideoFiltersPopover() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filtersOpen, setFiltersOpen] = useState(false)

  // Views range
  const [minViews, setMinViews] = useState(searchParams.get("minViews") || "")
  const [maxViews, setMaxViews] = useState(searchParams.get("maxViews") || "")

  // Outlier score range
  const [minOutlierScore, setMinOutlierScore] = useState(searchParams.get("minOutlierScore") || "")
  const [maxOutlierScore, setMaxOutlierScore] = useState(searchParams.get("maxOutlierScore") || "")

  // Performance score range (14d from SocialBlade)
  const [minPerformanceVsMedian14d, setMinPerformanceVsMedian14d] = useState(searchParams.get("minPerformanceVsMedian14d") || "")
  const [minPerformanceVsAvg14d, setMinPerformanceVsAvg14d] = useState(searchParams.get("minPerformanceVsAvg14d") || "")

  // Video age range
  const [minVideoAgeDays, setMinVideoAgeDays] = useState(searchParams.get("minVideoAgeDays") || "")
  const [maxVideoAgeDays, setMaxVideoAgeDays] = useState(searchParams.get("maxVideoAgeDays") || "")

  // Custom date range
  const [uploadDateFrom, setUploadDateFrom] = useState(searchParams.get("uploadDateFrom") || "")
  const [uploadDateTo, setUploadDateTo] = useState(searchParams.get("uploadDateTo") || "")

  // Legacy preset date range
  const [dateRange, setDateRange] = useState(searchParams.get("dateRange") || "all")

  // Sync local state with URL params when they change
  useEffect(() => {
    setMinViews(searchParams.get("minViews") || "")
    setMaxViews(searchParams.get("maxViews") || "")
    setMinOutlierScore(searchParams.get("minOutlierScore") || "")
    setMaxOutlierScore(searchParams.get("maxOutlierScore") || "")
    setMinPerformanceVsMedian14d(searchParams.get("minPerformanceVsMedian14d") || "")
    setMinPerformanceVsAvg14d(searchParams.get("minPerformanceVsAvg14d") || "")
    setMinVideoAgeDays(searchParams.get("minVideoAgeDays") || "")
    setMaxVideoAgeDays(searchParams.get("maxVideoAgeDays") || "")
    setUploadDateFrom(searchParams.get("uploadDateFrom") || "")
    setUploadDateTo(searchParams.get("uploadDateTo") || "")
    setDateRange(searchParams.get("dateRange") || "all")
  }, [searchParams])

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

  // Apply all filters at once
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Views range
    if (minViews) params.set("minViews", minViews)
    else params.delete("minViews")
    if (maxViews) params.set("maxViews", maxViews)
    else params.delete("maxViews")

    // Outlier score range
    if (minOutlierScore) params.set("minOutlierScore", minOutlierScore)
    else params.delete("minOutlierScore")
    if (maxOutlierScore) params.set("maxOutlierScore", maxOutlierScore)
    else params.delete("maxOutlierScore")

    // Performance score range (14d from SocialBlade)
    if (minPerformanceVsMedian14d) params.set("minPerformanceVsMedian14d", minPerformanceVsMedian14d)
    else params.delete("minPerformanceVsMedian14d")
    if (minPerformanceVsAvg14d) params.set("minPerformanceVsAvg14d", minPerformanceVsAvg14d)
    else params.delete("minPerformanceVsAvg14d")

    // Video age range
    if (minVideoAgeDays) params.set("minVideoAgeDays", minVideoAgeDays)
    else params.delete("minVideoAgeDays")
    if (maxVideoAgeDays) params.set("maxVideoAgeDays", maxVideoAgeDays)
    else params.delete("maxVideoAgeDays")

    // Custom date range
    if (uploadDateFrom) params.set("uploadDateFrom", uploadDateFrom)
    else params.delete("uploadDateFrom")
    if (uploadDateTo) params.set("uploadDateTo", uploadDateTo)
    else params.delete("uploadDateTo")

    // Legacy preset date range
    if (dateRange && dateRange !== "all") params.set("dateRange", dateRange)
    else params.delete("dateRange")

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    setFiltersOpen(false)
  }

  // Clear all filters
  const clearFilters = () => {
    setMinViews("")
    setMaxViews("")
    setMinOutlierScore("")
    setMaxOutlierScore("")
    setMinPerformanceVsMedian14d("")
    setMinPerformanceVsAvg14d("")
    setMinVideoAgeDays("")
    setMaxVideoAgeDays("")
    setUploadDateFrom("")
    setUploadDateTo("")
    setDateRange("all")

    const params = new URLSearchParams(searchParams.toString())
    params.delete("minViews")
    params.delete("maxViews")
    params.delete("minOutlierScore")
    params.delete("maxOutlierScore")
    params.delete("minPerformanceVsMedian14d")
    params.delete("minPerformanceVsAvg14d")
    params.delete("minVideoAgeDays")
    params.delete("maxVideoAgeDays")
    params.delete("uploadDateFrom")
    params.delete("uploadDateTo")
    params.delete("dateRange")

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Count active filters using helper function
  const activeFiltersCount = countActiveFilters({
    minViews: minViews ? Number(minViews) : undefined,
    maxViews: maxViews ? Number(maxViews) : undefined,
    minOutlierScore: minOutlierScore ? Number(minOutlierScore) : undefined,
    maxOutlierScore: maxOutlierScore ? Number(maxOutlierScore) : undefined,
    minPerformanceVsMedian14d: minPerformanceVsMedian14d ? Number(minPerformanceVsMedian14d) : undefined,
    minPerformanceVsAvg14d: minPerformanceVsAvg14d ? Number(minPerformanceVsAvg14d) : undefined,
    minVideoAgeDays: minVideoAgeDays ? Number(minVideoAgeDays) : undefined,
    maxVideoAgeDays: maxVideoAgeDays ? Number(maxVideoAgeDays) : undefined,
    uploadDateFrom: uploadDateFrom || undefined,
    uploadDateTo: uploadDateTo || undefined,
    dateRange: dateRange as '7d' | '30d' | '90d' | 'all' | undefined,
  })

  return (
    <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
      <PopoverTrigger asChild>
        <button className="border border-border bg-card rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors shadow-sm">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="secondary" className="rounded-sm px-1.5 py-0.5 text-xs font-normal">
                {activeFiltersCount}
              </Badge>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Advanced Filters</h4>
            <p className="text-sm text-muted-foreground">
              Filter videos by date ranges, views, age, and performance
            </p>
          </div>
          <Separator />

          {/* Views Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Views Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="min-views" className="text-xs text-muted-foreground">Minimum</Label>
                <Input
                  id="min-views"
                  type="number"
                  placeholder="e.g., 10000"
                  value={minViews}
                  onChange={(e) => setMinViews(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-views" className="text-xs text-muted-foreground">Maximum</Label>
                <Input
                  id="max-views"
                  type="number"
                  placeholder="e.g., 1000000"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Outlier Score Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Outlier Score Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="min-outlier" className="text-xs text-muted-foreground">Minimum</Label>
                <Input
                  id="min-outlier"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5.0"
                  value={minOutlierScore}
                  onChange={(e) => setMinOutlierScore(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-outlier" className="text-xs text-muted-foreground">Maximum</Label>
                <Input
                  id="max-outlier"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 20.0"
                  value={maxOutlierScore}
                  onChange={(e) => setMaxOutlierScore(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Performance Score Range (14d from SocialBlade) */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Performance Score (14d)</Label>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="min-median-14d" className="text-xs text-muted-foreground">Min Median Score</Label>
                <Input
                  id="min-median-14d"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5.0"
                  value={minPerformanceVsMedian14d}
                  onChange={(e) => setMinPerformanceVsMedian14d(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min-avg-14d" className="text-xs text-muted-foreground">Min Average Score</Label>
                <Input
                  id="min-avg-14d"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 4.0"
                  value={minPerformanceVsAvg14d}
                  onChange={(e) => setMinPerformanceVsAvg14d(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on recent 14-day SocialBlade data
            </p>
          </div>

          <Separator />

          {/* Video Age Range (in days) */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Video Age (days)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="min-age" className="text-xs text-muted-foreground">Minimum</Label>
                <Input
                  id="min-age"
                  type="number"
                  placeholder="e.g., 15"
                  value={minVideoAgeDays}
                  onChange={(e) => setMinVideoAgeDays(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-age" className="text-xs text-muted-foreground">Maximum</Label>
                <Input
                  id="max-age"
                  type="number"
                  placeholder="e.g., 90"
                  value={maxVideoAgeDays}
                  onChange={(e) => setMaxVideoAgeDays(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Custom Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Upload Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="date-from" className="text-xs text-muted-foreground">From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={uploadDateFrom}
                  onChange={(e) => setUploadDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date-to" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={uploadDateTo}
                  onChange={(e) => setUploadDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Legacy Preset Date Range */}
          <div className="space-y-2">
            <Label htmlFor="date-range" className="text-sm font-medium">Quick Date Filter</Label>
            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value)}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Custom date range takes precedence over quick filter
            </p>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm hover:bg-primary/90 transition-colors"
            >
              Apply Filters
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="border border-border bg-card rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
