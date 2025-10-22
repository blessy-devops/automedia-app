-- =====================================================
-- Remove Automatic Materialized View Refresh Triggers
-- =====================================================
-- Created: 2025-10-22
-- Purpose: Remove automatic triggers that cause concurrency issues
--          during high-frequency UPSERT operations
-- Reason:  The automatic triggers were causing "cannot refresh materialized view concurrently"
--          errors when Edge Functions tried to upsert channel data
-- Solution: Keep materialized views but refresh them manually or on schedule,
--           not on every single transaction

-- =====================================================
-- 1. DROP AUTOMATIC REFRESH TRIGGERS
-- =====================================================

-- Drop the triggers that auto-refresh on every INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS refresh_video_metrics_trigger ON benchmark_videos;
DROP TRIGGER IF EXISTS refresh_channel_metrics_trigger ON benchmark_channels;

-- =====================================================
-- 2. KEEP THE VIEWS AND FUNCTIONS
-- =====================================================

-- Note: We keep the materialized views themselves:
--   - video_metrics_summary
--   - channel_metrics_summary
--
-- And we keep the refresh function:
--   - refresh_metrics_views()
--
-- You can now refresh manually when needed:
--   SELECT refresh_metrics_views();
--
-- Or set up a scheduled job (pg_cron) to refresh periodically:
--   SELECT cron.schedule('refresh-metrics', '*/5 * * * *', 'SELECT refresh_metrics_views()');

-- =====================================================
-- 3. ADD COMMENT EXPLAINING THE CHANGE
-- =====================================================

COMMENT ON FUNCTION refresh_metrics_views() IS
'Refreshes all materialized views for metrics. Call manually or schedule with pg_cron.
Auto-refresh triggers were removed to prevent concurrency conflicts during high-frequency writes.';
