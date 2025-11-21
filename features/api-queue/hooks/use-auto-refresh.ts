/**
 * useAutoRefresh Hook
 * Handles automatic refresh with configurable interval
 */

'use client'

import { useEffect, useRef, useState } from 'react'

interface UseAutoRefreshOptions {
  interval?: number // milliseconds
  onRefresh: () => void | Promise<void>
}

export function useAutoRefresh({ interval = 5000, onRefresh }: UseAutoRefreshOptions) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isEnabled && !isRefreshing) {
      timerRef.current = setInterval(async () => {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }, interval)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isEnabled, interval, onRefresh, isRefreshing])

  const toggle = () => setIsEnabled((prev) => !prev)

  const manualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    isEnabled,
    isRefreshing,
    toggle,
    manualRefresh,
  }
}
