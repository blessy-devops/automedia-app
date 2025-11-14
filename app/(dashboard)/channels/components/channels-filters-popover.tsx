"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SlidersHorizontal, X } from "lucide-react"

export interface FiltersState {
  subscriberRange: string
  minSubscribers?: string
  maxSubscribers?: string
  niches: string[]
  categories: string[]
}

interface ChannelsFiltersPopoverProps {
  filters: FiltersState
  onFiltersChange: (filters: FiltersState) => void
  availableNiches: string[]
  availableCategories: string[]
}

export function ChannelsFiltersPopover({
  filters,
  onFiltersChange,
  availableNiches,
  availableCategories,
}: ChannelsFiltersPopoverProps) {
  const activeFilterCount = [
    filters.subscriberRange !== "all",
    filters.minSubscribers,
    filters.maxSubscribers,
    filters.niches.length > 0,
    filters.categories.length > 0,
  ].filter(Boolean).length

  const clearFilters = () => {
    onFiltersChange({
      subscriberRange: "all",
      minSubscribers: "",
      maxSubscribers: "",
      niches: [],
      categories: [],
    })
  }

  const handleNicheToggle = (niche: string) => {
    const newNiches = filters.niches.includes(niche)
      ? filters.niches.filter((n) => n !== niche)
      : [...filters.niches, niche]
    onFiltersChange({ ...filters, niches: newNiches })
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    onFiltersChange({ ...filters, categories: newCategories })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-[42px] border-border bg-card rounded-md px-3 shadow-sm"
        >
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
      <PopoverContent align="start" className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Advanced Filters</h4>
            <p className="text-sm text-muted-foreground">
              Refine your search with detailed filters
            </p>
          </div>

          <Separator />

          {/* Subscriber Range Preset */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Subscriber Range</Label>
            <Select
              value={filters.subscriberRange}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, subscriberRange: value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select range..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="0-10k">0 - 10K</SelectItem>
                <SelectItem value="10k-100k">10K - 100K</SelectItem>
                <SelectItem value="100k-1m">100K - 1M</SelectItem>
                <SelectItem value="1m+">1M+</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Subscriber Range */}
          {filters.subscriberRange === "custom" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Custom Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minSubscribers || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      minSubscribers: e.target.value,
                    })
                  }
                  className="h-9"
                  min="0"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxSubscribers || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      maxSubscribers: e.target.value,
                    })
                  }
                  className="h-9"
                  min="0"
                />
              </div>
            </div>
          )}

          {/* Niche Filter */}
          {availableNiches.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Niche</Label>
              <div className="flex flex-wrap gap-2">
                {availableNiches.slice(0, 8).map((niche) => (
                  <Badge
                    key={niche}
                    variant={filters.niches.includes(niche) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleNicheToggle(niche)}
                  >
                    {niche}
                  </Badge>
                ))}
              </div>
              {filters.niches.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {filters.niches.length} selected
                </p>
              )}
            </div>
          )}

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.slice(0, 8).map((category) => (
                  <Badge
                    key={category}
                    variant={
                      filters.categories.includes(category) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
              {filters.categories.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {filters.categories.length} selected
                </p>
              )}
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
  )
}
