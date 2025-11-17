CREATE OR REPLACE FUNCTION get_videos_awaiting_distribution()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH videos_data AS (
    SELECT
      bv.id,
      bv.title,
      bv.description,
      bv.categorization,
      bv.video_transcript,
      bv.youtube_video_id,
      bv.youtube_url,
      bv.channel_id,
      bv.status,
      bv.created_at,
      bc.channel_name AS benchmark_channel_title,
      '' AS benchmark_channel_handle,
      (
        SELECT json_agg(
          json_build_object(
            'unique_profile_id', sa.unique_profile_id,
            'placeholder', sa.placeholder,
            'niche', sa.niche,
            'subniche', sa.subniche,
            'language', sa.language,
            'structure_brand_bible', CASE
              WHEN sbb.id IS NOT NULL THEN
                json_build_object(
                  'brand_name', sbb.brand_name,
                  'production_workflow_id', sbb.production_workflow_id
                )
              ELSE NULL
            END
          ) ORDER BY sa.placeholder ASC
        )
        FROM structure_accounts sa
        LEFT JOIN structure_brand_bible sbb ON sbb.id = sa.brand_id
        WHERE sa.niche = (bv.categorization->>'niche')
          AND sa.subniche = (bv.categorization->>'subniche')
      ) AS eligible_channels
    FROM benchmark_videos bv
    LEFT JOIN benchmark_channels bc ON bc.channel_id = bv.channel_id
    WHERE bv.status = 'pending_distribution'
    ORDER BY bv.created_at ASC
  )
  SELECT json_build_object(
    'videos', COALESCE(json_agg(
      json_build_object(
        'id', vd.id,
        'title', vd.title,
        'description', vd.description,
        'categorization', vd.categorization,
        'video_transcript', vd.video_transcript,
        'youtube_video_id', vd.youtube_video_id,
        'youtube_url', vd.youtube_url,
        'status', vd.status,
        'created_at', vd.created_at,
        'benchmark_channels', CASE
          WHEN vd.benchmark_channel_title IS NOT NULL THEN
            json_build_object(
              'channel_title', vd.benchmark_channel_title,
              'channel_handle', vd.benchmark_channel_handle
            )
          ELSE NULL
        END,
        'eligibleChannels', COALESCE(vd.eligible_channels, '[]'::json)
      )
    ), '[]'::json),
    'error', NULL
  ) INTO result
  FROM videos_data vd;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'videos', '[]'::json,
      'error', SQLERRM
    );
END;
$$;
