// Video Enrichment Edge Function
// Fetches extended video metadata from RapidAPI (keywords, related videos)
// Author: Claude Code
// Date: 2025-11-13

// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnrichmentRequest {
  youtubeVideoId: string
  videoId: number
}

interface RelatedVideo {
  videoId: string
  title: string
  channelTitle: string
  channelId: string
  viewCount: string
  publishedTimeText?: string
  lengthText?: string
  thumbnail: Array<{ url: string; width: number; height: number }>
}

interface EnrichmentResponse {
  success: boolean
  keywords?: string[]
  relatedVideos?: RelatedVideo[]
  enrichmentData?: any
  error?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { youtubeVideoId, videoId }: EnrichmentRequest = await req.json()

    if (!youtubeVideoId || !videoId) {
      throw new Error('Missing required parameters: youtubeVideoId and videoId')
    }

    console.log(`[video-enrichment] Processing video: ${youtubeVideoId} (DB ID: ${videoId})`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get RapidAPI key from environment variables
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')

    if (!rapidApiKey) {
      console.error('[video-enrichment] RAPIDAPI_KEY environment variable not found')
      throw new Error('RAPIDAPI_KEY environment variable not found. Please add it to Edge Function secrets.')
    }

    console.log('[video-enrichment] RapidAPI key retrieved successfully')

    // Call RapidAPI Video Info endpoint for keywords
    console.log(`[video-enrichment] Calling RapidAPI /video/info for: ${youtubeVideoId}`)

    const videoInfoUrl = `https://yt-api.p.rapidapi.com/video/info?id=${youtubeVideoId}`
    const videoInfoResponse = await fetch(videoInfoUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
      },
    })

    if (!videoInfoResponse.ok) {
      const errorText = await videoInfoResponse.text()
      console.error('[video-enrichment] RapidAPI /video/info error:', videoInfoResponse.status, errorText)
      throw new Error(`RapidAPI /video/info request failed: ${videoInfoResponse.status}`)
    }

    const videoData = await videoInfoResponse.json()
    console.log(`[video-enrichment] Received video info for: ${videoData.title}`)

    // Extract keywords
    const keywords: string[] = videoData.keywords || []
    console.log(`[video-enrichment] Extracted ${keywords.length} keywords`)

    // Call RapidAPI Related Videos endpoint
    console.log(`[video-enrichment] Calling RapidAPI /related for: ${youtubeVideoId}`)

    const relatedUrl = `https://yt-api.p.rapidapi.com/related?id=${youtubeVideoId}`
    const relatedResponse = await fetch(relatedUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
      },
    })

    if (!relatedResponse.ok) {
      const errorText = await relatedResponse.text()
      console.error('[video-enrichment] RapidAPI /related error:', relatedResponse.status, errorText)
      throw new Error(`RapidAPI /related request failed: ${relatedResponse.status}`)
    }

    const relatedData = await relatedResponse.json()
    console.log(`[video-enrichment] Received related videos data`)

    // Extract related videos from the 'data' array
    const relatedVideos: RelatedVideo[] = (relatedData.data || [])
      .filter((rv: any) => rv.type === 'video') // Only keep actual videos
      .map((rv: any) => ({
        videoId: rv.videoId,
        title: rv.title,
        channelTitle: rv.channelTitle,
        channelId: rv.channelId,
        viewCount: rv.viewCountText || '0',
        publishedTimeText: rv.publishedTimeText,
        lengthText: rv.lengthText,
        thumbnail: rv.thumbnail || [],
      }))
    console.log(`[video-enrichment] Extracted ${relatedVideos.length} related videos`)

    // Extract related video IDs
    const relatedVideoIds = relatedVideos.map(rv => rv.videoId)

    // Store enrichment data in database (combine both API responses)
    const { error: updateError } = await supabase
      .from('benchmark_videos')
      .update({
        keywords,
        related_video_ids: relatedVideoIds,
        enrichment_data: {
          ...videoData,
          relatedVideos: relatedVideos, // Add related videos to enrichment data
        },
        last_enriched_at: new Date().toISOString(),
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('[video-enrichment] Database update error:', updateError)
      throw new Error(`Failed to update database: ${updateError.message}`)
    }

    console.log(`[video-enrichment] Successfully enriched video ${videoId}`)

    // Return response
    const response: EnrichmentResponse = {
      success: true,
      keywords,
      relatedVideos,
      enrichmentData: {
        title: videoData.title,
        viewCount: videoData.viewCount,
        likeCount: videoData.likeCount,
        commentCount: videoData.commentCount,
      },
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('[video-enrichment] Error:', error)

    const errorResponse: EnrichmentResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
