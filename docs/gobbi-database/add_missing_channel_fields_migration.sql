-- Migration: Add missing fields to benchmark_channels table (Gobbi's database)
-- Date: 2025-11-15
-- Purpose: Add 7 missing columns to enable full channel data sync from Automedia Platform
--
-- ⚠️ ESTE ARQUIVO DEVE SER EXECUTADO NO SUPABASE DO GOBBI, NÃO NO SEU
--
-- Como executar:
--   1. Abrir SQL Editor no dashboard do Supabase do Gobbi
--   2. Copiar e colar todo este arquivo
--   3. Executar (Run)

-- Add new columns to benchmark_channels table
ALTER TABLE benchmark_channels
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_url TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_benchmark_channels_country
  ON benchmark_channels(country)
  WHERE country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_benchmark_channels_is_verified
  ON benchmark_channels(is_verified)
  WHERE is_verified = TRUE;

CREATE INDEX IF NOT EXISTS idx_benchmark_channels_created_at
  ON benchmark_channels(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_benchmark_channels_updated_at
  ON benchmark_channels(updated_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_benchmark_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_benchmark_channels_updated_at ON benchmark_channels;

CREATE TRIGGER trigger_benchmark_channels_updated_at
  BEFORE UPDATE ON benchmark_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_benchmark_channels_updated_at();

-- Add column comments for documentation
COMMENT ON COLUMN benchmark_channels.thumbnail_url IS 'URL of the channel thumbnail/avatar image';
COMMENT ON COLUMN benchmark_channels.banner_url IS 'URL of the channel banner/header image';
COMMENT ON COLUMN benchmark_channels.custom_url IS 'Custom URL handle for the channel (e.g., @username)';
COMMENT ON COLUMN benchmark_channels.country IS 'Country of the channel (ISO country code or name)';
COMMENT ON COLUMN benchmark_channels.is_verified IS 'Whether the channel has YouTube verification badge';
COMMENT ON COLUMN benchmark_channels.created_at IS 'Timestamp when this channel record was created in the database';
COMMENT ON COLUMN benchmark_channels.updated_at IS 'Timestamp when this channel record was last updated (auto-updated by trigger)';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added 7 missing fields to benchmark_channels';
  RAISE NOTICE '  - thumbnail_url (TEXT)';
  RAISE NOTICE '  - banner_url (TEXT)';
  RAISE NOTICE '  - custom_url (TEXT)';
  RAISE NOTICE '  - country (TEXT)';
  RAISE NOTICE '  - is_verified (BOOLEAN, default: FALSE)';
  RAISE NOTICE '  - created_at (TIMESTAMPTZ, default: now())';
  RAISE NOTICE '  - updated_at (TIMESTAMPTZ, default: now())';
  RAISE NOTICE 'Created 4 indexes for performance';
  RAISE NOTICE 'Created trigger for auto-updating updated_at timestamp';
END $$;
