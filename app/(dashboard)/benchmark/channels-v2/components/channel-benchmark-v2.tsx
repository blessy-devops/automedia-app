'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Clock, CheckCircle2, Circle, Loader2, BarChart3, TrendingUp, Video, Search, RotateCcw, ChevronDown, ExternalLink } from 'lucide-react'
import { startChannelBenchmark } from '../actions'
import { BenchmarkProgressMonitor } from '../../channels/components/benchmark-progress-monitor'
import { createClient } from '@/lib/supabase/client'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface BenchmarkHistoryItem {
  id: number
  channel_id: string
  overall_status: 'completed' | 'processing' | 'failed' | 'pending'
  created_at: string
  benchmark_channels: { id: number } | null
}

interface ChannelBenchmarkV2Props {
  initialHistory: BenchmarkHistoryItem[]
}

interface ChannelPreview {
  id: number
  channel_id: string
  channel_name: string | null
  thumbnail_url: string | null
  subscriber_count: number | null
}

export function ChannelBenchmarkV2({ initialHistory }: ChannelBenchmarkV2Props) {
  const router = useRouter()
  const [channelId, setChannelId] = useState('')
  const [activeTask, setActiveTask] = useState<{ taskId: number; channelId: string } | null>(null)
  const [benchmarkState, setBenchmarkState] = useState<'idle' | 'processing' | 'completed'>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState(initialHistory)
  const [isPipelineOpen, setIsPipelineOpen] = useState(false)
  const [channelPreview, setChannelPreview] = useState<ChannelPreview | null>(null)

  // Subscribe to real-time updates for benchmark history
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('benchmark-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'channel_enrichment_tasks',
        },
        (payload) => {
          console.log('[BenchmarkV2] Realtime update received:', payload)

          // Update history list with new status
          setHistory((prevHistory) => {
            return prevHistory.map((item) => {
              if (item.id === payload.new.id) {
                return {
                  ...item,
                  overall_status: payload.new.overall_status,
                }
              }
              return item
            })
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleStartBenchmark = async () => {
    if (!channelId.trim()) return

    try {
      setIsSubmitting(true)
      setError(null)
      setBenchmarkState('processing')

      console.log('[BenchmarkV2] Submitting channel ID:', channelId)

      const response = await startChannelBenchmark(channelId)

      if (response.success && response.taskId) {
        console.log('[BenchmarkV2] Benchmark started successfully:', response)
        setActiveTask({
          taskId: response.taskId,
          channelId: channelId,
        })

        // Save channel preview data if available
        if (response.channelData) {
          console.log('[BenchmarkV2] Channel preview data:', response.channelData)
          setChannelPreview({
            id: response.channelData.id,
            channel_id: response.channelData.channel_id,
            channel_name: response.channelData.channel_name,
            thumbnail_url: response.channelData.thumbnail_url,
            subscriber_count: response.channelData.subscriber_count,
          })
        }
      } else {
        console.error('[BenchmarkV2] Benchmark failed:', response.error)
        setError(response.error || 'Failed to start benchmark')
        setBenchmarkState('idle')
      }
    } catch (err) {
      console.error('[BenchmarkV2] Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setBenchmarkState('idle')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewBenchmark = () => {
    setActiveTask(null)
    setBenchmarkState('idle')
    setChannelId('')
    setError(null)
    setChannelPreview(null)
  }

  const handleMonitoringComplete = () => {
    console.log('[BenchmarkV2] Enrichment pipeline completed!')
    setBenchmarkState('completed')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs rounded">
            Completed
          </span>
        )
      case 'processing':
        return (
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs rounded">
            Processing
          </span>
        )
      case 'failed':
        return (
          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs rounded">
            Failed
          </span>
        )
      case 'pending':
        return (
          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">
            Pending
          </span>
        )
      default:
        return null
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else {
      return `${diffDays}d ago`
    }
  }

  const stats = {
    totalBenchmarks: history.length,
    averageTime: '3m 24s',
    successRate: '96.4%',
    channelsProcessed: history.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.channel_id === item.channel_id)
    ).length,
  }

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Left Panel - Control Center */}
      <div className="w-[30%] bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-foreground mb-1">Channel Benchmark</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive YouTube channel analysis
          </p>
        </div>

        {/* Form Section */}
        <div className="p-6 border-b border-border">
          <div className="bg-accent rounded-lg p-5 border border-border">
            <h3 className="text-sm text-foreground mb-1">Start New Benchmark</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Enter a YouTube Channel ID to begin analysis
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  YouTube Channel ID
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="UC12AB34CD56EF78GH90IJ"
                  className="w-full bg-card border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  disabled={isSubmitting || benchmarkState === 'processing'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSubmitting) {
                      handleStartBenchmark()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Find this in the channel URL or use a Channel ID lookup tool
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 p-3">
                  <p className="text-xs">{error}</p>
                </div>
              )}

              <button
                onClick={handleStartBenchmark}
                disabled={!channelId.trim() || isSubmitting || benchmarkState === 'processing'}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-muted disabled:text-muted-foreground text-white px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Channel Benchmark
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Benchmarks */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-sm text-foreground mb-3">Recent Benchmarks</h3>
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No benchmarks yet
                </div>
              ) : (
                history.slice(0, 10).map((item) => {
                  const isClickable = item.benchmark_channels !== null
                  const handleClick = () => {
                    if (isClickable && item.benchmark_channels) {
                      router.push(`/benchmark/channels/${item.benchmark_channels.id}`)
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={handleClick}
                      className={`bg-accent hover:bg-accent/70 rounded-lg p-3 transition-colors border border-border ${
                        isClickable ? 'cursor-pointer' : 'cursor-default opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-foreground truncate">
                            {item.channel_id}
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            Task #{item.id}
                          </div>
                        </div>
                        {getStatusBadge(item.overall_status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Main Content Area */}
      <main className="flex-1 bg-background">
        {/* Idle State */}
        {benchmarkState === 'idle' && !activeTask && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-card border-b border-border px-8 py-5">
              <h1 className="text-foreground">Overview</h1>
              <p className="text-sm text-muted-foreground mt-1">
                System statistics and recent activity
              </p>
            </div>

            {/* Stats Cards */}
            <div className="p-8">
              <div className="grid grid-cols-4 gap-5 mb-8">
                <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Total Benchmarks</span>
                  </div>
                  <div className="text-foreground">{stats.totalBenchmarks}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </div>

                <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Average Time</span>
                  </div>
                  <div className="text-foreground">{stats.averageTime}</div>
                  <p className="text-xs text-muted-foreground mt-1">Per benchmark</p>
                </div>

                <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Success Rate</span>
                  </div>
                  <div className="text-foreground">{stats.successRate}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </div>

                <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Video className="w-4 h-4" />
                    <span className="text-sm">Channels Processed</span>
                  </div>
                  <div className="text-foreground">{stats.channelsProcessed}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unique channels</p>
                </div>
              </div>

              {/* Empty State */}
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-foreground mb-2">No Active Benchmark</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Enter a YouTube Channel ID in the left panel to start a comprehensive benchmark
                  analysis. The system will analyze performance, videos, and statistics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {(benchmarkState === 'processing' || (activeTask && benchmarkState !== 'completed')) && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-card border-b border-border px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-foreground">Enrichment Pipeline Progress</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Processing channel:{' '}
                    <span className="text-foreground font-mono">{activeTask?.channelId}</span>
                  </p>
                </div>
                {getStatusBadge('processing')}
              </div>
            </div>

            {/* Channel Preview */}
            {channelPreview && (
              <div className="bg-accent border-b border-border px-8 py-4">
                <div className="flex items-center gap-4">
                  {channelPreview.thumbnail_url && (
                    <img
                      src={channelPreview.thumbnail_url}
                      alt={channelPreview.channel_name || 'Channel'}
                      className="w-16 h-16 rounded-full border-2 border-border"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-foreground font-medium">
                      {channelPreview.channel_name || 'Unknown Channel'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {channelPreview.subscriber_count?.toLocaleString()} subscribers
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pipeline Steps - Real-time Monitor */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                {activeTask && (
                  <BenchmarkProgressMonitor
                    taskId={activeTask.taskId}
                    channelId={activeTask.channelId}
                    onComplete={handleMonitoringComplete}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completed State */}
        {benchmarkState === 'completed' && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-card border-b border-border px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-foreground">Benchmark Completed</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Channel:{' '}
                    <span className="text-foreground font-mono">{activeTask?.channelId}</span>
                  </p>
                </div>
                {getStatusBadge('completed')}
              </div>
            </div>

            {/* Success Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Success Message */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-foreground mb-3">Benchmark Successfully Completed!</h2>
                  <p className="text-muted-foreground mb-6">
                    All pipeline steps completed successfully. The channel data has been enriched
                    and is now available for analysis.
                  </p>
                </div>

                {/* Collapsible Pipeline Steps */}
                <Collapsible open={isPipelineOpen} onOpenChange={setIsPipelineOpen}>
                  <CollapsibleTrigger className="w-full">
                    <div className="bg-card border border-border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div className="text-left">
                            <h3 className="text-sm font-medium text-foreground">
                              Pipeline Steps Details
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Click to {isPipelineOpen ? 'hide' : 'view'} all completed steps
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-muted-foreground transition-transform ${
                            isPipelineOpen ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    {activeTask && (
                      <BenchmarkProgressMonitor
                        taskId={activeTask.taskId}
                        channelId={activeTask.channelId}
                        onComplete={() => {}}
                      />
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3">
                  {channelPreview && (
                    <button
                      onClick={() => router.push(`/channels/${channelPreview.id}`)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-md transition-colors flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Channel Details
                    </button>
                  )}
                  <button
                    onClick={handleNewBenchmark}
                    className="bg-card hover:bg-accent border border-border text-foreground px-6 py-2.5 rounded-md transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Start Another Benchmark
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
