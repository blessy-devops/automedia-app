"use client"

import { useState } from "react"
import { ChannelsToolbar, type ViewMode } from "./channels-toolbar"
import type { Channel } from "./channels-table"

interface ChannelsToolbarClientProps {
  channels: Channel[]
}

export function ChannelsToolbarClient({ channels }: ChannelsToolbarClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [benchmarkDate, setBenchmarkDate] = useState("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  const handleFiltersClick = () => {
    // TODO: Open filters modal/popover
    console.log("Filters clicked")
  }

  return (
    <ChannelsToolbar
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      benchmarkDate={benchmarkDate}
      onBenchmarkDateChange={setBenchmarkDate}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onFiltersClick={handleFiltersClick}
    />
  )
}
