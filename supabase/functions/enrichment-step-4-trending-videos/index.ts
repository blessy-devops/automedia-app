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
 * Returns current date if input is invalid
 * @param dateInput - Any date input (string, Date, number, etc.)
 * @returns Valid Date object
 */
function safeDate(dateInput: any): Date {
  if (!dateInput) return new Date()
  const date = new Date(dateInput)
  return isNaN(date.getTime()) ? new Date() : date
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
 * Enrichment Step 4: Trending Videos Fetch
 *
 * Orchestrates the fetching of trending videos from RapidAPI:
 * 1. Validates channelId and taskId
 * 2. Updates task status to 'processing'
 * 3. Fetches RapidAPI key from Supabase Vault
 * 4. Calls RapidAPI to get 50 most popular videos
 * 5. Filters videos (type=video, duration >= 240s)
 * 6. Performs UPSERT batch operation to benchmark_videos
 * 7. Fan-out: invokes video-categorization-manager for each video
 * 8. Updates task status to 'completed'
 * 9. Invokes next step: enrichment-step-5-outlier-calc
 */
Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  let taskId: number | null = null

  try {
    console.log('[Step 4: Trending Videos] Starting trending videos fetch orchestration')

    const { channelId, taskId: reqTaskId } = await req.json()
    taskId = reqTaskId

    if (!channelId || !taskId) {
      throw new Error('Missing required parameters: channelId or taskId')
    }

    console.log(`[Step 4: Trending Videos] Processing channel: ${channelId}, task: ${taskId}`)

    // ========================================================================
    // STEP 1: Update task status to 'processing'
    // ========================================================================
    console.log('[Step 4: Trending Videos] Updating task status to processing')
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        trending_videos_status: 'processing',
        trending_videos_started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // ========================================================================
    // STEP 2: Get RapidAPI key from Environment Variables
    // ========================================================================
    console.log('[Step 4: Trending Videos] Getting RapidAPI key from environment...')

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')

    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY environment variable not found. Please add it to Edge Function secrets.')
    }

    console.log('[Step 4: Trending Videos] RapidAPI key retrieved successfully')

    // ========================================================================
    // STEP 3: Call RapidAPI to fetch 50 most popular videos
    // ========================================================================
    console.log('[Step 4: Trending Videos] Calling RapidAPI for trending videos...')

    const rapidApiUrl = `https://yt-api.p.rapidapi.com/channel/videos?id=${channelId}&sort_by=popular`

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
    console.log(`[Step 4: Trending Videos] Received ${rapidData.data?.length || 0} videos from RapidAPI`)

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

    console.log(`[Step 4: Trending Videos] Filtered to ${filteredVideos.length} videos (removed Shorts and <4min videos)`)

    // ========================================================================
    // STEP 5: Sort by view count (descending) - most popular first
    // ========================================================================
    const sortedVideos = filteredVideos.sort((a: any, b: any) => {
      const viewsA = parseInt(a.viewCount) || parseViewCount(a.viewCountText) || 0
      const viewsB = parseInt(b.viewCount) || parseViewCount(b.viewCountText) || 0
      return viewsB - viewsA
    })

    console.log(`[Step 4: Trending Videos] Sorted ${sortedVideos.length} videos by view count`)

    // ========================================================================
    // STEP 6: Standardize data for UPSERT - matching database schema exactly
    // ========================================================================
    const videosToInsert = sortedVideos.map((video: any) => {
      const durationSeconds = video.lengthSeconds || textToSeconds(video.lengthText || '0:00')

      return {
        youtube_video_id: video.videoId,
        channel_id: channelId,
        title: video.title || '',
        description: video.description ? video.description.substring(0, 100) + '...' : null,
        thumbnail_url: getBestThumbnail(video.thumbnail),
        upload_date: safeDate(video.publishedTimeText || video.publishDate).toISOString(),
        views: parseViewCount(video.viewCount || video.viewCountText),
        likes: null, // Not available in this endpoint
        comments: null, // Not available in this endpoint
        video_length: formatDuration(durationSeconds), // Format as HH:MM:SS for interval type
        tags: video.keywords || [], // Store as JSONB array
        video_transcript: null, // Will be filled by categorization workflow
        categorization: null, // Will be filled by categorization workflow
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    console.log(`[Step 4: Trending Videos] Prepared ${videosToInsert.length} videos for UPSERT`)

    // ========================================================================
    // STEP 7: UPSERT videos to benchmark_videos table using Supabase Client
    // ========================================================================
    if (videosToInsert.length > 0) {
      console.log('[Step 4: Trending Videos] Performing UPSERT batch operation...')

      const { error: upsertError } = await supabase
        .from('benchmark_videos')
        .upsert(videosToInsert, {
          onConflict: 'youtube_video_id', // Unique constraint on youtube_video_id
        })

      if (upsertError) {
        console.error('[Step 4: Trending Videos] Error upserting videos:', upsertError)
        throw new Error(`Failed to upsert videos: ${upsertError.message}`)
      }

      console.log('[Step 4: Trending Videos] UPSERT completed successfully')
    }

    // ========================================================================
    // STEP 8: Fan-out to video-categorization-manager for each video
    // ========================================================================
    console.log('[Step 4: Trending Videos] Starting fan-out to video-categorization-manager...')

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
          console.warn(`[Step 4: Trending Videos] Error invoking categorization for video ${video.youtube_video_id}:`, response.error)
        } else {
          console.log(`[Step 4: Trending Videos] Successfully invoked categorization for video ${video.youtube_video_id}`)
        }
      } catch (error) {
        console.warn(`[Step 4: Trending Videos] Failed to invoke categorization for video ${video.youtube_video_id}:`, error)
      }
    })

    // Don't await - let categorizations run in background
    Promise.allSettled(fanOutPromises).then(() => {
      console.log(`[Step 4: Trending Videos] All ${videosToInsert.length} video categorizations completed`)
    }).catch((error) => {
      console.error('[Step 4: Trending Videos] Error in categorization promises:', error)
    })

    console.log(`[Step 4: Trending Videos] Fan-out initiated for ${videosToInsert.length} videos (background processing)`)

    // ========================================================================
    // STEP 9: Update task status to 'completed'
    // ========================================================================
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        trending_videos_status: 'completed',
        trending_videos_completed_at: new Date().toISOString(),
        trending_videos_result: {
          totalVideosFound: rawVideos.length,
          videosAfterFilter: filteredVideos.length,
          videosUpserted: videosToInsert.length,
        },
      })
      .eq('id', taskId)

    // ========================================================================
    // STEP 10: Invoke next step in the pipeline (fire-and-forget)
    // ========================================================================
    console.log('[Step 4: Trending Videos] Invoking Step 5: Outlier Calculation')
    console.log('[Step 4: Trending Videos] Invocation payload:', { channelId, taskId })

    // Fire and forget - don't wait for response to avoid timeout
    supabase.functions.invoke('enrichment-step-5-outlier-calc', {
      body: { channelId, taskId },
    }).then(({ data, error: invokeError }) => {
      if (invokeError) {
        console.error('[Step 4: Trending Videos] Error invoking Step 5:', invokeError)
        console.error('[Step 4: Trending Videos] Error details:', JSON.stringify(invokeError, null, 2))
      } else {
        console.log('[Step 4: Trending Videos] Successfully invoked Step 5')
        console.log('[Step 4: Trending Videos] Step 5 response:', data)
      }
    }).catch((invokeError) => {
      console.error('[Step 4: Trending Videos] Exception invoking Step 5:', invokeError)
    })

    console.log('[Step 4: Trending Videos] Step 5 invocation sent (fire-and-forget)')
    console.log('[Step 4: Trending Videos] Completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Trending videos fetch completed',
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
    console.error('[Step 4: Trending Videos] Error:', error)

    // Update task status to failed
    if (taskId) {
      try {
        await supabase
          .from('channel_enrichment_tasks')
          .update({
            trending_videos_status: 'failed',
            trending_videos_error: error instanceof Error ? error.message : 'Unknown error',
            trending_videos_completed_at: new Date().toISOString(),
          })
          .eq('id', taskId)
      } catch (updateError) {
        console.error('[Step 4: Trending Videos] Failed to update error status:', updateError)
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
