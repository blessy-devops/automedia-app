// supabase/functions/receive-benchmark-videos/index.ts
// Edge Function para RECEBER vídeos via webhook no banco do Gobbi
//
// ⚠️ ESTE ARQUIVO DEVE SER DEPLOYADO NO SUPABASE DO GOBBI, NÃO NO SEU
//
// Deployment (no Supabase do Gobbi):
//   1. Criar pasta: supabase/functions/receive-benchmark-videos/
//   2. Copiar este arquivo para: supabase/functions/receive-benchmark-videos/index.ts
//   3. Deploy: npx supabase functions deploy receive-benchmark-videos --project-ref eafkhsmgrzywrhviisdl
//
// Setup Secrets (opcional - para autenticação):
//   npx supabase secrets set WEBHOOK_API_KEY=seu-secret-key-aqui --project-ref eafkhsmgrzywrhviisdl
//
// URL após deploy:
//   https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos
//
// Usage:
//   POST https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos
//   Headers:
//     Content-Type: application/json
//     Authorization: Bearer YOUR_WEBHOOK_API_KEY (se configurado)
//   Body:
//     {
//       "videos": [...],
//       "metadata": {
//         "sent_at": "2025-11-14T20:00:00Z",
//         "source": "automedia-platform",
//         "video_count": 10
//       }
//     }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-key',
}

interface BenchmarkChannel {
  // Required field
  channel_id: string

  // Core fields
  channel_name?: string | null
  description?: string | null
  subscriber_count?: number | null
  video_count?: number | null
  view_count?: number | null
  published_at?: string | null

  // New fields (require migration)
  thumbnail_url?: string | null
  banner_url?: string | null
  custom_url?: string | null
  country?: string | null
  is_verified?: boolean | null
}

interface BenchmarkVideo {
  // Required fields
  youtube_video_id: string
  channel_id: string

  // Core fields
  title?: string | null
  description?: string | null
  thumbnail_url?: string | null
  upload_date?: string | null
  video_length?: string | null

  // Metrics
  views?: number | null
  likes?: number | null
  comments?: number | null

  // JSONB fields
  tags?: any | null
  categorization?: any | null
  keywords?: string[]
  related_video_ids?: string[]
  enrichment_data?: any

  // Performance metrics
  performance_vs_avg_historical?: number | null
  performance_vs_median_historical?: number | null
  performance_vs_recent_14d?: number | null
  performance_vs_recent_30d?: number | null
  performance_vs_recent_90d?: number | null
  is_outlier?: boolean | null
  outlier_threshold?: number | null

  // Gobbi-specific fields
  youtube_url?: string | null
  channel_name?: string | null
  metrics_last_updated?: string | null
  video_transcript?: string | null
  video_age_days?: number | null
  views_per_day?: number | null
  momentum_vs_14d?: number | null
  status?: string | null

  // Timestamps
  last_enriched_at?: string | null
}

interface WebhookPayload {
  channels?: BenchmarkChannel[]
  videos: BenchmarkVideo[]
  metadata?: {
    sent_at: string
    source: string
    video_count: number
    channel_count?: number
  }
}

