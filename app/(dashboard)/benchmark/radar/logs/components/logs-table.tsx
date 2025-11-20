'use client'

import { useState } from 'react'
import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, Loader2, Video, TrendingUp } from 'lucide-react'

export type LogEntry = {
  id: number
  execution_started_at: string
  execution_completed_at: string | null
  status: string
  channels_processed: number
  channels_failed: number
  error_message: string | null
  approximateNewVideos?: number
  approximateViralVideos?: number
  channelsWithOutliers?: number
}

interface LogsTableProps {
  logs: LogEntry[]
}

export function LogsTable({ logs }: LogsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        )
      case 'running':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return 'In progress...'
    const seconds = differenceInSeconds(new Date(completedAt), new Date(startedAt))
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground text-sm">No execution logs found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Execution Time</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Duration</TableHead>
            <TableHead className="w-[140px] text-center">Channels</TableHead>
            <TableHead className="w-[120px] text-center">
              <div className="flex items-center justify-center gap-1">
                <Video className="h-3.5 w-3.5" />
                Videos
              </div>
            </TableHead>
            <TableHead className="w-[120px] text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                Virals (5x+)
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isExpanded = expandedRows.has(log.id)
            const hasErrors = log.error_message && log.error_message !== 'null'

            return (
              <>
                <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    {hasErrors && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(log.id)}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">
                        {format(new Date(log.execution_started_at), 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.execution_started_at))} ago
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {getDuration(log.execution_started_at, log.execution_completed_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {log.channels_processed} success
                      </span>
                      {log.channels_failed > 0 && (
                        <span className="text-xs text-destructive">
                          {log.channels_failed} failed
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">
                      {log.approximateNewVideos !== undefined
                        ? `~${log.approximateNewVideos}`
                        : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {log.approximateViralVideos !== undefined && log.approximateViralVideos > 0 ? (
                      <Badge variant="default" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        ~{log.approximateViralVideos}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && hasErrors && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/30">
                      <div className="p-4 space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          Execution Errors
                        </h4>
                        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                          <pre className="text-xs text-destructive font-mono overflow-x-auto">
                            {log.error_message}
                          </pre>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
