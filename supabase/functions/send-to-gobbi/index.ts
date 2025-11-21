// supabase/functions/send-to-gobbi/index.ts
// Edge Function para enviar vídeos do seu banco para o banco do Gobbi via HTTP webhook
//
// Deployment:
//   supabase functions deploy send-to-gobbi --project-ref YOUR_PROJECT_REF
//
// Setup:
//   Nenhum secret necessário! A função usa HTTP POST para o webhook do Gobbi.
//   O webhook URL é buscado da tabela production_webhooks.
//
// Usage:
//   POST https://[YOUR-PROJECT].supabase.co/functions/v1/send-to-gobbi
//   Body: { "video_ids": [123, 456, 789] }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendWebhookPayload {
  video_ids: number[]
  options?: {
    include_transcript?: boolean  // Include video_transcript (large field)
    batch_size?: number           // Send in batches of N videos
  }
}

interface WebhookResponse {
  success: boolean
  channels_sent: number
  channels_failed: number
  videos_sent: number
  videos_failed: number
  message: string
  errors?: Array<{
    type: 'channel' | 'video'
    id: string | number
    error: string
  }>
  duration_ms?: number
}

serve(async (req) => {
  const startTime = Date.now()

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[send-to-gobbi] Starting webhook send process')

    // Parse request payload
    const payload: SendWebhookPayload = await req.json()

    // Validate payload
    if (!payload.video_ids || !Array.isArray(payload.video_ids)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid payload: video_ids must be an array',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (payload.video_ids.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No video_ids provided',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`[send-to-gobbi] Request to send ${payload.video_ids.length} videos`)

    // Create client for local database (source)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch webhook URL from production_webhooks table
    console.log('[send-to-gobbi] Fetching webhook URL from production_webhooks table')
    const { data: webhook, error: webhookError } = await supabase
      .from('production_webhooks')
      .select('webhook_url, name, is_active, api_key')
      .eq('name', 'receive-benchmark-videos')
      .eq('is_active', true)
      .single()

    if (webhookError || !webhook) {
      console.error('[send-to-gobbi] Error fetching webhook:', webhookError)
      throw new Error('Webhook "receive-benchmark-videos" not found or inactive in production_webhooks table')
    }

    const webhookUrl = webhook.webhook_url
    console.log(`[send-to-gobbi] Using webhook URL: ${webhookUrl}`)

    // Fetch videos from local database
    // Select ONLY compatible fields that exist in Gobbi's schema (22 total after migration)
    const { data: videos, error: fetchError } = await supabase
      .from('benchmark_videos')
      .select(`
        youtube_video_id,
        channel_id,
        title,
        description,
        upload_date,
        video_length,
        thumbnail_url,
        views,
        channel_name,
        metrics_last_updated,
        video_age_days,
        views_per_day,
        categorization,
        performance_vs_avg_historical,
        performance_vs_median_historical,
        performance_vs_recent_14d,
        momentum_vs_14d,
        status,
        enrichment_data,
        keywords,
        related_video_ids
        ${payload.options?.include_transcript !== false ? ', video_transcript' : ''}
      `)
      .in('id', payload.video_ids)

    if (fetchError) {
      console.error('[send-to-gobbi] Error fetching videos:', fetchError)
      throw fetchError
    }

    if (!videos || videos.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No videos found for the provided IDs',
          videos_sent: 0,
          videos_failed: payload.video_ids.length,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch complete channel data for all unique channels in the videos
    const channelIds = [...new Set(videos.map(v => v.channel_id))]
    const { data: channels, error: channelsError } = await supabase
      .from('benchmark_channels')
      .select(`
        channel_id,
        channel_name,
        description,
        subscriber_count,
        video_upload_count,
        total_views,
        thumbnail_url,
        banner_url,
        custom_url,
        country,
        is_verified
      `)
      .in('channel_id', channelIds)

    if (channelsError) {
      console.error('[send-to-gobbi] Error fetching channels:', channelsError)
      console.error('[send-to-gobbi] Channel IDs:', channelIds)
    }

    // Map channel names for video fallback
    const channelMap = new Map(
      (channels || []).map(c => [c.channel_id, c.channel_name])
    )

    // Map channel fields from our schema to Gobbi's schema
    // Note: Only send fields that exist in Gobbi's benchmark_channels table
    const mappedChannels = (channels || []).map(channel => ({
      channel_id: channel.channel_id,
      channel_name: channel.channel_name,
      description: channel.description,
      subscriber_count: channel.subscriber_count,
      // Note: video_count, view_count, published_at removed - columns don't exist in Gobbi's table
      thumbnail_url: channel.thumbnail_url,
      banner_url: channel.banner_url,
      custom_url: channel.custom_url,
      country: channel.country,
      is_verified: channel.is_verified,
    }))

    console.log(`[send-to-gobbi] Fetched ${videos.length} videos and ${mappedChannels.length} channels from local database`)

    // Prepare videos for webhook
    //
    // ⚠️ ARCHITECTURAL DECISION (2025-11-19): Status is forced to "pending_distribution"
    //
    // NEW ARCHITECTURE (current):
    //   Video → pending_distribution → Distribution UI → [catraca ao distribuir] → production_videos
    //
    // OLD ARCHITECTURE (deprecated):
    //   Video → add_to_production → [CRON a cada 2min] → pending_distribution → Distribution UI
    //
    // Why we changed:
    //   - Videos appear instantly in distribution screen (no 2-minute delay)
    //   - Simpler: no CRON needed just to change status
    //   - Queue control ("catraca") happens at the right moment: when distributing to production
    //
    // See: docs/gobbi-database/WEBHOOK_ARCHITECTURE.md (section "MUDANÇA DE ARQUITETURA DA FILA")
    //
    // Note: Do NOT add youtube_url (GENERATED column in Gobbi's DB)
    const videosWithMetadata = videos.map((video) => ({
      ...video,
      status: 'pending_distribution', // Videos go directly to distribution queue
      channel_name: video.channel_name || channelMap.get(video.channel_id) || null, // Fallback to channel map
    }))

    // Send in batches if batch_size is specified
    const batchSize = payload.options?.batch_size || videos.length
    let totalVideosSent = 0
    let totalVideosFailed = 0
    let totalChannelsSent = 0
    let totalChannelsFailed = 0
    const errors: Array<{ type: 'channel' | 'video'; id: string | number; error: string }> = []

    for (let i = 0; i < videosWithMetadata.length; i += batchSize) {
      const batch = videosWithMetadata.slice(i, i + batchSize)
      console.log(`[send-to-gobbi] Sending batch ${Math.floor(i / batchSize) + 1} (${batch.length} videos)`)

      try {
        // Prepare webhook payload
        // Send channels only once (in the first batch) to avoid duplicates
        const webhookPayload = {
          ...(i === 0 && mappedChannels && mappedChannels.length > 0 && { channels: mappedChannels }),
          videos: batch,
          metadata: {
            sent_at: new Date().toISOString(),
            source: 'automedia-platform',
            video_count: batch.length,
            ...(i === 0 && mappedChannels && { channel_count: mappedChannels.length }),
          },
        }

        // Send HTTP POST to webhook
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(webhook.api_key && { 'X-Webhook-Key': webhook.api_key }),
          },
          body: JSON.stringify(webhookPayload),
        })

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text()
          console.error('[send-to-gobbi] Webhook error:', errorText)

          // Try to identify which videos/channels failed
          if (i === 0 && mappedChannels && mappedChannels.length > 0) {
            mappedChannels.forEach((channel) => {
              errors.push({
                type: 'channel',
                id: channel.channel_id,
                error: `Webhook returned ${webhookResponse.status}: ${errorText}`,
              })
            })
            totalChannelsFailed += mappedChannels.length
          }
          batch.forEach((video, idx) => {
            errors.push({
              type: 'video',
              id: payload.video_ids[i + idx],
              error: `Webhook returned ${webhookResponse.status}: ${errorText}`,
            })
          })
          totalVideosFailed += batch.length
        } else {
          const webhookResult = await webhookResponse.json()
          console.log(`[send-to-gobbi] Webhook response:`, webhookResult)

          // Track success/failure based on webhook response
          if (webhookResult.success) {
            // Track channels (only first batch)
            if (i === 0) {
              totalChannelsSent += (webhookResult.channels_inserted || 0) + (webhookResult.channels_updated || 0)
              totalChannelsFailed += webhookResult.channels_failed || 0
            }
            // Track videos
            totalVideosSent += (webhookResult.videos_inserted || 0) + (webhookResult.videos_updated || 0)
            totalVideosFailed += webhookResult.videos_failed || 0

            // Add webhook-reported errors
            if (webhookResult.errors && Array.isArray(webhookResult.errors)) {
              webhookResult.errors.forEach((err: any) => {
                errors.push({
                  type: err.type || 'video',
                  id: err.id || err.youtube_video_id || 'unknown',
                  error: err.error,
                })
              })
            }
          } else {
            // Total failure - log full webhook response for debugging
            console.error('[send-to-gobbi] Webhook returned failure. Full response:', JSON.stringify(webhookResult, null, 2))

            const errorMessage = webhookResult.error || webhookResult.message || 'Unknown webhook error'

            if (i === 0 && mappedChannels && mappedChannels.length > 0) {
              totalChannelsFailed += mappedChannels.length
              mappedChannels.forEach((channel) => {
                errors.push({
                  type: 'channel',
                  id: channel.channel_id,
                  error: errorMessage,
                })
              })
            }
            totalVideosFailed += batch.length
            batch.forEach((video, idx) => {
              errors.push({
                type: 'video',
                id: payload.video_ids[i + idx],
                error: errorMessage,
              })
            })
          }
        }
      } catch (batchError) {
        console.error('[send-to-gobbi] Batch error:', batchError)
        if (i === 0 && mappedChannels && mappedChannels.length > 0) {
          mappedChannels.forEach((channel) => {
            errors.push({
              type: 'channel',
              id: channel.channel_id,
              error: batchError instanceof Error ? batchError.message : 'Unknown batch error',
            })
          })
          totalChannelsFailed += mappedChannels.length
        }
        batch.forEach((video, idx) => {
          errors.push({
            type: 'video',
            id: payload.video_ids[i + idx],
            error: batchError instanceof Error ? batchError.message : 'Unknown batch error',
          })
        })
        totalVideosFailed += batch.length
      }

      // Add small delay between batches to avoid rate limiting
      if (i + batchSize < videosWithMetadata.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    const duration = Date.now() - startTime
    const totalFailed = totalChannelsFailed + totalVideosFailed

    console.log(`[send-to-gobbi] Complete: channels(${totalChannelsSent} sent, ${totalChannelsFailed} failed), videos(${totalVideosSent} sent, ${totalVideosFailed} failed) in ${duration}ms`)

    // Prepare response
    const response: WebhookResponse = {
      success: totalFailed === 0,
      channels_sent: totalChannelsSent,
      channels_failed: totalChannelsFailed,
      videos_sent: totalVideosSent,
      videos_failed: totalVideosFailed,
      message:
        totalFailed === 0
          ? `Successfully sent ${totalChannelsSent} channels and ${totalVideosSent} videos to Gobbi's database`
          : totalChannelsSent + totalVideosSent === 0
          ? `All ${totalFailed} items failed to send`
          : `Partially successful: ${totalChannelsSent} channels, ${totalVideosSent} videos sent; ${totalFailed} failed`,
      duration_ms: duration,
      ...(errors.length > 0 && { errors }),
    }

    return new Response(JSON.stringify(response), {
      status: totalFailed === 0 ? 200 : 207, // 207 Multi-Status for partial success
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[send-to-gobbi] Fatal error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        channels_sent: 0,
        channels_failed: 0,
        videos_sent: 0,
        videos_failed: 0,
        duration_ms: duration,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
