-- ============================================================================
-- INVESTIGAÇÃO: Por que vídeos chegam com status 'available'?
-- RODE ESTE SQL NO EDITOR DO SUPABASE DO GOBBI
-- ============================================================================

-- QUERY 1: Verificar o DEFAULT VALUE da coluna 'status'
SELECT
  column_name,
  column_default,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'benchmark_videos'
  AND column_name = 'status';

-- RESULTADO ESPERADO:
-- Se column_default = 'available' → ESSE É O PROBLEMA!
-- O banco está usando default 'available' quando status não é fornecido


-- ============================================================================
-- QUERY 2: Verificar se há TRIGGERS que modificam o status
-- ============================================================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'benchmark_videos';

-- Se retornar algum trigger, pode estar mudando o status automaticamente


-- ============================================================================
-- QUERY 3: Ver vídeos que DEVERIAM ter pending_distribution
-- (vídeos recentes com 'available' que provavelmente são o problema)
-- ============================================================================
SELECT
  id,
  youtube_video_id,
  title,
  status,
  created_at
FROM benchmark_videos
WHERE status = 'available'
  AND created_at >= NOW() - INTERVAL '3 days'
ORDER BY created_at DESC
LIMIT 20;


-- ============================================================================
-- SOLUÇÃO TEMPORÁRIA: Atualizar manualmente os vídeos recentes
-- (SE o default value for 'available')
-- ============================================================================

-- TESTE PRIMEIRO: Ver quantos vídeos seriam afetados
SELECT COUNT(*) as total_to_update
FROM benchmark_videos
WHERE status = 'available'
  AND created_at >= NOW() - INTERVAL '7 days';

-- Se o número parecer correto (os vídeos que você enviou recentemente),
-- RODE o UPDATE abaixo:

-- UPDATE benchmark_videos
-- SET status = 'pending_distribution'
-- WHERE status = 'available'
--   AND created_at >= NOW() - INTERVAL '7 days';

-- NÃO RODE O UPDATE AINDA! Primeiro me mostre o resultado do COUNT.


-- ============================================================================
-- SOLUÇÃO PERMANENTE: Remover/Alterar o DEFAULT VALUE
-- ============================================================================

-- SE o problema for o default value 'available', precisamos:
-- 1. Alterar o default para 'pending_distribution' OU
-- 2. Remover o default completamente

-- Para REMOVER o default:
-- ALTER TABLE benchmark_videos
-- ALTER COLUMN status DROP DEFAULT;

-- Para ALTERAR o default para 'pending_distribution':
-- ALTER TABLE benchmark_videos
-- ALTER COLUMN status SET DEFAULT 'pending_distribution';

-- NÃO RODE AINDA! Primeiro veja o resultado da QUERY 1.
