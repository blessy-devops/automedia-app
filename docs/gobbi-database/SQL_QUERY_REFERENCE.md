# SQL Query Reference for Video Production

Complete SQL queries to fetch all production workflow data from Gobbi's database structure.

---

## 🎯 Core Workflow Queries

### 1. Get Complete Production Pipeline for One Video

```sql
WITH production_data AS (
  SELECT 
    pv.*,
    -- Source video data
    bv.title as source_title,
    bv.youtube_url as source_url,
    bv.youtube_video_id as source_video_id,
    bv.video_transcript,
    bv.views as source_views,
    bv.channel_name,
    -- Narrative analysis
    na.story_beats,
    na.central_theme,
    na.identified_structure_model,
    na.emotional_core_id,
    na.conflict_type_id,
    -- Status info
    sas.description as status_description
  FROM production_videos pv
  LEFT JOIN benchmark_videos bv ON pv.benchmark_id = bv.id
  LEFT JOIN narrative_analyses na ON na.benchmark_video_id = bv.id
  LEFT JOIN structure_allowed_status sas ON pv.status = sas.status_key
  WHERE pv.id = 168  -- Your production ID
),
audio_data AS (
  SELECT 
    video_id,
    json_agg(
      json_build_object(
        'segment_number', segment_number,
        'job_id', job_id,
        'segment_text', LEFT(segment_text, 100),
        'audio_url', audio_url,
        'duration_seconds', duration_seconds,
        'status', status
      ) ORDER BY segment_number
    ) as audio_segments
  FROM production_audio_segments
  WHERE video_id = 168
  GROUP BY video_id
),
video_data AS (
  SELECT 
    video_id,
    json_agg(
      json_build_object(
        'segment_id', segment_id,
        'id', id,
        'filename', filename,
        'video_url', video_url,
        'status', status,
        'covering_images_count', CASE 
          WHEN covering_images IS NOT NULL 
          THEN jsonb_array_length(covering_images) 
          ELSE 0 
        END
      ) ORDER BY segment_id
    ) as video_segments
  FROM production_video_segments
  WHERE video_id = 168
  GROUP BY video_id
),
concat_audio_data AS (
  SELECT 
    video_id,
    json_agg(
      json_build_object(
        'id', id,
        'total_duration_seconds', total_duration_seconds,
        'concatenated_audio_url', concatenated_audio_url,
        'status', status
      )
    ) as concatenated_audios
  FROM production_concatenated_audios
  WHERE video_id = 168
  GROUP BY video_id
)
SELECT 
  pd.*,
  ad.audio_segments,
  vd.video_segments,
  cad.concatenated_audios
FROM production_data pd
LEFT JOIN audio_data ad ON pd.id = ad.video_id
LEFT JOIN video_data vd ON pd.id = vd.video_id
LEFT JOIN concat_audio_data cad ON pd.id = cad.video_id;
```

**Returns:** Complete production data in a single row with all related records as JSON arrays.

---

### 2. Find High-Performing Videos (Outlier Detection)

```sql
WITH channel_stats AS (
  SELECT 
    channel_id,
    AVG(views) as avg_views,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY views) as median_views,
    COUNT(*) as total_videos
  FROM benchmark_videos
  WHERE upload_date > NOW() - INTERVAL '90 days'  -- Recent videos only
  GROUP BY channel_id
),
video_performance AS (
  SELECT 
    bv.id,
    bv.title,
    bv.youtube_video_id,
    bv.youtube_url,
    bv.thumbnail_url,
    bv.categorization,
    bv.views,
    bv.video_length,
    bv.upload_date,
    bv.video_age_days,
    bv.channel_name,
    bv.channel_id,
    bc.channel_url,
    bc.subscriber_count,
    bc.total_videos as channel_total_videos,
    -- Performance metrics
    ROUND(
      bv.views::NUMERIC / NULLIF(cs.avg_views, 0), 
      2
    ) as avg_performance_score,
    ROUND(
      bv.views::NUMERIC / NULLIF(cs.median_views, 0), 
      2
    ) as median_performance_score,
    ROUND(
      bv.views::NUMERIC / NULLIF(bc.subscriber_count, 0), 
      4
    ) as views_per_subscriber
  FROM benchmark_videos bv
  JOIN benchmark_channels bc ON bv.channel_id = bc.channel_id
  JOIN channel_stats cs ON bv.channel_id = cs.channel_id
  WHERE 
    bv.video_transcript IS NOT NULL  -- Must have transcript
    AND bv.video_age_days >= 7  -- At least 7 days old
    AND bv.views > cs.avg_views * 1.5  -- Better than 1.5x average
)
SELECT 
  *,
  CASE 
    WHEN median_performance_score >= 5 THEN 'exceptional'
    WHEN median_performance_score >= 3 THEN 'outstanding'
    WHEN median_performance_score >= 2 THEN 'high'
    ELSE 'moderate'
  END as performance_tier
FROM video_performance
WHERE median_performance_score >= 2  -- 2x median or better
ORDER BY median_performance_score DESC
LIMIT 50;
```

