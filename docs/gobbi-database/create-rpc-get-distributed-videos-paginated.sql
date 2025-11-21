-- create-rpc-get-distributed-videos-paginated.sql
-- RPC para buscar vídeos distribuídos com paginação e metadados de status
-- ⚠️ RODE ESTE SQL NO SQL EDITOR DO SUPABASE DO GOBBI
--
-- OBJETIVO:
-- Retornar vídeos que foram distribuídos (status = 'used') com:
-- 1. can_undo: verifica se TODOS os production_videos ainda estão em 'queued'
-- 2. status_summary: contagem de jobs por status (queued, processing, completed, failed)
-- 3. Lista de production_videos associados
-- 4. Paginação (offset/limit)
-- 5. Total count e hasMore flag
-- 6. distributed_at CORRETO: puxado de production_videos com fallback para created_at
--
-- USO:
-- SELECT * FROM get_distributed_videos_with_status(0, 20);
--
-- NOTA: Nome diferente da função antiga para evitar conflito com trigger de auditoria

-- Create new function with updated schema (novo nome para evitar conflito)
CREATE OR REPLACE FUNCTION get_distributed_videos_with_status(
  p_offset INT DEFAULT 0,
  p_limit INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_count INT;
  v_videos JSONB;
  v_has_more BOOLEAN;
BEGIN
  -- ========================================================================
  -- Step 1: Get total count (para pagination)
  -- ========================================================================
  SELECT COUNT(DISTINCT bv.id)::INT
  INTO v_total_count
  FROM benchmark_videos bv
  WHERE bv.status = 'used';

  -- ========================================================================
  -- Step 2: Get paginated distributed videos with all metadata
  -- ========================================================================
  WITH distributed_videos AS (
    SELECT
      bv.id,
      bv.title,
      bv.youtube_video_id,
      bv.youtube_url,
      -- ✅ CORRETO: Get the EARLIEST distributed_at from production_videos
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
  videos_with_metadata AS (
    SELECT
      dv.id,
      dv.title,
      dv.youtube_video_id,
      dv.youtube_url,
      dv.distributed_at,
      -- can_undo: TRUE se TODOS os production_videos estão em 'queued'
      BOOL_AND(pv.status = 'queued') as can_undo,
      -- status_summary: contagem de jobs por status
      JSONB_BUILD_OBJECT(
        'queued', COUNT(*) FILTER (WHERE pv.status = 'queued'),
        'processing', COUNT(*) FILTER (WHERE pv.status LIKE 'create_%'),
        'completed', COUNT(*) FILTER (WHERE pv.status = 'published'),
        'failed', COUNT(*) FILTER (WHERE pv.status = 'failed')
      ) as status_summary,
      -- production_videos: lista de jobs associados
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
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
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'id', id,
      'title', title,
      'youtube_video_id', youtube_video_id,
      'youtube_url', youtube_url,
      'distributed_at', distributed_at,
      'can_undo', can_undo,
      'status_summary', status_summary,
      'production_videos', production_videos
    )
    ORDER BY distributed_at DESC
  )
  INTO v_videos
  FROM videos_with_metadata;

  -- Calculate if there are more results
  v_has_more := (p_offset + p_limit) < v_total_count;

  -- Return final result
  RETURN JSONB_BUILD_OBJECT(
    'videos', COALESCE(v_videos, '[]'::jsonb),
    'totalCount', v_total_count,
    'hasMore', v_has_more
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_distributed_videos_with_status TO anon, authenticated;

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

-- Test query (uncomment to test)
-- SELECT * FROM get_distributed_videos_with_status(0, 20);
