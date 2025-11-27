-- ============================================================================
-- INVESTIGAÇÃO: Onde foram parar os 12-15 vídeos que sumiram?
-- RODE ESTE SQL NO EDITOR DO SUPABASE DO GOBBI
-- ============================================================================

-- QUERY 1: Contar vídeos por STATUS
-- Isso mostra onde os vídeos estão REALMENTE
SELECT
  status,
  COUNT(*) as total_videos
FROM benchmark_videos
GROUP BY status
ORDER BY total_videos DESC;

-- RESULTADO ESPERADO:
-- Você vai ver se tem muitos vídeos em 'available', 'used', ou outro status
-- Isso explica onde os 12-15 vídeos "desaparecidos" estão


-- ============================================================================
-- QUERY 2: Vídeos criados nos últimos 7 dias (os que você enviou recentemente)
-- ============================================================================
SELECT
  id,
  title,
  status,
  created_at,
  categorization->>'niche' as niche,
  categorization->>'subniche' as subniche
FROM benchmark_videos
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 50;

-- RESULTADO ESPERADO:
-- Você vai ver os vídeos que enviou recentemente
-- VERIFIQUE O STATUS: Está 'pending_distribution' ou 'available'?


-- ============================================================================
-- QUERY 3: Vídeos com status 'available' criados recentemente
-- (Esses DEVERIAM estar como 'pending_distribution')
-- ============================================================================
SELECT
  id,
  title,
  status,
  created_at,
  youtube_video_id
FROM benchmark_videos
WHERE status = 'available'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 30;

-- RESULTADO ESPERADO:
-- Se retornar muitos vídeos aqui, ESSE É O PROBLEMA!
-- Vídeos estão sendo inseridos com status 'available' ao invés de 'pending_distribution'


-- ============================================================================
-- QUERY 4: Vídeos criados HOJE especificamente
-- ============================================================================
SELECT
  id,
  title,
  status,
  created_at
FROM benchmark_videos
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;


-- ============================================================================
-- QUERY 5: Ver se algum vídeo teve o status ALTERADO recentemente
-- (Procurar por vídeos que tinham 'pending_distribution' mas foram mudados)
-- ============================================================================
SELECT
  id,
  title,
  status,
  created_at,
  updated_at
FROM benchmark_videos
WHERE updated_at IS NOT NULL
  AND updated_at > created_at
  AND status != 'pending_distribution'
ORDER BY updated_at DESC
LIMIT 30;

-- RESULTADO ESPERADO:
-- Se retornar vídeos aqui, alguém/algo MUDOU o status deles depois da criação


-- ============================================================================
-- ANÁLISE: O que pode estar acontecendo?
-- ============================================================================

-- CENÁRIO A: Vídeos chegam com status 'available'
-- ❌ Edge Function receive-benchmark-videos não está preservando o status correto
-- ❌ Trigger/constraint no banco está sobrescrevendo o status
-- ❌ Default value da coluna 'status' é 'available'

-- CENÁRIO B: Vídeos chegam corretos mas são alterados depois
-- ❌ CRON job ou trigger mudando status automaticamente
-- ❌ Alguém editando manualmente no Supabase

-- CENÁRIO C: A query antiga estava BUGADA
-- ✅ Query antiga retornava vídeos de QUALQUER status (não filtrava por 'pending_distribution')
-- ✅ Por isso apareciam 15-18 vídeos (soma de todos os status)
-- ✅ Query nova filtra corretamente, só mostra os 3 que REALMENTE estão 'pending_distribution'
