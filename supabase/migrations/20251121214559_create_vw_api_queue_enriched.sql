-- Create enriched view for API Queue with JOINs and computed fields
-- This view simplifies frontend queries by pre-processing JSON and joining related tables

CREATE OR REPLACE VIEW vw_api_queue_enriched AS
SELECT
  -- Core fields
  q.id,
  q.created_at,
  q.processed_at,
  q.status,
  q.error_message,
  q.api_provider,
  q.workflow_name,
  q.asset,
  q.video_id,
  q.workflow_id,
  q.api_rate_limit,

  -- Extract fields from JSONB payload (CORRECTED FIELD NAMES)
  q.payload->>'ai_model' as model,
  q.payload->>'generation_prompt' as prompt,
  q.payload->>'taskUUID' as task_uuid,
  q.payload->>'taskType' as task_type,

  -- JOIN with benchmark_videos to get video title and channel name
  v.title as video_title,
  v.channel_name,

  -- Detect job type from workflow_name or asset extension
  CASE
    WHEN q.workflow_name LIKE '%elenco%' OR q.workflow_name LIKE '%character%' OR q.asset LIKE '%.jpeg' OR q.asset LIKE '%.jpg' OR q.asset LIKE '%.png' THEN 'image'
    WHEN q.workflow_name LIKE '%audio%' OR q.workflow_name LIKE '%tts%' OR q.asset LIKE '%.mp3' OR q.asset LIKE '%.wav' THEN 'audio'
    WHEN q.workflow_name LIKE '%video%' OR q.asset LIKE '%.mp4' OR q.asset LIKE '%.mov' THEN 'video'
    ELSE 'image'  -- Default to image since most jobs are image generation
  END as job_type,

  -- Map internal status to UI-friendly status
  CASE
    WHEN q.status = 'processed' THEN 'completed'
    WHEN q.status = 'pending' THEN 'queued'
    WHEN q.status = 'processing' THEN 'processing'
    WHEN q.error_message IS NOT NULL THEN 'failed'
    ELSE q.status
  END as job_status,

  -- Calculate ETA for processing jobs
  CASE
    WHEN q.status = 'processed' THEN NULL
    WHEN q.status = 'processing' THEN
      -- Simple estimate: average processing time is ~1-2 minutes
      EXTRACT(EPOCH FROM (NOW() - q.created_at))::int || 's elapsed'
    ELSE NULL
  END as eta

FROM structure_api_queue q
LEFT JOIN benchmark_videos v ON q.video_id = v.id
ORDER BY q.created_at DESC;

-- Grant access to authenticated users
GRANT SELECT ON vw_api_queue_enriched TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW vw_api_queue_enriched IS 'Enriched view of API queue jobs with video titles, computed job types, and mapped statuses';
