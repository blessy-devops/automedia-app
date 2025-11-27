-- ============================================================================
-- SOLUÇÃO COMPLETA: Corrigir vídeos com status errado
-- RODE ESTE SQL NO EDITOR DO SUPABASE DO GOBBI
-- ============================================================================

-- ETAPA 1: CORRIGIR OS 43 VÍDEOS DOS ÚLTIMOS 7 DIAS
-- Estes vídeos deveriam ter 'pending_distribution' mas foram inseridos como 'available'

-- Primeiro, VISUALIZAR os vídeos que serão atualizados:
SELECT
  id,
  title,
  status,
  created_at
FROM benchmark_videos
WHERE status = 'available'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 50;

-- Se a lista parecer correta (os vídeos que você enviou recentemente), RODE:

UPDATE benchmark_videos
SET status = 'pending_distribution',
    updated_at = NOW()
WHERE status = 'available'
  AND created_at >= NOW() - INTERVAL '7 days';

-- RESULTADO ESPERADO: 43 rows updated


-- ============================================================================
-- ETAPA 2: ALTERAR O DEFAULT VALUE DA COLUNA
-- Para que novos vídeostenham 'pending_distribution' por padrão
-- ============================================================================

ALTER TABLE benchmark_videos
ALTER COLUMN status SET DEFAULT 'pending_distribution';

-- CONFIRMAÇÃO:
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'benchmark_videos'
  AND column_name = 'status';

-- Deve retornar: column_default = 'pending_distribution'::text


-- ============================================================================
-- ETAPA 3: TESTAR QUE FUNCIONOU
-- ============================================================================

-- Contar vídeos com pending_distribution agora
SELECT COUNT(*) as total_pending
FROM benchmark_videos
WHERE status = 'pending_distribution';

-- Deve retornar ~46 vídeos (os 3 que já estavam + os 43 atualizados)

-- Testar o RPC novamente
SELECT * FROM get_videos_awaiting_distribution(10, 0);

-- Deve retornar ~46 vídeos no total_count


-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Ver distribuição de status após as alterações
SELECT
  status,
  COUNT(*) as total
FROM benchmark_videos
GROUP BY status
ORDER BY total DESC;

-- ESPERADO:
-- | status                  | total |
-- |------------------------|-------|
-- | available              | 2153  |  (2196 - 43)
-- | used                   | 74    |
-- | pending_distribution   | 46    |  (3 + 43)
