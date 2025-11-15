'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current authenticated user ID from Supabase
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// ============================================================================
// FOLDER CRUD OPERATIONS
// ============================================================================

export async function createFolder(data: {
  name: string
  description?: string
  parentFolderId?: number | null
  color?: string
  icon?: string
}) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    // Validate name is not empty
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Folder name is required' }
    }

    // If parentFolderId is provided, validate it exists (RLS will check ownership)
    if (data.parentFolderId) {
      const { data: parent, error: parentError } = await supabase
        .from('video_folders')
        .select('id')
        .eq('id', data.parentFolderId)
        .single()

      if (parentError || !parent) {
        return { success: false, error: 'Parent folder not found or unauthorized' }
      }
    }

    const { data: folder, error } = await supabase
      .from('video_folders')
      .insert({
        name: data.name.trim(),
        description: data.description || null,
        parent_folder_id: data.parentFolderId || null,
        color: data.color || '#3b82f6',
        icon: data.icon || 'folder',
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating folder:', error)
      return { success: false, error: 'Failed to create folder' }
    }

    revalidatePath('/videos')
    return { success: true, folder }
  } catch (error) {
    console.error('Error creating folder:', error)
    return { success: false, error: 'Failed to create folder' }
  }
}

export async function updateFolder(
  folderId: number,
  data: {
    name?: string
    description?: string | null
    parentFolderId?: number | null
    color?: string
    icon?: string
  }
) {
  try {
    const supabase = await createClient()

    // Prevent folder from being its own parent
    if (data.parentFolderId === folderId) {
      return { success: false, error: 'A folder cannot be its own parent' }
    }

    // Prevent circular references by checking if new parent is a descendant
    if (data.parentFolderId) {
      const { data: descendants } = await supabase
        .rpc('get_folder_descendants', { p_folder_id: folderId })

      if (descendants && descendants.some((d: any) => d.id === data.parentFolderId)) {
        return {
          success: false,
          error: 'Cannot move folder to one of its descendants',
        }
      }

      // Validate new parent exists (RLS will check ownership)
      const { data: parent, error: parentError } = await supabase
        .from('video_folders')
        .select('id')
        .eq('id', data.parentFolderId)
        .single()

      if (parentError || !parent) {
        return { success: false, error: 'Parent folder not found or unauthorized' }
      }
    }

    // Validate name if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      return { success: false, error: 'Folder name cannot be empty' }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description
    if (data.parentFolderId !== undefined) updateData.parent_folder_id = data.parentFolderId
    if (data.color !== undefined) updateData.color = data.color
    if (data.icon !== undefined) updateData.icon = data.icon

    const { data: folder, error } = await supabase
      .from('video_folders')
      .update(updateData)
      .eq('id', folderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating folder:', error)
      return { success: false, error: 'Failed to update folder' }
    }

    revalidatePath('/videos')
    return { success: true, folder }
  } catch (error) {
    console.error('Error updating folder:', error)
    return { success: false, error: 'Failed to update folder' }
  }
}

export async function deleteFolder(folderId: number, force: boolean = false) {
  try {
    const supabase = await createClient()

    if (!force) {
      // Check if folder has content using RPC function
      const { data: contentCheck, error: checkError } = await supabase
        .rpc('check_folder_has_content', { p_folder_id: folderId })

      if (checkError) {
        console.error('Error checking folder content:', checkError)
        return { success: false, error: 'Failed to check folder content' }
      }

      if (contentCheck.hasSubFolders || contentCheck.hasItems) {
        return {
          success: false,
          error: 'Folder is not empty',
          hasSubFolders: contentCheck.hasSubFolders,
          hasItems: contentCheck.hasItems,
        }
      }
    }

    // Delete folder (CASCADE will handle subfolders and items if force=true)
    const { error } = await supabase
      .from('video_folders')
      .delete()
      .eq('id', folderId)

    if (error) {
      console.error('Error deleting folder:', error)
      return { success: false, error: 'Failed to delete folder' }
    }

    revalidatePath('/videos')
    return { success: true }
  } catch (error) {
    console.error('Error deleting folder:', error)
    return { success: false, error: 'Failed to delete folder' }
  }
}

