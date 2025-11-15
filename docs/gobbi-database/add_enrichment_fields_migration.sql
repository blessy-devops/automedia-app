-- Migration: Add enrichment fields to benchmark_videos table (Gobbi's database)
-- Date: 2025-11-15
-- Purpose: Add additional enrichment fields to enable full data sync from Automedia Platform
--
-- ⚠️ ESTE ARQUIVO DEVE SER EXECUTADO NO SUPABASE DO GOBBI, NÃO NO SEU
--
-- Como executar:
--   1. Abrir SQL Editor no dashboard do Supabase do Gobbi
--   2. Copiar e colar todo este arquivo
--   3. Executar (Run)

-- Add new columns to benchmark_videos table
ALTER TABLE benchmark_videos
  ADD COLUMN IF NOT EXISTS enrichment_data JSONB,
  ADD COLUMN IF NOT EXISTS performance_vs_recent_14d NUMERIC,
  ADD COLUMN IF NOT EXISTS keywords TEXT[],
  ADD COLUMN IF NOT EXISTS related_video_ids TEXT[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_enrichment_data
  ON benchmark_videos USING gin(enrichment_data)
  WHERE enrichment_data IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_benchmark_videos_keywords
  ON benchmark_videos USING gin(keywords)
  WHERE keywords IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_benchmark_videos_related_video_ids
  ON benchmark_videos USING gin(related_video_ids)
  WHERE related_video_ids IS NOT NULL;

-- Add column comments for documentation
COMMENT ON COLUMN benchmark_videos.enrichment_data IS 'Additional enrichment metadata from external sources (JSONB format)';
COMMENT ON COLUMN benchmark_videos.performance_vs_recent_14d IS 'Performance score vs recent 14-day average';
COMMENT ON COLUMN benchmark_videos.keywords IS 'Array of keywords/tags extracted from video content';
COMMENT ON COLUMN benchmark_videos.related_video_ids IS 'Array of related YouTube video IDs';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added 4 enrichment fields to benchmark_videos';
  RAISE NOTICE '  - enrichment_data (JSONB)';
  RAISE NOTICE '  - performance_vs_recent_14d (NUMERIC)';
  RAISE NOTICE '  - keywords (TEXT[])';
  RAISE NOTICE '  - related_video_ids (TEXT[])';
  RAISE NOTICE 'Created 3 GIN indexes for JSONB and array fields';
END $$;
