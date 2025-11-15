-- ============================================================================
-- QUERIES ÚTEIS PARA MONITORAMENTO DO SISTEMA DE WEBHOOKS
-- ============================================================================

-- ============================================================================
-- 1. WEBHOOKS
-- ============================================================================

-- Listar todos os webhooks cadastrados
SELECT
  id,
  name,
  webhook_url,
  is_active,
  created_at,
  updated_at
FROM production_webhooks
ORDER BY created_at DESC;


-- Contar webhooks ativos vs inativos
SELECT
  is_active,
  COUNT(*) as total
FROM production_webhooks
GROUP BY is_active;


-- ============================================================================
-- 2. LOGS DE WEBHOOKS
-- ============================================================================

-- Últimos 20 envios
SELECT
  wl.id,
  pw.name as webhook_name,
  wl.video_count,
  wl.status,
  wl.response_code,
  wl.sent_at,
  wl.error_message
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
ORDER BY wl.sent_at DESC
LIMIT 20;


-- Envios com falha (últimos 50)
SELECT
  wl.id,
  pw.name as webhook_name,
  wl.video_count,
  wl.video_ids,
  wl.error_message,
  wl.response_code,
  wl.sent_at
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
WHERE wl.status = 'failed'
ORDER BY wl.sent_at DESC
LIMIT 50;


-- Envios bem-sucedidos hoje
SELECT
  pw.name as webhook_name,
  COUNT(*) as total_requests,
  SUM(wl.video_count) as total_videos_sent
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
WHERE wl.status = 'success'
  AND wl.sent_at >= CURRENT_DATE
GROUP BY pw.name;


-- Estatísticas por webhook (últimos 30 dias)
SELECT
  pw.name as webhook_name,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN wl.status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN wl.status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN wl.status = 'partial' THEN 1 END) as partial,
  SUM(wl.video_count) as total_videos,
  AVG(wl.video_count) as avg_videos_per_request,
  MAX(wl.sent_at) as last_request
FROM production_webhooks pw
LEFT JOIN webhook_logs wl ON wl.webhook_id = pw.id
  AND wl.sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY pw.id, pw.name
ORDER BY total_requests DESC;


-- Logs de um webhook específico
SELECT
  wl.sent_at,
  wl.video_count,
  wl.status,
  wl.response_code,
  wl.error_message,
  array_length(wl.video_ids, 1) as video_count_check
FROM webhook_logs wl
WHERE wl.webhook_id = 1 -- Substitua pelo ID do webhook
ORDER BY wl.sent_at DESC
LIMIT 100;


-- ============================================================================
-- 3. VÍDEOS ENVIADOS
-- ============================================================================

-- Vídeos enviados recentemente (com nomes)
SELECT DISTINCT
  bv.id,
  bv.youtube_video_id,
  bv.title,
  bv.channel_id,
  bv.views,
  wl.sent_at
FROM webhook_logs wl
CROSS JOIN LATERAL unnest(wl.video_ids) AS video_id
JOIN benchmark_videos bv ON bv.id = video_id
ORDER BY wl.sent_at DESC
LIMIT 50;


-- Total de vídeos enviados por canal
SELECT
  bv.channel_id,
  COUNT(DISTINCT bv.id) as videos_sent,
  MAX(wl.sent_at) as last_sent
FROM webhook_logs wl
CROSS JOIN LATERAL unnest(wl.video_ids) AS video_id
JOIN benchmark_videos bv ON bv.id = video_id
GROUP BY bv.channel_id
ORDER BY videos_sent DESC
LIMIT 20;


-- Vídeos enviados múltiplas vezes
SELECT
  bv.youtube_video_id,
  bv.title,
  COUNT(*) as times_sent,
  array_agg(DISTINCT pw.name) as sent_to_webhooks,
  MIN(wl.sent_at) as first_sent,
  MAX(wl.sent_at) as last_sent
FROM webhook_logs wl
CROSS JOIN LATERAL unnest(wl.video_ids) AS video_id
JOIN benchmark_videos bv ON bv.id = video_id
JOIN production_webhooks pw ON pw.id = wl.webhook_id
GROUP BY bv.youtube_video_id, bv.title
HAVING COUNT(*) > 1
ORDER BY times_sent DESC;


-- ============================================================================
-- 4. ANÁLISE DE ERROS
-- ============================================================================

-- Erros mais comuns (últimos 30 dias)
SELECT
  wl.error_message,
  COUNT(*) as occurrence_count,
  array_agg(DISTINCT pw.name) as affected_webhooks
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
WHERE wl.status = 'failed'
  AND wl.sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY wl.error_message
ORDER BY occurrence_count DESC;


-- Taxa de sucesso por webhook
SELECT
  pw.name,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN wl.status = 'success' THEN 1 END) as successful,
  ROUND(
    (COUNT(CASE WHEN wl.status = 'success' THEN 1 END)::NUMERIC / COUNT(*) * 100),
    2
  ) as success_rate_percent
FROM production_webhooks pw
JOIN webhook_logs wl ON wl.webhook_id = pw.id
WHERE wl.sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY pw.id, pw.name
ORDER BY success_rate_percent DESC;


-- Histórico de falhas consecutivas (últimos 10 envios por webhook)
WITH recent_logs AS (
  SELECT
    webhook_id,
    status,
    sent_at,
    ROW_NUMBER() OVER (PARTITION BY webhook_id ORDER BY sent_at DESC) as rn
  FROM webhook_logs
)
SELECT
  pw.name,
  COUNT(CASE WHEN rl.status = 'failed' THEN 1 END) as failed_in_last_10,
  MAX(rl.sent_at) as last_attempt
