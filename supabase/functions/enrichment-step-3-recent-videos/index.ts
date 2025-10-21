// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'
// @ts-ignore: Deno-specific imports
import { drizzle } from 'npm:drizzle-orm/postgres-js'
// @ts-ignore: Deno-specific imports
import postgres from 'npm:postgres'
// @ts-ignore: Deno-specific imports
import {
  pgTable,
  serial,
  varchar,
  text,
  bigint,
  integer,
  timestamp,
  boolean,
} from 'npm:drizzle-orm/pg-core'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const dbUrl = Deno.env.get('DATABASE_URL_DIRECT')!

// Drizzle schema for benchmark_videos
const benchmarkVideosTable = pgTable('benchmark_videos', {
  id: serial('id').primaryKey(),
  videoId: varchar('video_id', { length: 255 }).notNull().unique(),
  channelId: varchar('channel_id', { length: 255 }).notNull(),
  title: text('title').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  duration: integer('duration').notNull(),
  viewCount: bigint('view_count', { mode: 'number' }),
  likeCount: bigint('like_count', { mode: 'number' }),
  commentCount: bigint('comment_count', { mode: 'number' }),
  tags: text('tags').array(),
  videoTranscript: text('video_transcript'),
  videoCategorization: text('video_categorization'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

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
    // STEP 2: Fetch RapidAPI key from Vault
    // ========================================================================
    console.log('[Step 3: Recent Videos] Fetching RapidAPI key from Vault...')

    const { data: secretData, error: secretError } = await supabase.rpc('read_secret', {
      secret_name: 'rapidapi_key_1760651731629',
    })

    if (secretError || !secretData) {
      throw new Error(`Failed to fetch RapidAPI key from Vault: ${secretError?.message || 'No data'}`)
    }

    const rapidApiKey = secretData as string
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
    // STEP 5: Standardize data for UPSERT
    // ========================================================================
    const videosToInsert = filteredVideos.map((video: any) => {
      const durationSeconds = video.lengthSeconds || textToSeconds(video.lengthText || '0:00')

      return {
        videoId: video.videoId,
        channelId: channelId,
        title: video.title || '',
        publishedAt: new Date(video.publishedTimeText || video.publishDate || new Date()),
        duration: durationSeconds,
        viewCount: parseInt(video.viewCount?.replace(/,/g, '') || '0', 10),
        likeCount: null, // Not available in this endpoint
        commentCount: null, // Not available in this endpoint
        tags: [], // Not available in this endpoint
        videoTranscript: null, // Will be filled by categorization workflow
        videoCategorization: null, // Will be filled by categorization workflow
        updatedAt: new Date(),
      }
    })

    console.log(`[Step 3: Recent Videos] Prepared ${videosToInsert.length} videos for UPSERT`)

    // ========================================================================
    // STEP 6: UPSERT videos to benchmark_videos table using Drizzle
    // ========================================================================
    if (videosToInsert.length > 0) {
      console.log('[Step 3: Recent Videos] Performing UPSERT batch operation...')

      const sql = postgres(dbUrl, { prepare: false })
      const db = drizzle(sql)

      for (const videoData of videosToInsert) {
        await db
          .insert(benchmarkVideosTable)
          .values(videoData as any)
          .onConflictDoUpdate({
            target: benchmarkVideosTable.videoId,
            set: {
              title: videoData.title,
              duration: videoData.duration,
              viewCount: videoData.viewCount,
              updatedAt: new Date(),
            },
          })
      }

      await sql.end()

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
            videoId: video.videoId,
            channelId: channelId,
            taskId: taskId,
          },
        }, { noWait: true }) // Execute asynchronously for parallel processing

        if (response.error) {
          console.warn(`[Step 3: Recent Videos] Error invoking categorization for video ${video.videoId}:`, response.error)
        } else {
          console.log(`[Step 3: Recent Videos] Successfully invoked categorization for video ${video.videoId}`)
        }
      } catch (error) {
        console.warn(`[Step 3: Recent Videos] Failed to invoke categorization for video ${video.videoId}:`, error)
      }
    })

    // Execute all invocations in parallel (noWait pattern)
    await Promise.allSettled(fanOutPromises)

    console.log(`[Step 3: Recent Videos] Fan-out completed for ${videosToInsert.length} videos`)

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
    // STEP 9: Invoke next step in the pipeline
    // ========================================================================
    console.log('[Step 3: Recent Videos] Invoking Step 4: Trending Videos Fetch')

    const nextStepResponse = await supabase.functions.invoke('enrichment-step-4-trending-videos', {
      body: { channelId, taskId },
    })

    if (nextStepResponse.error) {
      console.error('[Step 3: Recent Videos] Error invoking next step:', nextStepResponse.error)
      // Don't throw - this step completed successfully
    }

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
