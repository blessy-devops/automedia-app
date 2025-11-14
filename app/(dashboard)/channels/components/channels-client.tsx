"use client"

import { useState, useMemo, useEffect } from "react"
import { type ViewMode } from "./channels-toolbar"
import { ChannelsTable, type Channel } from "./channels-table"
import { ChannelGalleryView } from "./channel-gallery-view"
import { ChannelsFiltersPopover, type FiltersState } from "./channels-filters-popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, ChevronDown, LayoutList, LayoutGrid } from "lucide-react"

interface ChannelsClientProps {
  channels: Channel[]
}

export function ChannelsClient({ channels }: ChannelsClientProps) {
  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [benchmarkDate, setBenchmarkDate] = useState("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [filters, setFilters] = useState<FiltersState>({
    subscriberRange: "all",
    minSubscribers: "",
    maxSubscribers: "",
    niches: [],
    categories: [],
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Extract unique niches and categories
  const availableNiches = useMemo(() => {
    const niches = new Set<string>()
    channels.forEach((channel) => {
      if (channel.categorization?.niche) {
        niches.add(channel.categorization.niche)
      }
    })
    return Array.from(niches).sort()
  }, [channels])

  const availableCategories = useMemo(() => {
    const categories = new Set<string>()
    channels.forEach((channel) => {
      if (channel.categorization?.category) {
        categories.add(channel.categorization.category)
      }
    })
    return Array.from(categories).sort()
  }, [channels])

  // Filter channels
  const filteredChannels = useMemo(() => {
    let filtered = [...channels]

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter((channel) => {
        const matchName = channel.channelName?.toLowerCase().includes(searchLower)
        const matchHandle = channel.handle?.toLowerCase().includes(searchLower)
        const matchNiche = channel.categorization?.niche?.toLowerCase().includes(searchLower)
        const matchSubniche = channel.categorization?.subniche?.toLowerCase().includes(searchLower)
        const matchCategory = channel.categorization?.category?.toLowerCase().includes(searchLower)
        return matchName || matchHandle || matchNiche || matchSubniche || matchCategory
      })
    }

    // Subscriber range filter
    if (filters.subscriberRange !== "all") {
      filtered = filtered.filter((channel) => {
        const subs = channel.subscriberCount || 0
        switch (filters.subscriberRange) {
          case "0-10k":
            return subs < 10000
          case "10k-100k":
            return subs >= 10000 && subs < 100000
          case "100k-1m":
            return subs >= 100000 && subs < 1000000
          case "1m+":
            return subs >= 1000000
          case "custom":
            const min = filters.minSubscribers ? parseInt(filters.minSubscribers) : 0
            const max = filters.maxSubscribers ? parseInt(filters.maxSubscribers) : Infinity
            return subs >= min && subs <= max
          default:
            return true
        }
      })
    }

    // Niche filter
    if (filters.niches.length > 0) {
      filtered = filtered.filter((channel) =>
        filters.niches.includes(channel.categorization?.niche || "")
      )
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((channel) =>
        filters.categories.includes(channel.categorization?.category || "")
      )
    }

    // Benchmark date filter
    if (benchmarkDate !== "all") {
      const now = new Date()
      filtered = filtered.filter((channel) => {
        if (!channel.createdAt) return true
        const channelDate = new Date(channel.createdAt)
        const daysDiff = Math.floor((now.getTime() - channelDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (benchmarkDate) {
          case "7days":
            return daysDiff <= 7
          case "30days":
            return daysDiff <= 30
          case "90days":
            return daysDiff <= 90
          default:
            return true
        }
      })
    }

    return filtered
  }, [channels, debouncedSearch, filters, benchmarkDate])

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-card border border-border rounded-lg px-6 py-3 flex items-center justify-between shadow-sm">
        {/* Left Side */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search channels by name or niche..."
              className="w-full bg-card border border-border rounded-md pl-10 pr-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters Popover */}
          <ChannelsFiltersPopover
            filters={filters}
            onFiltersChange={setFilters}
            availableNiches={availableNiches}
            availableCategories={availableCategories}
          />

          {/* Benchmark Date Select */}
          <Select value={benchmarkDate} onValueChange={setBenchmarkDate}>
            <SelectTrigger className="h-[42px] w-[160px] border-border bg-card shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm">Benchmark Date</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right Side - View Toggle */}
        <div className="flex border border-border rounded-md overflow-hidden shadow-sm">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-2.5 transition-colors ${
              viewMode === "table"
                ? "bg-muted text-foreground"
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
            aria-label="Table view"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("gallery")}
            className={`px-3 py-2.5 border-l border-border transition-colors ${
              viewMode === "gallery"
                ? "bg-muted text-foreground"
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
            aria-label="Gallery view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredChannels.length} of {channels.length} channels
        {debouncedSearch && ` matching "${debouncedSearch}"`}
      </div>

      {/* Table or Gallery View */}
      {viewMode === "table" ? (
        <ChannelsTable channels={filteredChannels} />
      ) : (
        <ChannelGalleryView channels={filteredChannels} />
      )}
    </div>
  )
}
