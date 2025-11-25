-- ============================================================================
-- TEST: RPC Corrigido com paginação
-- RODE ESTE SQL NO EDITOR DO SUPABASE DO GOBBI
-- ============================================================================

-- Depois de rodar o rpc_get_videos_awaiting_distribution.sql corrigido,
-- teste chamando o RPC:

-- Teste 1: Primeira página (50 vídeos)
SELECT * FROM get_videos_awaiting_distribution(50, 0);

-- Teste 2: Segunda página (próximos 50)
SELECT * FROM get_videos_awaiting_distribution(50, 50);

-- Teste 3: Limite pequeno para debug (5 vídeos)
SELECT * FROM get_videos_awaiting_distribution(5, 0);

-- Teste 4: Verificar estrutura do retorno
SELECT
  (result->>'total_count')::int as total_count,
  jsonb_array_length(result->'videos') as videos_returned
FROM get_videos_awaiting_distribution(10, 0) as result;
