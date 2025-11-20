'use client'

import { Badge } from '@/components/ui/badge'
import { Flame } from 'lucide-react'

interface Outlier10xBadgeProps {
  has10xOutlier: boolean
}

export function Outlier10xBadge({ has10xOutlier }: Outlier10xBadgeProps) {
  if (!has10xOutlier) {
    return null
  }

  return (
    <Badge variant="destructive" className="gap-1 text-xs">
      <Flame className="h-3 w-3" />
      10x Outlier
    </Badge>
  )
}
