-- ============================================
-- DELETE OLD VIDEOS FROM BENCHMARK_VIDEOS
-- Purpose: Remove videos collected before November 10, 2025
-- Date: 2025-11-13
-- ============================================

-- ============================================
-- SAFETY CHECK: Count how many videos will be deleted
-- ============================================
SELECT
  COUNT(*) as total_videos_to_delete,
  MIN(created_at) as oldest_video,
  MAX(created_at) as newest_video_in_range
FROM benchmark_videos
WHERE created_at < '2025-11-10 00:00:00'::timestamptz;

-- ============================================
-- PREVIEW: Show sample of videos that will be deleted
-- ============================================
SELECT
  id,
  youtube_video_id,
  title,
  channel_id,
  created_at
FROM benchmark_videos
WHERE created_at < '2025-11-10 00:00:00'::timestamptz
ORDER BY created_at ASC
LIMIT 10;

-- ============================================
-- EXECUTE DELETE (uncomment to run)
-- ============================================
-- DELETE FROM benchmark_videos
-- WHERE created_at < '2025-11-10 00:00:00'::timestamptz;

-- ============================================
-- VERIFY: Count remaining videos
-- ============================================
-- SELECT
--   COUNT(*) as remaining_videos,
--   MIN(created_at) as oldest_remaining,
--   MAX(created_at) as newest_remaining
-- FROM benchmark_videos;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Run the SELECT queries first to verify what will be deleted
-- 2. Uncomment the DELETE statement only when you're sure
-- 3. This will cascade delete related records if foreign keys are set up
-- 4. Consider backing up data before running the DELETE
--
-- To backup before deleting:
-- CREATE TABLE benchmark_videos_backup_20251113 AS
-- SELECT * FROM benchmark_videos
-- WHERE created_at < '2025-11-10 00:00:00'::timestamptz;
