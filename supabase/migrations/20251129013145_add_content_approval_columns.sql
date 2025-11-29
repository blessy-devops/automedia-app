-- ============================================================================
-- Migration: Add Content Approval Columns
-- Description: Add columns to support content (script, teaser, description) approval workflow
-- Date: 2024-11-29
-- ============================================================================

-- Add content approval status column
-- Values: 'pending', 'approved', 'rejected'
ALTER TABLE production_videos
ADD COLUMN IF NOT EXISTS content_approval_status TEXT DEFAULT NULL;

-- Add content approval timestamp
ALTER TABLE production_videos
ADD COLUMN IF NOT EXISTS content_approved_at TIMESTAMPTZ DEFAULT NULL;

-- Add who approved the content
ALTER TABLE production_videos
ADD COLUMN IF NOT EXISTS content_approved_by TEXT DEFAULT NULL;

-- Create index for efficient querying of pending content approvals
CREATE INDEX IF NOT EXISTS idx_production_videos_content_approval_pending
ON production_videos (content_approval_status, status)
WHERE content_approval_status = 'pending' AND status = 'review_script';

-- Add comment explaining the columns
COMMENT ON COLUMN production_videos.content_approval_status IS 'Status of content approval: pending, approved, rejected';
COMMENT ON COLUMN production_videos.content_approved_at IS 'Timestamp when content was approved/rejected';
COMMENT ON COLUMN production_videos.content_approved_by IS 'User who approved/rejected the content';
