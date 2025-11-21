/**
 * API Queue Client Component
 * Main client wrapper with filters, tabs, and view management
 */

'use client'

import { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { QueueJob, RateLimit, TabView } from '../types'
import { ApiQueueFilters } from './api-queue-filters'
import { ApiQueueTable } from './api-queue-table'
import { RateLimitsPanel } from './rate-limits-panel'
import { QueueItemDialog } from './queue-item-dialog'
import { RetryConfigDialog } from './retry-config-dialog'
import { useQueueFilters } from '../hooks/use-queue-filters'
import { useAutoRefresh } from '../hooks/use-auto-refresh'
import { toast } from 'sonner'

interface ApiQueueClientProps {
  initialJobs: QueueJob[]
  rateLimits: RateLimit[]
  onRefresh?: () => void | Promise<void>
}

export function ApiQueueClient({
  initialJobs,
  rateLimits,
  onRefresh,
}: ApiQueueClientProps) {
  const [jobs, setJobs] = useState<QueueJob[]>(initialJobs)
  const [selectedTab, setSelectedTab] = useState<TabView>('all')
  const [selectedJob, setSelectedJob] = useState<QueueJob | null>(null)
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false)
  const [isRetryConfigOpen, setIsRetryConfigOpen] = useState(false)

  // Filters hook
  const { filters, setFilters, filteredJobs, activeFiltersCount } = useQueueFilters({
    jobs,
  })

  // Auto-refresh hook
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
      // TODO: In production, this would refetch from server
      // For now, we're just using the initial data
      toast.success('Queue refreshed')
    }
  }, [onRefresh])

  const { isEnabled: isAutoRefresh, isRefreshing, toggle: toggleAutoRefresh, manualRefresh } = useAutoRefresh({
    interval: 5000,
    onRefresh: handleRefresh,
  })

  // Filter jobs by tab
  const tabFilteredJobs = filteredJobs.filter((job) => {
    if (selectedTab === 'all') return true
    if (selectedTab === 'rate-limits') return false // Special tab
    return job.status === selectedTab
  })

  // Count jobs by status
  const statusCounts = {
    all: filteredJobs.length,
    pending: filteredJobs.filter((j) => j.status === 'pending').length,
    processing: filteredJobs.filter((j) => j.status === 'processing').length,
    failed: filteredJobs.filter((j) => j.status === 'failed').length,
  }

  // Job actions
  const handleRetry = (jobId: string) => {
    // TODO: Implement server action
    toast.success(`Retrying job ${jobId}`)
    console.log('Retry job:', jobId)
  }

  const handleCancel = (jobId: string) => {
    // TODO: Implement server action
    toast.success(`Cancelled job ${jobId}`)
    console.log('Cancel job:', jobId)
  }

  const handlePause = (jobId: string) => {
    // TODO: Implement server action
    toast.success(`Paused job ${jobId}`)
    console.log('Pause job:', jobId)
  }

  const handleViewLogs = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId)
    if (job) {
      setSelectedJob(job)
      setIsLogsDialogOpen(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ApiQueueFilters
        filters={filters}
        onFiltersChange={setFilters}
        isAutoRefresh={isAutoRefresh}
        onAutoRefreshToggle={toggleAutoRefresh}
        onManualRefresh={manualRefresh}
        isRefreshing={isRefreshing}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as TabView)}>
        <TabsList className="bg-card">
          <TabsTrigger value="all" className="gap-2">
            All Jobs
            {statusCounts.all > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {statusCounts.all}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {statusCounts.pending > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {statusCounts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processing" className="gap-2">
            Processing
            {statusCounts.processing > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {statusCounts.processing}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="failed" className="gap-2">
            Failed
            {statusCounts.failed > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {statusCounts.failed}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
        </TabsList>

        {/* All Jobs Tab */}
        <TabsContent value="all" className="mt-6">
          <ApiQueueTable
            jobs={tabFilteredJobs}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onPause={handlePause}
            onViewLogs={handleViewLogs}
          />
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-6">
          <ApiQueueTable
            jobs={tabFilteredJobs}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onPause={handlePause}
            onViewLogs={handleViewLogs}
          />
        </TabsContent>

        {/* Processing Tab */}
        <TabsContent value="processing" className="mt-6">
          <ApiQueueTable
            jobs={tabFilteredJobs}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onPause={handlePause}
            onViewLogs={handleViewLogs}
          />
        </TabsContent>

        {/* Failed Tab */}
        <TabsContent value="failed" className="mt-6">
          <ApiQueueTable
            jobs={tabFilteredJobs}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onPause={handlePause}
            onViewLogs={handleViewLogs}
          />
        </TabsContent>

        {/* Rate Limits Tab */}
        <TabsContent value="rate-limits" className="mt-6">
          <RateLimitsPanel
            rateLimits={rateLimits}
            onRefresh={manualRefresh}
            isRefreshing={isRefreshing}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <QueueItemDialog
        job={selectedJob}
        open={isLogsDialogOpen}
        onOpenChange={setIsLogsDialogOpen}
      />

      <RetryConfigDialog
        open={isRetryConfigOpen}
        onOpenChange={setIsRetryConfigOpen}
        jobType={selectedJob?.type}
      />
    </div>
  )
}
