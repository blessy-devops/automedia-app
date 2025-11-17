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
      status: 'create_title', // First stage of production pipeline
      is_processing: false,
      distribution_mode: 'manual', // Track how this was distributed
      distributed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      .update({
        status: 'used',
        updated_at: new Date().toISOString(),
      })
      .eq('id', benchmarkVideoId)

    if (updateError) {
      console.error(
        '[distributeVideoToChannels] Error updating benchmark video status:',
        updateError
      )
      // Don't return error here because production jobs were already created
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
      .update({
        status: 'available',
        updated_at: new Date().toISOString(),
      })
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
