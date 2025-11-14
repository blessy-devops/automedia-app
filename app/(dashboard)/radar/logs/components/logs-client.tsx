'use client'

import { useState, useMemo, useEffect } from 'react'
import { LogsTable, type LogEntry } from './logs-table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { getApproximateUpdateStats } from '../../actions'

interface LogsClientProps {
  logs: Array<{
    id: number
    execution_started_at: string
    execution_completed_at: string | null
    status: string
    channels_processed: number
    channels_failed: number
    error_message: string | null
  }>
}

export function LogsClient({ logs: initialLogs }: LogsClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [logsWithStats, setLogsWithStats] = useState<LogEntry[]>(
    initialLogs.map((log) => ({ ...log }))
  )
  const [loadingStats, setLoadingStats] = useState(true)

  const pageSize = 20

  // Load approximate stats for each log entry
  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true)
      try {
        const enrichedLogs = await Promise.all(
          initialLogs.map(async (log) => {
            // Only fetch stats for completed executions
            if (log.status === 'completed' && log.execution_completed_at) {
              const statsResult = await getApproximateUpdateStats(
                log.id,
                log.execution_started_at,
                log.execution_completed_at
              )

              if (statsResult.success && statsResult.data) {
                return {
                  ...log,
                  approximateNewVideos: statsResult.data.approximateNewVideos,
                  approximateViralVideos: statsResult.data.approximateViralVideos,
                  channelsWithOutliers: statsResult.data.channelsWithOutliers,
                }
              }
            }
            return log
          })
        )
        setLogsWithStats(enrichedLogs)
      } catch (error) {
        console.error('Failed to load stats:', error)
        // Keep logs without stats if fetch fails
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [initialLogs])

  // Filter logs by status
  const filteredLogs = useMemo(() => {
    if (statusFilter === 'all') return logsWithStats
    return logsWithStats.filter((log) => log.status === statusFilter)
  }, [logsWithStats, statusFilter])

  // Paginate logs
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredLogs.slice(start, start + pageSize)
  }, [filteredLogs, page])

  const totalPages = Math.ceil(filteredLogs.length / pageSize)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} execution{filteredLogs.length !== 1 ? 's' : ''}
          {loadingStats && ' (loading stats...)'}
        </div>
      </div>

      {/* Table */}
      <LogsTable logs={paginatedLogs} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
