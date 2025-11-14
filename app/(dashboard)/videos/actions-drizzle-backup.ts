'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/drizzle'
import {
  videoFoldersTable,
  videoFolderItemsTable,
  benchmarkVideosTable,
} from '@/lib/drizzle'
import { eq, and, inArray, isNull, sql, asc, desc } from 'drizzle-orm'
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

/**
 * Check if user owns a folder
 */
async function validateFolderOwnership(
  folderId: number,
  userId: string | null
): Promise<boolean> {
  const folders = await db
    .select()
    .from(videoFoldersTable)
    .where(
      and(
        eq(videoFoldersTable.id, folderId),
        userId ? eq(videoFoldersTable.userId, userId) : isNull(videoFoldersTable.userId)
      )
    )
    .limit(1)

  return folders.length > 0
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
    const userId = await getCurrentUserId()

    // Validate name is not empty
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Folder name is required' }
    }

    // If parentFolderId is provided, validate it exists and user owns it
    if (data.parentFolderId) {
      const parentExists = await validateFolderOwnership(data.parentFolderId, userId)
      if (!parentExists) {
        return { success: false, error: 'Parent folder not found or unauthorized' }
      }
    }

    const [folder] = await db
      .insert(videoFoldersTable)
      .values({
        name: data.name.trim(),
        description: data.description,
        parentFolderId: data.parentFolderId || null,
        color: data.color || '#3b82f6',
        icon: data.icon || 'folder',
        userId,
      })
      .returning()

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
    const userId = await getCurrentUserId()

    // Validate folder ownership
    const isOwner = await validateFolderOwnership(folderId, userId)
    if (!isOwner) {
      return { success: false, error: 'Folder not found or unauthorized' }
    }

    // Prevent folder from being its own parent
    if (data.parentFolderId === folderId) {
      return { success: false, error: 'A folder cannot be its own parent' }
    }

    // Prevent circular references by checking if new parent is a descendant
    if (data.parentFolderId) {
      const isDescendant = await checkIfDescendant(folderId, data.parentFolderId)
      if (isDescendant) {
        return {
          success: false,
          error: 'Cannot move folder to one of its descendants',
        }
      }

      // Validate new parent exists and user owns it
      const parentExists = await validateFolderOwnership(data.parentFolderId, userId)
      if (!parentExists) {
        return { success: false, error: 'Parent folder not found or unauthorized' }
      }
    }

    // Validate name if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      return { success: false, error: 'Folder name cannot be empty' }
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description
    if (data.parentFolderId !== undefined) updateData.parentFolderId = data.parentFolderId
    if (data.color !== undefined) updateData.color = data.color
    if (data.icon !== undefined) updateData.icon = data.icon

    const [folder] = await db
      .update(videoFoldersTable)
      .set(updateData)
      .where(eq(videoFoldersTable.id, folderId))
      .returning()

    revalidatePath('/videos')
    return { success: true, folder }
  } catch (error) {
    console.error('Error updating folder:', error)
    return { success: false, error: 'Failed to update folder' }
  }
}

/**
 * Check if targetId is a descendant of folderId
 */
async function checkIfDescendant(
  folderId: number,
  targetId: number
): Promise<boolean> {
  const descendants = await getDescendantIds(folderId)
  return descendants.includes(targetId)
}

/**
 * Get all descendant folder IDs recursively
 */
async function getDescendantIds(folderId: number): Promise<number[]> {
  const children = await db
    .select()
    .from(videoFoldersTable)
    .where(eq(videoFoldersTable.parentFolderId, folderId))

  let descendants: number[] = children.map((c) => c.id)

  for (const child of children) {
    const childDescendants = await getDescendantIds(child.id)
    descendants = [...descendants, ...childDescendants]
  }

  return descendants
}