**Returns:** Top 50 outlier videos with performance metrics.

---

### 3. Production Dashboard Query

```sql
WITH production_summary AS (
  SELECT 
    pv.id,
    pv.title,
    pv.status,
    pv.created_at,
    pv.updated_at,
    pv.final_link,
    sas.description as status_description,
    -- Counts
    (SELECT COUNT(*) FROM production_audio_segments WHERE video_id = pv.id) as audio_segments,
    (SELECT COUNT(*) FROM production_video_segments WHERE video_id = pv.id) as video_segments,
    (SELECT COUNT(*) FROM production_video_editing_assets WHERE video_id = pv.id) as editing_assets,
    -- Completion checks
    CASE WHEN pv.script IS NOT NULL THEN true ELSE false END as has_script,
    CASE WHEN pv.ssml_script IS NOT NULL THEN true ELSE false END as has_ssml,
    CASE WHEN pv.thumbnail_url IS NOT NULL THEN true ELSE false END as has_thumbnail,
    -- Source info
    bv.title as source_title,
    bv.views as source_views,
    bv.channel_name as source_channel,
    -- Time tracking
    EXTRACT(EPOCH FROM (pv.updated_at - pv.created_at)) / 86400 as days_in_production
  FROM production_videos pv
  LEFT JOIN benchmark_videos bv ON pv.benchmark_id = bv.id
  LEFT JOIN structure_allowed_status sas ON pv.status = sas.status_key
)
SELECT 
  *,
  CASE 
    WHEN status = 'published' THEN 'completed'
    WHEN status IN ('failed', 'canceled') THEN 'failed'
    WHEN status = 'on_hold' THEN 'paused'
    ELSE 'in_progress'
  END as production_state
FROM production_summary
ORDER BY updated_at DESC;
```

**Returns:** Dashboard view of all production videos with progress metrics.

---

### 4. Narrative Analysis with Full Details

```sql
SELECT 
  na.id as analysis_id,
  na.benchmark_video_id,
  bv.title as video_title,
  bv.youtube_url,
  bv.channel_name,
  na.identified_structure_model,
  na.central_theme,
  -- Structure details
  ns.name as structure_name,
  ns.description as structure_description,
  -- Emotional core
  nec.name as emotional_core,
  nec.description as emotional_description,
  -- Conflict type
  nct.name as conflict_type,
  nct.description as conflict_description,
  -- Story beats (full JSON)
  na.story_beats,
  na.story_setting,
  na.analysis_metadata,
  -- Characters
  (
    SELECT json_agg(
      json_build_object(
        'name', nc.name,
        'archetype_id', nc.archetype_id,
        'role', nc.role,
        'traits', nc.character_traits
      )
    )
    FROM narrative_characters nc
    WHERE nc.narrative_analysis_id = na.id
  ) as characters
FROM narrative_analyses na
LEFT JOIN benchmark_videos bv ON na.benchmark_video_id = bv.id
LEFT JOIN narrative_structures ns ON na.structure_id = ns.id
LEFT JOIN narrative_emotional_cores nec ON na.emotional_core_id = nec.id
LEFT JOIN narrative_conflict_types nct ON na.conflict_type_id = nct.id
WHERE na.benchmark_video_id = 13093;
```

