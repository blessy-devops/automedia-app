-- Add missing columns to benchmark_channels_baseline_stats
-- These columns store calculated metrics from SocialBlade scraping (last 14 days)

ALTER TABLE benchmark_channels_baseline_stats
  ADD COLUMN IF NOT EXISTS media_diaria_views_14d REAL,
  ADD COLUMN IF NOT EXISTS taxa_crescimento REAL;

-- Add comments for documentation
COMMENT ON COLUMN benchmark_channels_baseline_stats.media_diaria_views_14d
  IS 'Average daily views in last 14 days (total_views_14d / 14)';

COMMENT ON COLUMN benchmark_channels_baseline_stats.taxa_crescimento
  IS 'Growth rate percentage comparing first half vs second half of 14d period';
