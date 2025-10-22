'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  CheckCircle2,
  Loader2,
  Search,
  Database,
  TrendingUp,
  Video,
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileVideo,
  ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RealtimeChannel } from '@supabase/supabase-js'
import { getEnrichmentTaskStatus } from '../actions'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface BenchmarkProgressMonitorProps {
  taskId: number
  channelId: string
  onComplete?: () => void
}

type StepStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface SubStep {
  id: string
  text: string
  status: StepStatus
}

interface BenchmarkStep {
  id: string
  title: string
  status: StepStatus
  icon: React.ReactNode
  subSteps: SubStep[]
}

/**
 * BenchmarkProgressMonitor Component
 *
 * Monitors enrichment task progress in real-time using Supabase Realtime.
 * Displays pipeline steps with live status updates and collapsible sub-steps.
 */
export function BenchmarkProgressMonitor({
  taskId,
  channelId,
  onComplete,
}: BenchmarkProgressMonitorProps) {
  const shouldReduceMotion = useReducedMotion()
  const [expandedSteps, setExpandedSteps] = useState<string[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [overallStatus, setOverallStatus] = useState<StepStatus>('pending')

  const [steps, setSteps] = useState<BenchmarkStep[]>([
    {
      id: 'categorization',
      title: 'Step 1 (channel categorization)',
      status: 'pending',
      icon: <Database className="w-4 h-4" />,
      subSteps: [
        { id: 'cat-1', text: 'Buscando dados do canal no BD', status: 'pending' },
        { id: 'cat-2', text: 'Buscando vídeos recentes via RapidAPI', status: 'pending' },
        { id: 'cat-3', text: 'Carregando opções de categorização', status: 'pending' },
        { id: 'cat-4', text: 'AI Agent categorizando canal (OpenRouter)', status: 'pending' },
        { id: 'cat-5', text: 'Salvando categorização no BD', status: 'pending' },
      ],
    },
    {
      id: 'socialblade',
      title: 'Step 2 (scrapping socialblade website)',
      status: 'pending',
      icon: <TrendingUp className="w-4 h-4" />,
      subSteps: [
        { id: 'sb-1', text: 'Scrapeando últimos 14 dias (SocialBlade)', status: 'pending' },
        { id: 'sb-2', text: 'Calculando métricas e growth rate', status: 'pending' },
        { id: 'sb-3', text: 'Salvando baseline stats no BD', status: 'pending' },
      ],
    },
    {
      id: 'recent-videos',
      title: 'Step 3 (searching for recent-videos)',
      status: 'pending',
      icon: <Video className="w-4 h-4" />,
      subSteps: [
        { id: 'rv-1', text: 'Buscando vídeos recentes via RapidAPI', status: 'pending' },
        { id: 'rv-2', text: 'Filtrando e salvando vídeos no BD', status: 'pending' },
        { id: 'rv-3', text: 'Iniciando categorização paralela', status: 'pending' },
      ],
    },
    {
      id: 'trending-videos',
      title: 'Step 4 (searching for trending-videos)',
      status: 'pending',
      icon: <FileVideo className="w-4 h-4" />,
      subSteps: [
        { id: 'tv-1', text: 'Buscando vídeos em alta via RapidAPI', status: 'pending' },
        { id: 'tv-2', text: 'Filtrando e salvando vídeos no BD', status: 'pending' },
        { id: 'tv-3', text: 'Iniciando categorização paralela', status: 'pending' },
      ],
    },
    {
      id: 'outlier-analysis',
      title: 'Step 5 (calculating videos outlier ratios)',
      status: 'pending',
      icon: <BarChart3 className="w-4 h-4" />,
      subSteps: [
        { id: 'oa-1', text: 'Buscando vídeos sem outlier ratios', status: 'pending' },
        { id: 'oa-2', text: 'Levantando dados baseline do canal', status: 'pending' },
        { id: 'oa-3', text: 'Calculando outlier ratios (5 métricas)', status: 'pending' },
        { id: 'oa-4', text: 'Salvando ratios calculados no BD', status: 'pending' },
      ],
    },
  ])

  // Helper function to simulate sub-step progress
  const simulateSubStepProgress = async (stepId: string, stepIndex: number) => {
    const step = steps[stepIndex]
    if (!step || step.status !== 'processing') return

    console.log(`[Monitor] Simulating progress for ${stepId}`)

    // Animate each sub-step sequentially
    for (let subIndex = 0; subIndex < step.subSteps.length; subIndex++) {
      // Check if step is still processing (might have completed early)
      setSteps((prevSteps) => {
        if (prevSteps[stepIndex].status !== 'processing') {
          // Step completed early, skip simulation
          return prevSteps
        }

        const newSteps = [...prevSteps]

        // Set current sub-step to processing
        newSteps[stepIndex].subSteps[subIndex].status = 'processing'

        return newSteps
      })

      // Wait a bit (simulate work being done)
      await new Promise(resolve => setTimeout(resolve, 400))

      // Check again before completing
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps]

        if (prevSteps[stepIndex].status === 'processing') {
          // Mark as completed
          newSteps[stepIndex].subSteps[subIndex].status = 'completed'
        } else if (prevSteps[stepIndex].status === 'completed') {
          // Step completed, mark all remaining as completed
          for (let i = subIndex; i < newSteps[stepIndex].subSteps.length; i++) {
            newSteps[stepIndex].subSteps[i].status = 'completed'
          }
        }

        return newSteps
      })
    }
  }

  useEffect(() => {
    console.log('[Monitor] Setting up Realtime subscription for task:', taskId)

    const supabase = createClient()
    let channel: RealtimeChannel

    // Helper function to update steps based on task status
    const updateStepsFromTask = (data: any) => {
      console.log('[Monitor] Updating steps from task data:', data)

      setOverallStatus((data.overall_status || 'pending') as StepStatus)

      setSteps((prevSteps) => {
        const newSteps = [...prevSteps]

        // Update Step 1: Categorization
        const categorizationStatus = (data.categorization_status || 'pending') as StepStatus
        const wasStep1Processing = prevSteps[0].status === 'processing'
        newSteps[0].status = categorizationStatus

        if (categorizationStatus === 'processing' && !wasStep1Processing) {
          // Just started processing - expand and simulate
          setExpandedSteps((prev) => prev.includes('categorization') ? prev : [...prev, 'categorization'])
          setTimeout(() => simulateSubStepProgress('categorization', 0), 100)
        } else if (categorizationStatus === 'completed' && wasStep1Processing) {
          // Just completed - mark all sub-steps as completed and collapse after delay
          newSteps[0].subSteps.forEach(sub => sub.status = 'completed')
          setTimeout(() => {
            setExpandedSteps((prev) => prev.filter(id => id !== 'categorization'))
          }, 2000)
        }

        // Update Step 2: SocialBlade
        const socialbladeStatus = (data.socialblade_status || 'pending') as StepStatus
        const wasStep2Processing = prevSteps[1].status === 'processing'
        newSteps[1].status = socialbladeStatus

        if (socialbladeStatus === 'processing' && !wasStep2Processing) {
          setExpandedSteps((prev) => prev.includes('socialblade') ? prev : [...prev, 'socialblade'])
          setTimeout(() => simulateSubStepProgress('socialblade', 1), 100)
        } else if (socialbladeStatus === 'completed' && wasStep2Processing) {
          newSteps[1].subSteps.forEach(sub => sub.status = 'completed')
          setTimeout(() => {
            setExpandedSteps((prev) => prev.filter(id => id !== 'socialblade'))
          }, 2000)
        }

        // Update Step 3: Recent Videos
        const recentVideosStatus = (data.recent_videos_status || 'pending') as StepStatus
        const wasStep3Processing = prevSteps[2].status === 'processing'
        newSteps[2].status = recentVideosStatus

        if (recentVideosStatus === 'processing' && !wasStep3Processing) {
          setExpandedSteps((prev) => prev.includes('recent-videos') ? prev : [...prev, 'recent-videos'])
          setTimeout(() => simulateSubStepProgress('recent-videos', 2), 100)
        } else if (recentVideosStatus === 'completed' && wasStep3Processing) {
          newSteps[2].subSteps.forEach(sub => sub.status = 'completed')
          setTimeout(() => {
            setExpandedSteps((prev) => prev.filter(id => id !== 'recent-videos'))
          }, 2000)
        }

        // Update Step 4: Trending Videos
        const trendingVideosStatus = (data.trending_videos_status || 'pending') as StepStatus
        const wasStep4Processing = prevSteps[3].status === 'processing'
        newSteps[3].status = trendingVideosStatus

        if (trendingVideosStatus === 'processing' && !wasStep4Processing) {
          setExpandedSteps((prev) => prev.includes('trending-videos') ? prev : [...prev, 'trending-videos'])
          setTimeout(() => simulateSubStepProgress('trending-videos', 3), 100)
        } else if (trendingVideosStatus === 'completed' && wasStep4Processing) {
          newSteps[3].subSteps.forEach(sub => sub.status = 'completed')
          setTimeout(() => {
            setExpandedSteps((prev) => prev.filter(id => id !== 'trending-videos'))
          }, 2000)
        }

        // Update Step 5: Outlier Analysis
        const outlierAnalysisStatus = (data.outlier_analysis_status || 'pending') as StepStatus
        const wasStep5Processing = prevSteps[4].status === 'processing'
        newSteps[4].status = outlierAnalysisStatus

        if (outlierAnalysisStatus === 'processing' && !wasStep5Processing) {
          setExpandedSteps((prev) => prev.includes('outlier-analysis') ? prev : [...prev, 'outlier-analysis'])
          setTimeout(() => simulateSubStepProgress('outlier-analysis', 4), 100)
        } else if (outlierAnalysisStatus === 'completed' && wasStep5Processing) {
          newSteps[4].subSteps.forEach(sub => sub.status = 'completed')
          setTimeout(() => {
            setExpandedSteps((prev) => prev.filter(id => id !== 'outlier-analysis'))
          }, 2000)
        }

        return newSteps
      })

      // Call onComplete callback when overall status is completed
      if (data.overall_status === 'completed') {
        console.log('[Monitor] Pipeline completed!')
        onComplete?.()
      }
    }

    // Fetch initial task status via Server Action
    const fetchInitialStatus = async () => {
      const result = await getEnrichmentTaskStatus(taskId)

      if (!result.success || !result.data) {
        console.error('[Monitor] Error fetching initial status:', result.error)
        return
      }

      console.log('[Monitor] Initial task status:', result.data)
      updateStepsFromTask(result.data)
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
            updateStepsFromTask(payload.new)
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

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    )
  }

  const shouldAnimate = !shouldReduceMotion

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  }

  // Get overall badge variant
  const getOverallBadgeVariant = () => {
    switch (overallStatus) {
      case 'pending':
        return 'outline'
      case 'processing':
        return 'default'
      case 'completed':
        return 'default'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <motion.div
      className="w-full"
      initial={shouldAnimate ? 'hidden' : 'visible'}
      animate="visible"
      variants={shouldAnimate ? containerVariants : {}}
    >
      <Card className="bg-card border-border shadow-lg">
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold text-foreground">
                Channel Benchmark
              </h2>
              <Badge variant={getOverallBadgeVariant()} className={cn(
                overallStatus === 'completed' && 'bg-green-500 hover:bg-green-600'
              )}>
                {overallStatus.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-mono">{channelId}</p>
              {isSubscribed && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  Live Updates
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <motion.div
                key={step.id}
                variants={shouldAnimate ? itemVariants : {}}
              >
                <Collapsible
                  open={expandedSteps.includes(step.id)}
                  onOpenChange={() => toggleStep(step.id)}
                >
                  <div
                    className={cn(
                      'rounded-lg border transition-all duration-200',
                      step.status === 'completed'
                        ? 'bg-green-500/10 border-green-500/30'
                        : step.status === 'processing'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-muted/50 border-border'
                    )}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex items-center justify-center w-8 h-8 rounded-full',
                              step.status === 'completed'
                                ? 'bg-green-500 text-white'
                                : step.status === 'processing'
                                ? 'bg-blue-500 text-white'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {step.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : step.status === 'processing' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              step.icon
                            )}
                          </div>
                          <div className="text-left">
                            <p
                              className={cn(
                                'font-medium',
                                step.status === 'completed'
                                  ? 'text-green-600 dark:text-green-400'
                                  : step.status === 'processing'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {step.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {step.status === 'completed' && (
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              ✓ Completed
                            </span>
                          )}
                          {expandedSteps.includes(step.id) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-0 space-y-2 border-t border-border/50 mt-2 pt-3">
                        {step.subSteps.map((subStep) => (
                          <div
                            key={subStep.id}
                            className="flex items-center gap-3 pl-11"
                          >
                            <div className="flex items-center justify-center w-5 h-5">
                              {subStep.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : subStep.status === 'processing' ? (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                              )}
                            </div>
                            <span
                              className={cn(
                                'text-sm',
                                subStep.status === 'completed'
                                  ? 'text-green-600 dark:text-green-400'
                                  : subStep.status === 'processing'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {subStep.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </motion.div>
            ))}
          </div>

          {overallStatus === 'completed' && (
            <div className="mt-6 flex justify-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={`/channels/${channelId}`}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Channel Details
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