interface ProcessingResult {
  success: boolean
  channels_inserted: number
  channels_updated: number
  channels_failed: number
  videos_inserted: number
  videos_updated: number
  videos_failed: number
  message: string
  errors?: Array<{
    type: 'channel' | 'video'
    id: string
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
    console.log('[receive-benchmark-videos] Incoming webhook request')

    // Create Supabase client (Gobbi's database)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authentication disabled for testing
    // TODO: Re-enable authentication after testing
    // const webhookApiKey = Deno.env.get('WEBHOOK_API_KEY')
    // if (webhookApiKey) {
    //   const webhookKey = req.headers.get('X-Webhook-Key')
    //   if (!webhookKey || webhookKey !== webhookApiKey) {
    //     console.warn('[receive-benchmark-videos] Unauthorized request')
    //     return new Response(
    //       JSON.stringify({ success: false, error: 'Unauthorized' }),
    //       { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //     )
    //   }
    // }

    // Parse payload
    const payload: WebhookPayload = await req.json()

    console.log(`[receive-benchmark-videos] Received payload with ${payload.channels?.length || 0} channels and ${payload.videos?.length || 0} videos`)
    if (payload.metadata) {
      console.log(`[receive-benchmark-videos] Metadata: ${JSON.stringify(payload.metadata)}`)
    }

    // Validate payload
    if (!payload.videos || !Array.isArray(payload.videos)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid payload: missing or invalid "videos" array',
          channels_inserted: 0,
          channels_updated: 0,
          channels_failed: 0,
          videos_inserted: 0,
          videos_updated: 0,
          videos_failed: 0,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (payload.videos.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No videos provided',
          channels_inserted: 0,
          channels_updated: 0,
          channels_failed: 0,
          videos_inserted: 0,
          videos_updated: 0,
          videos_failed: 0,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Process channels FIRST (to avoid FK constraint errors)
    let channelsInserted = 0
    let channelsUpdated = 0
    let channelsFailed = 0

    // Process videos
    let videosInserted = 0
    let videosUpdated = 0
    let videosFailed = 0
    const errors: Array<{ type: 'channel' | 'video'; id: string; error: string }> = []

    // Step 1: Process channels (if provided)
    if (payload.channels && Array.isArray(payload.channels) && payload.channels.length > 0) {
      console.log(`[receive-benchmark-videos] Processing ${payload.channels.length} channels...`)

      for (const channel of payload.channels) {
        try {
          // Validate required field
          if (!channel.channel_id) {
            channelsFailed++
            errors.push({
              type: 'channel',
              id: 'unknown',
              error: 'Missing required field: channel_id',
            })
            console.error(`[receive-benchmark-videos] Skipping channel: missing channel_id`)
            continue
          }

          // Prepare channel data
          const channelData: any = {
            channel_id: channel.channel_id,
            ...(channel.channel_name && { channel_name: channel.channel_name }),
            ...(channel.description && { description: channel.description }),
            ...(channel.subscriber_count !== undefined && channel.subscriber_count !== null && {
              subscriber_count: channel.subscriber_count
            }),
            ...(channel.video_count !== undefined && channel.video_count !== null && {
              video_count: channel.video_count
            }),
            ...(channel.view_count !== undefined && channel.view_count !== null && {
              view_count: channel.view_count
            }),
            ...(channel.published_at && { published_at: channel.published_at }),
            // New fields (require migration)
            ...(channel.thumbnail_url && { thumbnail_url: channel.thumbnail_url }),
            ...(channel.banner_url && { banner_url: channel.banner_url }),
            ...(channel.custom_url && { custom_url: channel.custom_url }),
            ...(channel.country && { country: channel.country }),
            ...(channel.is_verified !== undefined && channel.is_verified !== null && {
              is_verified: channel.is_verified
            }),
          }

          // Check if channel exists
          const { data: existingChannel, error: checkError } = await supabase
            .from('benchmark_channels')
            .select('id, channel_id')
            .eq('channel_id', channel.channel_id)
            .single()

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError
          }

          // Upsert channel
          const { error: upsertError } = await supabase
            .from('benchmark_channels')
            .upsert(channelData, {
              onConflict: 'channel_id',
              ignoreDuplicates: false,
            })

          if (upsertError) {
            channelsFailed++
            errors.push({
              type: 'channel',
              id: channel.channel_id,
              error: upsertError.message,
            })
            console.error(
              `[receive-benchmark-videos] Error upserting channel ${channel.channel_id}:`,
              upsertError
            )
          } else {
            if (existingChannel) {
              channelsUpdated++
              console.log(`[receive-benchmark-videos] Updated channel ${channel.channel_id}`)
            } else {
              channelsInserted++
              console.log(`[receive-benchmark-videos] Inserted new channel ${channel.channel_id}`)
            }
          }
        } catch (channelError) {
          channelsFailed++
          errors.push({
            type: 'channel',
            id: channel.channel_id || 'unknown',
            error: channelError instanceof Error ? channelError.message : 'Unknown error',
          })
          console.error('[receive-benchmark-videos] Error processing channel:', channelError)
        }
      }

      console.log(`[receive-benchmark-videos] Channel processing complete: ${channelsInserted} new, ${channelsUpdated} updated, ${channelsFailed} failed`)
    }

    // Step 2: Process videos

    for (const video of payload.videos) {
      try {
        // Validate required fields
        if (!video.youtube_video_id || !video.channel_id) {
          videosFailed++
          errors.push({
            type: 'video',
            id: video.youtube_video_id || 'unknown',
            error: 'Missing required fields: youtube_video_id or channel_id',
          })
          console.error(`[receive-benchmark-videos] Skipping video: missing required fields`)
          continue
        }

        // Prepare data for insertion (ALL compatible fields)
        const videoData: any = {
          // Required identifiers
          youtube_video_id: video.youtube_video_id,
          channel_id: video.channel_id,

          // Core metadata (always send if present)
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnail_url,

          // Compatible optional fields (22 total fields can be sent after migration)
          // Note: Do NOT send youtube_url (GENERATED column), id (SERIAL), or created_at (DEFAULT)
          ...(video.upload_date && { upload_date: video.upload_date }),
          ...(video.video_length && { video_length: video.video_length }),
          ...(video.views !== undefined && video.views !== null && { views: video.views }),
          ...(video.channel_name && { channel_name: video.channel_name }),
          ...(video.metrics_last_updated && { metrics_last_updated: video.metrics_last_updated }),
          ...(video.video_transcript && { video_transcript: video.video_transcript }),
          ...(video.categorization && { categorization: video.categorization }),
          ...(video.performance_vs_avg_historical !== undefined && video.performance_vs_avg_historical !== null && {
            performance_vs_avg_historical: video.performance_vs_avg_historical,
          }),
          ...(video.performance_vs_median_historical !== undefined && video.performance_vs_median_historical !== null && {
            performance_vs_median_historical: video.performance_vs_median_historical,
          }),
          ...(video.video_age_days !== undefined && video.video_age_days !== null && {
            video_age_days: video.video_age_days,
          }),
          ...(video.views_per_day !== undefined && video.views_per_day !== null && {
            views_per_day: video.views_per_day,
          }),
          ...(video.momentum_vs_14d !== undefined && video.momentum_vs_14d !== null && {
            momentum_vs_14d: video.momentum_vs_14d,
          }),
          ...(video.status && { status: video.status }),
          // New enrichment fields (require migration to be run first)
          ...(video.enrichment_data && { enrichment_data: video.enrichment_data }),
          ...(video.performance_vs_recent_14d !== undefined && video.performance_vs_recent_14d !== null && {
            performance_vs_recent_14d: video.performance_vs_recent_14d,
          }),
          ...(video.keywords && Array.isArray(video.keywords) && { keywords: video.keywords }),
          ...(video.related_video_ids && Array.isArray(video.related_video_ids) && {
            related_video_ids: video.related_video_ids,
          }),
        }

        // Check if video already exists
        const { data: existing, error: checkError } = await supabase
          .from('benchmark_videos')
          .select('id, youtube_video_id')
          .eq('youtube_video_id', video.youtube_video_id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          // Error other than "not found"
          throw checkError
        }

        // Note: created_at is handled by database default (now())
        // Don't manually set created_at - let the database handle it

        // Upsert: Insert or update if youtube_video_id exists
        const { error: upsertError } = await supabase
          .from('benchmark_videos')
          .upsert(videoData, {
            onConflict: 'youtube_video_id',
            ignoreDuplicates: false,
          })

        if (upsertError) {
          videosFailed++
          errors.push({
            type: 'video',
            id: video.youtube_video_id,
            error: upsertError.message,
          })
          console.error(
            `[receive-benchmark-videos] Error upserting video ${video.youtube_video_id}:`,
            upsertError
          )
        } else {
          if (existing) {
            videosUpdated++
            console.log(`[receive-benchmark-videos] Updated video ${video.youtube_video_id}`)
          } else {
            videosInserted++
            console.log(`[receive-benchmark-videos] Inserted new video ${video.youtube_video_id}`)
          }
        }
      } catch (videoError) {
        videosFailed++
        errors.push({
          type: 'video',
          id: video.youtube_video_id || 'unknown',
          error: videoError instanceof Error ? videoError.message : 'Unknown error',
        })
        console.error('[receive-benchmark-videos] Error processing video:', videoError)
      }
    }

    const duration = Date.now() - startTime
    const totalFailed = channelsFailed + videosFailed

    // Log summary
    console.log(
      `[receive-benchmark-videos] Summary: channels(${channelsInserted} new, ${channelsUpdated} updated, ${channelsFailed} failed), videos(${videosInserted} new, ${videosUpdated} updated, ${videosFailed} failed), duration=${duration}ms`
    )

    // Prepare response
    const response: ProcessingResult = {
      success: totalFailed === 0,
      channels_inserted: channelsInserted,
      channels_updated: channelsUpdated,
      channels_failed: channelsFailed,
      videos_inserted: videosInserted,
      videos_updated: videosUpdated,
      videos_failed: videosFailed,
      message:
        totalFailed === 0
          ? `Successfully processed ${channelsInserted + channelsUpdated} channels and ${videosInserted + videosUpdated} videos`
          : totalFailed === (payload.channels?.length || 0) + payload.videos.length
          ? `All ${totalFailed} items failed to process`
          : `Partially processed: ${channelsInserted + channelsUpdated} channels, ${videosInserted + videosUpdated} videos (${totalFailed} failed)`,
      duration_ms: duration,
      ...(errors.length > 0 && { errors }),
    }

    return new Response(JSON.stringify(response), {
      status: totalFailed === 0 ? 200 : 207, // 207 Multi-Status for partial success
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[receive-benchmark-videos] Fatal error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        channels_inserted: 0,
        channels_updated: 0,
        channels_failed: 0,
        videos_inserted: 0,
        videos_updated: 0,
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
