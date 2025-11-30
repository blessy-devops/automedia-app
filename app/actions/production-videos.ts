// app/actions/production-videos.ts
// Server Actions para Production Videos (banco do Gobbi)

'use server'

import { gobbiClient, ensureServerSide } from '@/lib/gobbi-client'
import type {
  ProductionVideo,
  ProductionVideoDetails,
  ProductionStats,
  ProductionVideosFilters,
  GetProductionVideosResponse,
  ProductionVideoStatus,
} from '@/types/production-video'
import { VALID_PRODUCTION_STATUSES, type ValidProductionStatus } from './production-videos-constants'

/**
 * Get paginated list of production videos
 */
export async function getProductionVideos(
  filters: ProductionVideosFilters = {}
): Promise<GetProductionVideosResponse> {
  ensureServerSide()

  const { status = 'all', search = '', page = 1, perPage = 20 } = filters

  try {
    const { data, error } = await gobbiClient.rpc('get_production_videos_list', {
      p_status: status === 'all' ? null : status,
      p_search: search || null,
      p_page: page,
      p_per_page: perPage,
    })

    if (error) {
      console.error('[getProductionVideos] RPC error:', error)
      throw new Error(`Failed to fetch production videos: ${error.message}`)
    }

    if (!data) {
      return {
        videos: [],
        total: 0,
        stats: { total: 0, published: 0, processing: 0, failed: 0, onHold: 0 },
      }
    }

    return {
      videos: data.videos.map(mapToProductionVideo),
      total: data.total,
      stats: data.stats,
    }
  } catch (err) {
    console.error('[getProductionVideos] Error:', err)
    throw err
  }
}

/**
 * Get detailed information about a single production video
 */
export async function getProductionVideoDetails(
  videoId: number
): Promise<ProductionVideoDetails | null> {
  ensureServerSide()

  try {
    const { data, error } = await gobbiClient.rpc('get_production_video_details', {
      p_video_id: videoId,
    })

    if (error) {
      console.error('[getProductionVideoDetails] RPC error:', error)
      throw new Error(`Failed to fetch video details: ${error.message}`)
    }

    if (!data) {
      return null
    }

    return mapToProductionVideoDetails(data)
  } catch (err) {
    console.error('[getProductionVideoDetails] Error:', err)
    throw err
  }
}

/**
 * Get production statistics (for stat cards)
 */
export async function getProductionStats(): Promise<ProductionStats> {
  ensureServerSide()

  try {
    const { data, error } = await gobbiClient.rpc('get_production_stats')

    if (error) {
      console.error('[getProductionStats] RPC error:', error)
      throw new Error(`Failed to fetch stats: ${error.message}`)
    }

    return data || { total: 0, published: 0, processing: 0, failed: 0, onHold: 0 }
  } catch (err) {
    console.error('[getProductionStats] Error:', err)
    throw err
  }
}

// ============================================
// Mapping Functions
// ============================================

function mapToProductionVideo(video: any): ProductionVideo {
  // Validate status before processing
  const validatedStatus = validateStatus(video.status)

  // Scheduled e published devem ter 100% de progresso
  const progress = validatedStatus === 'scheduled' || validatedStatus === 'published'
    ? 100
    : (video.progress || 0)

  return {
    id: video.id,
    title: video.title || 'Untitled',
    thumbnailUrl: video.thumbnail_url || 'https://placehold.co/400x225',
    status: normalizeStatus(validatedStatus),
    progress,
    currentStage: formatStageName(validatedStatus),
    createdAt: video.created_at,
    updatedAt: video.updated_at,
    language: video.language || 'pt-BR',
    platform: video.platform || 'youtube',
    sourceChannel: video.source_channel || 'Unknown Channel',
    sourceYoutubeVideoId: video.source_youtube_video_id,
    youtubeId: video.youtube_id,
    productionDays: video.production_days || 0,
    plannedUploadDate: video.planned_upload_date,
  }
}

