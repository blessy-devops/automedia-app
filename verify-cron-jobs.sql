-- ==================================================================
-- VERIFICAÇÃO DOS CRON JOBS DE PRODUÇÃO
-- Execute essas queries no SQL Editor do Gobbi's Supabase
-- ==================================================================

-- ==================================================================
-- 1. VER TODOS OS CRON JOBS ATIVOS
-- ==================================================================
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
ORDER BY jobname;

-- ==================================================================
-- 2. VERIFICAR CRON JOB #1: production-queue-control
-- (Move vídeos de add_to_production → pending_distribution)
-- ==================================================================
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'production-queue-control';

-- Ver últimas 10 execuções
SELECT
  runid,
  status,
  return_message,
  start_time,
  end_time,
  (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'production-queue-control')
ORDER BY start_time DESC
LIMIT 10;

-- ==================================================================
-- 3. VERIFICAR CRON JOB #2: production-pipeline-starter
-- (Inicia processamento de vídeos em queued)
-- ==================================================================
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'production-pipeline-starter';

-- Ver últimas 10 execuções
SELECT
  runid,
  status,
  return_message,
  start_time,
  end_time,
  (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'production-pipeline-starter')
ORDER BY start_time DESC
LIMIT 10;

-- ==================================================================
-- 4. VERIFICAR ESTADO DA FILA DE PRODUÇÃO
-- ==================================================================

-- Vídeos em cada status
SELECT
  status,
  COUNT(*) as count,
  SUM(CASE WHEN is_processing = true THEN 1 ELSE 0 END) as processing_count
FROM production_videos
WHERE status NOT IN ('completed', 'canceled')
GROUP BY status
ORDER BY
  CASE status
    WHEN 'queued' THEN 1
    WHEN 'create_title' THEN 2
    WHEN 'create_hook' THEN 3
    ELSE 99
  END;

-- Vídeo atualmente processando (se houver)
SELECT
  id,
  placeholder,
  benchmark_id,
  status,
  is_processing,
  created_at,
  updated_at
FROM production_videos
WHERE is_processing = true
  AND status NOT IN ('completed', 'canceled')
ORDER BY updated_at DESC
LIMIT 1;

-- Próximos 5 vídeos na fila (queued)
SELECT
  id,
  placeholder,
  benchmark_id,
  status,
  is_processing,
  created_at
FROM production_videos
WHERE status = 'queued'
ORDER BY created_at ASC
LIMIT 5;

-- ==================================================================
-- 5. VERIFICAR VÍDEOS AWAITING DISTRIBUTION
-- ==================================================================
SELECT
  id,
  title,
  status,
  categorization->>'niche' as niche,
  categorization->>'subniche' as subniche,
  created_at
FROM benchmark_videos
WHERE status = 'pending_distribution'
ORDER BY created_at ASC
LIMIT 10;

-- ==================================================================
-- 6. DIAGNÓSTICO: Possíveis problemas
-- ==================================================================

-- Vídeos travados com is_processing=true mas status estranho
SELECT
  id,
  placeholder,
  status,
  is_processing,
  updated_at,
  NOW() - updated_at as time_since_update
FROM production_videos
WHERE is_processing = true
  AND updated_at < NOW() - INTERVAL '10 minutes'
  AND status NOT IN ('completed', 'canceled')
ORDER BY updated_at DESC;

-- Vídeos em queued há muito tempo (mais de 1 hora)
SELECT
  id,
  placeholder,
  status,
  created_at,
  NOW() - created_at as time_in_queue
FROM production_videos
WHERE status = 'queued'
  AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at ASC;

-- ==================================================================
-- 7. CRIAR CRON JOB #2 (se não existir)
-- ==================================================================
-- ⚠️ IMPORTANTE: Trocar ANON_KEY_AQUI pela chave real antes de rodar!
-- ⚠️ Só rodar se o job não existir (verificar com query #3)

/*
SELECT cron.schedule(
  'production-pipeline-starter',
  '*/2 * * * *',  -- a cada 2 minutos
  $$
  SELECT
    net.http_post(
      url := 'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/production-pipeline-starter',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY_AQUI"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
*/

-- ==================================================================
-- 8. COMANDOS DE MANUTENÇÃO (usar com cuidado!)
-- ==================================================================

-- Pausar Cron Job #1 (Queue Control)
-- SELECT cron.unschedule('production-queue-control');

-- Pausar Cron Job #2 (Pipeline Starter)
-- SELECT cron.unschedule('production-pipeline-starter');

-- Reativar Cron Job
-- SELECT cron.schedule(...); -- usar comando completo de criação

-- Limpar vídeo travado manualmente
-- UPDATE production_videos
-- SET is_processing = false
-- WHERE id = 123; -- substituir pelo ID real
