// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Helper function to convert time text (MM:SS or HH:MM:SS) to seconds
 * @param timeText - Time string in format "4:32" or "1:23:45"
 * @returns Total seconds
 */
function textToSeconds(timeText: string): number {
  const parts = timeText.split(':').map(p => parseInt(p, 10))

  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts
    return minutes * 60 + seconds
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }

  return 0
}

/**
 * Helper function to safely create a Date object
 * Returns current date if input is invalid (with warning log)
 * @param dateInput - Any date input (string, Date, number, etc.)
 * @param videoId - Optional video ID for better logging
 * @returns Valid Date object
 */
function safeDate(dateInput: any, videoId?: string): Date {
  const videoContext = videoId ? ` for video ${videoId}` : ''

  if (!dateInput) {
    console.warn(`[safeDate] ⚠️ No date input provided${videoContext}, falling back to current date`)
    return new Date()
  }

  const date = new Date(dateInput)

  if (isNaN(date.getTime())) {
    console.warn(`[safeDate] ⚠️ Invalid date input: "${dateInput}"${videoContext}, falling back to current date`)
    return new Date()
  }

  // Check if the date is suspiciously far in the future (more than 1 day from now)
  const oneDayFromNow = new Date()
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)

  if (date > oneDayFromNow) {
    console.warn(`[safeDate] ⚠️ Date is in the future: "${dateInput}"${videoContext}, using anyway but this seems suspicious`)
  }

  console.log(`[safeDate] ✓ Valid date parsed: ${dateInput} → ${date.toISOString()}${videoContext}`)
  return date
}

/**
 * Helper function to sanitize Unicode strings and remove invalid surrogates
 * Fixes "Unicode low surrogate must follow a high surrogate" errors
 * @param text - Input string that may contain invalid Unicode
 * @returns Sanitized string safe for PostgreSQL JSONB
 */
function sanitizeUnicode(text: string): string {
  if (!text || typeof text !== 'string') return ''

  try {
    // Method 1: Use JSON.stringify/parse to handle Unicode escaping
    // This automatically converts problematic characters to \uXXXX format
    const escaped = JSON.stringify(text)
    const parsed = JSON.parse(escaped)

    // Method 2: Additionally remove any remaining lone surrogates
    // Split into array of code points (properly handles surrogate pairs)
    return Array.from(parsed)
      .filter(char => {
        const code = char.charCodeAt(0)
        // Filter out lone surrogates (D800-DFFF range)
        // But Array.from already handles pairs correctly, so lone ones become � (U+FFFD)
        return code < 0xD800 || code > 0xDFFF
      })
      .join('')
  } catch (e) {
    // If all else fails, remove all problematic characters
    console.warn('[sanitizeUnicode] Failed to sanitize, removing all non-ASCII:', e)
    return text.replace(/[^\x00-\x7F]/g, '')
  }
}

/**
 * Helper function to safely parse tags/keywords into a valid JSON array
 * Handles various input types and ensures valid JSONB output for PostgreSQL
 * @param tagsInput - Tags from API (could be array, string, null, undefined, etc.)
 * @param videoId - Optional video ID for better logging
 * @returns Valid string array for JSONB storage
 */
function safeTags(tagsInput: any, videoId?: string): string[] {
  const videoContext = videoId ? ` for video ${videoId}` : ''

  // If null or undefined, return empty array
  if (tagsInput === null || tagsInput === undefined) {
    return []
  }

  // If already an array, validate and clean it
  if (Array.isArray(tagsInput)) {
    // Filter out non-string values and ensure all are valid strings
    const validTags = tagsInput
      .filter((tag) => tag !== null && tag !== undefined)
      .map((tag) => sanitizeUnicode(String(tag).trim()))
      .filter((tag) => tag.length > 0)

    return validTags
  }

  // If it's a string, try to parse as JSON array
  if (typeof tagsInput === 'string') {
    try {
      const parsed = JSON.parse(tagsInput)
      if (Array.isArray(parsed)) {
        return safeTags(parsed, videoId) // Recursively validate
      }
    } catch (e) {
      // Not valid JSON, treat as single tag
      const trimmed = tagsInput.trim()
      if (trimmed.length > 0) {
        return [trimmed]
      }
    }
  }

  // For any other type, log warning and return empty array
  console.warn(`[safeTags] ⚠️ Invalid tags input type: ${typeof tagsInput}${videoContext}, returning empty array`)
  return []
}

/**
 * Helper function to parse view count text with K/M/B notation
 * Converts strings like "1.2K", "5M", "1.5B" to actual numbers
 * @param viewText - View count as string or number
 * @returns Numeric view count
 */
function parseViewCount(viewText: any): number {
  if (!viewText) return 0
  if (typeof viewText === 'number') return viewText

  const text = String(viewText).toLowerCase().replace(/[^0-9kmb.,]/g, '')
  const num = parseFloat(text)

  if (isNaN(num)) return 0

  if (text.includes('k')) return Math.round(num * 1000)
  if (text.includes('m')) return Math.round(num * 1000000)
  if (text.includes('b')) return Math.round(num * 1000000000)

  return Math.round(num) || 0
}

