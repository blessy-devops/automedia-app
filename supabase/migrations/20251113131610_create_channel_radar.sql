-- Migration: Create Channel Radar System
-- Description: Adds channel_radar table for monitoring channels with daily updates
-- Author: Claude Code
-- Date: 2025-11-13

-- ============================================================================
-- STEP 1: Add in_radar column to benchmark_channels
-- ============================================================================
ALTER TABLE benchmark_channels
ADD COLUMN IF NOT EXISTS in_radar BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for fast queries on radar channels
CREATE INDEX IF NOT EXISTS idx_benchmark_channels_in_radar
ON benchmark_channels(in_radar)
WHERE in_radar = TRUE;

COMMENT ON COLUMN benchmark_channels.in_radar IS 'Flag indicating if channel is being monitored in Channel Radar';

-- ============================================================================
-- STEP 2: Create channel_radar table
-- ============================================================================
CREATE TABLE IF NOT EXISTS channel_radar (
  id SERIAL PRIMARY KEY,
  channel_id VARCHAR(255) NOT NULL UNIQUE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_update_at TIMESTAMP WITH TIME ZONE,
  next_update_at TIMESTAMP WITH TIME ZONE,
  update_frequency VARCHAR(20) DEFAULT 'daily' NOT NULL CHECK (update_frequency IN ('daily', 'weekly', 'manual')),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  has_10x_outlier BOOLEAN DEFAULT FALSE NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT fk_channel_radar_channel
    FOREIGN KEY (channel_id)
    REFERENCES benchmark_channels(channel_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_radar_active
ON channel_radar(is_active)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_channel_radar_next_update
ON channel_radar(next_update_at)
WHERE next_update_at IS NOT NULL AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_channel_radar_last_update
ON channel_radar(last_update_at DESC);

CREATE INDEX IF NOT EXISTS idx_channel_radar_10x_outlier
ON channel_radar(has_10x_outlier)
WHERE has_10x_outlier = TRUE;

-- Add comments
COMMENT ON TABLE channel_radar IS 'Tracks channels being monitored with daily automated updates';
COMMENT ON COLUMN channel_radar.channel_id IS 'YouTube Channel ID (foreign key to benchmark_channels)';
COMMENT ON COLUMN channel_radar.added_at IS 'When the channel was added to radar monitoring';
COMMENT ON COLUMN channel_radar.last_update_at IS 'Last time channel data was updated';
COMMENT ON COLUMN channel_radar.next_update_at IS 'Scheduled time for next update';
COMMENT ON COLUMN channel_radar.update_frequency IS 'How often to update: daily, weekly, or manual';
COMMENT ON COLUMN channel_radar.is_active IS 'Whether this channel is actively being monitored';
COMMENT ON COLUMN channel_radar.has_10x_outlier IS 'Cached flag: TRUE if channel has any video with 10x+ outlier ratio';
COMMENT ON COLUMN channel_radar.notes IS 'User notes about why this channel is being monitored';

-- ============================================================================
-- STEP 3: Create trigger function to sync in_radar flag
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_benchmark_channels_radar_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- When a channel is added to radar
  IF TG_OP = 'INSERT' THEN
    UPDATE benchmark_channels
    SET in_radar = TRUE
    WHERE channel_id = NEW.channel_id;
    RETURN NEW;

  -- When a channel is removed from radar
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE benchmark_channels
    SET in_radar = FALSE
    WHERE channel_id = OLD.channel_id;
    RETURN OLD;

  -- When radar status changes (is_active toggle)
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active != OLD.is_active THEN
    UPDATE benchmark_channels
    SET in_radar = NEW.is_active
    WHERE channel_id = NEW.channel_id;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_radar_flag ON channel_radar;
CREATE TRIGGER trigger_sync_radar_flag
AFTER INSERT OR UPDATE OR DELETE ON channel_radar
FOR EACH ROW EXECUTE FUNCTION sync_benchmark_channels_radar_flag();

COMMENT ON FUNCTION sync_benchmark_channels_radar_flag() IS 'Automatically syncs benchmark_channels.in_radar flag when channel_radar changes';

-- ============================================================================
-- STEP 4: Create trigger function to update has_10x_outlier flag
-- ============================================================================
CREATE OR REPLACE FUNCTION update_channel_10x_outlier_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the has_10x_outlier flag for the affected channel
  UPDATE channel_radar cr
  SET has_10x_outlier = EXISTS (
    SELECT 1
    FROM benchmark_videos bv
    WHERE bv.channel_id = cr.channel_id
    AND (
      bv.performance_vs_median_historical >= 10 OR
      bv.performance_vs_avg_historical >= 10 OR
      bv.performance_vs_recent_14d >= 10
    )
  )
  WHERE cr.channel_id = NEW.channel_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on benchmark_videos
DROP TRIGGER IF EXISTS trigger_update_10x_flag ON benchmark_videos;
CREATE TRIGGER trigger_update_10x_flag
AFTER INSERT OR UPDATE ON benchmark_videos
FOR EACH ROW EXECUTE FUNCTION update_channel_10x_outlier_flag();

COMMENT ON FUNCTION update_channel_10x_outlier_flag() IS 'Automatically updates has_10x_outlier flag when video outlier ratios change';

-- ============================================================================
-- STEP 5: Create updated_at trigger for channel_radar
-- ============================================================================
CREATE OR REPLACE FUNCTION update_channel_radar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_channel_radar_updated_at ON channel_radar;
CREATE TRIGGER trigger_update_channel_radar_updated_at
BEFORE UPDATE ON channel_radar
FOR EACH ROW EXECUTE FUNCTION update_channel_radar_updated_at();

-- ============================================================================
-- STEP 6: Grant permissions (RLS will be handled separately if needed)
-- ============================================================================
-- Note: Adjust permissions based on your auth setup
-- These are basic permissions for service_role and authenticated users

-- Grant access to service_role (for Edge Functions)
GRANT ALL ON channel_radar TO service_role;
GRANT ALL ON SEQUENCE channel_radar_id_seq TO service_role;

-- Grant read access to authenticated users
GRANT SELECT ON channel_radar TO authenticated;
GRANT SELECT ON benchmark_channels TO authenticated;

-- Grant UPDATE permissions for server actions (toggleRadarActive, updateRadarNotes)
GRANT UPDATE (is_active, notes, updated_at) ON channel_radar TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
