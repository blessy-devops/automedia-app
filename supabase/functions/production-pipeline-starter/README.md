# Production Pipeline Starter - Edge Function

**Função:** Iniciar processamento de vídeos na fila de produção
**Trigger:** Supabase Cron (a cada 2 minutos)
**Database:** Gobbi's Supabase

---

## 📖 O Que Faz

Esta Edge Function implementa a lógica de **catraca** para iniciar o processamento de vídeos:

1. **Verifica se há vídeo sendo processado** (`is_processing = true`)
   - Se SIM → PARA (espera terminar)
   - Se NÃO → Continua

2. **Busca próximo vídeo em fila** (`status = 'queued'`)
   - Se NÃO tem → Retorna idle
   - Se TEM → Continua

3. **Inicia processamento do vídeo**
   - Muda `is_processing` de `false` → `true`
   - Muda `status` de `queued` → `create_title` (primeira etapa)

---

## 🚀 Deploy

### 1. Deploy da Edge Function

```bash
# Deploy para o projeto do Gobbi
supabase functions deploy production-pipeline-starter \
  --project-ref eafkhsmgrzywrhviisdl \
  --no-verify-jwt
```

### 2. Verificar Secrets (Automáticas)

A Edge Function usa variáveis de ambiente **padrão do Supabase** que já existem automaticamente:
- `SUPABASE_URL` - URL do projeto Gobbi
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key do projeto

**Não precisa configurar nada!** Essas variáveis são injetadas automaticamente quando a função roda no Supabase.

### 3. Configurar Cron Trigger

**Via SQL Editor do Gobbi:**

```sql
-- Criar cron job
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
```

**⚠️ IMPORTANTE:** Trocar `ANON_KEY_AQUI` pela chave anon do projeto Gobbi.

---

## 🔍 Monitoramento

### Ver Logs da Edge Function

```bash
# Logs em tempo real
supabase functions logs production-pipeline-starter \
  --project-ref eafkhsmgrzywrhviisdl \
  --follow

# Últimos 100 logs
supabase functions logs production-pipeline-starter \
  --project-ref eafkhsmgrzywrhviisdl \
  --limit 100
```

### Ver Status do Cron

```sql
-- Jobs ativos
SELECT * FROM cron.job WHERE jobname = 'production-pipeline-starter';

-- Últimas 10 execuções
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
```

---

## 🧪 Testar Manualmente

### Via curl

```bash
# Testar a Edge Function diretamente
curl -X POST \
  'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/production-pipeline-starter' \
  -H 'Authorization: Bearer ANON_KEY_AQUI' \
  -H 'Content-Type: application/json'
```

### Via Supabase Dashboard

1. Acesse: `https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/functions`
2. Clique em `production-pipeline-starter`
3. Clique em "Invoke Function"
4. Veja o resultado

---

## 📊 Respostas Esperadas

### Caso 1: Vídeo já processando (Catraca bloqueada)

```json
{
  "status": "blocked",
  "message": "A video is already being processed",
  "processing_video_id": 123,
  "processing_video_placeholder": "Canal X",
  "processing_video_status": "create_thumbnail"
}
```

### Caso 2: Sem vídeos na fila

```json
{
  "status": "idle",
  "message": "No videos in queue"
}
```

### Caso 3: Vídeo iniciado com sucesso

```json
{
  "status": "started",
  "message": "Video processing started",
  "video_id": 456,
  "video_placeholder": "Canal Y",
  "benchmark_id": 26388,
  "new_status": "create_title"
}
```

### Caso 4: Erro

```json
{
  "error": "Failed to check processing videos: ..."
}
```

---

## 🛑 Parar/Pausar o Cron

```sql
-- Desabilitar cron job (pausa temporária)
SELECT cron.unschedule('production-pipeline-starter');

-- Reabilitar
SELECT cron.schedule(
  'production-pipeline-starter',
  '*/2 * * * *',
  $$ ... $$  -- mesma query de antes
);

-- Deletar permanentemente
DELETE FROM cron.job WHERE jobname = 'production-pipeline-starter';
```

---

## 🔧 Troubleshooting

### Função não está sendo chamada
- Verificar se cron job está ativo: `SELECT * FROM cron.job`
- Verificar logs do pg_cron: `SELECT * FROM cron.job_run_details`
- Verificar se URL da Edge Function está correta

### Erro 401 Unauthorized
- Verificar se Authorization header tem Bearer token correto
- Usar ANON_KEY (não service_role) para cron triggers

### Vídeos não saem de 'queued'
- Verificar se status foi atualizado: `SELECT id, status, is_processing FROM production_videos WHERE status = 'queued'`
- Verificar logs da Edge Function para erros
- Verificar se há vídeo travado com `is_processing = true` mas status incorreto

### Performance
- Se processar muitos vídeos, considerar aumentar intervalo (ex: 5 minutos)
- Monitorar execuções via `cron.job_run_details`

---

## 📝 Notas Importantes

1. **Catraca:** Garante que apenas 1 vídeo é processado por vez (evita sobrecarga)

2. **Status Flow:**
   - `queued` → Vídeo aguardando na fila
   - `create_title` → Primeira etapa do pipeline (15 stages total)

3. **Idempotente:** Se rodar múltiplas vezes, não causa problemas (pega sempre o mais antigo)

4. **Timeout:** Edge Functions têm timeout de 150s no plano Free, 500s no Pro. Esta função é rápida (~1s)

5. **Coordenação com production-queue-control:**
   - `production-queue-control`: Move benchmark_videos → production_videos (distribution)
   - `production-pipeline-starter`: Inicia processamento dos production_videos (pipeline)
