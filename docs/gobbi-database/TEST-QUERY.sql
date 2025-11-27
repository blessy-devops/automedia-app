-- ============================================================================
-- QUERY DE TESTE: Simular a função antiga para ver quantos vídeos retorna
-- RODE ESTE SQL NO EDITOR DO SUPABASE DO GOBBI
-- ============================================================================

-- Esta query é EXATAMENTE igual à função que você tinha rodado antes
-- Vai retornar o mesmo JSON que a função retornava

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
  WHERE bv.status = 'pending_distribution'  -- ← FILTRO PRINCIPAL
  ORDER BY bv.created_at ASC
  LIMIT 50 OFFSET 0
)
SELECT
  (SELECT COUNT(*) FROM benchmark_videos WHERE status = 'pending_distribution') as total_count,
  json_agg(
    json_build_object(
      'id', vd.id,
      'title', vd.title,
      'description', vd.description,
      'status', vd.status,
      'created_at', vd.created_at,
      'eligibleChannels', COALESCE(vd.eligible_channels, '[]'::json)
    )
  ) as videos
FROM videos_data vd;

-- ============================================================================
-- RESULTADO ATUAL: Vai retornar 3 vídeos
-- DEPOIS DO UPDATE: Vai retornar 46 vídeos (3 + 43)
-- ============================================================================
