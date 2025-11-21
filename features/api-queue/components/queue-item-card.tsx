/**
 * Queue Item Card
 * Expandable card showing job details, timeline, request/response, errors, and actions
 */

'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Clock,
  Loader,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Pause,
  X,
  FileText,
  Copy,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { QueueJob, JobStatus } from '../types'
import {
  formatTimeAgo,
  formatTimeUntil,
  getStatusColor,
  getJobTypeLabel,
  getApiProviderLabel,
} from '../lib/utils'
import { toast } from 'sonner'

interface QueueItemCardProps {
  job: QueueJob
  onRetry?: (jobId: string) => void
  onCancel?: (jobId: string) => void
  onPause?: (jobId: string) => void
  onViewLogs?: (jobId: string) => void
}

function getStatusIcon(status: JobStatus) {
  switch (status) {
    case 'pending':
      return Clock
    case 'processing':
      return Loader
    case 'completed':
      return CheckCircle
    case 'failed':
      return XCircle
    case 'retrying':
      return AlertCircle
    default:
      return Clock
  }
}

function getStatusBadgeClass(status: JobStatus): string {
  switch (status) {
    case 'processing':
      return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
    case 'pending':
      return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
    case 'completed':
      return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
    case 'failed':
      return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
    case 'retrying':
      return 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
    default:
      return 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300'
  }
}

export function QueueItemCard({
  job,
  onRetry,
  onCancel,
  onPause,
  onViewLogs,
}: QueueItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const StatusIcon = getStatusIcon(job.status)

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(JSON.stringify(job, null, 2))
    toast.success('Job details copied to clipboard')
  }

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-4">
        {/* Collapsed Header */}
        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Chevron */}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
          )}

          {/* Status Icon */}
          <div
            className={`p-2 rounded-md flex-shrink-0 ${
              job.status === 'pending'
                ? 'bg-yellow-50 dark:bg-yellow-950/20'
                : job.status === 'processing'
                ? 'bg-blue-50 dark:bg-blue-950/20'
                : job.status === 'completed'
                ? 'bg-green-50 dark:bg-green-950/20'
                : 'bg-red-50 dark:bg-red-950/20'
            }`}
          >
            <StatusIcon
              className={`w-4 h-4 ${getStatusColor(job.status)} ${
                job.status === 'processing' ? 'animate-spin' : ''
              }`}
            />
          </div>

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground truncate">
                {getJobTypeLabel(job.type)}: {job.metadata.videoTitle || job.metadata.channelName || job.id}
              </span>
            </div>

            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>
                {getApiProviderLabel(job.apiService)} • {job.metadata.channelName}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {job.status === 'processing' && job.progress !== undefined && (
                  <span>Progress: {job.progress}%</span>
                )}
                {job.status === 'failed' && job.retryCount > 0 && (
                  <span>Retry: {job.retryCount}/{job.maxRetries} attempts</span>
                )}
                {job.createdAt && (
                  <span>
                    {job.status === 'completed' ? 'Completed' : job.status === 'failed' ? 'Failed' : 'Created'}: {formatTimeAgo(job.createdAt)}
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px]">Job ID: {job.id}</div>
            </div>
          </div>

          {/* Status Badge */}
          <Badge className={`${getStatusBadgeClass(job.status)} flex-shrink-0`}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        </div>

        {/* Progress Bar (only if processing) */}
        {job.status === 'processing' && job.progress !== undefined && (
          <div className="ml-10 mt-3">
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="ml-10 mt-4 space-y-4">
            <Separator />

            {/* Job Details */}
            <div>
              <h4 className="text-sm font-medium mb-2">Job Details</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Job Type:</span>
                  <span className="ml-2 text-foreground">{getJobTypeLabel(job.type)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">API:</span>
                  <span className="ml-2 text-foreground">{getApiProviderLabel(job.apiService)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="ml-2 text-foreground capitalize">{job.priority}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Workflow:</span>
                  <span className="ml-2 text-foreground">{job.workflowName || 'N/A'}</span>
                </div>
                {job.metadata.fileSize && (
                  <div>
                    <span className="text-muted-foreground">File Size:</span>
                    <span className="ml-2 text-foreground">{job.metadata.fileSize}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Retry Policy:</span>
                  <span className="ml-2 text-foreground capitalize">
                    {job.retryStrategy} ({job.maxRetries} max)
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-medium mb-2">Timeline</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5" />
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2 text-foreground">{formatTimeAgo(job.createdAt)}</span>
                  </div>
                </div>
                {job.queuedAt && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5" />
                    <div>
                      <span className="text-muted-foreground">Queued:</span>
                      <span className="ml-2 text-foreground">{formatTimeAgo(job.queuedAt)}</span>
                    </div>
                  </div>
                )}
                {job.startedAt && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <span className="ml-2 text-foreground">{formatTimeAgo(job.startedAt)}</span>
                    </div>
                  </div>
                )}
                {job.completedAt && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5" />
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="ml-2 text-foreground">{formatTimeAgo(job.completedAt)}</span>
                    </div>
                  </div>
                )}
                {job.failedAt && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5" />
                    <div>
                      <span className="text-muted-foreground">Failed:</span>
                      <span className="ml-2 text-foreground">{formatTimeAgo(job.failedAt)}</span>
                    </div>
                  </div>
                )}
                {job.status === 'processing' && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 animate-pulse" />
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2 text-foreground">{job.progressMessage || 'In progress...'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Details (if failed) */}
            {job.status === 'failed' && job.error && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-600">Error Details</h4>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-3 space-y-2 text-xs">
                    <div>
                      <span className="font-medium">Error Code:</span>
                      <span className="ml-2">{job.error.code}</span>
                    </div>
                    <div>
                      <span className="font-medium">Message:</span>
                      <span className="ml-2">{job.error.message}</span>
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>
                      <span className="ml-2">{job.error.type}</span>
                    </div>
                    {job.error.stack && (
                      <div>
                        <span className="font-medium">Stack Trace:</span>
                        <pre className="mt-1 text-[10px] font-mono whitespace-pre-wrap bg-background p-2 rounded border">
                          {job.error.stack}
                        </pre>
                      </div>
                    )}
                    {job.nextRetryAt && (
                      <div className="pt-2 border-t border-red-200 dark:border-red-900">
                        <span className="font-medium">Next Retry:</span>
                        <span className="ml-2">in {formatTimeUntil(job.nextRetryAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {(job.status === 'failed' || job.status === 'retrying') && onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRetry(job.id)}
                  className="h-8 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry Now
                </Button>
              )}
              {job.status === 'processing' && onPause && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPause(job.id)}
                  className="h-8 text-xs"
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </Button>
              )}
              {job.status !== 'completed' && job.status !== 'cancelled' && onCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(job.id)}
                  className="h-8 text-xs text-red-600 hover:text-red-700"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              )}
              {onViewLogs && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewLogs(job.id)}
                  className="h-8 text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  View Logs
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyDetails}
                className="h-8 text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Details
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
