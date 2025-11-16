'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface ChannelCheckboxProps {
  channel: {
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
  isSelected: boolean
  onToggle: (channelId: string) => void
}

export function ChannelCheckbox({ channel, isSelected, onToggle }: ChannelCheckboxProps) {
  return (
    <div
      className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent cursor-pointer"
      onClick={() => onToggle(channel.unique_profile_id)}
    >
      <Checkbox
        id={channel.unique_profile_id}
        checked={isSelected}
        onCheckedChange={() => onToggle(channel.unique_profile_id)}
        className="mt-1"
        onClick={(e) => e.stopPropagation()} // Prevent double-toggle
      />

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <label
            htmlFor={channel.unique_profile_id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {channel.placeholder}
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            🎯 {channel.niche}
          </Badge>
          <Badge variant="outline" className="text-xs">
            📊 {channel.subniche}
          </Badge>
          {channel.language && (
            <Badge variant="secondary" className="text-xs">
              🌐 {channel.language.toUpperCase()}
            </Badge>
          )}
        </div>

        {channel.structure_brand_bible && channel.structure_brand_bible.length > 0 && (
          <div className="text-xs text-muted-foreground">
            ✓ Brand Bible configured
          </div>
        )}
      </div>
    </div>
  )
}
