# 🔍 Monitoramento e Troubleshooting

**Última atualização:** 2025-11-15
**Versão:** 1.0.0

---

## 📋 Índice

1. [Health Checks](#health-checks)
2. [Monitoramento de Edge Functions](#monitoramento-de-edge-functions)
3. [Métricas de Performance](#métricas-de-performance)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Common Error Patterns](#common-error-patterns)
6. [Setup de Alertas](#setup-de-alertas)
7. [Log Analysis](#log-analysis)

---

## 🏥 Health Checks

### 1.1 Verificar Status de Sincronização

**Query para verificar últimas sincronizações (Gobbi):**

```sql
-- Vídeos recebidos recentemente
SELECT
  COUNT(*) as total_videos,
  MAX(created_at) as ultimo_video_recebido,
  MIN(created_at) as primeiro_video_recebido,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/60 as duracao_minutos
FROM benchmark_videos
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Canais recebidos recentemente
SELECT
  COUNT(*) as total_canais,
  MAX(created_at) as ultimo_canal_recebido,
  MIN(created_at) as primeiro_canal_recebido
FROM benchmark_channels
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Status breakdown por status
SELECT
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM benchmark_videos
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY total DESC;
```

### 1.2 Verificar Integridade de Dados

**Query para detectar dados incompletos:**

```sql
-- Vídeos sem canal associado (ERRO DE FK)
SELECT
  youtube_video_id,
  channel_id,
  title,
  created_at
FROM benchmark_videos
WHERE channel_id NOT IN (SELECT channel_id FROM benchmark_channels)
ORDER BY created_at DESC
LIMIT 10;

-- Vídeos sem dados essenciais
SELECT
  youtube_video_id,
  CASE
    WHEN title IS NULL THEN 'missing_title'
    WHEN views IS NULL THEN 'missing_views'
    WHEN upload_date IS NULL THEN 'missing_upload_date'
    ELSE 'unknown_issue'
  END as issue_type,
  created_at
FROM benchmark_videos
WHERE title IS NULL
   OR views IS NULL
   OR upload_date IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- Canais sem nome
SELECT
  channel_id,
  subscriber_count,
  created_at
FROM benchmark_channels
WHERE channel_name IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

### 1.3 Verificar Duplicatas

**Query para detectar duplicatas:**

```sql
-- Verificar se há múltiplos registros para mesmo youtube_video_id (não deveria acontecer)
SELECT
  youtube_video_id,
  COUNT(*) as occurrences,
  ARRAY_AGG(id ORDER BY created_at DESC) as ids,
  ARRAY_AGG(created_at ORDER BY created_at DESC) as timestamps
FROM benchmark_videos
GROUP BY youtube_video_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Verificar se há múltiplos registros para mesmo channel_id (não deveria acontecer)
SELECT
  channel_id,
  COUNT(*) as occurrences,
  ARRAY_AGG(id ORDER BY created_at DESC) as ids
FROM benchmark_channels
GROUP BY channel_id
HAVING COUNT(*) > 1;
```

---

## 📊 Monitoramento de Edge Functions

### 2.1 Logs do Supabase (Sua Plataforma)

**Como acessar logs do `send-to-gobbi`:**

1. Ir para [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecionar projeto: `xlpkabexmwsugkmbngwm`
3. Navegar: **Edge Functions** → `send-to-gobbi` → **Logs**

**Logs importantes a monitorar:**

```
[send-to-gobbi] Starting webhook send process
[send-to-gobbi] Request to send X videos
[send-to-gobbi] Fetched X videos and Y channels from local database
[send-to-gobbi] Sending batch 1 (X videos)
[send-to-gobbi] Webhook response: {success: true, ...}
[send-to-gobbi] Complete: channels(X sent, Y failed), videos(A sent, B failed) in Xms
```

**Alertas a configurar:**

- ⚠️ **Error rate > 5%** → Investigar imediatamente
- ⚠️ **Latency > 10s** → Possível timeout
- ⚠️ **Failed batches** → Verificar webhook do Gobbi

### 2.2 Logs do Supabase (Gobbi)

**Como acessar logs do `receive-benchmark-videos`:**

1. Ir para Supabase Dashboard do Gobbi
2. Projeto: `eafkhsmgrzywrhviisdl`
3. Navegar: **Edge Functions** → `receive-benchmark-videos` → **Logs**

**Logs importantes a monitorar:**

```
[receive-benchmark-videos] Incoming webhook request
[receive-benchmark-videos] Received payload with X channels and Y videos
[receive-benchmark-videos] Processing X channels...
[receive-benchmark-videos] Updated channel UCxxx
[receive-benchmark-videos] Inserted new channel UCyyy
[receive-benchmark-videos] Channel processing complete: X new, Y updated, Z failed
[receive-benchmark-videos] Summary: channels(A new, B updated, C failed), videos(D new, E updated, F failed), duration=Xms
```

**Alertas a configurar:**

- 🚨 **Any failed channels** → Verificar migration
- 🚨 **Failed videos > 10%** → Verificar field compatibility
- ⚠️ **Duration > 30s** → Performance degradation

### 2.3 Monitoramento via SQL (Gobbi)

**Query para monitorar health da Edge Function:**

```sql
-- Criar view para monitoramento
CREATE OR REPLACE VIEW webhook_sync_health AS
SELECT
  DATE_TRUNC('hour', created_at) as sync_hour,
  COUNT(*) as videos_received,
  COUNT(CASE WHEN status = 'add_to_production' THEN 1 END) as production_videos,
  AVG(views) as avg_views,
  MAX(created_at) as last_sync_time
FROM benchmark_videos
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY sync_hour DESC;

-- Usar a view
SELECT * FROM webhook_sync_health
WHERE sync_hour >= NOW() - INTERVAL '24 hours'
ORDER BY sync_hour DESC;
```

---

## ⚡ Métricas de Performance

### 3.1 Benchmarks Esperados

| Operação | Latência Esperada | Throughput | Notas |
|----------|-------------------|------------|-------|
| **send-to-gobbi** (10 vídeos) | 500-1500ms | ~100 vídeos/min | Inclui fetch + HTTP |
| **send-to-gobbi** (50 vídeos) | 2-5s | ~600 vídeos/min | Batch processing |
| **receive-benchmark-videos** (10 vídeos) | 200-800ms | - | Depende de DB load |
| **receive-benchmark-videos** (50 vídeos) | 1-3s | - | Upsert em batch |
| **HTTP Round-trip** | 100-300ms | - | Network latency |

### 3.2 Query para Medir Performance Real

**Adicionar timestamps personalizados (opcional):**

```sql
-- Criar tabela de logs de sync
CREATE TABLE IF NOT EXISTS webhook_sync_logs (
  id SERIAL PRIMARY KEY,
  sync_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  video_count INT NOT NULL,
  channel_count INT,
  videos_inserted INT DEFAULT 0,
  videos_updated INT DEFAULT 0,
  videos_failed INT DEFAULT 0,
  channels_inserted INT DEFAULT 0,
  channels_updated INT DEFAULT 0,
  channels_failed INT DEFAULT 0,
  duration_ms INT,
  source TEXT DEFAULT 'automedia-platform',
  error_message TEXT
);

-- Analisar performance histórica
SELECT
  AVG(duration_ms) as avg_duration_ms,
  MIN(duration_ms) as min_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration_ms,
  SUM(video_count) as total_videos_synced,
  COUNT(*) as total_syncs
FROM webhook_sync_logs
WHERE sync_started_at >= NOW() - INTERVAL '7 days';
```

### 3.3 Otimizações de Performance

**Batch Size Recomendado:**

- ✅ **50 vídeos por batch** (default configurado)
- Menor: Mais HTTP requests, maior overhead
- Maior: Risco de timeout, dificulta troubleshooting

**Índices Críticos (já criados):**

```sql
-- Gobbi's DB - verificar se índices existem
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('benchmark_videos', 'benchmark_channels')
ORDER BY tablename, indexname;

-- Índices essenciais:
-- benchmark_videos: youtube_video_id (UNIQUE), channel_id (FK), created_at
-- benchmark_channels: channel_id (UNIQUE), created_at
```

---

## 🔧 Troubleshooting Guide

### 4.1 Fluxo de Diagnóstico

```
1. Identificar sintoma
   ↓
2. Verificar logs da Edge Function (send-to-gobbi)
   ↓
3. Verificar logs da Edge Function (receive-benchmark-videos)
   ↓
4. Verificar queries de health check
   ↓
5. Reproduzir erro com test-webhook.mjs
   ↓
6. Aplicar correção
   ↓
7. Validar com queries de verificação
```

### 4.2 Checklist de Troubleshooting

Quando algo dá errado, seguir essa ordem:

**✅ Passo 1: Verificar Edge Function `send-to-gobbi`**

```bash
# Ver últimos logs
cd /Users/daviluis/Documents/automedia-platform/automedia
npx supabase functions logs send-to-gobbi --limit 50

# Procurar por:
# - "Fatal error"
# - "Webhook error"
# - "Failed to call Edge Function"
```

**✅ Passo 2: Verificar Webhook Configuration**

```sql
-- Sua plataforma
SELECT
  id,
  name,
  webhook_url,
  is_active,
  created_at,
  updated_at
FROM production_webhooks
WHERE name = 'receive-benchmark-videos';

-- Deve retornar:
-- is_active = true
-- webhook_url = https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos
```

**✅ Passo 3: Testar Manualmente**

```bash
# Rodar script de teste
cd /Users/daviluis/Documents/automedia-platform/automedia
node test-webhook.mjs

# Resultado esperado:
# ✅ Edge Function succeeded!
# Status: 200 OK
# {
#   "success": true,
#   "channels_sent": 2,
#   "videos_sent": 2,
#   ...
# }
```

**✅ Passo 4: Verificar Dados no Gobbi**

```sql
-- Verificar se vídeos chegaram
SELECT
  youtube_video_id,
  channel_id,
  title,
  status,
  created_at
FROM benchmark_videos
ORDER BY created_at DESC
LIMIT 10;

-- Verificar se canais chegaram
SELECT
  channel_id,
  channel_name,
  is_verified,
  created_at
FROM benchmark_channels
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚨 Common Error Patterns

### 5.1 Erro: "Webhook not found or inactive"

**Sintoma:**
```
[send-to-gobbi] Error fetching webhook: null
Error: Webhook "receive-benchmark-videos" not found or inactive in production_webhooks table
```

**Causa:** Webhook não configurado ou desativado

**Solução:**

```sql
-- Verificar webhooks existentes
SELECT * FROM production_webhooks;

-- Se não existe, criar:
INSERT INTO production_webhooks (name, webhook_url, is_active)
VALUES (
  'receive-benchmark-videos',
  'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos',
  true
);

-- Se existe mas está inativo, ativar:
UPDATE production_webhooks
SET is_active = true
WHERE name = 'receive-benchmark-videos';
```

### 5.2 Erro: "Could not find the 'X' column"

**Sintoma:**
```
[receive-benchmark-videos] Error upserting video: Could not find the 'enrichment_data' column in schema cache
```

**Causa:** Migration não foi executada no Gobbi

**Solução:**

1. Identificar qual migration falta:
   - `enrichment_data`, `keywords`, `related_video_ids`, `performance_vs_recent_14d` → Rodar `add_enrichment_fields_migration.sql`
   - `thumbnail_url`, `banner_url`, `custom_url`, `country`, `is_verified` → Rodar `add_missing_channel_fields_migration.sql`

2. Executar migration no Gobbi:
   - Abrir SQL Editor no Supabase do Gobbi
   - Copiar e colar migration SQL
   - Executar

3. Re-deploy Edge Function `receive-benchmark-videos`

### 5.3 Erro: "Foreign key constraint violation"

**Sintoma:**
```
[receive-benchmark-videos] Error upserting video: insert or update on table "benchmark_videos" violates foreign key constraint "benchmark_videos_channel_id_fkey"
```

**Causa:** Canal não existe na tabela `benchmark_channels`

**Solução:**

**Opção 1:** Garantir que canais são enviados junto (já implementado)

```typescript
// send-to-gobbi já envia canais no payload
const webhookPayload = {
  channels: [...], // Canais enviados PRIMEIRO
  videos: [...],
  metadata: {...}
}
```

**Opção 2:** Verificar se migration de canais foi executada

```sql
-- Verificar se trigger de upsert de canais está funcionando
SELECT * FROM benchmark_channels
WHERE channel_id = 'UCxxx'; -- Substituir pelo channel_id do erro
```

**Opção 3:** Criar canal manualmente (emergência)

```sql
INSERT INTO benchmark_channels (channel_id, channel_name)
VALUES ('UCxxx', 'Nome do Canal')
ON CONFLICT (channel_id) DO NOTHING;
```

### 5.4 Erro: "Cannot insert a non-DEFAULT value into column 'youtube_url'"

**Sintoma:**
```
Error upserting video: cannot insert a non-DEFAULT value into column "youtube_url" of relation "benchmark_videos"
```

**Causa:** Tentando enviar `youtube_url` (que é GENERATED COLUMN no Gobbi)

**Solução:** Já corrigido no código. Verificar se Edge Function `send-to-gobbi` está atualizada:

```typescript
// CORRETO - NÃO enviar youtube_url
const videoData = {
  youtube_video_id: video.youtube_video_id,
  channel_id: video.channel_id,
  // ... outros campos
  // youtube_url: video.youtube_url, // ❌ NUNCA enviar isso
}
```

### 5.5 Erro: "Invalid payload: missing or invalid 'videos' array"

**Sintoma:**
```
{
  "success": false,
  "error": "Invalid payload: missing or invalid 'videos' array",
  "channels_inserted": 0,
  "videos_inserted": 0,
  ...
}
```

**Causa:** Payload malformado ou vazio

**Solução:**

```typescript
// Verificar formato do payload
const payload = {
  videos: [  // ✅ OBRIGATÓRIO - array de objetos
    {
      youtube_video_id: "xxx",
      channel_id: "UCyyy",
      // ... outros campos
    }
  ],
  channels: [  // ⚠️ OPCIONAL - mas recomendado
    {
      channel_id: "UCyyy",
      channel_name: "Nome",
      // ... outros campos
    }
  ],
  metadata: {  // ⚠️ OPCIONAL
    sent_at: "2025-11-15T...",
    source: "automedia-platform",
    video_count: 1,
    channel_count: 1
  }
}
```

### 5.6 Erro: HTTP 401 "Unauthorized"

**Sintoma:**
```
Webhook returned 401: {"success": false, "error": "Unauthorized"}
```

**Causa:** API Key inválida ou ausente

**Solução:**

```sql
-- Verificar se API key está configurada
SELECT api_key FROM production_webhooks
WHERE name = 'receive-benchmark-videos';

-- Se NULL, adicionar:
UPDATE production_webhooks
SET api_key = 'seu-secret-key-aqui'
WHERE name = 'receive-benchmark-videos';

-- No Gobbi, verificar se WEBHOOK_API_KEY está configurado:
-- npx supabase secrets set WEBHOOK_API_KEY=seu-secret-key-aqui --project-ref eafkhsmgrzywrhviisdl
```

**Nota:** Autenticação está desabilitada por padrão para testes. Reabilitar em produção:

```typescript
// receive-benchmark-videos-function.ts
// Descomentar linhas 152-164 para habilitar autenticação
const webhookApiKey = Deno.env.get('WEBHOOK_API_KEY')
if (webhookApiKey) {
  const webhookKey = req.headers.get('X-Webhook-Key')
  if (!webhookKey || webhookKey !== webhookApiKey) {
    // Retornar 401
  }
}
```

### 5.7 Erro: Timeout (10s+)

**Sintoma:**
```
[send-to-gobbi] Batch error: FetchError: request to https://... failed, reason: timeout of 10000ms exceeded
```

**Causa:** Batch muito grande ou database lento

**Solução:**

```typescript
// Reduzir batch_size
const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
  body: {
    video_ids: videoIds,
    options: {
      batch_size: 25, // Reduzir de 50 para 25
    },
  },
})
```

---

## 🔔 Setup de Alertas

### 6.1 Alertas Críticos (Configurar no Supabase Dashboard)

**Para sua plataforma:**

1. **Edge Function Errors** (send-to-gobbi)
   - Threshold: > 5% error rate
   - Action: Email + Slack notification
   - Severity: Critical

2. **Latency Alerts**
   - Threshold: p95 > 10s
   - Action: Email notification
   - Severity: Warning

**Para Gobbi:**

1. **Database Errors** (receive-benchmark-videos)
   - Threshold: Any FK constraint errors
   - Action: Email notification
   - Severity: Critical

2. **Processing Failures**
   - Threshold: > 10% videos failed
   - Action: Email notification
   - Severity: Critical

### 6.2 Alertas Opcionais

**Monitoramento de Volume:**

```sql
-- Criar function para detectar anomalias
CREATE OR REPLACE FUNCTION detect_sync_anomaly()
RETURNS TABLE(anomaly_type TEXT, value NUMERIC, threshold NUMERIC) AS $$
BEGIN
  -- Detectar se parou de receber vídeos
  RETURN QUERY
  SELECT
    'no_videos_received' as anomaly_type,
    EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))/3600 as value,
    24.0 as threshold
  FROM benchmark_videos
  HAVING EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))/3600 > 24;

  -- Detectar spike anormal de vídeos
  RETURN QUERY
  SELECT
    'abnormal_spike' as anomaly_type,
    COUNT(*)::NUMERIC as value,
    1000.0 as threshold
  FROM benchmark_videos
  WHERE created_at >= NOW() - INTERVAL '1 hour'
  HAVING COUNT(*) > 1000;
END;
$$ LANGUAGE plpgsql;

-- Rodar periodicamente (ex: via cron)
SELECT * FROM detect_sync_anomaly();
```

---

## 📝 Log Analysis

### 7.1 Queries Úteis para Análise de Logs

**Performance ao longo do tempo:**

```sql
-- Análise de throughput por hora
SELECT
  DATE_TRUNC('hour', created_at) as sync_hour,
  COUNT(*) as videos_synced,
  COUNT(DISTINCT channel_id) as unique_channels,
  AVG(views) as avg_views,
  MIN(created_at) as first_video,
  MAX(created_at) as last_video,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration_seconds
FROM benchmark_videos
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY sync_hour DESC;
```

**Top erros por tipo:**

```sql
-- Se você implementou webhook_sync_logs
SELECT
  error_message,
  COUNT(*) as occurrences,
  MAX(sync_started_at) as last_occurrence,
  AVG(video_count) as avg_video_count_when_failed
FROM webhook_sync_logs
WHERE error_message IS NOT NULL
GROUP BY error_message
ORDER BY occurrences DESC
LIMIT 10;
```

**Análise de taxa de sucesso:**

```sql
-- Taxa de sucesso de sync
SELECT
  DATE(sync_started_at) as sync_date,
  COUNT(*) as total_syncs,
  SUM(CASE WHEN error_message IS NULL THEN 1 ELSE 0 END) as successful_syncs,
  SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END) as failed_syncs,
  ROUND(
    SUM(CASE WHEN error_message IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2
  ) as success_rate_percent
FROM webhook_sync_logs
WHERE sync_started_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sync_started_at)
ORDER BY sync_date DESC;
```

---

## 📞 Suporte e Escalação

### Quando Escalar

**Severidade 1 (Crítica):**
- 🚨 Webhook completamente parado (> 1 hora sem sync)
- 🚨 Error rate > 50%
- 🚨 Data loss detectado (vídeos desaparecendo)

**Severidade 2 (Alta):**
- ⚠️ Error rate entre 10-50%
- ⚠️ Latência consistentemente > 30s
- ⚠️ FK constraint errors frequentes

**Severidade 3 (Média):**
- ℹ️ Error rate entre 5-10%
- ℹ️ Latência ocasional > 10s
- ℹ️ Anomalias de volume

### Informações a Coletar

Ao reportar problemas, incluir:

1. **Timestamp do erro** (UTC)
2. **Logs da Edge Function** (send-to-gobbi e receive-benchmark-videos)
3. **IDs dos vídeos afetados** (youtube_video_id)
4. **Resultado de health checks** (queries SQL)
5. **Screenshot do erro** (se aplicável)

---

## 🔗 Links Úteis

- **Supabase Dashboard (Sua Plataforma):** https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm
- **Supabase Dashboard (Gobbi):** https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl
- **Edge Function Logs (send-to-gobbi):** Dashboard → Edge Functions → send-to-gobbi → Logs
- **Edge Function Logs (receive-benchmark-videos):** Dashboard Gobbi → Edge Functions → receive-benchmark-videos → Logs
- **Documentação Principal:** [README.md](./README.md)
- **Arquitetura:** [WEBHOOK_ARCHITECTURE.md](./WEBHOOK_ARCHITECTURE.md)
- **Testes:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

**Última revisão:** 2025-11-15
**Mantido por:** Claude Code + Davi Luis