**Returns:** Complete narrative analysis with all related metadata.

---

### 5. Audio Production Status

```sql
WITH segment_summary AS (
  SELECT 
    video_id,
    COUNT(*) as total_segments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_segments,
    COUNT(*) FILTER (WHERE status = 'concatenated') as concatenated_segments,
    SUM(duration_seconds) as total_duration_seconds,
    MIN(created_at) as first_segment_created,
    MAX(created_at) as last_segment_created
  FROM production_audio_segments
  GROUP BY video_id
)
SELECT 
  pv.id as video_id,
  pv.title,
  ss.total_segments,
  ss.completed_segments,
  ss.concatenated_segments,
  ROUND(ss.total_duration_seconds / 60, 2) as total_minutes,
  ss.first_segment_created,
  ss.last_segment_created,
  -- Concatenated audio
  pca.concatenated_audio_url,
  pca.total_duration_seconds as final_duration,
  pca.status as concatenation_status,
  -- Progress percentage
  ROUND(
    (ss.completed_segments::NUMERIC / NULLIF(ss.total_segments, 0)) * 100, 
    1
  ) as completion_percentage
FROM production_videos pv
LEFT JOIN segment_summary ss ON pv.id = ss.video_id
LEFT JOIN production_concatenated_audios pca ON pv.id = pca.video_id
WHERE pv.status IN ('create_audio_segments', 'create_concatenated_audios')
ORDER BY pv.updated_at DESC;
```

**Returns:** Audio production progress for videos currently in audio stages.

---

### 6. Video Editing Assets Query

```sql
WITH asset_summary AS (
  SELECT 
    video_id,
    segment_id,
    asset_type,
    COUNT(*) as asset_count,
    SUM(duration) as total_duration,
    json_agg(
      json_build_object(
        'id', id,
        'asset_key', asset_key,
        'file_url', file_url,
        'start_time', start_time,
        'duration', duration,
        'layer', layer,
        'status', status
      ) ORDER BY layer, start_time
    ) as assets
  FROM production_video_editing_assets
  GROUP BY video_id, segment_id, asset_type
)
SELECT 
  pvs.video_id,
  pvs.segment_id,
  pvs.filename as segment_filename,
  pvs.video_url as segment_video_url,
  -- Asset breakdown
  (SELECT asset_count FROM asset_summary WHERE asset_type = 'image' AND segment_id = pvs.id LIMIT 1) as image_count,
  (SELECT asset_count FROM asset_summary WHERE asset_type = 'text' AND segment_id = pvs.id LIMIT 1) as text_count,
  (SELECT asset_count FROM asset_summary WHERE asset_type = 'audio' AND segment_id = pvs.id LIMIT 1) as audio_count,
  -- Full asset details
  (
    SELECT json_object_agg(asset_type, assets)
    FROM asset_summary
    WHERE segment_id = pvs.id
  ) as assets_by_type
FROM production_video_segments pvs
WHERE pvs.video_id = 168
ORDER BY pvs.segment_id;
```

**Returns:** Complete asset inventory per video segment.

---

### 7. Performance Analytics Query

```sql
WITH production_stats AS (
  SELECT 
    pv.id,
    pv.title,
    pv.status,
    pv.final_link,
    pv.content_id_on_platform,
    bv.views as source_views,
    -- Production metrics
    EXTRACT(EPOCH FROM (pv.updated_at - pv.created_at)) / 86400 as production_days,
    (SELECT COUNT(*) FROM production_audio_segments WHERE video_id = pv.id) as audio_segment_count,
    (SELECT SUM(duration_seconds) FROM production_audio_segments WHERE video_id = pv.id) as total_audio_seconds,
    -- Check if published
    CASE WHEN pv.status = 'published' THEN pv.updated_at ELSE NULL END as published_at
  FROM production_videos pv
  LEFT JOIN benchmark_videos bv ON pv.benchmark_id = bv.id
  WHERE pv.status IN ('published', 'in_analysis')
)
SELECT 
  id,
  title,
  final_link,
  source_views,
  ROUND(production_days, 1) as days_to_publish,
  audio_segment_count,
  ROUND(total_audio_seconds / 60, 1) as video_duration_minutes,
  published_at,
  -- Efficiency metrics
  ROUND(total_audio_seconds / (production_days * 86400), 4) as seconds_per_day_rate
FROM production_stats
ORDER BY published_at DESC NULLS LAST;
```

