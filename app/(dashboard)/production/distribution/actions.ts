'use server'

import { gobbiClient, ensureServerSide } from '@/lib/gobbi-client'
import { revalidatePath } from 'next/cache'

// ============================================================================
// Type Definitions
// ============================================================================

interface BenchmarkVideo {
  id: number
  title: string
  description: string | null
  categorization: string | Record<string, any>
  video_transcript: string | null
  youtube_video_id: string
  youtube_url: string
  status: string
  created_at: string
  benchmark_channels?: {
    channel_title: string
    channel_handle: string
  }
}

interface StructureAccount {
  unique_profile_id: string
  placeholder: string
  niche: string
  subniche: string
  language: string
  structure_brand_bible?: {
    brand_identity: Record<string, any>
    production_workflow_id: string
    visual_style?: Record<string, any>
    narrative_tone?: Record<string, any>
  }[]
}

interface VideoWithChannels extends BenchmarkVideo {
  categorization: {
    niche: string
    subniche: string
    microniche?: string
    category?: string
    format?: string
  }
  eligibleChannels: StructureAccount[]
}

interface DistributionInput {
  benchmarkVideoId: number
  selectedChannelIds: string[] // unique_profile_ids
}

interface DistributionResult {
  success: boolean
  error?: string
  jobsCreated?: number
  channels?: string[]
  productionJobIds?: number[] // IDs of created production jobs (for undo)
}

// ============================================================================
// Server Action 1: Get Videos Awaiting Distribution
// ============================================================================

