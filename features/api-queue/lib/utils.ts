/**
 * Utility functions for API Queue feature
 */

import { JobStatus, LogLevel, ApiProvider } from '../types'
import { formatDistanceToNow } from 'date-fns'

export function getStatusColor(status: JobStatus): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600'
    case 'processing':
      return 'text-blue-600'
    case 'completed':
      return 'text-green-600'
    case 'failed':
      return 'text-red-600'
    case 'retrying':
      return 'text-orange-600'
    case 'cancelled':
      return 'text-gray-600'
    default:
      return 'text-gray-600'
  }
}

export function getStatusBadgeVariant(status: JobStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default'
    case 'processing':
    case 'pending':
      return 'secondary'
    case 'failed':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function getLogLevelColor(level: LogLevel): string {
  switch (level) {
    case 'INFO':
      return 'text-blue-600 dark:text-blue-400'
    case 'DEBUG':
      return 'text-gray-600 dark:text-gray-400'
    case 'WARN':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'ERROR':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600'
  }
}

export function getRateLimitColor(percentage: number): string {
  if (percentage >= 95) return 'text-red-600'
  if (percentage >= 80) return 'text-orange-600'
  if (percentage >= 50) return 'text-yellow-600'
  return 'text-green-600'
}

export function getRateLimitSeverity(percentage: number): 'safe' | 'warning' | 'danger' | 'critical' {
  if (percentage >= 95) return 'critical'
  if (percentage >= 80) return 'danger'
  if (percentage >= 50) return 'warning'
  return 'safe'
}

export function formatTimeAgo(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export function formatTimeUntil(date: string): string {
  try {
    const now = new Date()
    const target = new Date(date)
    const diffMs = target.getTime() - now.getTime()

    if (diffMs < 0) return 'Now'

    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
    if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`
    if (diffMinutes > 0) return `${diffMinutes}m`
    return `${diffSeconds}s`
  } catch {
    return 'Unknown'
  }
}

export function getApiProviderLabel(provider: ApiProvider): string {
  switch (provider) {
    case 'youtube':
      return 'YouTube Data API'
    case 'youtube_analytics':
      return 'YouTube Analytics API'
    case 'openai':
      return 'OpenAI API'
    case 'elevenlabs':
      return 'ElevenLabs API'
    case 'replicate':
      return 'Replicate API'
    case 'aws_s3':
      return 'AWS S3'
    case 'custom':
      return 'Custom API'
    default:
      return provider
  }
}

export function getJobTypeLabel(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function calculateAverageProcessingTime(jobs: any[]): number {
  const completedJobs = jobs.filter(
    (job) => job.status === 'completed' && job.startedAt && job.completedAt
  )

  if (completedJobs.length === 0) return 0

  const totalTime = completedJobs.reduce((sum, job) => {
    const start = new Date(job.startedAt!).getTime()
    const end = new Date(job.completedAt!).getTime()
    return sum + (end - start)
  }, 0)

  return Math.floor(totalTime / completedJobs.length / 1000) // in seconds
}

export function calculateSuccessRate(jobs: any[]): number {
  if (jobs.length === 0) return 0

  const finishedJobs = jobs.filter(
    (job) => job.status === 'completed' || job.status === 'failed'
  )

  if (finishedJobs.length === 0) return 0

  const completedJobs = finishedJobs.filter((job) => job.status === 'completed')

  return Math.round((completedJobs.length / finishedJobs.length) * 100)
}
