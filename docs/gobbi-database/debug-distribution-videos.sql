-- ============================================================================
-- DEBUG: Investigar por que vídeos não aparecem na Distribution
-- RODE ESTE SQL NO EDITOR DO SUPABASE DO GOBBI
-- ============================================================================

-- 1. Verificar TODOS os status possíveis de benchmark_videos
SELECT
  status,
  COUNT(*) as total_videos
FROM benchmark_videos
GROUP BY status
ORDER BY total_videos DESC;

-- 2. Verificar vídeos com status 'pending_distribution' especificamente
SELECT
  id,
  title,
  status,
  created_at,
  categorization->>'niche' as niche,
  categorization->>'subniche' as subniche
FROM benchmark_videos
WHERE status = 'pending_distribution'
ORDER BY created_at ASC
LIMIT 20;

-- 3. Verificar vídeos recentes (últimos 10) e seus status
SELECT
  id,
  title,
  status,
  created_at,
  youtube_video_id
FROM benchmark_videos
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar se existem canais elegíveis (structure_accounts)
SELECT
  niche,
  subniche,
  COUNT(*) as total_channels
FROM structure_accounts
GROUP BY niche, subniche
ORDER BY total_channels DESC;

-- 5. Simular a query do RPC (SEM os canais elegíveis pra simplificar)
SELECT
  bv.id,
  bv.title,
  bv.status,
  bv.created_at,
  bc.channel_name AS benchmark_channel_title,
  bv.categorization->>'niche' as niche,
  bv.categorization->>'subniche' as subniche
FROM benchmark_videos bv
LEFT JOIN benchmark_channels bc ON bc.channel_id = bv.channel_id
WHERE bv.status = 'pending_distribution'
ORDER BY bv.created_at ASC;

-- 6. Verificar se há vídeos que FORAM distribuídos recentemente
SELECT
  id,
  title,
  status,
  created_at
FROM benchmark_videos
WHERE status IN ('used', 'distributed')
ORDER BY created_at DESC
LIMIT 10;

-- 7. TESTE: Verificar se há vídeos com status 'add_to_production' ou similar
SELECT
  id,
  title,
  status,
  created_at
FROM benchmark_videos
WHERE status LIKE '%production%' OR status LIKE '%pending%'
ORDER BY created_at DESC
LIMIT 20;
