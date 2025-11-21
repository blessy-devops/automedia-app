-- Migration: Add Social Blade availability flags
-- Date: 2025-11-20
-- Description: Add flags to track when Social Blade data is unavailable (channel too new/not indexed)
--              This allows the enrichment pipeline to continue even when Social Blade scraping fails

-- Add availability flag to channel_enrichment_tasks
-- Tracks whether Social Blade data was successfully retrieved for this enrichment task
ALTER TABLE channel_enrichment_tasks
ADD COLUMN IF NOT EXISTS socialblade_available boolean DEFAULT true;

COMMENT ON COLUMN channel_enrichment_tasks.socialblade_available IS
'Indicates whether Social Blade data was successfully retrieved. False when channel is too new or not indexed in Social Blade.';

-- Add availability flag to benchmark_channels_baseline_stats
-- Allows quick filtering/querying of channels with valid Social Blade metrics
ALTER TABLE benchmark_channels_baseline_stats
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

COMMENT ON COLUMN benchmark_channels_baseline_stats.is_available IS
'Indicates whether this baseline stats record contains valid Social Blade data. False when metrics could not be retrieved.';

-- Create index for efficient querying of available/unavailable baseline stats
CREATE INDEX IF NOT EXISTS idx_baseline_stats_availability
ON benchmark_channels_baseline_stats(is_available);

COMMENT ON INDEX idx_baseline_stats_availability IS
'Performance index for filtering channels by Social Blade data availability.';
