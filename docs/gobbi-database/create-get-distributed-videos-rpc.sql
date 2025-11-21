-- create-get-distributed-videos-rpc.sql
-- ⚠️ DEPRECATED - NÃO USE ESTE ARQUIVO
-- Este é a versão antiga da RPC sem os campos can_undo e status_summary
-- Use: create-rpc-get-distributed-videos-paginated.sql (função: get_distributed_videos_with_status)
--
-- RPC otimizada para buscar vídeos distribuídos ordenados por data de distribuição
-- ⚠️ NÃO RODE ESTE SQL - USE A VERSÃO NOVA

-- ========================================================================
-- RPC: get_distributed_videos_paginated
-- ========================================================================
-- Retorna vídeos distribuídos (status='used') ordenados por distributed_at
-- Com suporte a paginação (offset/limit) e total count

CREATE OR REPLACE FUNCTION get_distributed_videos_paginated(
  p_offset INT DEFAULT 0,
  p_limit INT DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
  v_total_count INT;
BEGIN
  -- ========================================================================
  -- Step 1: Get total count (para pagination)
  -- ========================================================================
  SELECT COUNT(DISTINCT bv.id)::INT
  INTO v_total_count
  FROM benchmark_videos bv
  WHERE bv.status = 'used';

  -- ========================================================================
  -- Step 2: Get paginated distributed videos with production_videos data
  -- ========================================================================
  WITH distributed_videos AS (
    SELECT
      bv.id,
      bv.title,
      bv.youtube_video_id,
      bv.youtube_url,
      -- Get the EARLIEST distributed_at for this benchmark video
      -- COALESCE fallback to created_at for old records with NULL distributed_at
      MIN(COALESCE(pv.distributed_at, pv.created_at)) as distributed_at
    FROM benchmark_videos bv
    INNER JOIN production_videos pv ON pv.benchmark_id = bv.id
    WHERE bv.status = 'used'
    GROUP BY bv.id, bv.title, bv.youtube_video_id, bv.youtube_url
    ORDER BY MIN(COALESCE(pv.distributed_at, pv.created_at)) DESC  -- Order by distribution date (newest first)
    LIMIT p_limit
    OFFSET p_offset
  ),
  videos_with_channels AS (
    SELECT
      dv.id,
      dv.title,
      dv.youtube_video_id,
      dv.youtube_url,
      dv.distributed_at,
      json_agg(
        json_build_object(
          'id', pv.id,
          'placeholder', pv.placeholder,
          'status', pv.status,
          'distributed_at', COALESCE(pv.distributed_at, pv.created_at)
        )
        ORDER BY COALESCE(pv.distributed_at, pv.created_at) ASC
      ) as production_videos
    FROM distributed_videos dv
    INNER JOIN production_videos pv ON pv.benchmark_id = dv.id
    GROUP BY dv.id, dv.title, dv.youtube_video_id, dv.youtube_url, dv.distributed_at
    ORDER BY dv.distributed_at DESC
  )
  SELECT json_build_object(
    'videos', COALESCE((SELECT json_agg(v ORDER BY v.distributed_at DESC) FROM videos_with_channels v), '[]'::json),
    'totalCount', v_total_count,
    'hasMore', (v_total_count > (p_offset + p_limit))
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_distributed_videos_paginated TO anon, authenticated;

-- ========================================================================
-- Índices recomendados para performance
-- ========================================================================

-- Índice composto para filtro + join
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_status_used
ON benchmark_videos (status)
WHERE status = 'used';

-- Índice para JOIN e ORDER BY
CREATE INDEX IF NOT EXISTS idx_production_videos_benchmark_distributed
ON production_videos (benchmark_id, distributed_at DESC);

-- ========================================================================
-- Test Query (descomente para testar)
-- ========================================================================
/*
-- Test 1: Get first page (20 videos)
SELECT get_distributed_videos_paginated(0, 20);

-- Test 2: Get second page
SELECT get_distributed_videos_paginated(20, 20);

-- Test 3: Get small page
SELECT get_distributed_videos_paginated(0, 5);
*/

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Created RPC: get_distributed_videos_paginated(offset, limit)';
  RAISE NOTICE '   - Returns videos ordered by distributed_at DESC (with COALESCE fallback to created_at)';
  RAISE NOTICE '   - Includes totalCount and hasMore for pagination';
  RAISE NOTICE '   - Optimized with indexes for performance';
  RAISE NOTICE '   - Handles NULL distributed_at gracefully (old records before column was added)';
END $$;