**Returns:** Production efficiency metrics for published videos.

---

### 8. Status Workflow Tracking

```sql
SELECT 
  sas.status_key,
  sas.description,
  COUNT(pv.id) as videos_in_this_status,
  AVG(EXTRACT(EPOCH FROM (pv.updated_at - pv.created_at)) / 3600) as avg_hours_in_status,
  json_agg(
    json_build_object(
      'video_id', pv.id,
      'title', LEFT(pv.title, 50),
      'created_at', pv.created_at,
      'updated_at', pv.updated_at
    )
  ) FILTER (WHERE pv.id IS NOT NULL) as videos
FROM structure_allowed_status sas
LEFT JOIN production_videos pv ON pv.status = sas.status_key
GROUP BY sas.status_key, sas.description
ORDER BY COUNT(pv.id) DESC;
```

**Returns:** How many videos are in each status, with average time spent.

---

### 9. Source to Production Mapping

```sql
SELECT 
  bv.id as benchmark_id,
  bv.title as source_title,
  bv.channel_name,
  bv.views as source_views,
  bv.upload_date as source_upload_date,
  -- Check if analyzed
  na.id IS NOT NULL as has_narrative_analysis,
  -- Check if in production
  pv.id as production_id,
  pv.title as production_title,
  pv.status as production_status,
  pv.final_link,
  -- Outlier status
  ov.benchmark_video_id IS NOT NULL as is_outlier,
  ov.median_performance_score,
  -- Status progression
  CASE 
    WHEN pv.status = 'published' THEN 'published'
    WHEN pv.id IS NOT NULL THEN 'in_production'
    WHEN na.id IS NOT NULL THEN 'analyzed'
    WHEN ov.benchmark_video_id IS NOT NULL THEN 'outlier_identified'
    ELSE 'source_only'
  END as workflow_stage
FROM benchmark_videos bv
LEFT JOIN narrative_analyses na ON na.benchmark_video_id = bv.id
LEFT JOIN production_videos pv ON pv.benchmark_id = bv.id
LEFT JOIN benchmark_outlier_videos ov ON ov.benchmark_video_id = bv.id
WHERE bv.video_transcript IS NOT NULL  -- Only videos with transcripts
ORDER BY 
  CASE workflow_stage
    WHEN 'published' THEN 1
    WHEN 'in_production' THEN 2
    WHEN 'analyzed' THEN 3
    WHEN 'outlier_identified' THEN 4
    ELSE 5
  END,
  bv.views DESC;
```

**Returns:** Complete view of all videos and their position in the workflow.

---

### 10. Bulk Production Creation

```sql
-- Create production_videos for all analyzed outliers without production yet
INSERT INTO production_videos (
  benchmark_id,
  unique_profile_id,
  title,
  status,
  language,
  platform,
  placeholder,
  created_at,
  updated_at
)
SELECT 
  ov.benchmark_video_id,
  'YOUR_CHANNEL_ID',  -- Replace with your channel
  ov.title || ' (Adapted)',  -- Will be regenerated by AI
  'create_title',
  'pt-BR',  -- Your language
  'youtube',
  'YOUR_ACCOUNT_PLACEHOLDER',  -- Replace
  NOW(),
  NOW()
FROM benchmark_outlier_videos ov
JOIN narrative_analyses na ON na.benchmark_video_id = ov.benchmark_video_id
LEFT JOIN production_videos pv ON pv.benchmark_id = ov.benchmark_video_id
WHERE 
  ov.status = 'available'
  AND pv.id IS NULL  -- No production exists yet
  AND ov.median_performance_score >= 2  -- High performers only
RETURNING id, title, status;
```

