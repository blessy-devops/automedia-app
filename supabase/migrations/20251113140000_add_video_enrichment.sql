-- Migration: Add Video Enrichment Features
-- Description: Adds support for storing video keywords, related videos, and enrichment queue
-- Author: Claude Code
-- Date: 2025-11-13

-- ============================================================================
-- STEP 1: Add enrichment columns to benchmark_videos table
-- ============================================================================

ALTER TABLE benchmark_videos
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS related_video_ids TEXT[],
ADD COLUMN IF NOT EXISTS enrichment_data JSONB,
ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ;

-- Create index for efficient querying of enriched videos
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_last_enriched
ON benchmark_videos(last_enriched_at)
WHERE last_enriched_at IS NOT NULL;

-- Create GIN index for keyword search
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_keywords
ON benchmark_videos USING GIN(keywords);

COMMENT ON COLUMN benchmark_videos.keywords IS 'YouTube video keywords extracted from video metadata';
COMMENT ON COLUMN benchmark_videos.related_video_ids IS 'Array of YouTube video IDs that are related to this video';
COMMENT ON COLUMN benchmark_videos.enrichment_data IS 'Full enrichment response from RapidAPI for reference';
COMMENT ON COLUMN benchmark_videos.last_enriched_at IS 'Timestamp of the last enrichment operation';

-- ============================================================================
-- STEP 2: Create video_enrichment_queue table
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_enrichment_queue (
  id SERIAL PRIMARY KEY,
  youtube_video_id VARCHAR(20) NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('related', 'manual', 'radar')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  parent_video_id INTEGER REFERENCES benchmark_videos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(youtube_video_id, source)
);

-- Create indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status
ON video_enrichment_queue(status, created_at);

CREATE INDEX IF NOT EXISTS idx_enrichment_queue_youtube_id
ON video_enrichment_queue(youtube_video_id);

CREATE INDEX IF NOT EXISTS idx_enrichment_queue_parent
ON video_enrichment_queue(parent_video_id);

COMMENT ON TABLE video_enrichment_queue IS 'Queue for videos discovered via related videos feature that need categorization';
COMMENT ON COLUMN video_enrichment_queue.source IS 'Source of discovery: related (from related videos), manual (user added), radar (from channel monitoring)';
COMMENT ON COLUMN video_enrichment_queue.parent_video_id IS 'Reference to the video that led to discovering this related video';

-- Grant permissions
GRANT ALL ON video_enrichment_queue TO service_role;
GRANT SELECT, INSERT, UPDATE ON video_enrichment_queue TO authenticated;
GRANT ALL ON SEQUENCE video_enrichment_queue_id_seq TO service_role;
GRANT USAGE ON SEQUENCE video_enrichment_queue_id_seq TO authenticated;

-- ============================================================================
-- STEP 3: Create helper function to check if video is already queued
-- ============================================================================

CREATE OR REPLACE FUNCTION is_video_queued(p_youtube_video_id VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if video exists in benchmark_videos
  SELECT EXISTS(
    SELECT 1 FROM benchmark_videos
    WHERE youtube_video_id = p_youtube_video_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN TRUE;
  END IF;

  -- Check if video is in enrichment queue
  SELECT EXISTS(
    SELECT 1 FROM video_enrichment_queue
    WHERE youtube_video_id = p_youtube_video_id
    AND status IN ('pending', 'processing')
  ) INTO v_exists;

  RETURN v_exists;
END;
$$;

COMMENT ON FUNCTION is_video_queued IS 'Check if a video already exists in database or is queued for processing';

GRANT EXECUTE ON FUNCTION is_video_queued TO service_role;
GRANT EXECUTE ON FUNCTION is_video_queued TO authenticated;

-- ============================================================================
-- STEP 4: Create RPC function for batch adding videos to queue
-- ============================================================================

CREATE OR REPLACE FUNCTION add_videos_to_enrichment_queue(
  p_video_ids TEXT[],
  p_source VARCHAR DEFAULT 'related',
  p_parent_video_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
  youtube_video_id VARCHAR,
  status VARCHAR,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_video_id TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Loop through each video ID
  FOREACH v_video_id IN ARRAY p_video_ids
  LOOP
    -- Check if already exists
    SELECT is_video_queued(v_video_id) INTO v_exists;

    IF v_exists THEN
      RETURN QUERY SELECT
        v_video_id::VARCHAR,
        'skipped'::VARCHAR,
        'Already exists or queued'::TEXT;
    ELSE
      -- Add to queue
      BEGIN
        INSERT INTO video_enrichment_queue (
          youtube_video_id,
          source,
          parent_video_id,
          status
        ) VALUES (
          v_video_id,
          p_source,
          p_parent_video_id,
          'pending'
        );

        RETURN QUERY SELECT
          v_video_id::VARCHAR,
          'queued'::VARCHAR,
          'Added to enrichment queue'::TEXT;
      EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT
          v_video_id::VARCHAR,
          'error'::VARCHAR,
          SQLERRM::TEXT;
      END;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION add_videos_to_enrichment_queue IS 'Batch add videos to enrichment queue with duplicate checking';

GRANT EXECUTE ON FUNCTION add_videos_to_enrichment_queue TO service_role;
GRANT EXECUTE ON FUNCTION add_videos_to_enrichment_queue TO authenticated;

-- ============================================================================
-- STEP 5: Create view for enrichment queue monitoring
-- ============================================================================

CREATE OR REPLACE VIEW video_enrichment_queue_status AS
SELECT
  q.id,
  q.youtube_video_id,
  q.source,
  q.status,
  q.error_message,
  q.created_at,
  q.processed_at,
  pv.title AS parent_video_title,
  pv.youtube_video_id AS parent_youtube_video_id,
  CASE
    WHEN bv.id IS NOT NULL THEN TRUE
    ELSE FALSE
  END AS video_exists_in_db
FROM video_enrichment_queue q
LEFT JOIN benchmark_videos pv ON q.parent_video_id = pv.id
LEFT JOIN benchmark_videos bv ON q.youtube_video_id = bv.youtube_video_id
ORDER BY q.created_at DESC;

COMMENT ON VIEW video_enrichment_queue_status IS 'Monitor enrichment queue with parent video context';

GRANT SELECT ON video_enrichment_queue_status TO service_role;
GRANT SELECT ON video_enrichment_queue_status TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
