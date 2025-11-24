-- ============================================================================
-- UPDATE RPC: Add Outlier Scores to get_videos_awaiting_distribution
-- Date: 2025-11-24
-- ============================================================================
--
-- OBJETIVO:
-- Atualizar a RPC function get_videos_awaiting_distribution para incluir
-- os campos de performance (outlier scores) na resposta.
--
-- Novos campos:
-- - performance_vs_median_14d: Ratio do vídeo vs mediana do canal (14 dias)
-- - performance_vs_avg_14d: Ratio do vídeo vs média do canal (14 dias)
--
-- USO:
-- Copie e cole este SQL no SQL Editor do Supabase do GOBBI
--
-- ⚠️ IMPORTANTE: Rode este SQL no banco do GOBBI, não no seu banco local!
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
      -- Performance scores with fallback to historical
      COALESCE(bv.performance_vs_median_14d, bv.performance_vs_median_historical) as performance_vs_median_14d,
      COALESCE(bv.performance_vs_avg_14d, bv.performance_vs_avg_historical) as performance_vs_avg_14d,
      -- Indicators for which metric is being used
      CASE WHEN bv.performance_vs_median_14d IS NOT NULL THEN '14d' ELSE 'historical' END as median_metric_source,
      CASE WHEN bv.performance_vs_avg_14d IS NOT NULL THEN '14d' ELSE 'historical' END as avg_metric_source,
      -- Get source channel info
      bc.channel_name AS benchmark_channel_title,
      '' AS benchmark_channel_handle,
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
                  'production_workflow_id', sbb.production_workflow_id
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

-- ============================================================================
-- Comentário e Permissões
-- ============================================================================

COMMENT ON FUNCTION get_videos_awaiting_distribution() IS
'Returns all videos in pending_distribution status with their eligible destination channels and outlier scores (performance_vs_median_14d, performance_vs_avg_14d)';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_videos_awaiting_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION get_videos_awaiting_distribution() TO service_role;

-- ============================================================================
-- Verificação (Execute após rodar o SQL acima)
-- ============================================================================

-- Teste a função:
-- SELECT * FROM get_videos_awaiting_distribution();

-- Verifique se os campos de performance estão sendo retornados:
-- SELECT
--   (video->>'id')::int as id,
--   video->>'title' as title,
--   (video->>'performance_vs_median_14d')::numeric as median_score,
--   (video->>'performance_vs_avg_14d')::numeric as avg_score
-- FROM (
--   SELECT jsonb_array_elements(
--     (get_videos_awaiting_distribution()->>'videos')::jsonb
--   ) as video
-- ) t
-- LIMIT 5;
