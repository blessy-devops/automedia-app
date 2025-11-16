'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChannelCheckbox } from './ChannelCheckbox'

interface Channel {
  unique_profile_id: string
  placeholder: string
  niche: string
  subniche: string
  language?: string
  structure_brand_bible?: Array<{
    brand_identity?: Record<string, any>
    production_workflow_id?: string
  }>
}

interface ChannelSelectionListProps {
  channels: Channel[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function ChannelSelectionList({
  channels,
  selectedIds,
  onSelectionChange,
}: ChannelSelectionListProps) {
  const handleToggle = (channelId: string) => {
    const newSelection = selectedIds.includes(channelId)
      ? selectedIds.filter((id) => id !== channelId)
      : [...selectedIds, channelId]

    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    onSelectionChange(channels.map((c) => c.unique_profile_id))
  }

  const handleSelectNone = () => {
    onSelectionChange([])
  }

  if (channels.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No eligible channels found for this video&apos;s niche/subniche.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          📺 <span className="font-medium">{channels.length}</span> eligible channel
          {channels.length !== 1 ? 's' : ''} •{' '}
          <span className="font-medium text-foreground">{selectedIds.length}</span> selected
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectNone}
            disabled={selectedIds.length === 0}
          >
            Select None
          </Button>
        </div>
      </div>

      {/* Channel list */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {channels.map((channel) => (
            <ChannelCheckbox
              key={channel.unique_profile_id}
              channel={channel}
              isSelected={selectedIds.includes(channel.unique_profile_id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
