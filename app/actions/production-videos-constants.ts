// Constants for production videos
// Separated from server actions to avoid "use server" restriction

/**
 * Valid production video status values
 * These must match the status values in the database
 */
export const VALID_PRODUCTION_STATUSES = [
  // Queue (not started yet - only ONE video can be in production at a time)
  'queued',
  // Production stages (in order)
  'create_title',
  'create_outline',
  'create_cast',
  'create_rich_outline',
  'create_script',
  'review_script',
  'create_seo_description',
  'create_thumbnail',
  'create_audio_segments',
  'create_video_segments',
  'create_concatenated_audios',
  'create_final_video',
  // Post-production stages
  'pending_approval',
  'approved',
  'scheduled',
  'published',
  // Special states
  'failed',
  'on_hold',
] as const

export type ValidProductionStatus = (typeof VALID_PRODUCTION_STATUSES)[number]