export async function getVideosAwaitingDistribution(): Promise<{
  videos: VideoWithChannels[]
  error: string | null
}> {
  ensureServerSide()

  try {
    // Call RPC function in Gobbi's database
    const { data, error } = await gobbiClient.rpc('get_videos_awaiting_distribution')

    if (error) {
      console.error('[getVideosAwaitingDistribution] RPC error:', error)
      return { videos: [], error: error.message }
    }

    if (!data) {
      return { videos: [], error: null }
    }

    // RPC returns { videos: [...], error: null }
    const result = data as { videos: VideoWithChannels[]; error: string | null }

    if (result.error) {
      console.error('[getVideosAwaitingDistribution] RPC returned error:', result.error)
      return { videos: [], error: result.error }
    }

    console.log(`[getVideosAwaitingDistribution] Fetched ${result.videos.length} videos awaiting distribution`)

    return { videos: result.videos, error: null }
  } catch (error) {
    console.error('[getVideosAwaitingDistribution] Unexpected error:', error)
    return {
      videos: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Server Action 2: Get Eligible Channels (Helper)
// ============================================================================

export async function getEligibleChannels(benchmarkVideoId: number): Promise<{
  channels: StructureAccount[]
  error: string | null
}> {
  ensureServerSide()

  try {
    // Get video categorization
    const { data: video, error: videoError } = await gobbiClient
      .from('benchmark_videos')
      .select('categorization')
      .eq('id', benchmarkVideoId)
      .single()

    if (videoError || !video) {
      console.error('[getEligibleChannels] Video not found:', benchmarkVideoId)
      return { channels: [], error: 'Video not found' }
    }

    // Parse categorization
    const categorization =
      typeof video.categorization === 'string'
        ? JSON.parse(video.categorization)
        : video.categorization

    // Fetch eligible channels matching niche AND subniche
    const { data: channels, error: channelsError } = await gobbiClient
      .from('structure_accounts')
      .select(`
        *,
        structure_brand_bible(
          brand_identity,
          production_workflow_id,
          visual_style,
          narrative_tone
        )
      `)
      .eq('niche', categorization.niche)
      .eq('subniche', categorization.subniche) // AND condition
      .order('placeholder', { ascending: true })

    if (channelsError) {
      console.error('[getEligibleChannels] Error fetching channels:', channelsError)
      return { channels: [], error: channelsError.message }
    }

    return { channels: (channels || []) as StructureAccount[], error: null }
  } catch (error) {
    console.error('[getEligibleChannels] Unexpected error:', error)
    return {
      channels: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Server Action 3: Distribute Video to Channels
// ============================================================================

export async function distributeVideoToChannels({
  benchmarkVideoId,
  selectedChannelIds,
}: DistributionInput): Promise<DistributionResult> {
  ensureServerSide()

  try {
    // ========================================================================
    // Step 1: Validate video exists and is in pending_distribution
    // ========================================================================
    const { data: video, error: videoError } = await gobbiClient
      .from('benchmark_videos')
      .select('*')
      .eq('id', benchmarkVideoId)
      .eq('status', 'pending_distribution')
      .single()

    if (videoError || !video) {
      console.error(
        '[distributeVideoToChannels] Video not found or invalid status:',
        benchmarkVideoId
      )
      return {
        success: false,
        error: 'Video not found or not in pending_distribution status',
      }
    }

    // ========================================================================
    // Step 2: Validate selected channels are eligible
    // ========================================================================
    const categorization =
      typeof video.categorization === 'string'
        ? JSON.parse(video.categorization)
        : video.categorization

    const { data: channels, error: channelsError } = await gobbiClient
      .from('structure_accounts')
      .select('*')
      .eq('niche', categorization.niche)
      .eq('subniche', categorization.subniche) // AND condition
      .in('unique_profile_id', selectedChannelIds)

    if (channelsError || !channels || channels.length !== selectedChannelIds.length) {
      console.error(
        '[distributeVideoToChannels] Invalid channels selected:',
        channelsError
      )
      return {
        success: false,
        error: 'Some selected channels are not eligible or do not exist',
      }
    }

    // ========================================================================
    // Step 3: Create production jobs for each selected channel
    // ========================================================================
    const productionJobs = channels.map((channel) => ({
      benchmark_id: video.id,
      benchmark_title: video.title,
      benchmark_video_transcript: video.video_transcript,
      unique_profile_id: channel.unique_profile_id,
      placeholder: channel.placeholder,
      language: channel.language,
      description: video.description,
      status: 'queued', // Jobs start in queue, pipeline starter moves to 'create_title'
      is_processing: false,
      distribution_mode: 'manual', // Track how this was distributed
      distributed_at: new Date().toISOString(),
    }))

    const { data: createdJobs, error: insertError } = await gobbiClient
      .from('production_videos')
      .insert(productionJobs)
      .select()

    if (insertError) {
      console.error('[distributeVideoToChannels] Error creating production jobs:', insertError)
      return { success: false, error: insertError.message }
    }

    // ========================================================================
    // Step 4: Update benchmark video status to 'used'
    // ========================================================================
    const { error: updateError } = await gobbiClient
      .from('benchmark_videos')
      .update({ status: 'used' })
      .eq('id', benchmarkVideoId)

    if (updateError) {
      console.error(
        '[distributeVideoToChannels] Error updating benchmark video status:',
        updateError
      )
      // Don't return error here because production jobs were already created
      // But we should still notify about this issue
      console.error(
        '[distributeVideoToChannels] WARNING: Video will remain in pending_distribution!',
        'Video ID:', benchmarkVideoId
      )
    }

    // ========================================================================
    // Step 5: Revalidate affected pages
    // ========================================================================
    revalidatePath('/production/distribution')
    revalidatePath('/production/videos')
    revalidatePath('/benchmark/videos')

    console.log(
      `[distributeVideoToChannels] Successfully distributed video ${benchmarkVideoId} to ${createdJobs.length} channels`
    )

    return {
      success: true,
      jobsCreated: createdJobs.length,
      channels: channels.map((c) => c.placeholder),
      productionJobIds: createdJobs.map((job) => job.id), // Return job IDs for undo
    }
  } catch (error) {
    console.error('[distributeVideoToChannels] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Server Action 4: Remove Video from Distribution Queue
// ============================================================================

export async function removeVideoFromQueue(
  benchmarkVideoId: number
): Promise<{ success: boolean; error?: string }> {
  ensureServerSide()

  try {
    // Validate video exists and is in pending_distribution
    const { data: video, error: videoError } = await gobbiClient
      .from('benchmark_videos')
      .select('id, status')
      .eq('id', benchmarkVideoId)
      .eq('status', 'pending_distribution')
      .single()

    if (videoError || !video) {
      console.error('[removeVideoFromQueue] Video not found or invalid status:', benchmarkVideoId)
      return {
        success: false,
        error: 'Video not found or not in pending_distribution status',
      }
    }

    // Update status back to 'available' (so it can be re-added later if needed)
    const { error: updateError } = await gobbiClient
      .from('benchmark_videos')
      .update({ status: 'available' })
      .eq('id', benchmarkVideoId)

    if (updateError) {
      console.error('[removeVideoFromQueue] Error updating video status:', updateError)
      return { success: false, error: updateError.message }
    }

    // Revalidate pages
    revalidatePath('/production/distribution')
    revalidatePath('/benchmark/videos')

    console.log(`[removeVideoFromQueue] Successfully removed video ${benchmarkVideoId} from queue`)

    return { success: true }
  } catch (error) {
    console.error('[removeVideoFromQueue] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Server Action 5: Undo Distribution (Restore video + Delete production jobs)
// ============================================================================

export async function undoDistribution(
  benchmarkVideoId: number,
  productionJobIds: number[]
): Promise<{ success: boolean; error?: string }> {
  ensureServerSide()

  try {
    // ========================================================================
    // Step 1: Validate video exists and is in 'used' status
    // ========================================================================
    const { data: video, error: videoError } = await gobbiClient
      .from('benchmark_videos')
      .select('id, status')
      .eq('id', benchmarkVideoId)
      .eq('status', 'used')
      .single()

    if (videoError || !video) {
      console.error('[undoDistribution] Video not found or not in used status:', benchmarkVideoId)
      return {
        success: false,
        error: 'Video not found or not in used status',
      }
    }

    // ========================================================================
    // Step 2: Delete production jobs created from this distribution
    // ========================================================================
    if (productionJobIds.length > 0) {
      const { error: deleteError } = await gobbiClient
        .from('production_videos')
        .delete()
        .in('id', productionJobIds)

      if (deleteError) {
        console.error('[undoDistribution] Error deleting production jobs:', deleteError)
        return { success: false, error: deleteError.message }
      }
    }

    // ========================================================================
    // Step 3: Update video status back to pending_distribution
    // ========================================================================
    const { error: updateError } = await gobbiClient
      .from('benchmark_videos')
      .update({ status: 'pending_distribution' })
      .eq('id', benchmarkVideoId)

    if (updateError) {
      console.error('[undoDistribution] Error updating video status:', updateError)
      return { success: false, error: updateError.message }
    }

    // ========================================================================
    // Step 4: Revalidate affected pages
    // ========================================================================
    revalidatePath('/production/distribution')
    revalidatePath('/production/videos')
    revalidatePath('/benchmark/videos')

    console.log(`[undoDistribution] Successfully undone distribution for video ${benchmarkVideoId}`)

    return { success: true }
  } catch (error) {
    console.error('[undoDistribution] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Server Action 6: Restore Video to Queue
// ============================================================================

export async function restoreVideoToQueue(
  benchmarkVideoId: number
): Promise<{ success: boolean; error?: string }> {
  ensureServerSide()

  try {
    // ========================================================================
    // Step 1: Validate video exists and is in 'available' status
    // ========================================================================
    const { data: video, error: videoError } = await gobbiClient
      .from('benchmark_videos')
      .select('id, status')
      .eq('id', benchmarkVideoId)
      .eq('status', 'available')
      .single()

    if (videoError || !video) {
      console.error('[restoreVideoToQueue] Video not found or not in available status:', benchmarkVideoId)
      return {
        success: false,
        error: 'Video not found or not in available status',
      }
    }

    // ========================================================================
    // Step 2: Update status back to pending_distribution
    // ========================================================================
    const { error: updateError } = await gobbiClient
      .from('benchmark_videos')
      .update({ status: 'pending_distribution' })
      .eq('id', benchmarkVideoId)

    if (updateError) {
      console.error('[restoreVideoToQueue] Error updating video status:', updateError)
      return { success: false, error: updateError.message }
    }

    // ========================================================================
    // Step 3: Revalidate affected pages
    // ========================================================================
    revalidatePath('/production/distribution')
    revalidatePath('/benchmark/videos')

    console.log(`[restoreVideoToQueue] Successfully restored video ${benchmarkVideoId} to queue`)

    return { success: true }
  } catch (error) {
    console.error('[restoreVideoToQueue] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Server Action 7: Get Distributed Videos (for "Distributed" tab)
// ============================================================================

interface DistributedVideo {
  id: number
  title: string
  youtube_video_id: string
  youtube_url: string
  distributed_at: string
  channels: Array<{
    placeholder: string
    production_video_id: number
    status: string
  }>
}

export async function getDistributedVideos(options: {
  offset?: number
  limit?: number
} = {}): Promise<{
  videos: DistributedVideo[]
  totalCount: number
  hasMore: boolean
  error: string | null
}> {
  ensureServerSide()

  const { offset = 0, limit = 20 } = options

  try {
    // Call optimized RPC function
    const { data, error: rpcError } = await gobbiClient.rpc(
      'get_distributed_videos_paginated',
      {
        p_offset: offset,
        p_limit: limit,
      }
    )

    if (rpcError) {
      console.error('[getDistributedVideos] RPC error:', rpcError)
      return { videos: [], totalCount: 0, hasMore: false, error: rpcError.message }
    }

    if (!data) {
      return { videos: [], totalCount: 0, hasMore: false, error: null }
    }

    // RPC returns { videos: [...], totalCount: number, hasMore: boolean }
    const result = data as {
      videos: Array<{
        id: number
        title: string
        youtube_video_id: string
        youtube_url: string
        distributed_at: string
        production_videos: Array<{
          id: number
          placeholder: string
          status: string
          distributed_at: string
        }>
      }>
      totalCount: number
      hasMore: boolean
    }

    // Transform to match interface
    const videos: DistributedVideo[] = result.videos.map((video) => ({
      id: video.id,
      title: video.title,
      youtube_video_id: video.youtube_video_id,
      youtube_url: video.youtube_url,
      distributed_at: video.distributed_at,
      channels: video.production_videos.map((pv) => ({
        placeholder: pv.placeholder || 'Unknown',
        production_video_id: pv.id,
        status: pv.status,
      })),
    }))

    console.log(
      `[getDistributedVideos] Fetched ${videos.length} videos via RPC (offset: ${offset}, total: ${result.totalCount}, hasMore: ${result.hasMore})`
    )

    return {
      videos,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
      error: null,
    }
  } catch (error) {
    console.error('[getDistributedVideos] Unexpected error:', error)
    return {
      videos: [],
      totalCount: 0,
      hasMore: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
