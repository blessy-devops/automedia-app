-- ============================================================================
-- THUMBNAIL APPROVAL SYSTEM
-- Migration to add thumbnail approval workflow columns to production_videos
-- Date: 2025-11-23
-- ============================================================================
-- This migration adds a complete approval system for AI-generated thumbnails,
-- mirroring the existing title approval workflow. When N8N generates a thumbnail,
-- it will set thumbnail_approval_status='pending' and populate thumbnail_approval_data.
-- Users can then approve (advances to create_audio_segments) or reject thumbnails.
-- ============================================================================

-- Add columns for thumbnail approval workflow
ALTER TABLE production_videos
ADD COLUMN IF NOT EXISTS thumbnail_approval_data JSONB,
ADD COLUMN IF NOT EXISTS thumbnail_approval_status TEXT CHECK (thumbnail_approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS thumbnail_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS thumbnail_approved_by TEXT;

-- Create index for efficient queries on pending thumbnails
CREATE INDEX IF NOT EXISTS idx_thumbnail_approval_pending
ON production_videos(thumbnail_approval_status, created_at)
WHERE thumbnail_approval_status = 'pending' AND status = 'create_thumbnail';

-- Add comments for documentation
COMMENT ON COLUMN production_videos.thumbnail_approval_data IS
'JSONB containing generated thumbnail URL, reference thumbnail URL, generation prompt, AI model, and generation metadata.
Example structure:
{
  "thumbnail_url": "https://storage.example.com/thumbnails/video_123.png",
  "reference_thumbnail_url": "https://i.ytimg.com/vi/ABC123/maxresdefault.jpg",
  "generation_prompt": "Create a dramatic thumbnail showing...",
  "ai_model": "black-forest-labs/FLUX.1-schnell",
  "generation_metadata": {
    "seed": 42,
    "steps": 4,
    "guidance_scale": 7.5,
    "width": 1280,
    "height": 720
  },
  "generated_at": "2025-11-23T16:30:00.000Z"
}';

COMMENT ON COLUMN production_videos.thumbnail_approval_status IS
'Thumbnail approval status lifecycle:
- NULL: Thumbnail not yet generated
- pending: Awaiting user approval/rejection
- approved: User approved, video advanced to next workflow step
- rejected: User rejected, thumbnail needs regeneration (future feature)';

COMMENT ON COLUMN production_videos.thumbnail_approved_at IS
'Timestamp when the thumbnail was approved or rejected by a user. Used for audit trail and analytics.';

COMMENT ON COLUMN production_videos.thumbnail_approved_by IS
'Identifier of the user who approved/rejected the thumbnail (email, user_id, etc).
Currently placeholder for future authentication system integration.';