function mapToProductionVideoDetails(data: any): ProductionVideoDetails {
  // Validate status before processing
  const validatedStatus = validateStatus(data.status)

  return {
    // Basic info
    id: data.id,
    title: data.title || 'Untitled',
    thumbnailUrl: data.thumbnailUrl || 'https://placehold.co/800x450',
    status: normalizeStatus(validatedStatus),
    language: data.language || 'pt-BR',
    platform: data.platform || 'youtube',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    description: data.description || '',
    tags: data.tags || '',
    finalLink: data.finalLink,
    youtubeId: data.youtubeId,

    // Links
    parentFolder: data.parentFolder || '',
    audioFolderUrl: data.audioFolderUrl || '',
    videoSegmentsFolder: data.videoSegmentsFolder || '',
    thumbnailFolderUrl: data.thumbnailFolderUrl || '',
    coveringImagesFolder: data.coveringImagesFolder || '',

    // Progress
    productionDays: data.productionDays || 0,
    progressPercentage: data.progressPercentage || 0,
    currentStage: data.currentStage || 1,
    totalStages: data.totalStages || 13,

    // Source video
    sourceVideo: {
      id: data.sourceVideo?.id || 0,
      title: data.sourceVideo?.title || 'Unknown',
      thumbnailUrl: data.sourceVideo?.thumbnailUrl || 'https://placehold.co/400x225',
      channelName: data.sourceVideo?.channelName || 'Unknown',
      channelId: data.sourceVideo?.channelId || '',
      views: data.sourceVideo?.views || 0,
      uploadDate: data.sourceVideo?.uploadDate || '',
      duration: data.sourceVideo?.duration || '0:00',
      youtubeUrl: data.sourceVideo?.youtubeUrl || '',
      youtubeVideoId: data.sourceVideo?.youtubeVideoId || '',
      transcript: data.sourceVideo?.transcript || '',
    },

    // Narrative
    narrative: {
      structureModel: data.narrative?.structureModel || 'Not analyzed',
      centralTheme: data.narrative?.centralTheme || 'Not analyzed',
      emotionalCore: data.narrative?.emotionalCore || 'Unknown',
      conflictType: data.narrative?.conflictType || 'Unknown',
      storyBeats: Array.isArray(data.narrative?.storyBeats) ? data.narrative.storyBeats : [],
    },

    // Content
    script: data.script || '',
    storyCast: parseJSONField(data.storyCast, []),
    richOutline: parseJSONField(data.richOutline, []),

    // Production assets
    audioSegments: Array.isArray(data.audioSegments) ? data.audioSegments : [],
    videoSegments: Array.isArray(data.videoSegments) ? data.videoSegments : [],

    // Workflow
    workflowStages: Array.isArray(data.workflowStages) ? data.workflowStages : [],
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Validates if a status is a valid production status
 * Logs a warning if an invalid status is detected
 */
function isValidProductionStatus(status: string): status is ValidProductionStatus {
  const isValid = VALID_PRODUCTION_STATUSES.includes(status as ValidProductionStatus)

  if (!isValid) {
    console.warn(
      `[Production Videos] Invalid status detected: "${status}". ` +
      `Valid statuses are: ${VALID_PRODUCTION_STATUSES.join(', ')}`
    )
  }

  return isValid
}

/**
 * Validates and returns a safe status value
 * Returns 'create_title' as default for invalid statuses
 */
function validateStatus(status: string): ValidProductionStatus {
  if (!isValidProductionStatus(status)) {
    console.error(
      `[Production Videos] CRITICAL: Invalid status "${status}" found in database. ` +
      `Defaulting to 'create_title'. This should be investigated!`
    )
    return 'create_title'
  }
  return status
}

function normalizeStatus(gobbiStatus: string): ProductionVideoStatus {
  if (gobbiStatus === 'queued') return 'waiting'
  if (gobbiStatus === 'published') return 'published'
  if (gobbiStatus === 'scheduled') return 'scheduled'
  if (gobbiStatus === 'failed') return 'failed'
  if (gobbiStatus === 'on_hold') return 'on_hold'
  if (gobbiStatus === 'canceled') return 'canceled'
  if (gobbiStatus === 'pending_approval' || gobbiStatus === 'approved') return 'pending_approval'
  // All "create_*" states are "processing"
  return 'processing'
}

/**
 * Formats a status string into a human-readable stage name
 * Handles invalid statuses gracefully
 */
function formatStageName(status: string): string {
  // Validate status first
  if (!isValidProductionStatus(status)) {
    return 'Unknown Status'
  }

  // Handle special statuses
  if (status === 'queued') return 'Queued'
  if (status === 'published') return 'Published'
  if (status === 'scheduled') return 'Scheduled'
  if (status === 'pending_approval') return 'Pending Approval'
  if (status === 'approved') return 'Approved'
  if (status === 'failed') return 'Failed'
  if (status === 'on_hold') return 'On Hold'
  if (status === 'canceled') return 'Canceled'

  // Format "create_something" -> "Something" (removing "create_" prefix)
  if (status.startsWith('create_')) {
    const words = status.replace('create_', '').split('_')
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // Fallback: capitalize each word
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function parseJSONField<T>(field: any, defaultValue: T): T {
  if (!field) return defaultValue
  if (typeof field === 'object') return field as T
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T
    } catch {
      return defaultValue
    }
  }
  return defaultValue
}
