'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// Video Enrichment Actions
// ============================================================================

interface EnrichmentResult {
  success: boolean
  keywords?: string[]
  relatedVideosCount?: number
  error?: string
}

/**
 * Enrich a video with keywords and related videos from RapidAPI
 */
export async function enrichVideo(
  videoId: number,
  youtubeVideoId: string
): Promise<EnrichmentResult> {
  try {
    const supabase = await createClient()

    // Verify video exists
    const { data: video, error: fetchError } = await supabase
      .from('benchmark_videos')
      .select('id, youtube_video_id, title')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      return {
        success: false,
        error: 'Video not found in database',
      }
    }

    // Call video-enrichment Edge Function
    const { data, error } = await supabase.functions.invoke('video-enrichment', {
      body: {
        youtubeVideoId,
        videoId,
      },
    })

    if (error) {
      console.error('[enrichVideo] Edge Function error:', error)
      return {
        success: false,
        error: error.message || 'Failed to enrich video',
      }
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Enrichment failed',
      }
    }

    // Revalidate the page to show new data
    revalidatePath(`/videos/${videoId}`)

    return {
      success: true,
      keywords: data.keywords || [],
      relatedVideosCount: data.relatedVideos?.length || 0,
    }
  } catch (error) {
    console.error('[enrichVideo] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

// ============================================================================
// Queue Management Actions
// ============================================================================

interface QueueResult {
  success: boolean
  queuedCount?: number
  skippedCount?: number
  errorCount?: number
  details?: Array<{
    youtubeVideoId: string
    status: string
    message: string
  }>
  error?: string
}

/**
 * Add videos to the enrichment queue for categorization
 */
export async function addVideosToQueue(
  youtubeVideoIds: string[],
  source: 'related' | 'manual' | 'radar' = 'related',
  parentVideoId?: number
): Promise<QueueResult> {
  try {
    const supabase = await createClient()

    // Call RPC function to batch add videos
    const { data, error } = await supabase.rpc('add_videos_to_enrichment_queue', {
      p_video_ids: youtubeVideoIds,
      p_source: source,
      p_parent_video_id: parentVideoId || null,
    })

    if (error) {
      console.error('[addVideosToQueue] RPC error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Count results
    const queuedCount = data.filter((r: any) => r.status === 'queued').length
    const skippedCount = data.filter((r: any) => r.status === 'skipped').length
    const errorCount = data.filter((r: any) => r.status === 'error').length

    console.log(
      `[addVideosToQueue] Results: ${queuedCount} queued, ${skippedCount} skipped, ${errorCount} errors`
    )

    // Revalidate relevant pages
    revalidatePath('/videos')
    if (parentVideoId) {
      revalidatePath(`/videos/${parentVideoId}`)
    }

    return {
      success: true,
      queuedCount,
      skippedCount,
      errorCount,
      details: data,
    }
  } catch (error) {
    console.error('[addVideosToQueue] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Add a single video to the queue
 */
export async function addVideoToQueue(
  youtubeVideoId: string,
  source: 'related' | 'manual' | 'radar' = 'related',
  parentVideoId?: number
): Promise<QueueResult> {
  return addVideosToQueue([youtubeVideoId], source, parentVideoId)
}

/**
 * Check if a video is already in database or queued
 */
export async function isVideoQueued(youtubeVideoId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('is_video_queued', {
      p_youtube_video_id: youtubeVideoId,
    })

    if (error) {
      console.error('[isVideoQueued] RPC error:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('[isVideoQueued] Unexpected error:', error)
    return false
  }
}

/**
 * Get enrichment queue status
 */
export async function getEnrichmentQueueStatus() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('video_enrichment_queue_status')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[getEnrichmentQueueStatus] Query error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('[getEnrichmentQueueStatus] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