export async function deleteFolder(folderId: number, force: boolean = false) {
  try {
    const userId = await getCurrentUserId()

    // Validate folder ownership
    const isOwner = await validateFolderOwnership(folderId, userId)
    if (!isOwner) {
      return { success: false, error: 'Folder not found or unauthorized' }
    }

    if (!force) {
      // Check if folder has subfolders
      const subFolders = await db
        .select()
        .from(videoFoldersTable)
        .where(eq(videoFoldersTable.parentFolderId, folderId))
        .limit(1)

      // Check if folder has items
      const items = await db
        .select()
        .from(videoFolderItemsTable)
        .where(eq(videoFolderItemsTable.folderId, folderId))
        .limit(1)

      if (subFolders.length > 0 || items.length > 0) {
        return {
          success: false,
          error: 'Folder is not empty',
          hasSubFolders: subFolders.length > 0,
          hasItems: items.length > 0,
        }
      }
    }

    // Delete folder (CASCADE will handle subfolders and items if force=true)
    await db.delete(videoFoldersTable).where(eq(videoFoldersTable.id, folderId))

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
    const userId = await getCurrentUserId()

    // Validate folder ownership
    const isOwner = await validateFolderOwnership(folderId, userId)
    if (!isOwner) {
      return { success: false, error: 'Folder not found or unauthorized' }
    }

    // Validate videoIds array
    if (!videoIds || videoIds.length === 0) {
      return { success: false, error: 'No videos selected' }
    }

    // Verify videos exist
    const videos = await db.query.benchmarkVideosTable.findMany({
      where: inArray(benchmarkVideosTable.id, videoIds),
    })

    if (videos.length === 0) {
      return { success: false, error: 'No valid videos found' }
    }

    // Prepare values for batch insert
    const values = videos.map((video) => ({
      folderId,
      videoId: video.id,
      addedBy: userId,
    }))

    // Insert with conflict handling (ignore duplicates)
    await db
      .insert(videoFolderItemsTable)
      .values(values)
      .onConflictDoNothing({
        target: [videoFolderItemsTable.folderId, videoFolderItemsTable.videoId],
      })

    revalidatePath('/videos')
    return {
      success: true,
      addedCount: videos.length,
      message: `${videos.length} video${videos.length > 1 ? 's' : ''} added to folder`,
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
    const userId = await getCurrentUserId()

    // Validate folder ownership
    const isOwner = await validateFolderOwnership(folderId, userId)
    if (!isOwner) {
      return { success: false, error: 'Folder not found or unauthorized' }
    }

    // Validate videoIds array
    if (!videoIds || videoIds.length === 0) {
      return { success: false, error: 'No videos selected' }
    }

    // Delete items
    await db
      .delete(videoFolderItemsTable)
      .where(
        and(
          eq(videoFolderItemsTable.folderId, folderId),
          inArray(videoFolderItemsTable.videoId, videoIds)
        )
      )

    revalidatePath('/videos')
    return {
      success: true,
      removedCount: videoIds.length,
      message: `${videoIds.length} video${videoIds.length > 1 ? 's' : ''} removed from folder`,
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
    const userId = await getCurrentUserId()

    // Fetch all folders
    const folders = await db
      .select()
      .from(videoFoldersTable)
      .where(
        userId
          ? eq(videoFoldersTable.userId, userId)
          : isNull(videoFoldersTable.userId)
      )
      .orderBy(asc(videoFoldersTable.name))

    // Get video counts for each folder
    const folderCounts = await db
      .select({
        folderId: videoFolderItemsTable.folderId,
        count: sql<number>`count(*)::int`,
      })
      .from(videoFolderItemsTable)
      .groupBy(videoFolderItemsTable.folderId)

    const countMap = new Map(folderCounts.map((c) => [c.folderId, c.count]))

    // Build hierarchical tree
    const buildTree = (parentId: number | null): any[] => {
      return folders
        .filter((f) => f.parentFolderId === parentId)
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
    const userId = await getCurrentUserId()

    // Validate folder ownership
    const isOwner = await validateFolderOwnership(folderId, userId)
    if (!isOwner) {
      return { success: false, error: 'Folder not found or unauthorized' }
    }

    // Get folder
    const folders = await db
      .select()
      .from(videoFoldersTable)
      .where(eq(videoFoldersTable.id, folderId))
      .limit(1)

    const folder = folders[0]

    if (!folder) {
      return { success: false, error: 'Folder not found' }
    }

    // Get all videos in this folder
    const items = await db
      .select({
        id: videoFolderItemsTable.id,
        videoId: benchmarkVideosTable.id,
        addedAt: videoFolderItemsTable.addedAt,
        video: benchmarkVideosTable,
      })
      .from(videoFolderItemsTable)
      .innerJoin(
        benchmarkVideosTable,
        eq(videoFolderItemsTable.videoId, benchmarkVideosTable.id)
      )
      .where(eq(videoFolderItemsTable.folderId, folderId))

    // Get subfolders
    const subFolders = await db
      .select()
      .from(videoFoldersTable)
      .where(eq(videoFoldersTable.parentFolderId, folderId))
      .orderBy(asc(videoFoldersTable.name))

    return {
      success: true,
      folder,
      videos: items.map((item) => item.video),
      subFolders,
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
    const path: Array<{ id: number; name: string }> = []
    let currentId: number | null = folderId

    while (currentId !== null) {
      const folders: typeof videoFoldersTable.$inferSelect[] = await db
        .select()
        .from(videoFoldersTable)
        .where(eq(videoFoldersTable.id, currentId))
        .limit(1)

      const folder = folders[0]

      if (!folder) break

      path.unshift({ id: folder.id, name: folder.name })
      currentId = folder.parentFolderId
    }

    return { success: true, path }
  } catch (error) {
    console.error('Error fetching folder path:', error)
    return { success: false, error: 'Failed to fetch folder path', path: [] }
  }
}
