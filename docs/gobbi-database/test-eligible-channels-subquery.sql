-- ============================================================================
-- DEBUG: Testar a subquery de eligible_channels isoladamente
-- RODE ESTE SQL NO EDITOR DO SUPABASE DO GOBBI
-- ============================================================================

-- Teste 1: Pegar um vídeo específico e testar a subquery
WITH test_video AS (
  SELECT
    id,
    categorization->>'niche' as niche,
    categorization->>'subniche' as subniche
  FROM benchmark_videos
  WHERE status = 'pending_distribution'
  LIMIT 1
)
SELECT
  tv.*,
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
              'production_workflow_id', sbb.placeholder  -- PODE ESTAR ERRADO!
            )
          ELSE NULL
        END
      ) ORDER BY sa.placeholder ASC
    )
    FROM structure_accounts sa
    LEFT JOIN structure_brand_bible sbb ON sbb.id = sa.brand_id
    WHERE sa.niche = tv.niche
      AND sa.subniche = tv.subniche
  ) AS eligible_channels
FROM test_video tv;

-- Teste 2: Verificar se há erros de tipagem na subquery
SELECT
  sa.unique_profile_id,
  sa.placeholder,
  sa.niche,
  sa.subniche,
  sa.language,
  sa.brand_id,
  sbb.id as bible_id,
  sbb.brand_name,
  sbb.placeholder as bible_placeholder
FROM structure_accounts sa
LEFT JOIN structure_brand_bible sbb ON sbb.id = sa.brand_id
WHERE sa.niche = 'entertainment'
  AND sa.subniche = 'storytelling'
ORDER BY sa.placeholder ASC;

-- Teste 3: Ver se a query COMPLETA funciona SEM a subquery problemática
SELECT
  bv.id,
  bv.title,
  bv.status,
  bv.created_at,
  bc.channel_name AS benchmark_channel_title
FROM benchmark_videos bv
LEFT JOIN benchmark_channels bc ON bc.channel_id = bv.channel_id
WHERE bv.status = 'pending_distribution'
ORDER BY bv.created_at ASC
LIMIT 10;
