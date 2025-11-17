-- ==================================================================
-- TEST DISTRIBUTION FLOW
-- Script para testar o fluxo completo de distribuição
-- ==================================================================

-- STEP 1: Find suitable test video
-- Busca vídeos com categorização e transcript disponível
SELECT
  id,
  title,
  youtube_video_id,
  status,
  categorization->>'niche' as niche,
  categorization->>'subniche' as subniche,
  CASE
    WHEN video_transcript IS NOT NULL AND video_transcript != '' THEN 'Available'
    ELSE 'Missing'
  END as transcript_status
FROM benchmark_videos
WHERE status = 'available'
  AND categorization IS NOT NULL
  AND categorization->>'niche' IS NOT NULL
  AND categorization->>'subniche' IS NOT NULL
  AND video_transcript IS NOT NULL
  AND video_transcript != ''
ORDER BY created_at DESC
LIMIT 5;

-- ==================================================================
-- STEP 2: Check eligible channels for the video
-- Substitua 26388 pelo ID do vídeo que escolheu acima
-- ==================================================================
SELECT
  sa.unique_profile_id,
  sa.placeholder,
  sa.niche,
  sa.subniche,
  sa.language,
  sbb.id as brand_bible_id,
  CASE
    WHEN sbb.id IS NOT NULL THEN '✅ Has Brand Bible'
    ELSE '❌ No Brand Bible'
  END as brand_bible_status
FROM structure_accounts sa
LEFT JOIN structure_brand_bible sbb ON sbb.id = sa.brand_id
WHERE sa.niche = (
  SELECT categorization->>'niche'
  FROM benchmark_videos
  WHERE id = 26388  -- ⚠️ SUBSTITUA PELO ID DO VÍDEO ESCOLHIDO
)
AND sa.subniche = (
  SELECT categorization->>'subniche'
  FROM benchmark_videos
  WHERE id = 26388  -- ⚠️ SUBSTITUA PELO ID DO VÍDEO ESCOLHIDO
)
ORDER BY sa.placeholder;

-- ==================================================================
-- STEP 3: Update video status to start the flow
-- ⚠️ IMPORTANTE: Rodar SOMENTE depois de confirmar que tem canais elegíveis
-- ==================================================================
-- UPDATE benchmark_videos
-- SET status = 'add_to_production',
--     updated_at = NOW()
-- WHERE id = 26388;  -- ⚠️ SUBSTITUA PELO ID DO VÍDEO ESCOLHIDO

-- ==================================================================
-- STEP 4: Monitor queue processing (run periodically)
-- ==================================================================
SELECT
  id,
  title,
  status,
  updated_at,
  CASE
    WHEN status = 'add_to_production' THEN '⏳ Waiting for queue processor'
    WHEN status = 'pending_distribution' THEN '✅ Ready for distribution'
    WHEN status = 'used' THEN '✅ Already distributed'
    ELSE status
  END as status_label
FROM benchmark_videos
WHERE id = 26388  -- ⚠️ SUBSTITUA PELO ID DO VÍDEO ESCOLHIDO
ORDER BY updated_at DESC;

-- ==================================================================
-- STEP 5: Check if production jobs were created (after distribution)
-- ==================================================================
SELECT
  id,
  benchmark_id,
  placeholder,
  status,
  distribution_mode,
  distributed_at,
  created_at
FROM production_videos
WHERE benchmark_id = 26388  -- ⚠️ SUBSTITUA PELO ID DO VÍDEO ESCOLHIDO
ORDER BY created_at DESC;

-- ==================================================================
-- STEP 6: Cleanup (reset test video if needed)
-- ==================================================================
-- UPDATE benchmark_videos
-- SET status = 'available',
--     updated_at = NOW()
-- WHERE id = 26388;  -- ⚠️ SUBSTITUA PELO ID DO VÍDEO ESCOLHIDO
--
-- DELETE FROM production_videos
-- WHERE benchmark_id = 26388;  -- ⚠️ SUBSTITUA PELO ID DO VÍDEO ESCOLHIDO
