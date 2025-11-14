-- Migration: Remove Orphaned Pipeline Status Fields
-- Date: 2025-11-13
-- Description: Removes status fields from old stub functions that are no longer used in the pipeline
--
-- Background:
-- The current pipeline has 5 steps:
--   1. Categorization (updates categorization_status)
--   2. SocialBlade (updates socialblade_status + writes to benchmark_channels_baseline_stats)
--   3. Recent Videos (updates recent_videos_status)
--   4. Trending Videos (updates trending_videos_status)
--   5. Outlier Calc (updates outlier_analysis_status)
--
-- The old pipeline design had stub functions (step-3-fetch-videos, step-4-baseline-stats,
-- step-5-outlier-analysis) that created status fields but were never actually used.
-- These fields are orphaned and never updated by the current pipeline.

-- Remove orphaned baseline_stats fields
ALTER TABLE channel_enrichment_tasks
  DROP COLUMN IF EXISTS baseline_stats_status,
  DROP COLUMN IF EXISTS baseline_stats_started_at,
  DROP COLUMN IF EXISTS baseline_stats_completed_at,
  DROP COLUMN IF EXISTS baseline_stats_error,
  DROP COLUMN IF EXISTS baseline_stats_result;

-- Remove orphaned fetch_videos fields (if they exist)
ALTER TABLE channel_enrichment_tasks
  DROP COLUMN IF EXISTS fetch_videos_status,
  DROP COLUMN IF EXISTS fetch_videos_started_at,
  DROP COLUMN IF EXISTS fetch_videos_completed_at,
  DROP COLUMN IF EXISTS fetch_videos_error,
  DROP COLUMN IF EXISTS fetch_videos_result;

-- Add comment to table explaining the current pipeline
COMMENT ON TABLE channel_enrichment_tasks IS
'Tracks enrichment pipeline progress for benchmark channels.
Current pipeline (5 steps):
1. Categorization - AI categorizes channel (categorization_status)
2. SocialBlade - Fetches metrics and calculates baseline stats (socialblade_status)
3. Recent Videos - Fetches newest videos from YouTube (recent_videos_status)
4. Trending Videos - Fetches popular videos from YouTube (trending_videos_status)
5. Outlier Analysis - Calculates performance metrics for all videos (outlier_analysis_status)

Note: Baseline statistics are calculated in Step 2 and stored in benchmark_channels_baseline_stats table.
There is no separate baseline_stats step.';
