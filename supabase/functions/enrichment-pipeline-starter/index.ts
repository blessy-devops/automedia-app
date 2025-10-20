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
  thumbnail?: string
  banner?: string
}

Deno.serve(async (req) => {
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

    // Step 2: Fetch RapidAPI Key from Supabase Vault
    console.log('[Pipeline] Fetching RapidAPI key from Vault')

    const { data: vaultData, error: vaultError } = await supabase.rpc('get_secret', {
      secret_name: 'rapidapi_key_1760651731629',
    })

    if (vaultError || !vaultData) {
      throw new Error(`Failed to fetch API key from Vault: ${vaultError?.message || 'No data'}`)
    }

    const rapidApiKey = vaultData as string

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
      custom_url: apiData.customUrl || null,
      thumbnail_url: apiData.thumbnail || null,
      banner_url: apiData.banner || null,
      is_verified: false, // TODO: Get from API if available
      updated_at: new Date().toISOString(),
    }

    console.log('[Pipeline] Standardized channel data:', {
      channel_id: standardizedData.channel_id,
      channel_name: standardizedData.channel_name,
      subscriber_count: standardizedData.subscriber_count,
    })

    // Step 5: UPSERT data into benchmark_channels table
    console.log(`[Pipeline] Upserting data into benchmark_channels for: ${channelId}`)

    const { error: upsertError } = await supabase
      .from('benchmark_channels')
      .upsert(standardizedData, {
        onConflict: 'channel_id',
        ignoreDuplicates: false,
      })

    if (upsertError) {
      throw new Error(`Failed to upsert channel data: ${upsertError.message}`)
    }

    console.log('[Pipeline] Successfully saved channel data to database')

    // Step 6: Invoke next Edge Function in the pipeline (categorization)
    console.log('[Pipeline] Invoking next step: enrichment-step-1-categorization')

    try {
      const { error: invokeError } = await supabase.functions.invoke(
        'enrichment-step-1-categorization',
        {
          body: {
            channelId,
            taskId,
          },
        }
      )

      if (invokeError) {
        console.error('[Pipeline] Error invoking next step:', invokeError)
        // Don't fail - the task is saved and can be retried
      } else {
        console.log('[Pipeline] Successfully invoked categorization step')
      }
    } catch (invokeError) {
      console.error('[Pipeline] Exception invoking next step:', invokeError)
      // Continue - task can be retried
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Pipeline started successfully for channel ${channelId}`,
        channelData: {
          channel_id: standardizedData.channel_id,
          channel_name: standardizedData.channel_name,
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
