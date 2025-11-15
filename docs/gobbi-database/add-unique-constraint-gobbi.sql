-- add-unique-constraint-gobbi.sql
-- SQL para adicionar unique constraint no banco do Gobbi
-- ⚠️ RODE ESTE SQL NO SQL EDITOR DO SUPABASE DO GOBBI

-- Check if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_youtube_video_id'
      AND conrelid = 'public.benchmark_videos'::regclass
  ) THEN
    -- Add unique constraint
    ALTER TABLE benchmark_videos
    ADD CONSTRAINT unique_youtube_video_id UNIQUE (youtube_video_id);

    RAISE NOTICE '✅ Unique constraint added successfully';
  ELSE
    RAISE NOTICE '⚠️  Constraint already exists, skipping';
  END IF;
END $$;

-- Verify constraint was created
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.benchmark_videos'::regclass
  AND conname = 'unique_youtube_video_id';

-- Check for any duplicate youtube_video_ids before creating constraint
-- (If this returns rows, you need to clean duplicates first)
SELECT
  youtube_video_id,
  COUNT(*) as count
FROM benchmark_videos
GROUP BY youtube_video_id
HAVING COUNT(*) > 1;
