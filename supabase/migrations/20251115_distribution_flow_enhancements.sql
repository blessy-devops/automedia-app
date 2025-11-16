-- Migration: Distribution Flow Enhancements
-- Description: Add indexes and tracking columns for production distribution flow
-- Created: 2025-11-15
-- Related: docs/next-steps/distribution-flow/IMPLEMENTATION-PLAN.md

-- ============================================================================
-- PART 1: Performance Indexes
-- ============================================================================

-- Index for matching channels by niche AND subniche (used in channel selection)
CREATE INDEX IF NOT EXISTS idx_structure_accounts_niche_subniche
ON structure_accounts(niche, subniche);

COMMENT ON INDEX idx_structure_accounts_niche_subniche IS
'Performance index for matching channels to benchmark videos via categorization (niche AND subniche)';

-- Index for finding videos awaiting distribution
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_pending_distribution
ON benchmark_videos(status, created_at)
WHERE status IN ('add_to_production', 'pending_distribution');

COMMENT ON INDEX idx_benchmark_videos_pending_distribution IS
'Performance index for querying videos in distribution flow (add_to_production, pending_distribution)';

-- Index for production queue control (finding next video to process)
CREATE INDEX IF NOT EXISTS idx_production_videos_queue
ON production_videos(is_processing, status, created_at)
WHERE is_processing = false AND status = 'create_title';

COMMENT ON INDEX idx_production_videos_queue IS
'Performance index for queue cron to find next video to process (is_processing=false, status=create_title)';

-- ============================================================================
-- PART 2: Distribution Tracking Columns
-- ============================================================================

-- Add tracking columns to production_videos table
ALTER TABLE production_videos
ADD COLUMN IF NOT EXISTS distributed_by TEXT,
ADD COLUMN IF NOT EXISTS distributed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS distribution_mode TEXT DEFAULT 'manual';

-- Add check constraint for distribution_mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'production_videos_distribution_mode_check'
  ) THEN
    ALTER TABLE production_videos
    ADD CONSTRAINT production_videos_distribution_mode_check
    CHECK (distribution_mode IN ('manual', 'automatic'));
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN production_videos.distributed_by IS
'User email who distributed this video to channels (for audit trail)';

COMMENT ON COLUMN production_videos.distributed_at IS
'Timestamp when distribution was completed (when production job was created)';

COMMENT ON COLUMN production_videos.distribution_mode IS
'How this video was distributed to channels: manual (user selected via UI) or automatic (system auto-selected all eligible channels)';

-- ============================================================================
-- PART 3: Verification Queries
-- ============================================================================

-- Verify indexes were created
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE indexname IN (
    'idx_structure_accounts_niche_subniche',
    'idx_benchmark_videos_pending_distribution',
    'idx_production_videos_queue'
  );

  RAISE NOTICE 'Created % indexes for distribution flow', idx_count;
END $$;

-- Verify columns were added
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'production_videos'
    AND column_name IN ('distributed_by', 'distributed_at', 'distribution_mode');

  RAISE NOTICE 'Added % tracking columns to production_videos', col_count;
END $$;

-- ============================================================================
-- PART 4: Sample Query for Testing
-- ============================================================================

-- Query to test channel matching (should use idx_structure_accounts_niche_subniche)
-- EXPLAIN ANALYZE
-- SELECT sa.*, bb.production_workflow_id, bb.brand_identity
-- FROM structure_accounts sa
-- LEFT JOIN structure_brand_bible bb ON bb.placeholder = sa.placeholder
-- WHERE sa.niche = 'stories'
--   AND sa.subniche = 'revenge'
-- ORDER BY sa.placeholder ASC;

-- Query to test videos awaiting distribution (should use idx_benchmark_videos_pending_distribution)
-- EXPLAIN ANALYZE
-- SELECT bv.*
-- FROM benchmark_videos bv
-- WHERE bv.status = 'pending_distribution'
-- ORDER BY bv.created_at ASC;

-- Query to test production queue (should use idx_production_videos_queue)
-- EXPLAIN ANALYZE
-- SELECT pv.*
-- FROM production_videos pv
-- WHERE pv.is_processing = false
--   AND pv.status = 'create_title'
-- ORDER BY pv.created_at ASC
-- LIMIT 1;
