-- Migration: Add Gobbi-compatible fields to benchmark_videos table
-- Date: 2025-11-14
-- Purpose: Add missing fields from Gobbi's database to enable bi-directional sync

-- Add new columns to benchmark_videos table
ALTER TABLE benchmark_videos
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS channel_name TEXT,
  ADD COLUMN IF NOT EXISTS metrics_last_updated TIMESTAMP,
  ADD COLUMN IF NOT EXISTS video_transcript TEXT,
  ADD COLUMN IF NOT EXISTS video_age_days INTEGER,
  ADD COLUMN IF NOT EXISTS views_per_day NUMERIC,
  ADD COLUMN IF NOT EXISTS momentum_vs_14d NUMERIC,
  ADD COLUMN IF NOT EXISTS status TEXT;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_status
  ON benchmark_videos(status)
  WHERE status IS NOT NULL;

-- Create index on video_transcript for full-text search (if needed in future)
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_transcript
  ON benchmark_videos USING gin(to_tsvector('english', video_transcript))
  WHERE video_transcript IS NOT NULL;

-- Create function to auto-calculate computed fields
CREATE OR REPLACE FUNCTION update_benchmark_video_computed_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate video_age_days from upload_date
  IF NEW.upload_date IS NOT NULL THEN
    NEW.video_age_days := EXTRACT(DAY FROM (NOW() - NEW.upload_date::timestamp))::INTEGER;
  END IF;

  -- Auto-calculate views_per_day
  IF NEW.views IS NOT NULL AND NEW.video_age_days IS NOT NULL AND NEW.video_age_days > 0 THEN
    NEW.views_per_day := NEW.views::NUMERIC / NEW.video_age_days;
  ELSE
    NEW.views_per_day := NULL;
  END IF;

  -- Auto-generate youtube_url if not provided but youtube_video_id exists
  IF NEW.youtube_url IS NULL AND NEW.youtube_video_id IS NOT NULL THEN
    NEW.youtube_url := 'https://www.youtube.com/watch?v=' || NEW.youtube_video_id;
  END IF;

  -- Auto-update metrics_last_updated timestamp when views/likes/comments change
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.views IS DISTINCT FROM NEW.views) OR
       (OLD.likes IS DISTINCT FROM NEW.likes) OR
       (OLD.comments IS DISTINCT FROM NEW.comments) THEN
      NEW.metrics_last_updated := NOW();
    END IF;
  ELSIF (TG_OP = 'INSERT') AND NEW.views IS NOT NULL THEN
    NEW.metrics_last_updated := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update computed fields
DROP TRIGGER IF EXISTS trigger_update_benchmark_video_computed_fields ON benchmark_videos;
CREATE TRIGGER trigger_update_benchmark_video_computed_fields
  BEFORE INSERT OR UPDATE ON benchmark_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_benchmark_video_computed_fields();

-- Backfill existing records with computed values
UPDATE benchmark_videos
SET
  video_age_days = EXTRACT(DAY FROM (NOW() - upload_date::timestamp))::INTEGER,
  views_per_day = CASE
    WHEN upload_date IS NOT NULL AND EXTRACT(DAY FROM (NOW() - upload_date::timestamp)) > 0
    THEN views::NUMERIC / EXTRACT(DAY FROM (NOW() - upload_date::timestamp))
    ELSE NULL
  END,
  youtube_url = CASE
    WHEN youtube_url IS NULL AND youtube_video_id IS NOT NULL
    THEN 'https://www.youtube.com/watch?v=' || youtube_video_id
    ELSE youtube_url
  END,
  metrics_last_updated = CASE
    WHEN views IS NOT NULL
    THEN COALESCE(updated_at, created_at, NOW())
    ELSE NULL
  END
WHERE upload_date IS NOT NULL;

-- Add comment documentation
COMMENT ON COLUMN benchmark_videos.youtube_url IS 'Full YouTube URL (auto-generated from youtube_video_id if not provided)';
COMMENT ON COLUMN benchmark_videos.channel_name IS 'Channel name (synced from channel data or external source)';
COMMENT ON COLUMN benchmark_videos.metrics_last_updated IS 'Timestamp when views/likes/comments were last updated';
COMMENT ON COLUMN benchmark_videos.video_transcript IS 'Full video transcript/captions for content analysis';
COMMENT ON COLUMN benchmark_videos.video_age_days IS 'Video age in days (auto-calculated from upload_date)';
COMMENT ON COLUMN benchmark_videos.views_per_day IS 'Average views per day (auto-calculated)';
COMMENT ON COLUMN benchmark_videos.momentum_vs_14d IS 'Momentum score vs 14-day average';
COMMENT ON COLUMN benchmark_videos.status IS 'Video status (e.g., active, archived, processing, etc.)';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added 8 Gobbi-compatible fields to benchmark_videos';
  RAISE NOTICE 'Triggers created for auto-calculation of youtube_url, video_age_days, views_per_day, metrics_last_updated';
  RAISE NOTICE 'Indexes created for status and video_transcript';
  RAISE NOTICE 'Backfilled % existing records', (SELECT COUNT(*) FROM benchmark_videos WHERE upload_date IS NOT NULL);
END $$;