/**
 * Helper function to get best quality thumbnail from array
 * Selects thumbnail with highest width
 * @param thumbnails - Array of thumbnail objects with url and width
 * @returns URL of best quality thumbnail or null
 */
function getBestThumbnail(thumbnails: any[]): string | null {
  if (!thumbnails || !Array.isArray(thumbnails) || thumbnails.length === 0) {
    return null
  }

  const sorted = thumbnails.sort((a, b) => (b.width || 0) - (a.width || 0))
  return sorted[0]?.url || null
}

/**
 * Helper function to format duration in seconds to HH:MM:SS or MM:SS
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Enrichment Step 3: Recent Videos Fetch
 *
 * Orchestrates the fetching of recent videos from RapidAPI:
 * 1. Validates channelId and taskId
 * 2. Updates task status to 'processing'
 * 3. Fetches RapidAPI key from Supabase Vault
 * 4. Calls RapidAPI to get 50 most recent videos
 * 5. Filters videos (type=video, duration >= 240s)
 * 6. Performs UPSERT batch operation to benchmark_videos
 * 7. Fan-out: invokes video-categorization-manager for each video
 * 8. Updates task status to 'completed'
 * 9. Invokes next step: enrichment-step-4-trending-videos
 */
Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  let taskId: number | null = null

  try {
    console.log('[Step 3: Recent Videos] Starting recent videos fetch orchestration')

    const { channelId, taskId: reqTaskId } = await req.json()
    taskId = reqTaskId

    if (!channelId || !taskId) {
      throw new Error('Missing required parameters: channelId or taskId')
    }

    console.log(`[Step 3: Recent Videos] Processing channel: ${channelId}, task: ${taskId}`)

    // ========================================================================
    // STEP 1: Update task status to 'processing'
    // ========================================================================
    console.log('[Step 3: Recent Videos] Updating task status to processing')
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        recent_videos_status: 'processing',
        recent_videos_started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // ========================================================================
    // STEP 2: Get RapidAPI key from Environment Variables
    // ========================================================================
    console.log('[Step 3: Recent Videos] Getting RapidAPI key from environment...')

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')

    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY environment variable not found. Please add it to Edge Function secrets.')
    }

    console.log('[Step 3: Recent Videos] RapidAPI key retrieved successfully')

    // ========================================================================
    // STEP 3: Call RapidAPI to fetch 50 most recent videos
    // ========================================================================
    console.log('[Step 3: Recent Videos] Calling RapidAPI for recent videos...')

    const rapidApiUrl = `https://yt-api.p.rapidapi.com/channel/videos?id=${channelId}&sort_by=newest`

    const rapidResponse = await fetch(rapidApiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
      },
    })

    if (!rapidResponse.ok) {
      const errorText = await rapidResponse.text()
      throw new Error(`RapidAPI request failed with status ${rapidResponse.status}: ${errorText}`)
    }

    const rapidData = await rapidResponse.json()
    console.log(`[Step 3: Recent Videos] Received ${rapidData.data?.length || 0} videos from RapidAPI`)

    // ========================================================================
    // STEP 4: Filter videos (type=video AND duration >= 240 seconds)
    // ========================================================================
    const rawVideos = rapidData.data || []

    const filteredVideos = rawVideos.filter((video: any) => {
      // Filter 1: Only type 'video' (remove Shorts)
      if (video.type !== 'video') {
        return false
      }

      // Filter 2: Duration >= 240 seconds (4 minutes)
      const durationSeconds = video.lengthSeconds || textToSeconds(video.lengthText || '0:00')
      if (durationSeconds < 240) {
        return false
      }

      return true
    })

    console.log(`[Step 3: Recent Videos] Filtered to ${filteredVideos.length} videos (removed Shorts and <4min videos)`)

    // ========================================================================
    // STEP 5: Standardize data for UPSERT - matching database schema exactly
    // ========================================================================
    const videosToInsert = filteredVideos.map((video: any) => {
      const durationSeconds = video.lengthSeconds || textToSeconds(video.lengthText || '0:00')

      return {
        youtube_video_id: video.videoId,
        channel_id: channelId,
        title: sanitizeUnicode(video.title || ''),
        description: video.description ? sanitizeUnicode(video.description.substring(0, 100)) + '...' : null,
        thumbnail_url: getBestThumbnail(video.thumbnail),
        upload_date: safeDate(video.publishedAt || video.publishDate || video.uploadDate, video.videoId).toISOString(),
        views: parseViewCount(video.viewCount || video.viewCountText),
        likes: null, // Not available in this endpoint
        comments: null, // Not available in this endpoint
        video_length: formatDuration(durationSeconds), // Format as HH:MM:SS for interval type
        tags: safeTags(video.keywords, video.videoId), // Store as JSONB array (sanitized inside)
        video_transcript: null, // Will be filled by categorization workflow
        categorization: null, // Will be filled by categorization workflow
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    console.log(`[Step 3: Recent Videos] Prepared ${videosToInsert.length} videos for UPSERT`)

    // ========================================================================
    // VALIDATION: Check for suspicious upload dates
    // ========================================================================
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const suspiciousVideos = videosToInsert.filter((video) => {
      const uploadDate = new Date(video.upload_date)
      return uploadDate > oneHourAgo
    })

    if (suspiciousVideos.length > 0) {
      console.warn(`[Step 3: Recent Videos] ⚠️ Found ${suspiciousVideos.length} videos with suspicious upload dates (within last hour):`)
      suspiciousVideos.forEach((video) => {
        console.warn(`  - Video ${video.youtube_video_id}: "${video.title}" - upload_date: ${video.upload_date}`)
      })
      console.warn('[Step 3: Recent Videos] These videos may have missing/invalid YouTube API date data')
    }

    // ========================================================================
    // STEP 6: UPSERT videos to benchmark_videos table using Supabase Client
    // ========================================================================
    if (videosToInsert.length > 0) {
      console.log('[Step 3: Recent Videos] Performing UPSERT batch operation...')

      const { error: upsertError } = await supabase
        .from('benchmark_videos')
        .upsert(videosToInsert, {
          onConflict: 'youtube_video_id', // Unique constraint on youtube_video_id
        })

      if (upsertError) {
        console.error('[Step 3: Recent Videos] Error upserting videos:', upsertError)
        throw new Error(`Failed to upsert videos: ${upsertError.message}`)
      }

      console.log('[Step 3: Recent Videos] UPSERT completed successfully')
    }

    // ========================================================================
    // STEP 7: Fan-out to video-categorization-manager for each video
    // ========================================================================
    console.log('[Step 3: Recent Videos] Starting fan-out to video-categorization-manager...')

    const fanOutPromises = videosToInsert.map(async (video) => {
      try {
        const response = await supabase.functions.invoke('video-categorization-manager', {
          body: {
            youtube_video_id: video.youtube_video_id,
            channelId: channelId,
            taskId: taskId,
          },
        })

        if (response.error) {
          console.warn(`[Step 3: Recent Videos] Error invoking categorization for video ${video.youtube_video_id}:`, response.error)
        } else {
          console.log(`[Step 3: Recent Videos] Successfully invoked categorization for video ${video.youtube_video_id}`)
        }
      } catch (error) {
        console.warn(`[Step 3: Recent Videos] Failed to invoke categorization for video ${video.youtube_video_id}:`, error)
      }
    })

    // Don't await - let categorizations run in background
    Promise.allSettled(fanOutPromises).then(() => {
      console.log(`[Step 3: Recent Videos] All ${videosToInsert.length} video categorizations completed`)
    }).catch((error) => {
      console.error('[Step 3: Recent Videos] Error in categorization promises:', error)
    })

    console.log(`[Step 3: Recent Videos] Fan-out initiated for ${videosToInsert.length} videos (background processing)`)

    // ========================================================================
    // STEP 8: Update task status to 'completed'
    // ========================================================================
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        recent_videos_status: 'completed',
        recent_videos_completed_at: new Date().toISOString(),
        recent_videos_result: {
          totalVideosFound: rawVideos.length,
          videosAfterFilter: filteredVideos.length,
          videosUpserted: videosToInsert.length,
        },
      })
      .eq('id', taskId)

    // ========================================================================
    // STEP 9: Invoke next step in the pipeline (fire-and-forget)
    // ========================================================================
    console.log('[Step 3: Recent Videos] Invoking Step 4: Trending Videos Fetch')
    console.log('[Step 3: Recent Videos] Invocation payload:', { channelId, taskId })

    // Fire and forget - don't wait for response to avoid timeout
    supabase.functions.invoke('enrichment-step-4-trending-videos', {
      body: { channelId, taskId },
    }).then(({ data, error: invokeError }) => {
      if (invokeError) {
        console.error('[Step 3: Recent Videos] Error invoking Step 4:', invokeError)
        console.error('[Step 3: Recent Videos] Error details:', JSON.stringify(invokeError, null, 2))
      } else {
        console.log('[Step 3: Recent Videos] Successfully invoked Step 4')
        console.log('[Step 3: Recent Videos] Step 4 response:', data)
      }
    }).catch((invokeError) => {
      console.error('[Step 3: Recent Videos] Exception invoking Step 4:', invokeError)
    })

    console.log('[Step 3: Recent Videos] Step 4 invocation sent (fire-and-forget)')
    console.log('[Step 3: Recent Videos] Completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Recent videos fetch completed',
        channelId,
        taskId,
        stats: {
          totalVideosFound: rawVideos.length,
          videosAfterFilter: filteredVideos.length,
          videosUpserted: videosToInsert.length,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Step 3: Recent Videos] Error:', error)

    // Update task status to failed
    if (taskId) {
      try {
        await supabase
          .from('channel_enrichment_tasks')
          .update({
            recent_videos_status: 'failed',
            recent_videos_error: error instanceof Error ? error.message : 'Unknown error',
            recent_videos_completed_at: new Date().toISOString(),
          })
          .eq('id', taskId)
      } catch (updateError) {
        console.error('[Step 3: Recent Videos] Failed to update error status:', updateError)
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
