'use client'

import { useEffect, useState } from 'react'
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
  fetchVideosStatus: StepStatus
  baselineStatsStatus: StepStatus
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
 * 3. Video Fetching (YouTube API)
 * 4. Baseline Statistics
 * 5. Outlier Analysis
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
    fetchVideosStatus: 'pending',
    baselineStatsStatus: 'pending',
    outlierAnalysisStatus: 'pending',
  })

  const [isSubscribed, setIsSubscribed] = useState(false)

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
        fetchVideosStatus: (data.fetch_videos_status || 'pending') as StepStatus,
        baselineStatsStatus: (data.baseline_stats_status || 'pending') as StepStatus,
        outlierAnalysisStatus: (data.outlier_analysis_status || 'pending') as StepStatus,
      }

      console.log('[Monitor] Updating task status:', newStatus)
      setTaskStatus(newStatus)

      // Call onComplete callback if all steps are completed
      if (
        newStatus.overallStatus === 'completed' &&
        newStatus.categorizationStatus === 'completed' &&
        newStatus.socialbladeStatus === 'completed' &&
        newStatus.fetchVideosStatus === 'completed' &&
        newStatus.baselineStatsStatus === 'completed' &&
        newStatus.outlierAnalysisStatus === 'completed'
      ) {
        console.log('[Monitor] All steps completed!')
        onComplete?.()
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
  }, [taskId, onComplete])

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
            title="Video Fetching"
            status={taskStatus.fetchVideosStatus}
            description="Retrieving channel videos via YouTube API"
          />
          <StatusStep
            stepNumber={4}
            title="Baseline Statistics"
            status={taskStatus.baselineStatsStatus}
            description="Calculating performance baselines (14d, 30d, 90d)"
          />
          <StatusStep
            stepNumber={5}
            title="Outlier Analysis"
            status={taskStatus.outlierAnalysisStatus}
            description="Identifying high-performing outlier videos"
          />
        </div>
      </CardContent>
    </Card>
  )
}