FROM production_webhooks pw
LEFT JOIN recent_logs rl ON rl.webhook_id = pw.id AND rl.rn <= 10
GROUP BY pw.id, pw.name
HAVING COUNT(CASE WHEN rl.status = 'failed' THEN 1 END) >= 3
ORDER BY failed_in_last_10 DESC;


-- ============================================================================
-- 5. VIEWS ÚTEIS
-- ============================================================================

-- Criar view de estatísticas de webhooks
CREATE OR REPLACE VIEW webhook_statistics AS
SELECT
  pw.id,
  pw.name as webhook_name,
  pw.is_active,
  COUNT(wl.id) as total_requests,
  COUNT(CASE WHEN wl.status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN wl.status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN wl.status = 'partial' THEN 1 END) as partial,
  SUM(wl.video_count) as total_videos_sent,
  AVG(wl.video_count) as avg_videos_per_request,
  MAX(wl.sent_at) as last_request,
  MIN(wl.sent_at) as first_request
FROM production_webhooks pw
LEFT JOIN webhook_logs wl ON wl.webhook_id = pw.id
GROUP BY pw.id, pw.name, pw.is_active;

-- Usar a view
SELECT * FROM webhook_statistics ORDER BY total_requests DESC;


-- Criar view de logs recentes com nomes
CREATE OR REPLACE VIEW recent_webhook_logs AS
SELECT
  wl.id,
  pw.name as webhook_name,
  wl.video_count,
  wl.status,
  wl.response_code,
  wl.error_message,
  wl.sent_at,
  wl.video_ids
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
WHERE wl.sent_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY wl.sent_at DESC;

-- Usar a view
SELECT * FROM recent_webhook_logs LIMIT 50;


-- ============================================================================
-- 6. MANUTENÇÃO
-- ============================================================================

-- Limpar logs antigos (mais de 90 dias)
-- ATENÇÃO: Execute com cuidado em produção!
DELETE FROM webhook_logs
WHERE sent_at < CURRENT_DATE - INTERVAL '90 days';


-- Contar logs por idade
SELECT
  CASE
    WHEN sent_at >= CURRENT_DATE THEN 'Hoje'
    WHEN sent_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'Última semana'
    WHEN sent_at >= CURRENT_DATE - INTERVAL '30 days' THEN 'Último mês'
    WHEN sent_at >= CURRENT_DATE - INTERVAL '90 days' THEN 'Últimos 3 meses'
    ELSE 'Mais de 3 meses'
  END as age_group,
  COUNT(*) as log_count,
  pg_size_pretty(SUM(pg_column_size(webhook_logs))::bigint) as estimated_size
FROM webhook_logs
GROUP BY age_group
ORDER BY
  CASE age_group
    WHEN 'Hoje' THEN 1
    WHEN 'Última semana' THEN 2
    WHEN 'Último mês' THEN 3
    WHEN 'Últimos 3 meses' THEN 4
    ELSE 5
  END;


-- Tamanho da tabela webhook_logs
SELECT
  pg_size_pretty(pg_total_relation_size('webhook_logs')) as total_size,
  pg_size_pretty(pg_relation_size('webhook_logs')) as table_size,
  pg_size_pretty(pg_indexes_size('webhook_logs')) as indexes_size;


-- ============================================================================
-- 7. ALERTAS E MONITORAMENTO
-- ============================================================================

-- Webhooks que falharam 3+ vezes nas últimas 24 horas
SELECT
  pw.name,
  COUNT(*) as failures_24h,
  array_agg(wl.error_message ORDER BY wl.sent_at DESC) as recent_errors
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
WHERE wl.status = 'failed'
  AND wl.sent_at >= NOW() - INTERVAL '24 hours'
GROUP BY pw.id, pw.name
HAVING COUNT(*) >= 3
ORDER BY failures_24h DESC;


-- Webhooks inativos com envios recentes (possível erro de configuração)
SELECT
  pw.name,
  pw.is_active,
  MAX(wl.sent_at) as last_attempt
FROM production_webhooks pw
JOIN webhook_logs wl ON wl.webhook_id = pw.id
WHERE pw.is_active = false
  AND wl.sent_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY pw.id, pw.name, pw.is_active;


-- Performance: Tempo médio de resposta (baseado em timestamps)
-- Nota: Isso é uma aproximação, pois não temos tempo de resposta exato
SELECT
  pw.name,
  COUNT(*) as requests,
  AVG(
    CASE
      WHEN wl.status = 'success' THEN 1
      ELSE 3 -- Assumir que falhas demoram mais
    END
  ) as avg_estimated_seconds
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
WHERE wl.sent_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY pw.id, pw.name
ORDER BY avg_estimated_seconds DESC;


-- ============================================================================
-- 8. RELATÓRIOS
-- ============================================================================

-- Relatório diário de envios
SELECT
  DATE(wl.sent_at) as date,
  COUNT(*) as total_requests,
  SUM(wl.video_count) as total_videos,
  COUNT(CASE WHEN wl.status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN wl.status = 'failed' THEN 1 END) as failed
FROM webhook_logs wl
WHERE wl.sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(wl.sent_at)
ORDER BY date DESC;


-- Relatório mensal por webhook
SELECT
  DATE_TRUNC('month', wl.sent_at) as month,
  pw.name,
  COUNT(*) as requests,
  SUM(wl.video_count) as videos_sent
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
WHERE wl.sent_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', wl.sent_at), pw.name
ORDER BY month DESC, requests DESC;
