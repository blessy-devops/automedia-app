-- =====================================================
-- Materialized Views for Performance Metrics
-- =====================================================
-- Created: 2025-10-22
-- Purpose: Pre-calculate aggregated metrics for videos and channels
--          to improve page load performance
-- Refresh: Auto-refreshed via trigger on data changes

-- =====================================================
-- 1. VIDEO METRICS MATERIALIZED VIEW
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS video_metrics_summary AS
SELECT
  COUNT(*)::int AS total_videos,
  COALESCE(SUM(views), 0)::bigint AS total_views,
  CASE
    WHEN COUNT(*) > 0
    THEN ROUND(COALESCE(SUM(views), 0)::numeric / COUNT(*)::numeric)::bigint
    ELSE 0
  END AS average_views,
  COUNT(
    CASE
      WHEN performance_vs_median_historical >= 5
      THEN 1
    END
  )::int AS outliers_5x_count,
  NOW() AS last_updated
FROM benchmark_videos;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS video_metrics_summary_singleton_idx
ON video_metrics_summary ((1));

-- Add comment
COMMENT ON MATERIALIZED VIEW video_metrics_summary IS
'Aggregated metrics for all videos. Refreshed automatically on video changes.';

-- =====================================================
-- 2. CHANNEL METRICS MATERIALIZED VIEW
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS channel_metrics_summary AS
SELECT
  COUNT(*)::int AS total_channels,
  COALESCE(SUM(subscriber_count), 0)::bigint AS total_subscribers,
  CASE
    WHEN COUNT(*) > 0
    THEN ROUND(COALESCE(SUM(subscriber_count), 0)::numeric / COUNT(*)::numeric)::bigint
    ELSE 0
  END AS average_subscribers,
  COALESCE(SUM(video_upload_count), 0)::bigint AS total_videos_across_channels,
  CASE
    WHEN COUNT(*) > 0
    THEN ROUND(COALESCE(SUM(video_upload_count), 0)::numeric / COUNT(*)::numeric)::bigint
    ELSE 0
  END AS average_videos_per_channel,
  NOW() AS last_updated
FROM benchmark_channels;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS channel_metrics_summary_singleton_idx
ON channel_metrics_summary ((1));

-- Add comment
COMMENT ON MATERIALIZED VIEW channel_metrics_summary IS
'Aggregated metrics for all channels. Refreshed automatically on channel changes.';

-- =====================================================
-- 3. FUNCTION TO REFRESH METRICS VIEWS
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_metrics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh video metrics (CONCURRENTLY allows reads during refresh)
  REFRESH MATERIALIZED VIEW CONCURRENTLY video_metrics_summary;

  -- Refresh channel metrics
  REFRESH MATERIALIZED VIEW CONCURRENTLY channel_metrics_summary;

  RAISE NOTICE 'Metrics views refreshed at %', NOW();
END;
$$;

COMMENT ON FUNCTION refresh_metrics_views() IS
'Refreshes all materialized views for metrics. Safe to call frequently.';

-- =====================================================
-- 4. TRIGGER TO AUTO-REFRESH ON DATA CHANGES
-- =====================================================

-- Function that will be called by trigger
CREATE OR REPLACE FUNCTION trigger_refresh_video_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Refresh asynchronously to avoid blocking the transaction
  PERFORM refresh_metrics_views();
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_refresh_channel_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Refresh asynchronously to avoid blocking the transaction
  PERFORM refresh_metrics_views();
  RETURN NULL;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS refresh_video_metrics_trigger ON benchmark_videos;
DROP TRIGGER IF EXISTS refresh_channel_metrics_trigger ON benchmark_channels;

-- Create triggers for automatic refresh
-- AFTER INSERT/UPDATE/DELETE ensures views stay fresh
-- STATEMENT level means it fires once per transaction, not per row
CREATE TRIGGER refresh_video_metrics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON benchmark_videos
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_video_metrics();

CREATE TRIGGER refresh_channel_metrics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON benchmark_channels
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_channel_metrics();

-- =====================================================
-- 5. INITIAL REFRESH
-- =====================================================

-- Populate the views with initial data
SELECT refresh_metrics_views();

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Allow service role to refresh manually if needed
GRANT EXECUTE ON FUNCTION refresh_metrics_views() TO service_role;

-- Allow anon/authenticated to read the views
GRANT SELECT ON video_metrics_summary TO anon, authenticated;
GRANT SELECT ON channel_metrics_summary TO anon, authenticated;
