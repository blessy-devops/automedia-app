/**
 * Queue Item Dialog
 * Modal for viewing detailed logs of a queue job
 */

'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Search } from 'lucide-react'
import { QueueJob, LogLevel } from '../types'
import { getLogLevelColor, getJobTypeLabel, getApiProviderLabel } from '../lib/utils'
import { toast } from 'sonner'

interface QueueItemDialogProps {
  job: QueueJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QueueItemDialog({
  job,
  open,
  onOpenChange,
}: QueueItemDialogProps) {
  const [logLevelFilter, setLogLevelFilter] = useState<LogLevel | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLogs = useMemo(() => {
    if (!job) return []

    let logs = job.logs

    // Filter by level
    if (logLevelFilter !== 'all') {
      logs = logs.filter((log) => log.level === logLevelFilter)
    }

    // Filter by search query
    if (searchQuery) {
      logs = logs.filter((log) =>
        log.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return logs
  }, [job, logLevelFilter, searchQuery])

  const handleDownloadLogs = () => {
    if (!job) return

    const logsText = job.logs
      .map(
        (log) =>
          `${log.timestamp} [${log.level}] ${log.message}${
            log.metadata ? ` ${JSON.stringify(log.metadata)}` : ''
          }`
      )
      .join('\n')

    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-${job.id}-logs.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Logs downloaded successfully')
  }

  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Job Logs: {job.id}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {getJobTypeLabel(job.type)} • {getApiProviderLabel(job.apiService)}
          </p>
        </DialogHeader>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select
            value={logLevelFilter}
            onValueChange={(value) => setLogLevelFilter(value as LogLevel | 'all')}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Log level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="DEBUG">DEBUG</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleDownloadLogs} className="h-9">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto border rounded-md bg-muted/30 p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No logs found matching your filters.
            </div>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {filteredLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 group">
                  <span className="text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      fractionalSecondDigits: 3,
                    })}
                  </span>
                  <span className={`font-medium w-12 flex-shrink-0 ${getLogLevelColor(log.level)}`}>
                    [{log.level}]
                  </span>
                  <span className="text-foreground flex-1">{log.message}</span>
                  {log.metadata && (
                    <span className="text-muted-foreground text-[10px]">
                      {JSON.stringify(log.metadata)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {filteredLogs.length} of {job.logs.length} logs
          </span>
          {(logLevelFilter !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLogLevelFilter('all')
                setSearchQuery('')
              }}
              className="h-7 text-xs"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
