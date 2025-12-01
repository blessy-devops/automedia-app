-- ============================================================================
-- Migration: Add 'regenerating' to thumbnail_approval_status constraint
-- Date: 2025-12-01
-- Purpose: Allow thumbnail regeneration status in production_videos table
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE production_videos
DROP CONSTRAINT IF EXISTS production_videos_thumbnail_approval_status_check;

-- Add the new constraint with 'regenerating' included
ALTER TABLE production_videos
ADD CONSTRAINT production_videos_thumbnail_approval_status_check
CHECK (thumbnail_approval_status IN ('pending', 'approved', 'rejected', 'regenerating'));

-- Update comment
COMMENT ON COLUMN production_videos.thumbnail_approval_status IS
  'Status da aprovação de thumbnail: pending (aguardando revisão), approved (aprovada), rejected (rejeitada), regenerating (regenerando via N8N)';
