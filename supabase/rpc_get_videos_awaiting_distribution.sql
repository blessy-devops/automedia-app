CREATE OR REPLACE FUNCTION get_videos_awaiting_distribution(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_count INT;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO total_count
  FROM benchmark_videos
  WHERE status = 'pending_distribution';

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
      -- Performance scores with fallback to historical
      COALESCE(bv.performance_vs_median_14d, bv.performance_vs_median_historical) as performance_vs_median_14d,
      COALESCE(bv.performance_vs_avg_14d, bv.performance_vs_avg_historical) as performance_vs_avg_14d,
      -- Indicators for which metric is being used
      CASE WHEN bv.performance_vs_median_14d IS NOT NULL THEN '14d' ELSE 'historical' END as median_metric_source,
      CASE WHEN bv.performance_vs_avg_14d IS NOT NULL THEN '14d' ELSE 'historical' END as avg_metric_source,
      bc.channel_name AS benchmark_channel_title,
      '' AS benchmark_channel_handle,
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
                  'production_workflow_id', sbb.placeholder
                )
              ELSE NULL
            END
          ) ORDER BY sa.placeholder ASC
        )
        FROM structure_accounts sa
        LEFT JOIN structure_brand_bible sbb ON sbb.id = sa.brand_id
        WHERE sa.niche = (bv.categorization->>'niche')
          AND sa.subniche = (bv.categorization->>'subniche')
      ) AS eligible_channels
    FROM benchmark_videos bv
    LEFT JOIN benchmark_channels bc ON bc.channel_id = bv.channel_id
    WHERE bv.status = 'pending_distribution'
    ORDER BY bv.created_at ASC
    LIMIT p_limit OFFSET p_offset
  ),
  aggregated_videos AS (
    SELECT COALESCE(json_agg(
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
        'performance_vs_median_14d', vd.performance_vs_median_14d,
        'performance_vs_avg_14d', vd.performance_vs_avg_14d,
        'median_metric_source', vd.median_metric_source,
        'avg_metric_source', vd.avg_metric_source,
        'benchmark_channels', CASE
          WHEN vd.benchmark_channel_title IS NOT NULL THEN
            json_build_object(
              'channel_title', vd.benchmark_channel_title,
              'channel_handle', vd.benchmark_channel_handle
            )
          ELSE NULL
        END,
        'eligibleChannels', COALESCE(vd.eligible_channels, '[]'::json)
      )
    ), '[]'::json) as videos_json
    FROM videos_data vd
  )
  SELECT json_build_object(
    'videos', av.videos_json,
    'total_count', tc.count_value,
    'error', NULL
  ) INTO result
  FROM aggregated_videos av
  CROSS JOIN (SELECT total_count as count_value) tc;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'videos', '[]'::json,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- Comentários e Permissões
-- ============================================================================

COMMENT ON FUNCTION get_videos_awaiting_distribution(INT, INT) IS
'Returns paginated videos in pending_distribution status with their eligible destination channels and performance scores (outlier metrics). Includes fallback to historical metrics if 14d metrics are not available.

Parameters:
- p_limit: Number of videos to return (default: 50)
- p_offset: Number of videos to skip for pagination (default: 0)

Returns:
{
  "videos": [...],
  "total_count": number,
  "error": null
}';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_videos_awaiting_distribution(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_videos_awaiting_distribution(INT, INT) TO service_role;
