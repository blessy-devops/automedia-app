-- ============================================================================
-- Migration: Add is_sent_to_production flag to benchmark_videos
-- Date: 2025-12-03
-- Purpose: Track which videos have been sent to Gobbi production database
-- ============================================================================

-- Add the column with default false
ALTER TABLE benchmark_videos
ADD COLUMN IF NOT EXISTS is_sent_to_production BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_is_sent_to_production
ON benchmark_videos(is_sent_to_production)
WHERE is_sent_to_production = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN benchmark_videos.is_sent_to_production IS
  'Flag indicating if this video has been sent to Gobbi production database';
