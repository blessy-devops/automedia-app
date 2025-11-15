// supabase/functions/receive-benchmark-videos/index.ts
// Edge Function para receber vídeos do Automedia Platform
//
// Deployment:
//   supabase functions deploy receive-benchmark-videos
//
// URL:
//   https://[PROJECT-ID].supabase.co/functions/v1/receive-benchmark-videos

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BenchmarkVideo {
  id?: number
  youtube_video_id: string
  channel_id: string
  title: string | null
  description: string | null
  views: number | null
  likes: number | null
  comments: number | null
  upload_date: string | null
  video_length: string | null
  thumbnail_url: string | null
  tags: any | null
  categorization: any | null
  keywords?: string[]
  related_video_ids?: string[]
  enrichment_data?: any
  performance_vs_avg_historical: number | null
  performance_vs_median_historical: number | null
  performance_vs_recent_14d: number | null
  performance_vs_recent_30d: number | null
  performance_vs_recent_90d: number | null
  is_outlier: boolean | null
  outlier_threshold: number | null
  last_enriched_at?: string | null
  created_at?: string
  updated_at?: string
}

interface WebhookPayload {
  videos: BenchmarkVideo[]
  metadata: {
    sent_at: string
    source: string
    video_count: number
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Optional: Autenticação via API Key
    // Descomente as linhas abaixo para habilitar
    /*
    const authHeader = req.headers.get('Authorization')
    const expectedKey = Deno.env.get('WEBHOOK_API_KEY')

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    */

    // Parse payload
    const payload: WebhookPayload = await req.json()

    console.log(`[receive-benchmark-videos] Received ${payload.videos?.length || 0} videos`)

    // Validate payload
    if (!payload.videos || !Array.isArray(payload.videos)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid payload: missing or invalid "videos" array',
          inserted: 0,
          updated: 0,
          failed: 0,
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
          inserted: 0,
          updated: 0,
          failed: 0,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Process videos
    let inserted = 0
    let updated = 0
    let failed = 0
    const errors: Array<{ youtube_video_id: string; error: string }> = []

    for (const video of payload.videos) {
      try {
        // Validate required fields
        if (!video.youtube_video_id || !video.channel_id) {
          failed++
          errors.push({
            youtube_video_id: video.youtube_video_id || 'unknown',
            error: 'Missing required fields: youtube_video_id or channel_id',
          })
          continue
        }

        // Prepare data for insertion (exclude source 'id')
        const videoData = {
          youtube_video_id: video.youtube_video_id,
          channel_id: video.channel_id,
          title: video.title,
          description: video.description,
          views: video.views,
          likes: video.likes,
          comments: video.comments,
          upload_date: video.upload_date,
          video_length: video.video_length,
          thumbnail_url: video.thumbnail_url,
          tags: video.tags,
          categorization: video.categorization,
          keywords: video.keywords || [],
          related_video_ids: video.related_video_ids || [],
          enrichment_data: video.enrichment_data || {},
          performance_vs_avg_historical: video.performance_vs_avg_historical,
          performance_vs_median_historical: video.performance_vs_median_historical,
          performance_vs_recent_14d: video.performance_vs_recent_14d,
          performance_vs_recent_30d: video.performance_vs_recent_30d,
          performance_vs_recent_90d: video.performance_vs_recent_90d,
          is_outlier: video.is_outlier,
          outlier_threshold: video.outlier_threshold,
          last_enriched_at: video.last_enriched_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Upsert: Insert or update if youtube_video_id exists
        const { error } = await supabase
          .from('benchmark_videos')
          .upsert(videoData, {
            onConflict: 'youtube_video_id',
            ignoreDuplicates: false,
          })

        if (error) {
          failed++
          errors.push({
            youtube_video_id: video.youtube_video_id,
            error: error.message,
          })
          console.error(`[receive-benchmark-videos] Error upserting video ${video.youtube_video_id}:`, error)
        } else {
          // Count as inserted (could check if it was update vs insert)
          inserted++
          console.log(`[receive-benchmark-videos] Successfully upserted video ${video.youtube_video_id}`)
        }
      } catch (videoError) {
        failed++
        errors.push({
          youtube_video_id: video.youtube_video_id || 'unknown',
          error: videoError instanceof Error ? videoError.message : 'Unknown error',
        })
        console.error('[receive-benchmark-videos] Error processing video:', videoError)
      }
    }

    // Log summary
    console.log(`[receive-benchmark-videos] Summary: inserted=${inserted}, updated=${updated}, failed=${failed}`)

    // Prepare response
    const response = {
      success: failed === 0,
      inserted,
      updated,
      failed,
      message:
        failed === 0
          ? 'Videos processed successfully'
          : failed === payload.videos.length
          ? 'All videos failed to process'
          : 'Partially processed',
      ...(errors.length > 0 && { errors }),
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[receive-benchmark-videos] Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        inserted: 0,
        updated: 0,
        failed: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
