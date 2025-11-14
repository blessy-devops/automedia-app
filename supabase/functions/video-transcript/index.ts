// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

/**
 * Helper function to clean SRT transcript text
 * Removes timestamps, sequence numbers, HTML tags, and bracketed notations
 * @param srtText - Raw SRT subtitle text
 * @returns Cleaned transcript as plain text
 */
function cleanSrt(srtText: string): string {
  if (!srtText) return ''

  let cleaned = srtText

  // 1. Remove timestamps (format: 00:00:00,000 --> 00:00:02,000)
  cleaned = cleaned.replace(/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/g, '')

  // 2. Remove sequence numbers and extra line breaks
  cleaned = cleaned.replace(/^\d+[\r\n]+/gm, '')

  // 3. Remove HTML tags (like <i>, </i>, <b>, etc.)
  cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '')

  // 4. Remove bracketed notations (like [Music], [Applause], [Laughter])
  cleaned = cleaned.replace(/\[[^\]]*\]/g, '')

  // 5. Replace multiple spaces and line breaks with single space
  cleaned = cleaned.replace(/\s+/g, ' ')

  // 6. Trim and return
  return cleaned.trim()
}

/**
 * Video Transcript Fetcher (Worker Function)
 *
 * A pure worker function that fetches, cleans, and saves video transcripts.
 * Called by video-categorization-manager when transcript is missing.
 *
 * Process:
 * 1. Check if transcript already exists in DB (optimization)
 * 2. Fetch available subtitles from RapidAPI
 * 3. Prioritize 'pt' then 'en' subtitles
 * 4. Download SRT subtitle file
 * 5. Clean SRT text (remove timestamps, tags, etc.)
 * 6. Save to benchmark_videos.video_transcript
 * 7. Return cleaned transcript to caller
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    console.log('[Video Transcript] Starting transcript fetch')

    const { youtube_video_id } = await req.json()

    if (!youtube_video_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameter: youtube_video_id' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`[Video Transcript] Processing video: ${youtube_video_id}`)

    // ========================================================================
    // STEP 1: Check if transcript already exists (optimization)
    // ========================================================================
    console.log('[Video Transcript] Checking if transcript already exists in DB...')

    const { data: existingVideo, error: selectError } = await supabase
      .from('benchmark_videos')
      .select('video_transcript')
      .eq('youtube_video_id', youtube_video_id)
      .single()

    if (existingVideo && existingVideo.video_transcript) {
      console.log(`[Video Transcript] Transcript already exists for ${youtube_video_id}. Returning from DB.`)

      return new Response(
        JSON.stringify({
          success: true,
          transcript: existingVideo.video_transcript,
          source: 'database',
        }),
        { status: 200, headers: corsHeaders }
      )
    }

    // ========================================================================
    // STEP 2: Get RapidAPI key from Environment Variables
    // ========================================================================
    console.log('[Video Transcript] Getting RapidAPI key from environment...')

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')

    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY environment variable not found. Please add it to Edge Function secrets.')
    }

    // ========================================================================
    // STEP 3: Call RapidAPI - List available subtitles
    // ========================================================================
    console.log('[Video Transcript] Fetching available subtitles from RapidAPI...')

    const subtitlesResponse = await fetch(
      `https://yt-api.p.rapidapi.com/subtitles?id=${youtube_video_id}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
        },
      }
    )

    if (!subtitlesResponse.ok) {
      const errorText = await subtitlesResponse.text()
      throw new Error(`RapidAPI subtitles request failed: ${subtitlesResponse.status} - ${errorText}`)
    }

    const subtitlesData = await subtitlesResponse.json()
    const subtitles = subtitlesData.subtitles || []

    console.log(`[Video Transcript] Found ${subtitles.length} subtitle(s)`)

    // ========================================================================
    // STEP 4: Find best subtitle (priority: 'pt' -> 'en')
    // ========================================================================
    let selectedSubtitle = null

    // Try Portuguese first
    selectedSubtitle = subtitles.find((sub: any) => sub.languageCode === 'pt')

    // Fallback to English
    if (!selectedSubtitle) {
      selectedSubtitle = subtitles.find((sub: any) => sub.languageCode === 'en')
    }

    // No subtitles available
    if (!selectedSubtitle || !selectedSubtitle.url) {
      console.log('[Video Transcript] No suitable subtitles found (pt/en)')

      return new Response(
        JSON.stringify({
          success: true,
          transcript: null,
          message: 'No Portuguese or English subtitles available',
        }),
        { status: 200, headers: corsHeaders }
      )
    }

    console.log(`[Video Transcript] Selected subtitle: ${selectedSubtitle.languageCode}`)

    // ========================================================================
    // STEP 5: Download SRT subtitle file
    // ========================================================================
    console.log('[Video Transcript] Downloading SRT subtitle...')

    const encodedSubtitleUrl = encodeURIComponent(selectedSubtitle.url)
    const srtDownloadUrl = `https://yt-api.p.rapidapi.com/subtitle?url=${encodedSubtitleUrl}&format=srt`

    const srtResponse = await fetch(srtDownloadUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
      },
    })

    if (!srtResponse.ok) {
      const errorText = await srtResponse.text()
      throw new Error(`RapidAPI SRT download failed: ${srtResponse.status} - ${errorText}`)
    }

    const srtText = await srtResponse.text()
    console.log(`[Video Transcript] Downloaded SRT (${srtText.length} chars)`)

    // ========================================================================
    // STEP 6: Clean SRT text
    // ========================================================================
    console.log('[Video Transcript] Cleaning SRT text...')

    const cleanedTranscript = cleanSrt(srtText)
    console.log(`[Video Transcript] Cleaned transcript (${cleanedTranscript.length} chars)`)

    // ========================================================================
    // STEP 7: Save to database using Supabase Client
    // ========================================================================
    console.log('[Video Transcript] Saving transcript to database...')

    const { error: updateError } = await supabase
      .from('benchmark_videos')
      .update({
        video_transcript: cleanedTranscript,
        updated_at: new Date().toISOString(),
      })
      .eq('youtube_video_id', youtube_video_id)

    if (updateError) {
      console.error('[Video Transcript] Error updating transcript:', updateError)
      throw new Error(`Failed to update transcript: ${updateError.message}`)
    }

    console.log('[Video Transcript] Transcript saved successfully')

    // ========================================================================
    // STEP 8: Return transcript to caller
    // ========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        transcript: cleanedTranscript,
        source: 'rapidapi',
        language: selectedSubtitle.languageCode,
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('[Video Transcript] Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
