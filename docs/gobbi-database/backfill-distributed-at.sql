-- backfill-distributed-at.sql
-- Backfill distributed_at column for old production_videos records
-- ⚠️ RODE ESTE SQL NO SQL EDITOR DO SUPABASE DO GOBBI

-- ========================================================================
-- PROBLEMA:
-- ========================================================================
-- A coluna distributed_at foi adicionada em migração posterior
-- Registros antigos ficaram com distributed_at = NULL
-- Isso faz MIN(pv.distributed_at) retornar NULL → Unix timestamp 0 → "31 dez 1969"

-- ========================================================================
-- SOLUÇÃO:
-- ========================================================================
-- Preencher distributed_at com created_at para registros antigos
-- Isso dá uma aproximação razoável da data de distribuição

-- ========================================================================
-- Backfill distributed_at com created_at
-- ========================================================================

UPDATE production_videos
SET distributed_at = created_at
WHERE distributed_at IS NULL;

-- ========================================================================
-- Verificação (opcional - execute após o UPDATE)
-- ========================================================================

-- Verificar quantos registros foram atualizados
-- SELECT COUNT(*) FROM production_videos WHERE distributed_at IS NOT NULL;

-- Verificar se ainda há registros com distributed_at NULL
-- SELECT COUNT(*) FROM production_videos WHERE distributed_at IS NULL;

-- Log
DO $$
DECLARE
  v_updated_count INT;
BEGIN
  -- Contar quantos foram atualizados
  SELECT COUNT(*) INTO v_updated_count
  FROM production_videos
  WHERE distributed_at IS NOT NULL;

  RAISE NOTICE '✅ Backfill completed!';
  RAISE NOTICE '   - Total production_videos with distributed_at: %', v_updated_count;
  RAISE NOTICE '   - Old records now use created_at as distributed_at (approximation)';
  RAISE NOTICE '   - New records continue to use actual distribution timestamp';
END $$;
