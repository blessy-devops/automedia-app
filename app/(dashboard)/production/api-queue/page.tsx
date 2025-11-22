/**
 * API Queue Page - Integrated with Gobbi's production database
 */

import { ApiQueueClient } from './client'
import { createGobbiClient } from '@/lib/supabase/gobbi'
import { mapViewRowsToApiQueueJobs } from '@/features/api-queue/lib/adapters'
import type { QueueStats } from '@/features/api-queue/types'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  period?: string
}>

export default async function ApiQueuePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createGobbiClient()
  const params = await searchParams
  const period = params.period || '7d'

  let allJobs

  // If Gobbi client is not available (missing env vars), use mock data
  if (!supabase) {
    console.log('Gobbi Supabase not configured - using mock data')
    const { mockImageJobs, mockAudioJobs, mockVideoJobs } = await import('@/features/api-queue/lib/mock-data')
    allJobs = [...mockImageJobs, ...mockAudioJobs, ...mockVideoJobs]
  } else {
    // Calculate date cutoff based on period
    const getCutoffDate = (period: string): string | null => {
      const now = new Date()
      switch (period) {
        case '1h':
          return new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
        case '24h':
          return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        case '7d':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        case '30d':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        case 'all':
        default:
          return null
      }
    }

    const cutoffDate = getCutoffDate(period)

    // Fetch real data from enriched VIEW with period filter
    let query = supabase
      .from('vw_api_queue_enriched')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply period filter if not "all"
    if (cutoffDate) {
      query = query.gte('created_at', cutoffDate)
    }

    const { data: viewData, error } = await query.limit(500)

    if (error) {
      console.error('Error fetching queue data:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))

      // Fallback to mock data if VIEW query fails
      console.log('Using mock data as fallback')
      const { mockImageJobs, mockAudioJobs, mockVideoJobs } = await import('@/features/api-queue/lib/mock-data')
      allJobs = [...mockImageJobs, ...mockAudioJobs, ...mockVideoJobs]
    } else {
      allJobs = mapViewRowsToApiQueueJobs(viewData || [])
      console.log(`Loaded ${allJobs.length} jobs from database`)
    }
  }

  // Separate jobs by type
  const imageJobs = allJobs.filter(j => j.type === 'image')
  const audioJobs = allJobs.filter(j => j.type === 'audio')
  const videoJobs = allJobs.filter(j => j.type === 'video')
  const failedJobs = allJobs.filter(j => j.status === 'failed')

  // Calculate stats from jobs
  const stats: QueueStats = {
    processing: allJobs.filter(j => j.status === 'processing').length,
    queued: allJobs.filter(j => j.status === 'queued').length,
    completed24h: allJobs.filter(j => j.status === 'completed').length,
    failed24h: failedJobs.length,
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-[1600px]">
        <ApiQueueClient
          stats={stats}
          imageJobs={imageJobs}
          audioJobs={audioJobs}
          videoJobs={videoJobs}
          failedJobs={failedJobs}
          currentPeriod={period}
        />
      </div>
    </div>
  )
}
