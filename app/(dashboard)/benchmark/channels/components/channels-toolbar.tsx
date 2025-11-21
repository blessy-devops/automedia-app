"use client"

import { Search, SlidersHorizontal, ChevronDown, LayoutList, LayoutGrid } from "lucide-react"

export type ViewMode = "table" | "gallery"

interface ChannelsToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  benchmarkDate: string
  onBenchmarkDateChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onFiltersClick?: () => void
}

export function ChannelsToolbar({
  searchQuery,
  onSearchChange,
  benchmarkDate,
  onBenchmarkDateChange,
  viewMode,
  onViewModeChange,
  onFiltersClick,
}: ChannelsToolbarProps) {
  return (
    <div className="bg-card border border-border rounded-lg px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Left Side: Search + Filters + Benchmark Date */}
      <div className="flex items-center gap-2">
        {/* Search Input - 320px */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search channels by name or niche..."
            className="w-full bg-card border border-border rounded-md pl-10 pr-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters Button */}
        <button
          onClick={onFiltersClick}
          className="border border-border bg-card rounded-md px-3 py-2.5 text-sm flex items-center gap-2 shadow-sm hover:bg-accent transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>

        {/* Benchmark Date Dropdown */}
        <button
          onClick={() => {
            // TODO: Open benchmark date picker/dropdown
            console.log("Benchmark Date clicked")
          }}
          className="border border-border bg-card rounded-md px-3 py-2.5 text-sm flex items-center gap-2 shadow-sm hover:bg-accent transition-colors"
        >
          Benchmark Date
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Right Side: View Toggle */}
      <div className="flex border border-border rounded-md overflow-hidden shadow-sm">
        <button
          onClick={() => onViewModeChange("table")}
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
          onClick={() => onViewModeChange("gallery")}
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
  )
}