// ============================================================================
// VIDEO MANAGEMENT IN FOLDERS
// ============================================================================

export async function addVideosToFolder(folderId: number, videoIds: number[]) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    // Validate videoIds array
    if (!videoIds || videoIds.length === 0) {
      return { success: false, error: 'No videos selected' }
    }

    // Verify folder exists and user owns it (RLS will check)
    const { data: folder, error: folderError } = await supabase
      .from('video_folders')
      .select('id')
      .eq('id', folderId)
      .single()

    if (folderError || !folder) {
      return { success: false, error: 'Folder not found or unauthorized' }
    }

    // Prepare values for upsert (handles duplicates automatically)
    const values = videoIds.map((videoId) => ({
      folder_id: folderId,
      video_id: videoId,
      added_by: userId,
    }))

    const { error } = await supabase
      .from('video_folder_items')
      .upsert(values, {
        onConflict: 'folder_id,video_id',
        ignoreDuplicates: true,
      })

    if (error) {
      console.error('Error adding videos to folder:', error)
      return { success: false, error: 'Failed to add videos to folder' }
    }

    revalidatePath('/videos')
    return {
      success: true,
      addedCount: videoIds.length,
      message: `${videoIds.length} vídeo${videoIds.length > 1 ? 's' : ''} adicionado${videoIds.length > 1 ? 's' : ''} à pasta`,
    }
  } catch (error) {
    console.error('Error adding videos to folder:', error)
    return { success: false, error: 'Failed to add videos to folder' }
  }
}

export async function removeVideosFromFolder(
  folderId: number,
  videoIds: number[]
) {
  try {
    const supabase = await createClient()

    // Validate videoIds array
    if (!videoIds || videoIds.length === 0) {
      return { success: false, error: 'No videos selected' }
    }

    // Verify folder exists and user owns it (RLS will check)
    const { data: folder, error: folderError } = await supabase
      .from('video_folders')
      .select('id')
      .eq('id', folderId)
      .single()

    if (folderError || !folder) {
      return { success: false, error: 'Folder not found or unauthorized' }
    }

    // Delete items
    const { error } = await supabase
      .from('video_folder_items')
      .delete()
      .eq('folder_id', folderId)
      .in('video_id', videoIds)

    if (error) {
      console.error('Error removing videos from folder:', error)
      return { success: false, error: 'Failed to remove videos from folder' }
    }

    revalidatePath('/videos')
    return {
      success: true,
      removedCount: videoIds.length,
      message: `${videoIds.length} vídeo${videoIds.length > 1 ? 's' : ''} removido${videoIds.length > 1 ? 's' : ''} da pasta`,
    }
  } catch (error) {
    console.error('Error removing videos from folder:', error)
    return { success: false, error: 'Failed to remove videos from folder' }
  }
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export async function getFolderTree() {
  try {
    const supabase = await createClient()

    // Fetch all folders (RLS filters by user automatically)
    const { data: folders, error } = await supabase
      .from('video_folders')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching folders:', error)
      return { success: false, error: 'Failed to fetch folders', folders: [] }
    }

    if (!folders) {
      return { success: true, folders: [] }
    }

    // Get video counts for each folder
    const { data: folderCounts } = await supabase
      .from('video_folder_items')
      .select('folder_id, count')
      .select('folder_id')

    // Count items per folder
    const countMap = new Map<number, number>()
    if (folderCounts) {
      const counts = folderCounts.reduce((acc, item) => {
        acc[item.folder_id] = (acc[item.folder_id] || 0) + 1
        return acc
      }, {} as Record<number, number>)

      Object.entries(counts).forEach(([folderId, count]) => {
        countMap.set(Number(folderId), count)
      })
    }

    // Build hierarchical tree
    const buildTree = (parentId: number | null): any[] => {
      return folders
        .filter((f) => f.parent_folder_id === parentId)
        .map((f) => ({
          ...f,
          videoCount: countMap.get(f.id) || 0,
          subFolders: buildTree(f.id),
        }))
    }

    const tree = buildTree(null)

    return { success: true, folders: tree }
  } catch (error) {
    console.error('Error fetching folder tree:', error)
    return { success: false, error: 'Failed to fetch folders', folders: [] }
  }
}

