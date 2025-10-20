'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { startChannelBenchmark } from '../actions'
import { BenchmarkProgressMonitor } from './benchmark-progress-monitor'

/**
 * Form validation schema using Zod
 */
const formSchema = z.object({
  channelId: z
    .string()
    .min(1, {
      message: 'Channel ID is required',
    })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Channel ID must only contain letters, numbers, hyphens, and underscores',
    }),
})

type FormData = z.infer<typeof formSchema>

/**
 * Channel Benchmark Form Component
 *
 * Client Component that handles:
 * - Form state and validation
 * - Loading states
 * - Submission to Server Action
 * - Success/error feedback
 * - Real-time progress monitoring
 */
export function ChannelBenchmarkForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTask, setActiveTask] = useState<{
    taskId: number
    channelId: string
  } | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    error?: string
    jobId?: number
    taskId?: number
  } | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channelId: '',
    },
  })

  async function onSubmit(values: FormData) {
    try {
      setIsSubmitting(true)
      setResult(null)
      setActiveTask(null)

      console.log('[Form] Submitting channel ID:', values.channelId)

      const response = await startChannelBenchmark(values.channelId)

      setResult(response)

      if (response.success && response.taskId) {
        console.log('[Form] Benchmark started successfully:', response)
        // Set active task to show progress monitor
        setActiveTask({
          taskId: response.taskId,
          channelId: values.channelId,
        })
        // Reset form on success
        form.reset()
      } else {
        console.error('[Form] Benchmark failed:', response.error)
      }
    } catch (error) {
      console.error('[Form] Unexpected error:', error)
      setResult({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler for when monitoring is complete
  const handleMonitoringComplete = () => {
    console.log('[Form] Enrichment pipeline completed!')
  }

  // Handler to start a new benchmark
  const handleStartNew = () => {
    setActiveTask(null)
    setResult(null)
    form.reset()
  }

  // If there's an active task, show the progress monitor
  if (activeTask) {
    return (
      <div className="space-y-6">
        <BenchmarkProgressMonitor
          taskId={activeTask.taskId}
          channelId={activeTask.channelId}
          onComplete={handleMonitoringComplete}
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleStartNew}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Another Benchmark
          </Button>
        </div>
      </div>
    )
  }

  // Otherwise, show the form
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Start Channel Benchmark</CardTitle>
        <CardDescription>
          Enter a YouTube Channel ID to begin a comprehensive benchmark analysis.
          The system will analyze the channel&apos;s performance, videos, and statistics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="channelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Channel ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="UC1234567890ABCDEFGHIJ"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The unique identifier for the YouTube channel. You can find this in
                    the channel&apos;s URL or use a Channel ID lookup tool.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Benchmark...
                </>
              ) : (
                'Start Channel Benchmark'
              )}
            </Button>
          </form>
        </Form>

        {/* Error Feedback */}
        {result && !result.success && (
          <div className="mt-6 rounded-lg border border-red-500 bg-red-50 text-red-900 p-4">
            <h3 className="font-semibold mb-2">Error</h3>
            <p className="text-sm">{result.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
