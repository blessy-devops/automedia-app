-- ============================================================================
-- ADD MEDIAN-BASED OUTLIER SCORE METRICS (14d from SocialBlade)
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Copie este arquivo
-- 2. Cole no Supabase SQL Editor
-- 3. Execute (clique em "Run")
--
-- Este script adiciona:
-- - mediana_diaria_views_14d em benchmark_channels_baseline_stats
-- - performance_vs_median_14d e performance_vs_avg_14d em benchmark_videos
-- ============================================================================

-- STEP 1: Add median calculation to baseline_stats table
ALTER TABLE benchmark_channels_baseline_stats
  ADD COLUMN IF NOT EXISTS mediana_diaria_views_14d NUMERIC;

COMMENT ON COLUMN benchmark_channels_baseline_stats.mediana_diaria_views_14d
  IS 'Median of daily views in last 14 days (from SocialBlade dailyStats array)';

-- STEP 2: Add new performance columns to benchmark_videos table
ALTER TABLE benchmark_videos
  ADD COLUMN IF NOT EXISTS performance_vs_median_14d NUMERIC,
  ADD COLUMN IF NOT EXISTS performance_vs_avg_14d NUMERIC;

COMMENT ON COLUMN benchmark_videos.performance_vs_median_14d
  IS 'Video viewsPerDay / channel median daily views (14d from SocialBlade). Fallback: performance_vs_median_historical';

COMMENT ON COLUMN benchmark_videos.performance_vs_avg_14d
  IS 'Video viewsPerDay / channel average daily views (14d from SocialBlade). Fallback: performance_vs_avg_historical';

-- STEP 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_performance_vs_median_14d
  ON benchmark_videos(performance_vs_median_14d)
  WHERE performance_vs_median_14d IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_benchmark_videos_performance_vs_avg_14d
  ON benchmark_videos(performance_vs_avg_14d)
  WHERE performance_vs_avg_14d IS NOT NULL;

-- STEP 4: Verify columns were created
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'benchmark_channels_baseline_stats'
  AND column_name = 'mediana_diaria_views_14d';

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'benchmark_videos'
  AND column_name IN ('performance_vs_median_14d', 'performance_vs_avg_14d');

-- SUCCESS MESSAGE
SELECT 'Migration completed successfully! New columns added.' AS status;