export async function getFolderContents(folderId: number) {
  try {
    const supabase = await createClient()

    // Get folder (RLS will check ownership)
    const { data: folder, error: folderError } = await supabase
      .from('video_folders')
      .select('*')
      .eq('id', folderId)
      .single()

    if (folderError || !folder) {
      return { success: false, error: 'Folder not found or unauthorized' }
    }

    // Get all videos in this folder
    const { data: items, error: itemsError } = await supabase
      .from('video_folder_items')
      .select(`
        id,
        added_at,
        video:benchmark_videos (*)
      `)
      .eq('folder_id', folderId)

    if (itemsError) {
      console.error('Error fetching folder items:', itemsError)
      return { success: false, error: 'Failed to fetch folder contents' }
    }

    // Get subfolders
    const { data: subFolders, error: subFoldersError } = await supabase
      .from('video_folders')
      .select('*')
      .eq('parent_folder_id', folderId)
      .order('name')

    if (subFoldersError) {
      console.error('Error fetching subfolders:', subFoldersError)
    }

    return {
      success: true,
      folder,
      videos: items?.map((item: any) => item.video) || [],
      subFolders: subFolders || [],
    }
  } catch (error) {
    console.error('Error fetching folder contents:', error)
    return { success: false, error: 'Failed to fetch folder contents' }
  }
}

/**
 * Get breadcrumb path for a folder
 */
export async function getFolderPath(folderId: number) {
  try {
    const supabase = await createClient()

    // Use RPC function to get path
    const { data: path, error } = await supabase
      .rpc('get_folder_path', { p_folder_id: folderId })

    if (error) {
      console.error('Error fetching folder path:', error)
      return { success: false, error: 'Failed to fetch folder path', path: [] }
    }

    return { success: true, path: path || [] }
  } catch (error) {
    console.error('Error fetching folder path:', error)
    return { success: false, error: 'Failed to fetch folder path', path: [] }
  }
}

// ============================================================================
// VIDEO ENRICHMENT QUEUE OPERATIONS
// ============================================================================

/**
 * Add a single video to the enrichment queue
 */
export async function addVideoToQueue(
  videoId: string,
  channelId: string,
  channelName: string,
  videoTitle: string
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('video_enrichment_queue')
      .insert({
        youtube_video_id: videoId,
        channel_id: channelId,
        channel_name: channelName,
        video_title: videoTitle,
        status: 'pending',
        source: 'manual',
      })

    if (error) {
      console.error('Error adding video to queue:', error)
      return { success: false, error: 'Failed to add video to queue' }
    }

    revalidatePath(`/videos/${videoId}`)
    return { success: true }
  } catch (error) {
    console.error('Error adding video to queue:', error)
    return { success: false, error: 'Failed to add video to queue' }
  }
}

/**
 * Add multiple videos to the enrichment queue
 */
export async function addMultipleVideosToQueue(
  videos: Array<{
    videoId: string
    channelId: string
    channelTitle: string
    title: string
  }>
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('video_enrichment_queue')
      .insert(
        videos.map((v) => ({
          youtube_video_id: v.videoId,
          channel_id: v.channelId,
          channel_name: v.channelTitle,
          video_title: v.title,
          status: 'pending',
          source: 'manual',
        }))
      )

    if (error) {
      console.error('Error adding videos to queue:', error)
      return { success: false, error: 'Failed to add videos to queue' }
    }

    return { success: true, addedCount: videos.length }
  } catch (error) {
    console.error('Error adding videos to queue:', error)
    return { success: false, error: 'Failed to add videos to queue' }
  }
}

/**
 * Manually trigger the video queue processor
 */
