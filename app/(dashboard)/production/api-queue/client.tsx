/**
 * API Queue Client Component - Pixel-perfect Figma replication
 */

'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  RefreshCw,
  Play,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw,
  Eye,
  Zap,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ApiQueueJob, QueueStats } from '@/features/api-queue/types'

interface ApiQueueClientProps {
  stats: QueueStats
  imageJobs: ApiQueueJob[]
  audioJobs: ApiQueueJob[]
  videoJobs: ApiQueueJob[]
  failedJobs: ApiQueueJob[]
  currentPeriod: string
}

const ITEMS_PER_PAGE = 20

export function ApiQueueClient({
  stats,
  imageJobs,
  audioJobs,
  videoJobs,
  failedJobs,
  currentPeriod,
}: ApiQueueClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [activeTab, setActiveTab] = useState('image')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handlePeriodChange = (newPeriod: string) => {
    router.push(`${pathname}?period=${newPeriod}`)
    setCurrentPage(1) // Reset to first page when changing period
  }

  // Reset page when changing tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  // Helper functions
  const getStatusBadge = (status: ApiQueueJob['status']) => {
    switch (status) {
      case 'queued':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" /> Queued
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <Play className="w-3 h-3" /> Processing
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="w-3 h-3" /> Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" /> Failed
          </Badge>
        )
    }
  }

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      'Runware': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
      'Gemini': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      'GPT': 'bg-green-500/10 text-green-700 dark:text-green-300',
      'ElevenLabs': 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
      'Google TTS': 'bg-red-500/10 text-red-700 dark:text-red-300',
      'FFMPEG': 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
    }

    return (
      <Badge variant="outline" className={colors[provider] || ''}>
        {provider}
      </Badge>
    )
  }

  const renderJobsTable = (jobs: ApiQueueJob[]) => {
    // Pagination logic
    const totalJobs = jobs.length
    const totalPages = Math.ceil(totalJobs / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginatedJobs = jobs.slice(startIndex, endIndex)

    const canGoPrevious = currentPage > 1
    const canGoNext = currentPage < totalPages

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Video/Prompt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No jobs in queue
                </TableCell>
              </TableRow>
            ) : (
              paginatedJobs.map(job => (
            <TableRow key={job.id}>
              <TableCell className="font-mono text-sm">#{job.id}</TableCell>
              <TableCell>{getProviderBadge(job.provider)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{job.model}</TableCell>
              <TableCell className="max-w-[300px]">
                <div className="space-y-1">
                  {job.videoTitle && (
                    <div className="text-sm truncate">{job.videoTitle}</div>
                  )}
                  {job.prompt && (
                    <div className="text-xs text-muted-foreground truncate">{job.prompt}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(job.status)}</TableCell>
              <TableCell className="text-sm">
                {job.eta ? (
                  <span className="text-muted-foreground">{job.eta}</span>
                ) : job.completedAt ? (
                  <span className="text-green-600 dark:text-green-400">Done</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(job.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Job Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2">
                      <Eye className="w-4 h-4" />
                      View Logs
                    </DropdownMenuItem>
                    {job.status === 'failed' && (
                      <>
                        <DropdownMenuItem className="gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Retry
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Zap className="w-4 h-4" />
                          Switch Provider
                        </DropdownMenuItem>
                      </>
                    )}
                    {job.status === 'queued' && (
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <X className="w-4 h-4" />
                        Cancel
                      </DropdownMenuItem>
                    )}
                    {job.status === 'completed' && (
                      <DropdownMenuItem className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Reprocess
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalJobs > 0 && (
          <div className="flex items-center justify-between px-2 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, totalJobs)} of {totalJobs} jobs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={!canGoPrevious}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground px-2">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!canGoNext}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-1">API Queue</h1>
          <p className="text-sm text-muted-foreground">
            Centralized queue for all asset generation across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <CalendarDays className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last 1 Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Play className="w-4 h-4" />
            <span className="text-sm">Processing</span>
          </div>
          <div className="text-foreground">{stats.processing}</div>
          <p className="text-xs text-muted-foreground mt-1">Active jobs</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Queued</span>
          </div>
          <div className="text-foreground">{stats.queued}</div>
          <p className="text-xs text-muted-foreground mt-1">Waiting to process</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Completed (24h)</span>
          </div>
          <div className="text-foreground">{stats.completed24h}</div>
          <p className="text-xs text-muted-foreground mt-1">Successfully finished</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Failed (24h)</span>
          </div>
          <div className="text-foreground text-destructive">{stats.failed24h}</div>
          <p className="text-xs text-muted-foreground mt-1">Errors occurred</p>
        </div>
      </div>

      {/* Main Card with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Queues</CardTitle>
          <CardDescription>
            Monitor and manage asset generation across all providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="image" className="gap-2">
                <Zap className="w-4 h-4" />
                Image Generation
              </TabsTrigger>
              <TabsTrigger value="audio" className="gap-2">
                <Zap className="w-4 h-4" />
                Audio Generation
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Zap className="w-4 h-4" />
                Video Processing
              </TabsTrigger>
              <TabsTrigger value="failed" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                Failed Jobs ({failedJobs.length})
              </TabsTrigger>
            </TabsList>

            {/* Image Tab */}
            <TabsContent value="image" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <h3 className="font-medium text-foreground mb-2">Provider Configurations:</h3>
                  <ul className="space-y-1 ml-4">
                    <li>• <strong>Runware:</strong> N8N Workflow &quot;Runware Image Generation A&quot;</li>
                    <li>• <strong>Gemini:</strong> N8N Workflow &quot;Gemini Imagen B&quot;</li>
                    <li>• <strong>GPT:</strong> N8N Workflow &quot;OpenAI DALL-E C&quot;</li>
                  </ul>
                </div>
                {renderJobsTable(imageJobs)}
              </div>
            </TabsContent>

            {/* Audio Tab */}
            <TabsContent value="audio" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <h3 className="font-medium text-foreground mb-2">Provider Configurations:</h3>
                  <ul className="space-y-1 ml-4">
                    <li>• <strong>ElevenLabs:</strong> N8N Workflow &quot;ElevenLabs Voice A&quot;</li>
                    <li>• <strong>Google TTS:</strong> N8N Workflow &quot;Google TTS Workflow&quot;</li>
                  </ul>
                </div>
                {renderJobsTable(audioJobs)}
              </div>
            </TabsContent>

            {/* Video Tab */}
            <TabsContent value="video" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <h3 className="font-medium text-foreground mb-2">Provider Configurations:</h3>
                  <ul className="space-y-1 ml-4">
                    <li>• <strong>FFMPEG:</strong> N8N Workflow &quot;Video Assembly Pipeline A&quot; (1080p)</li>
                    <li>• <strong>FFMPEG:</strong> N8N Workflow &quot;Video Assembly Pipeline B&quot; (4K)</li>
                  </ul>
                </div>
                {renderJobsTable(videoJobs)}
              </div>
            </TabsContent>

            {/* Failed Jobs Tab */}
            <TabsContent value="failed" className="mt-6">
              {failedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-foreground mb-2">No Failed Jobs</h3>
                  <p className="text-sm text-muted-foreground">All jobs are running smoothly!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {failedJobs.map(job => (
                    <Card key={job.id} className="border-destructive/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {job.videoTitle || job.prompt}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {job.provider} - {job.model}
                            </CardDescription>
                          </div>
                          {getStatusBadge(job.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {job.error && (
                            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{job.error}</span>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="gap-2">
                              <RotateCcw className="w-4 h-4" />
                              Retry
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Zap className="w-4 h-4" />
                              Switch Provider
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Eye className="w-4 h-4" />
                              View Logs
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  )
}
