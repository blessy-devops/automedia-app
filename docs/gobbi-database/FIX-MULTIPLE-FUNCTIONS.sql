-- ============================================================================
-- FIX: Múltiplas versões da função get_videos_awaiting_distribution
-- RODE ESTE SQL NO EDITOR DO SUPABASE DO GOBBI
-- ============================================================================

-- PASSO 1: Listar TODAS as versões da função
-- Isso mostra quantas versões existem e seus parâmetros
SELECT
  p.oid,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  l.lanname AS language
FROM pg_proc p
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE p.proname = 'get_videos_awaiting_distribution'
ORDER BY p.oid;

-- ============================================================================
-- RESULTADO ESPERADO:
-- Você vai ver 2 ou mais linhas, algo como:
--
-- | oid   | function_name                      | arguments      | return_type |
-- |-------|-----------------------------------|----------------|-------------|
-- | 12345 | get_videos_awaiting_distribution | (INT, INT)     | json        |
-- | 12346 | get_videos_awaiting_distribution | (p_limit INT, p_offset INT) | json |
--
-- ============================================================================

-- PASSO 2: DROPAR TODAS as versões antigas
-- Rode os DROP abaixo até não dar mais erro "function does not exist"

-- Tentar dropar versão SEM default values
DROP FUNCTION IF EXISTS get_videos_awaiting_distribution(INT, INT);

-- Tentar dropar versão COM default values (essa é a que queremos manter!)
-- NÃO RODE ESTE! (só se quiser dropar tudo e recriar)
-- DROP FUNCTION IF EXISTS get_videos_awaiting_distribution(p_limit INT, p_offset INT);

-- Tentar dropar versão sem parâmetros (se existir)
DROP FUNCTION IF EXISTS get_videos_awaiting_distribution();

-- ============================================================================
-- PASSO 3: Verificar se ainda existe mais de uma versão
-- Rode novamente a query do PASSO 1
-- Deve retornar apenas 1 linha
-- ============================================================================

-- PASSO 4: Se ainda tiver múltiplas versões, DROPAR TUDO e recriar

-- Dropar TODAS as versões (use CASCADE para dropar dependências)
DROP FUNCTION IF EXISTS get_videos_awaiting_distribution CASCADE;

-- ============================================================================
-- PASSO 5: Recriar a função CORRIGIDA
-- Copie e cole TODO o conteúdo do arquivo:
-- /Users/daviluis/Documents/automedia-platform/automedia/supabase/rpc_get_videos_awaiting_distribution.sql
-- ============================================================================

-- PASSO 6: TESTAR que só existe UMA versão agora
SELECT
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
WHERE p.proname = 'get_videos_awaiting_distribution';

-- Deve retornar apenas 1 linha:
-- | function_name                      | arguments                                  | return_type |
-- |------------------------------------|--------------------------------------------|-------------|
-- | get_videos_awaiting_distribution  | p_limit integer DEFAULT 50, p_offset integer DEFAULT 0 | json |

-- ============================================================================
-- PASSO 7: Testar se funciona
-- ============================================================================

SELECT * FROM get_videos_awaiting_distribution(5, 0);

-- Deve retornar JSON com videos e total_count
