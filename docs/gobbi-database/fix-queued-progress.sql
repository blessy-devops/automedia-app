-- ============================================
-- FIX: Correção do cálculo de progresso para status 'queued'
-- ============================================
--
-- PROBLEMA: Status 'queued' estava retornando 25% (lista) e 50% (detalhes)
-- SOLUÇÃO: 'queued' agora retorna 0% (vídeo ainda não começou produção)
--
-- INSTRUÇÕES:
-- 1. Copie todo este arquivo
-- 2. Cole no Supabase SQL Editor: https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/sql/new
-- 3. Execute
--
-- ============================================

-- Recriar get_production_videos_list (sem DROP - apenas substitui)
CREATE OR REPLACE FUNCTION get_production_videos_list(
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_per_page INT DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset INT;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_per_page;

  WITH filtered_videos AS (
    SELECT
      pv.id,
      pv.title,
      pv.thumbnail_url,
      pv.status,
      pv.created_at,
      pv.updated_at,
      pv.language,
      pv.platform,
      bv.channel_name as source_channel,
      bv.title as source_title,
      bv.youtube_video_id as source_youtube_video_id,
      pv.content_id_on_platform as youtube_id,
      -- Calculate progress (0-100) based on status
      CASE
        WHEN pv.status = 'queued' THEN 0
        WHEN pv.status = 'published' THEN 100
        WHEN pv.status LIKE 'create_%' THEN
          CASE pv.status
            WHEN 'create_title' THEN 8
            WHEN 'create_outline' THEN 16
            WHEN 'create_cast' THEN 24
            WHEN 'create_rich_outline' THEN 32
            WHEN 'create_script' THEN 40
            WHEN 'review_script' THEN 48
            WHEN 'create_seo_description' THEN 56
            WHEN 'create_thumbnail' THEN 64
            WHEN 'create_audio_segments' THEN 72
            WHEN 'create_video_segments' THEN 80
            WHEN 'create_concatenated_audios' THEN 88
            WHEN 'create_final_video' THEN 96
            ELSE 0
          END
        WHEN pv.status = 'pending_approval' THEN 98
        WHEN pv.status = 'approved' THEN 99
        WHEN pv.status = 'failed' THEN 0
        WHEN pv.status = 'on_hold' THEN 50
        ELSE 0
      END as progress,
      EXTRACT(DAY FROM (NOW() - pv.created_at))::INT as production_days
    FROM production_videos pv
    LEFT JOIN benchmark_videos bv ON pv.benchmark_id = bv.id
    WHERE
      (p_status IS NULL OR p_status = 'all' OR pv.status = p_status)
      AND (
        p_search IS NULL OR p_search = '' OR
        pv.title ILIKE '%' || p_search || '%' OR
        bv.channel_name ILIKE '%' || p_search || '%'
      )
  ),
  stats AS (
    SELECT
      COUNT(*)::INT as total,
      COUNT(*) FILTER (WHERE status = 'published')::INT as published,
      COUNT(*) FILTER (WHERE status LIKE 'create_%' OR status IN ('pending_approval', 'approved'))::INT as processing,
      COUNT(*) FILTER (WHERE status = 'failed')::INT as failed,
      COUNT(*) FILTER (WHERE status = 'on_hold')::INT as on_hold
    FROM filtered_videos
  ),
  paginated_videos AS (
    SELECT *
    FROM filtered_videos
    ORDER BY updated_at DESC
    LIMIT p_per_page
    OFFSET v_offset
  )
  SELECT json_build_object(
    'videos', COALESCE((SELECT json_agg(pv) FROM paginated_videos pv), '[]'::json),
    'total', (SELECT total FROM stats),
    'stats', (SELECT row_to_json(s) FROM stats s)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Recriar get_production_video_details (sem DROP - apenas substitui)
CREATE OR REPLACE FUNCTION get_production_video_details(p_video_id INT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH production_data AS (
    SELECT
      pv.id,
      pv.title,
      pv.thumbnail_url,
      pv.status,
      pv.language,
      pv.platform,
      pv.created_at,
      pv.updated_at,
      pv.description,
      pv.tags,
      pv.final_link,
      pv.content_id_on_platform as youtube_id,
      pv.parent_folder,
      pv.audio_folder_url,
      pv.video_segments_folder,
      pv.thumbnail_folder_url,
      pv.covering_images_folder,
      pv.script,
      pv.adapted_story_beats_payload,
      pv.story_cast_payload,
      pv.rich_outline_payload,
      -- Progress calculation
      EXTRACT(DAY FROM (NOW() - pv.created_at))::INT as production_days,
      CASE
        WHEN pv.status = 'queued' THEN 0
        WHEN pv.status = 'published' THEN 100
        WHEN pv.status LIKE 'create_%' THEN
          CASE pv.status
            WHEN 'create_title' THEN 8
            WHEN 'create_outline' THEN 16
            WHEN 'create_cast' THEN 24
            WHEN 'create_rich_outline' THEN 32
            WHEN 'create_script' THEN 40
            WHEN 'review_script' THEN 48
            WHEN 'create_seo_description' THEN 56
            WHEN 'create_thumbnail' THEN 64
            WHEN 'create_audio_segments' THEN 72
            WHEN 'create_video_segments' THEN 80
            WHEN 'create_concatenated_audios' THEN 88
            WHEN 'create_final_video' THEN 96
            ELSE 0
          END
        WHEN pv.status = 'pending_approval' THEN 98
        WHEN pv.status = 'approved' THEN 99
        WHEN pv.status = 'failed' THEN 0
        WHEN pv.status = 'on_hold' THEN 50
        ELSE 0
      END as progress_percentage,
      -- Source video data
      bv.id as source_video_id,
      bv.title as source_title,
      bv.thumbnail_url as source_thumbnail_url,
      bv.channel_name as source_channel_name,
      bv.channel_id as source_channel_id,
      bv.views as source_views,
      bv.upload_date as source_upload_date,
      bv.video_length as source_duration,
      bv.youtube_url as source_youtube_url,
      bv.youtube_video_id as source_youtube_video_id,
      bv.video_transcript as source_transcript,
      -- Narrative analysis
      na.identified_structure_model as narrative_structure,
      na.central_theme as narrative_theme,
      na.story_beats as narrative_story_beats,
      COALESCE(nec.name, 'Unknown') as narrative_emotional_core,
      COALESCE(nct.name, 'Unknown') as narrative_conflict_type
    FROM production_videos pv
    LEFT JOIN benchmark_videos bv ON pv.benchmark_id = bv.id
    LEFT JOIN narrative_analyses na ON na.benchmark_video_id = bv.id
    LEFT JOIN narrative_emotional_cores nec ON na.emotional_core_id = nec.id
    LEFT JOIN narrative_conflict_types nct ON na.conflict_type_id = nct.id
    WHERE pv.id = p_video_id
  ),
  audio_data AS (
    SELECT
      json_agg(
        json_build_object(
          'number', segment_number,
          'text', segment_text,
          'duration', duration_seconds,
          'status', status,
          'audioUrl', audio_url,
          'jobId', job_id
        ) ORDER BY segment_number
      ) as audio_segments
    FROM production_audio_segments
    WHERE video_id = p_video_id
  ),
  video_data AS (
    SELECT
      json_agg(
        json_build_object(
          'id', id,
          'segmentNumber', segment_id,
          'thumbnailUrl', CASE
            -- Se covering_images é objeto com 'images' array
            WHEN covering_images IS NOT NULL
              AND jsonb_typeof(covering_images) = 'object'
              AND covering_images ? 'images'
              AND jsonb_typeof(covering_images->'images') = 'array'
              AND jsonb_array_length(covering_images->'images') > 0
            THEN (covering_images->'images'->0->>'url')
            -- Se covering_images é array direto (formato legado)
            WHEN covering_images IS NOT NULL
              AND jsonb_typeof(covering_images) = 'array'
              AND jsonb_array_length(covering_images) > 0
            THEN (covering_images->0->>'url')
            -- Fallback: placeholder
            ELSE 'https://placehold.co/400x225'
          END,
          'filename', filename,
          'status', status,
          'imageCount', CASE
            -- Se covering_images é objeto com 'images' array
            WHEN covering_images IS NOT NULL
              AND jsonb_typeof(covering_images) = 'object'
              AND covering_images ? 'images'
              AND jsonb_typeof(covering_images->'images') = 'array'
            THEN jsonb_array_length(covering_images->'images')
            -- Se covering_images é array direto (formato legado)
            WHEN covering_images IS NOT NULL
              AND jsonb_typeof(covering_images) = 'array'
            THEN jsonb_array_length(covering_images)
            -- Fallback: 0
            ELSE 0
          END,
          'videoUrl', video_url
        ) ORDER BY segment_id
      ) as video_segments
    FROM production_video_segments
    WHERE video_id = p_video_id
  ),
  workflow_data AS (
    SELECT json_agg(
      json_build_object(
        'id', stage_number,
        'name', stage_name,
        'status', stage_status
      ) ORDER BY stage_number
    ) as workflow_stages
    FROM (
      SELECT 1 as stage_number, 'Create Title' as stage_name,
        CASE WHEN pd.status IN ('published', 'create_outline', 'create_cast', 'create_rich_outline', 'create_script', 'review_script', 'create_seo_description', 'create_thumbnail', 'create_audio_segments', 'create_video_segments', 'create_concatenated_audios', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_title' THEN 'processing' ELSE 'pending' END as stage_status
      FROM production_data pd
      UNION ALL
      SELECT 2, 'Create Outline',
        CASE WHEN pd.status IN ('published', 'create_cast', 'create_rich_outline', 'create_script', 'review_script', 'create_seo_description', 'create_thumbnail', 'create_audio_segments', 'create_video_segments', 'create_concatenated_audios', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_outline' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 3, 'Create Cast',
        CASE WHEN pd.status IN ('published', 'create_rich_outline', 'create_script', 'review_script', 'create_seo_description', 'create_thumbnail', 'create_audio_segments', 'create_video_segments', 'create_concatenated_audios', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_cast' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 4, 'Create Rich Outline',
        CASE WHEN pd.status IN ('published', 'create_script', 'review_script', 'create_seo_description', 'create_thumbnail', 'create_audio_segments', 'create_video_segments', 'create_concatenated_audios', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_rich_outline' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 5, 'Create Script',
        CASE WHEN pd.status IN ('published', 'review_script', 'create_seo_description', 'create_thumbnail', 'create_audio_segments', 'create_video_segments', 'create_concatenated_audios', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_script' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 6, 'Review Script',
        CASE WHEN pd.status IN ('published', 'create_seo_description', 'create_thumbnail', 'create_audio_segments', 'create_video_segments', 'create_concatenated_audios', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'review_script' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 7, 'Create SEO Description',
        CASE WHEN pd.status IN ('published', 'create_thumbnail', 'create_audio_segments', 'create_video_segments', 'create_concatenated_audios', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_seo_description' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 8, 'Create Thumbnail',
        CASE WHEN pd.status IN ('published', 'create_audio_segments', 'create_video_segments', 'create_concatenated_audios', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_thumbnail' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 9, 'Create Audio Segments',
        CASE WHEN pd.status IN ('published', 'create_video_segments', 'create_concatenated_audios', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_audio_segments' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 10, 'Create Video Segments',
        CASE WHEN pd.status IN ('published', 'create_concatenated_audios', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_video_segments' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 11, 'Concatenate Audios',
        CASE WHEN pd.status IN ('published', 'create_final_video', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_concatenated_audios' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 12, 'Create Final Video',
        CASE WHEN pd.status IN ('published', 'pending_approval', 'approved') THEN 'completed' WHEN pd.status = 'create_final_video' THEN 'processing' ELSE 'pending' END
      FROM production_data pd
      UNION ALL
      SELECT 13, 'Published',
        CASE WHEN pd.status = 'published' THEN 'completed' WHEN pd.status IN ('pending_approval', 'approved') THEN 'processing' ELSE 'pending' END
      FROM production_data pd
    ) stages
  )
  SELECT json_build_object(
    -- Basic info
    'id', pd.id,
    'title', pd.title,
    'thumbnailUrl', pd.thumbnail_url,
    'status', pd.status,
    'language', pd.language,
    'platform', pd.platform,
    'createdAt', pd.created_at,
    'updatedAt', pd.updated_at,
    'description', pd.description,
    'tags', COALESCE(pd.tags, ''),
    'finalLink', pd.final_link,
    'youtubeId', pd.youtube_id,
    -- Links
    'parentFolder', pd.parent_folder,
    'audioFolderUrl', pd.audio_folder_url,
    'videoSegmentsFolder', pd.video_segments_folder,
    'thumbnailFolderUrl', pd.thumbnail_folder_url,
    'coveringImagesFolder', pd.covering_images_folder,
    -- Progress
    'productionDays', pd.production_days,
    'progressPercentage', pd.progress_percentage,
    'currentStage',
      CASE
        WHEN pd.status LIKE 'create_%' THEN REPLACE(INITCAP(REPLACE(pd.status, '_', ' ')), 'Create ', '')
        ELSE INITCAP(REPLACE(pd.status, '_', ' '))
      END,
    'totalStages', 13,
    -- Source video
    'sourceVideo', json_build_object(
      'id', pd.source_video_id,
      'title', pd.source_title,
      'thumbnailUrl', pd.source_thumbnail_url,
      'channelName', pd.source_channel_name,
      'channelId', pd.source_channel_id,
      'views', pd.source_views,
      'uploadDate', pd.source_upload_date,
      'duration', pd.source_duration,
      'youtubeUrl', pd.source_youtube_url,
      'youtubeVideoId', pd.source_youtube_video_id,
      'transcript', pd.source_transcript
    ),
    -- Narrative
    'narrative', json_build_object(
      'structureModel', COALESCE(pd.narrative_structure, 'Not analyzed'),
      'centralTheme', COALESCE(pd.narrative_theme, 'Not analyzed'),
      'emotionalCore', pd.narrative_emotional_core,
      'conflictType', pd.narrative_conflict_type,
      'storyBeats', COALESCE(pd.narrative_story_beats, '[]'::jsonb)
    ),
    -- Content
    'script', COALESCE(pd.script, ''),
    'storyCast', COALESCE(pd.story_cast_payload, '[]'::jsonb),
    'richOutline', COALESCE(pd.rich_outline_payload, '[]'::jsonb),
    -- Production assets
    'audioSegments', COALESCE((SELECT audio_segments FROM audio_data), '[]'::json),
    'videoSegments', COALESCE((SELECT video_segments FROM video_data), '[]'::json),
    -- Workflow
    'workflowStages', COALESCE((SELECT workflow_stages FROM workflow_data), '[]'::json)
  ) INTO v_result
  FROM production_data pd;

  RETURN v_result;
END;
$$;

-- Teste rápido para verificar se está funcionando
SELECT
  id,
  status,
  CASE
    WHEN status = 'queued' THEN 0
    WHEN status = 'published' THEN 100
    WHEN status LIKE 'create_%' THEN
      CASE status
        WHEN 'create_title' THEN 8
        ELSE 50
      END
    ELSE 0
  END as expected_progress
FROM production_videos
WHERE id IN (176, 177)
ORDER BY id;
