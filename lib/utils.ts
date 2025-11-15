import ms from 'ms'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const timeAgo = (timestamp: Date, timeOnly?: boolean): string => {
  if (!timestamp) return 'never'
  return `${ms(Date.now() - new Date(timestamp).getTime())}${
    timeOnly ? '' : ' ago'
  }`
}

/**
 * Utility function to merge Tailwind CSS classes
 * Used by shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format large numbers into readable strings
 * Examples: 1234567 -> "1.2M", 45000 -> "45K", 999 -> "999"
 */
export function formatLargeNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'

  const absNum = Math.abs(num)

  if (absNum >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  }
  if (absNum >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (absNum >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  }

  return num.toString()
}

// Alias for formatLargeNumber
export const formatNumber = formatLargeNumber

/**
 * Format date to readable string
 * Example: 2024-01-15 -> "Jan 15, 2024"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
