-- Migration: Fix video_enrichment_queue schema
-- Add missing columns required by queue processor

ALTER TABLE video_enrichment_queue
ADD COLUMN IF NOT EXISTS channel_id VARCHAR(30),
ADD COLUMN IF NOT EXISTS channel_name TEXT,
ADD COLUMN IF NOT EXISTS video_title TEXT,
ADD COLUMN IF NOT EXISTS enrichment_task_id INTEGER
  REFERENCES channel_enrichment_tasks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_task_id
ON video_enrichment_queue(enrichment_task_id);

CREATE INDEX IF NOT EXISTS idx_enrichment_queue_channel_id
ON video_enrichment_queue(channel_id);

CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status
ON video_enrichment_queue(status, created_at);

-- Add comments
COMMENT ON COLUMN video_enrichment_queue.channel_id IS 'YouTube channel ID extracted from video';
COMMENT ON COLUMN video_enrichment_queue.channel_name IS 'Channel name for display purposes';
COMMENT ON COLUMN video_enrichment_queue.video_title IS 'Video title for display purposes';
COMMENT ON COLUMN video_enrichment_queue.enrichment_task_id IS 'Reference to enrichment task created for this video';
COMMENT ON COLUMN video_enrichment_queue.processing_started_at IS 'When processing started';
COMMENT ON COLUMN video_enrichment_queue.processing_completed_at IS 'When processing completed (success or failure)';

-- Create RPC function for row-level locking to prevent concurrent processing
CREATE OR REPLACE FUNCTION get_pending_queue_items(p_limit INTEGER DEFAULT 10)
RETURNS SETOF video_enrichment_queue
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM video_enrichment_queue
  WHERE status = 'pending'
  ORDER BY created_at ASC
  LIMIT p_limit
  FOR UPDATE SKIP LOCKED;
END;
$$;

COMMENT ON FUNCTION get_pending_queue_items IS 'Get pending queue items with row-level locking to prevent concurrent processing';
