-- ============================================================================
-- Migration: Distribution Flow for Gobbi's Database
-- Date: 2025-11-16
-- Description: Adds distribution tracking columns and RPC function
-- ============================================================================

-- ============================================================================
-- Part 1: Add tracking columns to production_videos (if not exist)
-- ============================================================================

ALTER TABLE production_videos
ADD COLUMN IF NOT EXISTS distributed_by TEXT,
ADD COLUMN IF NOT EXISTS distributed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS distribution_mode TEXT DEFAULT 'manual';

COMMENT ON COLUMN production_videos.distributed_by IS 'User/system that distributed this video';
COMMENT ON COLUMN production_videos.distributed_at IS 'When the video was distributed';
COMMENT ON COLUMN production_videos.distribution_mode IS 'manual or automatic';

-- ============================================================================
-- Part 2: Performance indexes
-- ============================================================================

-- Index for matching channels by niche AND subniche
CREATE INDEX IF NOT EXISTS idx_structure_accounts_niche_subniche
ON structure_accounts(niche, subniche);

-- Index for benchmark_videos by status (for queue control)
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_status
ON benchmark_videos(status);

-- Index for production_videos by status (for monitoring)
CREATE INDEX IF NOT EXISTS idx_production_videos_status
ON production_videos(status);

-- ============================================================================
-- Part 3: RPC Function - Get Videos Awaiting Distribution
-- ============================================================================

CREATE OR REPLACE FUNCTION get_videos_awaiting_distribution()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Fetch videos in pending_distribution status with eligible channels
  WITH videos_data AS (
    SELECT
      bv.id,
      bv.title,
      bv.description,
      bv.categorization,
      bv.video_transcript,
      bv.youtube_video_id,
      bv.youtube_url,
      bv.channel_id,
      bv.status,
      bv.created_at,
      -- Get source channel info
      bc.channel_title,
      bc.channel_handle,
      -- Get eligible destination channels (matching niche AND subniche)
      (
        SELECT json_agg(
          json_build_object(
            'unique_profile_id', sa.unique_profile_id,
            'placeholder', sa.placeholder,
            'niche', sa.niche,
            'subniche', sa.subniche,
            'language', sa.language,
            'structure_brand_bible', CASE
              WHEN sbb.id IS NOT NULL THEN
                json_build_object(
                  'brand_name', sbb.brand_name,
                  'production_workflow_id', sbb.production_workflow_id,
                  'brand_context', sbb.brand_context,
                  'visual_profile', sbb.visual_profile
                )
              ELSE NULL
            END
          )
        )
        FROM structure_accounts sa
        LEFT JOIN structure_brand_bible sbb ON sbb.placeholder = sa.unique_profile_id
        WHERE sa.niche = (bv.categorization->>'niche')
          AND sa.subniche = (bv.categorization->>'subniche')
        ORDER BY sa.placeholder ASC
      ) AS eligible_channels
    FROM benchmark_videos bv
    LEFT JOIN benchmark_channels bc ON bc.id::text = bv.channel_id::text
    WHERE bv.status = 'pending_distribution'
    ORDER BY bv.created_at ASC
  )
  SELECT json_build_object(
    'videos', COALESCE(json_agg(
      json_build_object(
        'id', vd.id,
        'title', vd.title,
        'description', vd.description,
        'categorization', vd.categorization,
        'video_transcript', vd.video_transcript,
        'youtube_video_id', vd.youtube_video_id,
        'youtube_url', vd.youtube_url,
        'status', vd.status,
        'created_at', vd.created_at,
        'benchmark_channels', CASE
          WHEN vd.channel_title IS NOT NULL THEN
            json_build_object(
              'channel_title', vd.channel_title,
              'channel_handle', vd.channel_handle
            )
          ELSE NULL
        END,
        'eligibleChannels', COALESCE(vd.eligible_channels, '[]'::json)
      )
    ), '[]'::json),
    'error', NULL
  ) INTO result
  FROM videos_data vd;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'videos', '[]'::json,
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION get_videos_awaiting_distribution() IS
'Returns all videos in pending_distribution status with their eligible destination channels';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_videos_awaiting_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION get_videos_awaiting_distribution() TO service_role;