**Returns:** IDs of newly created production videos.

---

## 🔍 Specialized Queries

### Get All Video Segments for Rendering

```sql
SELECT 
  pvs.segment_id,
  pvs.filename,
  pvs.video_url,
  pca.concatenated_audio_url,
  pvs.covering_images,
  pvs.covering_assets,
  pvs.metadata_video,
  json_agg(
    json_build_object(
      'asset_type', pvea.asset_type,
      'file_url', pvea.file_url,
      'start_time', pvea.start_time,
      'duration', pvea.duration,
      'layer', pvea.layer,
      'properties', pvea.properties,
      'text', pvea.text
    ) ORDER BY pvea.layer, pvea.start_time
  ) FILTER (WHERE pvea.id IS NOT NULL) as timeline_assets
FROM production_video_segments pvs
LEFT JOIN production_concatenated_audios pca ON pvs.concatenated_audio_id = pca.id
LEFT JOIN production_video_editing_assets pvea ON pvea.segment_id = pvs.id
WHERE pvs.video_id = 168
GROUP BY 
  pvs.segment_id, 
  pvs.filename, 
  pvs.video_url, 
  pca.concatenated_audio_url,
  pvs.covering_images,
  pvs.covering_assets,
  pvs.metadata_video
ORDER BY pvs.segment_id;
```

---

### Production Velocity Metrics

```sql
WITH weekly_production AS (
  SELECT 
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as started,
    COUNT(*) FILTER (WHERE status = 'published') as published,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) 
      FILTER (WHERE status = 'published') as avg_days_to_publish
  FROM production_videos
  GROUP BY DATE_TRUNC('week', created_at)
)
SELECT 
  week,
  started,
  published,
  ROUND(avg_days_to_publish, 1) as avg_days,
  ROUND((published::NUMERIC / NULLIF(started, 0)) * 100, 1) as success_rate
FROM weekly_production
WHERE week >= NOW() - INTERVAL '12 weeks'
ORDER BY week DESC;
```

---

## 💾 Export Queries

### Export Production Summary to JSON

```sql
SELECT json_build_object(
  'production_id', pv.id,
  'title', pv.title,
  'status', pv.status,
  'source', json_build_object(
    'benchmark_id', bv.id,
    'title', bv.title,
    'url', bv.youtube_url,
    'views', bv.views
  ),
  'narrative', json_build_object(
    'structure', na.identified_structure_model,
    'theme', na.central_theme,
    'beats', na.story_beats
  ),
  'production_data', json_build_object(
    'script', pv.script IS NOT NULL,
    'audio_segments', (SELECT COUNT(*) FROM production_audio_segments WHERE video_id = pv.id),
    'video_segments', (SELECT COUNT(*) FROM production_video_segments WHERE video_id = pv.id),
    'final_url', pv.final_link
  )
) as production_export
FROM production_videos pv
LEFT JOIN benchmark_videos bv ON pv.benchmark_id = bv.id
LEFT JOIN narrative_analyses na ON na.benchmark_video_id = bv.id
WHERE pv.id = 168;
```

---

## 🎯 Quick Reference

| Query Purpose | Section | Complexity |
|---------------|---------|------------|
| Single video production data | #1 | Medium |
| Find outliers | #2 | Hard |
| Dashboard view | #3 | Easy |
| Narrative details | #4 | Medium |
| Audio progress | #5 | Medium |
| Video assets | #6 | Hard |
| Performance metrics | #7 | Medium |
| Status tracking | #8 | Easy |
| Workflow mapping | #9 | Medium |
| Bulk creation | #10 | Easy |

---

**Pro Tip:** Use `EXPLAIN ANALYZE` before these queries on large datasets to check performance:

```sql
EXPLAIN ANALYZE
SELECT ... -- your query here
```

Add indexes if needed:

```sql
CREATE INDEX idx_production_videos_status ON production_videos(status);
CREATE INDEX idx_production_audio_segments_video_id ON production_audio_segments(video_id);
CREATE INDEX idx_production_video_segments_video_id ON production_video_segments(video_id);
```
