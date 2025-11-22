'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusStep, type StepStatus } from './status-step'
import { Badge } from '@/components/ui/badge'
import { RealtimeChannel } from '@supabase/supabase-js'

interface BenchmarkProgressMonitorProps {
  taskId: number
  channelId: string
  onComplete?: () => void
}

interface TaskStatus {
  overallStatus: StepStatus
  categorizationStatus: StepStatus
  socialbladeStatus: StepStatus
  recentVideosStatus: StepStatus
  trendingVideosStatus: StepStatus
  outlierAnalysisStatus: StepStatus
}

/**
 * BenchmarkProgressMonitor Component
 *
 * Monitors enrichment task progress in real-time using Supabase Realtime.
 * Displays 5 pipeline steps with live status updates.
 *
 * Steps:
 * 1. Channel Categorization (Claude AI)
 * 2. SocialBlade Metrics
 * 3. Recent Videos (YouTube API - sorted by newest)
 * 4. Trending Videos (YouTube API - sorted by views)
 * 5. Performance Analysis (Outlier ratios and metrics)
 */
export function BenchmarkProgressMonitor({
  taskId,
  channelId,
  onComplete,
}: BenchmarkProgressMonitorProps) {
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({
    overallStatus: 'pending',
    categorizationStatus: 'pending',
    socialbladeStatus: 'pending',
    recentVideosStatus: 'pending',
    trendingVideosStatus: 'pending',
    outlierAnalysisStatus: 'pending',
  })

  const [isSubscribed, setIsSubscribed] = useState(false)

  // Stable ref for onComplete callback to prevent unnecessary re-subscriptions
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    console.log('[Monitor] Setting up Realtime subscription for task:', taskId)

    const supabase = createClient()
    let channel: RealtimeChannel

    // Fetch initial task status
    const fetchInitialStatus = async () => {
      const { data, error } = await supabase
        .from('channel_enrichment_tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (error) {
        console.error('[Monitor] Error fetching initial status:', error)
        return
      }

      if (data) {
        console.log('[Monitor] Initial task status:', data)
        updateTaskStatus(data)
      }
    }

    // Subscribe to real-time updates
    const subscribeToUpdates = () => {
      channel = supabase
        .channel(`task-${taskId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'channel_enrichment_tasks',
            filter: `id=eq.${taskId}`,
          },
          (payload) => {
            console.log('[Monitor] Realtime update received:', payload)
            updateTaskStatus(payload.new)
          }
        )
        .subscribe((status) => {
          console.log('[Monitor] Subscription status:', status)
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true)
            console.log('[Monitor] Successfully subscribed to task updates')
          }
        })
    }

    // Helper function to update task status
    const updateTaskStatus = (data: any) => {
      const newStatus: TaskStatus = {
        overallStatus: (data.overall_status || 'pending') as StepStatus,
        categorizationStatus: (data.categorization_status || 'pending') as StepStatus,
        socialbladeStatus: (data.socialblade_status || 'pending') as StepStatus,
        recentVideosStatus: (data.recent_videos_status || 'pending') as StepStatus,
        trendingVideosStatus: (data.trending_videos_status || 'pending') as StepStatus,
        outlierAnalysisStatus: (data.outlier_analysis_status || 'pending') as StepStatus,
      }

      console.log('[Monitor] Updating task status:', newStatus)
      setTaskStatus(newStatus)

      // Call onComplete callback if all steps are completed (or skipped - non-blocking)
      // Social Blade can be 'skipped' for new channels without data
      // Trending Videos can be 'skipped' for radar updates
      const isSocialBladeComplete =
        newStatus.socialbladeStatus === 'completed' || newStatus.socialbladeStatus === 'skipped'

      const isTrendingVideosComplete =
        newStatus.trendingVideosStatus === 'completed' || newStatus.trendingVideosStatus === 'skipped'

      if (
        newStatus.overallStatus === 'completed' &&
        newStatus.categorizationStatus === 'completed' &&
        isSocialBladeComplete &&
        newStatus.recentVideosStatus === 'completed' &&
        isTrendingVideosComplete &&
        newStatus.outlierAnalysisStatus === 'completed'
      ) {
        console.log('[Monitor] All steps completed!')
        onCompleteRef.current?.()
      }
    }

    // Initialize
    fetchInitialStatus()
    subscribeToUpdates()

    // Cleanup function
    return () => {
      console.log('[Monitor] Cleaning up subscription')
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [taskId]) // Only re-subscribe when taskId changes, not onComplete

  // Get overall badge variant
  const getOverallBadgeVariant = () => {
    switch (taskStatus.overallStatus) {
      case 'pending':
        return 'outline'
      case 'processing':
        return 'info'
      case 'completed':
        return 'success'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Enrichment Pipeline Progress</CardTitle>
            <CardDescription>
              Monitoring channel: <span className="font-mono">{channelId}</span>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getOverallBadgeVariant()}>
              {taskStatus.overallStatus.toUpperCase()}
            </Badge>
            {isSubscribed && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                Live Updates
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          <StatusStep
            stepNumber={1}
            title="Channel Categorization"
            status={taskStatus.categorizationStatus}
            description="Analyzing channel content with Claude AI"
          />
          <StatusStep
            stepNumber={2}
            title="SocialBlade Metrics"
            status={taskStatus.socialbladeStatus}
            description="Fetching additional metrics from SocialBlade"
          />
          <StatusStep
            stepNumber={3}
            title="Recent Videos"
            status={taskStatus.recentVideosStatus}
            description="Fetching latest videos (sorted by newest)"
          />
          <StatusStep
            stepNumber={4}
            title="Trending Videos"
            status={taskStatus.trendingVideosStatus}
            description="Fetching popular videos (sorted by views)"
          />
          <StatusStep
            stepNumber={5}
            title="Performance Analysis"
            status={taskStatus.outlierAnalysisStatus}
            description="Calculating performance metrics and identifying outliers"
          />
        </div>
      </CardContent>
    </Card>
  )
}