export async function processVideoQueue() {
  try {
    const supabase = await createClient()

    // Call the queue processor Edge Function
    const { data, error } = await supabase.functions.invoke('video-queue-processor', {
      body: {},
    })

    if (error) {
      console.error('Error processing queue:', error)
      return { success: false, error: 'Failed to process queue' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error processing queue:', error)
    return { success: false, error: 'Failed to process queue' }
  }
}

// ============================================================================
// VIDEO DELETE OPERATIONS
// ============================================================================

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Delete a single video from the database
 * Also removes the video from any folders it's in (video_folder_items)
 *
 * @param id - Video database ID (benchmark_videos.id)
 */
export async function deleteVideo(id: number): Promise<ActionResult<{ videoTitle: string | null }>> {
  try {
    const supabase = await createClient()

    // Get the video first to retrieve title for confirmation
    const { data: video, error: fetchError } = await supabase
      .from('benchmark_videos')
      .select('id, title')
      .eq('id', id)
      .single()

    if (fetchError || !video) {
      return {
        success: false,
        error: 'Video not found',
      }
    }

    // 1. Delete from video_folder_items (cascade)
    const { error: folderItemsError } = await supabase
      .from('video_folder_items')
      .delete()
      .eq('video_id', id)

    if (folderItemsError) {
      console.error('[deleteVideo] Error deleting folder items:', folderItemsError)
      // Not critical, continue with video deletion
    }

    // 2. Delete the video itself
    const { error: deleteError } = await supabase
      .from('benchmark_videos')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[deleteVideo] Error deleting video:', deleteError)
      return {
        success: false,
        error: 'Failed to delete video',
      }
    }

    // Revalidate the videos page
    revalidatePath('/videos')

    return {
      success: true,
      data: {
        videoTitle: video.title,
      },
    }
  } catch (error) {
    console.error('[deleteVideo] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete video',
    }
  }
}

/**
 * Delete multiple videos in bulk
 *
 * @param ids - Array of video database IDs
 */
export async function bulkDeleteVideos(
  ids: number[]
): Promise<ActionResult<{ deleted: number; failed: number; errors: string[] }>> {
  try {
    if (!ids || ids.length === 0) {
      return {
        success: false,
        error: 'No videos selected for deletion',
      }
    }

    let deleted = 0
    let failed = 0
    const errors: string[] = []

    // Delete videos one by one
    for (const id of ids) {
      const result = await deleteVideo(id)
      if (result.success) {
        deleted++
      } else {
        failed++
        errors.push(`Video ID ${id}: ${result.error}`)
      }
    }

    // Revalidate once at the end
    revalidatePath('/videos')

    return {
      success: true,
      data: {
        deleted,
        failed,
        errors,
      },
    }
  } catch (error) {
    console.error('[bulkDeleteVideos] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk delete videos',
    }
  }
}

// ============================================================================
// PRODUCTION WEBHOOK OPERATIONS
// ============================================================================

/**
 * Send videos to production via Edge Function
 *
 * Calls the send-to-gobbi Edge Function which handles:
 * - Fetching compatible video fields
 * - Batching
 * - Webhook URL lookup
 * - Error handling
 * - Logging
 *
 * @param videoIds - Array of video database IDs to send
 * @param webhookId - ID of the webhook to use (currently unused - Edge Function looks up by name)
 */
export async function sendVideosToProduction(
  videoIds: number[],
  webhookId: number
): Promise<ActionResult<{ sent: number; webhook_name: string }>> {
  try {
    if (!videoIds || videoIds.length === 0) {
      return {
        success: false,
        error: 'No videos selected',
      }
    }

    const supabase = await createClient()

    // Call the send-to-gobbi Edge Function
    const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
      body: {
        video_ids: videoIds,
        options: {
          include_transcript: false, // Don't send huge transcript by default
          batch_size: 50, // Send in batches of 50
        },
      },
    })

    if (error) {
      console.error('[sendVideosToProduction] Edge Function error:', error)
      return {
        success: false,
        error: error.message || 'Failed to call Edge Function',
      }
    }

    // Check Edge Function response
    if (!data.success) {
      console.error('[sendVideosToProduction] Edge Function returned error:', data)
      return {
        success: false,
        error: data.message || data.error || 'Edge Function failed',
      }
    }

    return {
      success: true,
      data: {
        sent: data.videos_sent || videoIds.length,
        webhook_name: 'receive-benchmark-videos',
      },
    }
  } catch (error) {
    console.error('[sendVideosToProduction] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send videos to production',
    }
  }
}
