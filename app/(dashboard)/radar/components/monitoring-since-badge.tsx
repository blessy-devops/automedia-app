'use client'

import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow, format } from 'date-fns'

interface MonitoringSinceBadgeProps {
  addedAt: string
  variant?: 'default' | 'secondary' | 'outline'
}

export function MonitoringSinceBadge({ addedAt, variant = 'outline' }: MonitoringSinceBadgeProps) {
  const addedDate = new Date(addedAt)
  const daysMonitoring = Math.floor(
    (Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Badge variant={variant} className="text-xs">
      {daysMonitoring}d monitoring
    </Badge>
  )
}

export function MonitoringSinceText({ addedAt }: { addedAt: string }) {
  const addedDate = new Date(addedAt)
  const daysMonitoring = Math.floor(
    (Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium">{format(addedDate, 'MMM dd, yyyy')}</span>
      <span className="text-xs text-muted-foreground">{daysMonitoring} days</span>
    </div>
  )
}
