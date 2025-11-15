// Follow Deno best practices for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

/**
 * Enrichment Pipeline Starter - Edge Function
 *
 * This is the entry point of the channel enrichment pipeline.
 * It:
 * 1. Fetches channel details from RapidAPI
 * 2. Standardizes and saves data to benchmark_channels table
 * 3. Triggers the next step in the pipeline (categorization)
 *
 * @param channelId - YouTube Channel ID
 * @param taskId - Enrichment task ID for tracking
 */

interface RequestBody {
  channelId: string
  taskId: number
}

interface RapidAPIChannelResponse {
  channelId: string
  title: string
  description?: string
  subscriberCount?: number | string
  viewCount?: number | string
  videosCount?: number
  joinedDate?: string
  keywords?: string[]
  country?: string
  customUrl?: string
  channelHandle?: string
  thumbnail?: string  // Old API format (deprecated)
  avatar?: Array<{ url: string; width: number; height: number }>  // New API format
  banner?: string | Array<{ url: string; width: number; height: number }>  // Support both formats
  isVerified?: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Parse request body
    const { channelId, taskId }: RequestBody = await req.json()

    console.log(`[Pipeline] Starting enrichment for channel: ${channelId}, task: ${taskId}`)

    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Step 1: Update task status to 'processing'
    console.log(`[Pipeline] Updating task #${taskId} to 'processing'`)

    const { error: updateError } = await supabase
      .from('channel_enrichment_tasks')
      .update({
        overall_status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    if (updateError) {
      throw new Error(`Failed to update task status: ${updateError.message}`)
    }

    // Step 2: Get RapidAPI Key from Environment Variables
    console.log('[Pipeline] Getting RapidAPI key from environment')

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')

    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY environment variable not found. Please add it to Edge Function secrets.')
    }

    // Step 3: Call RapidAPI to get channel details
    console.log(`[Pipeline] Fetching channel data from RapidAPI for: ${channelId}`)

    const rapidApiUrl = `https://yt-api.p.rapidapi.com/channel/about?id=${channelId}`
    const rapidApiResponse = await fetch(rapidApiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
        'X-RapidAPI-Key': rapidApiKey,
      },
    })

    if (!rapidApiResponse.ok) {
      throw new Error(
        `RapidAPI request failed: ${rapidApiResponse.status} ${rapidApiResponse.statusText}`
      )
    }

    const apiData: RapidAPIChannelResponse = await rapidApiResponse.json()

    console.log('[Pipeline] Successfully fetched channel data from RapidAPI')

    // Helper: Select best avatar URL from array (prefer 176x176 for high quality)
    // Supports both old format (string) and new format (array)
    const getAvatarUrl = (
      avatarArray?: Array<{ url: string; width: number; height: number }>,
      thumbnailString?: string
    ): string | null => {
      // Try new format first (avatar array)
      if (avatarArray && Array.isArray(avatarArray) && avatarArray.length > 0) {
        // Prefer 176x176 for high quality
        const highRes = avatarArray.find(a => a.width >= 176)
        if (highRes) return highRes.url

        // Fallback to largest available
        const largest = avatarArray.reduce((prev, current) =>
          current.width > prev.width ? current : prev
        )
        return largest.url
      }

      // Fallback to old format (thumbnail string)
      return thumbnailString || null
    }

    // Helper: Convert banner to JSON string
    // Supports both old format (string) and new format (array)
    const getBannerUrl = (banner?: string | Array<{ url: string; width: number; height: number }>): string | null => {
      if (!banner) return null

      // If it's already a string, return as is (old format)
      if (typeof banner === 'string') return banner

      // If it's an array, convert to JSON (new format)
      if (Array.isArray(banner) && banner.length > 0) {
        return JSON.stringify(banner)
      }

      return null
    }

    // Step 4: Standardize and map API data to database schema
    const standardizedData = {
      channel_id: apiData.channelId || channelId,
      channel_name: apiData.title || null,
      description: apiData.description || null,
      subscriber_count: apiData.subscriberCount
        ? parseInt(String(apiData.subscriberCount), 10)
        : null,
      total_views: apiData.viewCount ? parseInt(String(apiData.viewCount), 10) : null,
      video_upload_count: apiData.videosCount || null,
      creation_date: apiData.joinedDate ? new Date(apiData.joinedDate).toISOString() : null,
      channel_keywords: apiData.keywords || null,
      metric_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      country: apiData.country || null,
      custom_url: apiData.customUrl || apiData.channelHandle || null,
      thumbnail_url: getAvatarUrl(apiData.avatar, apiData.thumbnail),
      banner_url: getBannerUrl(apiData.banner),
      is_verified: apiData.isVerified || false,
      updated_at: new Date().toISOString(),
    }

    console.log('[Pipeline] Standardized channel data:', {
      channel_id: standardizedData.channel_id,
      channel_name: standardizedData.channel_name,
      subscriber_count: standardizedData.subscriber_count,
    })

    // Step 5: UPSERT data into benchmark_channels table
    console.log(`[Pipeline] Upserting data into benchmark_channels for: ${channelId}`)

    const { data: upsertedChannel, error: upsertError } = await supabase
      .from('benchmark_channels')
      .upsert(standardizedData, {
        onConflict: 'channel_id',
        ignoreDuplicates: false,
      })
      .select('id, channel_id, channel_name, thumbnail_url')
      .single()

    if (upsertError || !upsertedChannel) {
      throw new Error(`Failed to upsert channel data: ${upsertError?.message || 'No data returned'}`)
    }

    console.log('[Pipeline] Successfully saved channel data to database')
    console.log('[Pipeline] Upserted channel:', {
      id: upsertedChannel.id,
      channel_id: upsertedChannel.channel_id,
      channel_name: upsertedChannel.channel_name,
    })

    // Step 6: Invoke next Edge Function in the pipeline (categorization)
    // Using fire-and-forget pattern to avoid timeout issues
    console.log('[Pipeline] Invoking next step: enrichment-step-1-categorization')
    console.log('[Pipeline] Invocation payload:', { channelId, taskId })

    // Fire and forget - don't wait for response to avoid timeout
    supabase.functions.invoke(
      'enrichment-step-1-categorization',
      {
        body: {
          channelId,
          taskId,
        },
      }
    ).then(({ data, error: invokeError }) => {
      if (invokeError) {
        console.error('[Pipeline] Error invoking Step 1:', invokeError)
        console.error('[Pipeline] Error details:', JSON.stringify(invokeError, null, 2))
      } else {
        console.log('[Pipeline] Successfully invoked Step 1')
        console.log('[Pipeline] Step 1 response:', data)
      }
    }).catch((invokeError) => {
      console.error('[Pipeline] Exception invoking Step 1:', invokeError)
    })

    console.log('[Pipeline] Step 1 invocation sent (fire-and-forget)')

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Pipeline started successfully for channel ${channelId}`,
        channelData: {
          id: upsertedChannel.id,
          channel_id: upsertedChannel.channel_id,
          channel_name: upsertedChannel.channel_name,
          thumbnail_url: upsertedChannel.thumbnail_url,
          subscriber_count: standardizedData.subscriber_count,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('[Pipeline] Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
