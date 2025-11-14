-- Add missing columns to benchmark_videos for outlier calculation
-- These columns are calculated by enrichment-step-5-outlier-calc

ALTER TABLE benchmark_videos
  ADD COLUMN IF NOT EXISTS video_age_days INTEGER,
  ADD COLUMN IF NOT EXISTS views_per_day INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN benchmark_videos.video_age_days
  IS 'Age of video in days (calculated from upload_date to current date)';

COMMENT ON COLUMN benchmark_videos.views_per_day
  IS 'Average views per day (total views / video age in days)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS benchmark_videos_video_age_days_idx
  ON benchmark_videos(video_age_days);

CREATE INDEX IF NOT EXISTS benchmark_videos_views_per_day_idx
  ON benchmark_videos(views_per_day);
