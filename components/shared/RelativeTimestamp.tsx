'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface RelativeTimestampProps {
  date: Date
  className?: string
  showIcon?: boolean
}

export function RelativeTimestamp({
  date,
  className = '',
  showIcon = true
}: RelativeTimestampProps) {
  const [timestamp, setTimestamp] = useState(() => formatRelativeTime(date))

  useEffect(() => {
    // Update timestamp every minute
    const interval = setInterval(() => {
      setTimestamp(formatRelativeTime(date))
    }, 60000)

    return () => clearInterval(interval)
  }, [date])

  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      {showIcon && <Clock className="w-3 h-3" />}
      <span>{timestamp}</span>
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
}
