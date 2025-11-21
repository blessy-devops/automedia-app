"use client"

import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ToggleGroupSimple, ToggleGroupItem } from "@/components/ui/toggle-group-simple"
import { LayoutList, LayoutGrid, X, SlidersHorizontal } from "lucide-react"

export type ViewMode = "table" | "gallery"

interface EnhancedToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  minSubscribers?: string
  maxSubscribers?: string
  niche?: string
  subniche?: string
  onFilterChange: (key: string, value: string) => void
  benchmarkDate?: string
  onBenchmarkDateChange: (value: string) => void
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  availableNiches?: string[]
  availableSubniches?: string[]
}

export function EnhancedToolbar({
  search,
  onSearchChange,
  minSubscribers,
  maxSubscribers,
  niche,
  subniche,
  onFilterChange,
  benchmarkDate,
  onBenchmarkDateChange,
  view,
  onViewChange,
  availableNiches = [],
  availableSubniches = [],
}: EnhancedToolbarProps) {
  const activeFilterCount = [minSubscribers, maxSubscribers, niche, subniche].filter(Boolean).length

  const clearFilters = () => {
    onFilterChange('minSubscribers', '')
    onFilterChange('maxSubscribers', '')
    onFilterChange('niche', '')
    onFilterChange('subniche', '')
  }

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left side: Search */}
      <div className="flex-1">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search channels by name or niche..."
          className="w-80"
        />
      </div>

      {/* Right side: Filters, Benchmark Date, View Toggle */}
      <div className="flex items-center gap-2">
        {/* Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {activeFilterCount}
                  </Badge>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Advanced Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Refine your search with detailed filters
                </p>
              </div>

              <Separator />

              {/* Subscriber Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Subscriber Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minSubscribers || ''}
                      onChange={(e) => onFilterChange('minSubscribers', e.target.value)}
                      className="h-9"
                      min="0"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxSubscribers || ''}
                      onChange={(e) => onFilterChange('maxSubscribers', e.target.value)}
                      className="h-9"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Niche Filter */}
              {availableNiches.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Niche</Label>
                  <Select
                    value={niche || ''}
                    onValueChange={(value) => onFilterChange('niche', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select niche..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Niches</SelectItem>
                      {availableNiches.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subniche Filter */}
              {availableSubniches.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subniche</Label>
                  <Select
                    value={subniche || ''}
                    onValueChange={(value) => onFilterChange('subniche', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select subniche..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Subniches</SelectItem>
                      {availableSubniches.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeFilterCount > 0 && (
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

        {/* Benchmark Date Selector */}
        <Select value={benchmarkDate || 'all'} onValueChange={onBenchmarkDateChange}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Benchmark Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>

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
          </ToggleGroupItem>
          <ToggleGroupItem value="gallery" aria-label="Gallery view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroupSimple>
      </div>
    </div>
  )
}
