'use server'

import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  try {
    // Fetch benchmark videos in pending_distribution status
    const { data: videos, error } = await supabase
      .from('benchmark_videos')
      .select(`
        *,
        benchmark_channels!inner(
          channel_title,
          channel_handle
        )
      `)
      .eq('status', 'pending_distribution')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[getVideosAwaitingDistribution] Error fetching videos:', error)
      return { videos: [], error: error.message }
    }

    if (!videos || videos.length === 0) {
      return { videos: [], error: null }
    }

    // For each video, fetch eligible channels
    const videosWithChannels = await Promise.all(
      videos.map(async (video) => {
        // Parse categorization if it's a string
        const categorization =
          typeof video.categorization === 'string'
            ? JSON.parse(video.categorization)
            : video.categorization

        // Fetch eligible channels matching niche AND subniche
        const { data: channels } = await supabase
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

        return {
          ...video,
          categorization,
          eligibleChannels: channels || [],
        }
      })
    )

    return { videos: videosWithChannels as VideoWithChannels[], error: null }
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
  const supabase = await createClient()

  try {
    // Get video categorization
    const { data: video, error: videoError } = await supabase
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
    const { data: channels, error: channelsError } = await supabase
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
  const supabase = await createClient()

  try {
    // ========================================================================
    // Step 1: Validate video exists and is in pending_distribution
    // ========================================================================
    const { data: video, error: videoError } = await supabase
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

    const { data: channels, error: channelsError } = await supabase
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

    const { data: createdJobs, error: insertError } = await supabase
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
    const { error: updateError } = await supabase
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
