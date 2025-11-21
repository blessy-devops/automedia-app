/**
 * API Queue Table
 * Renders list of queue job cards with pagination
 */

'use client'

import { QueueJob } from '../types'
import { QueueItemCard } from './queue-item-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface ApiQueueTableProps {
  jobs: QueueJob[]
  onRetry?: (jobId: string) => void
  onCancel?: (jobId: string) => void
  onPause?: (jobId: string) => void
  onViewLogs?: (jobId: string) => void
}

export function ApiQueueTable({
  jobs,
  onRetry,
  onCancel,
  onPause,
  onViewLogs,
}: ApiQueueTableProps) {
  if (jobs.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No jobs found matching your filters. Try adjusting your search criteria.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <QueueItemCard
          key={job.id}
          job={job}
          onRetry={onRetry}
          onCancel={onCancel}
          onPause={onPause}
          onViewLogs={onViewLogs}
        />
      ))}
    </div>
  )
}
