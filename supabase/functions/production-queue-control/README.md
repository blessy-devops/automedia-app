# Production Queue Control - Edge Function

**⚠️ ARQUITETURA ANTIGA - NÃO MAIS NECESSÁRIA (2025-11-19)**

Esta função implementa a arquitetura CRON-controlled que **não é mais usada**.

**Arquitetura Antiga (esta função):**
```
Video → add_to_production → [CRON a cada 2min] → pending_distribution → Distribution UI
```

**Arquitetura Nova (atual):**
```
Video → pending_distribution → Distribution UI → [catraca ao distribuir] → production_videos
```

**Por que mudamos?**
- ✅ Vídeos aparecem instantaneamente na tela (sem delay de 2min)
- ✅ Menos componentes = menos bugs
- ✅ Controle de fila acontece no momento certo: ao distribuir para production

**Ver:** `docs/gobbi-database/WEBHOOK_ARCHITECTURE.md` (seção "MUDANÇA DE ARQUITETURA DA FILA")

---

## 📖 Documentação Original (Arquitetura Antiga)

**Função:** Substituir WF0 do N8N (controle de fila de produção)
**Trigger:** Supabase Cron (a cada 2 minutos)
**Database:** Gobbi's Supabase

---

## 📖 O Que Faz

Esta Edge Function implementa a lógica de "catraca" que controla a fila de produção:

1. **Verifica se há vídeo sendo processado** (`is_processing = true`)
   - Se SIM → PARA (espera terminar)
   - Se NÃO → Continua

2. **Busca próximo vídeo em fila** (`status = 'add_to_production'`)
   - Se NÃO tem → Retorna idle
   - Se TEM → Continua

3. **Marca vídeo como pending_distribution**
   - Muda status de `add_to_production` → `pending_distribution`
   - Vídeo aparece na tela `/production/distribution`

4. **Usuário seleciona canais** (via UI)
   - Cria production_videos (jobs)
   - Marca vídeo como `used`

---

## 🚀 Deploy

### 1. Deploy da Edge Function

```bash
# Deploy para o projeto do Gobbi
supabase functions deploy production-queue-control \
  --project-ref eafkhsmgrzywrhviisdl \
  --no-verify-jwt
```

### 2. Verificar Secrets (Automáticas)

A Edge Function usa variáveis de ambiente **padrão do Supabase** que já existem automaticamente:
- `SUPABASE_URL` - URL do projeto Gobbi
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key do projeto

**Não precisa configurar nada!** Essas variáveis são injetadas automaticamente quando a função roda no Supabase.

### 3. Configurar Cron Trigger

**Opção A: Via Dashboard do Gobbi**
1. Acesse: `https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/database/cron-jobs`
2. Clique em "Create a new cron job"
3. Preencha:
   - **Name:** `production-queue-control`
   - **Schedule:** `*/2 * * * *` (a cada 2 minutos)
   - **HTTP Request:**
     - Method: `POST`
     - URL: `https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/production-queue-control`
     - Headers:
       ```json
       {
         "Authorization": "Bearer <ANON_KEY>"
       }
       ```

**Opção B: Via SQL (no dashboard do Gobbi)**

```sql
-- Habilitar extensão pg_cron (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar cron job
SELECT cron.schedule(
  'production-queue-control',     -- nome
  '*/2 * * * *',                   -- a cada 2 minutos
  $$
  SELECT
    net.http_post(
      url := 'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/production-queue-control',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY_AQUI"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Ver jobs agendados
SELECT * FROM cron.job;

-- Ver últimas execuções
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## 🔍 Monitoramento

### Ver Logs da Edge Function

```bash
# Logs em tempo real
supabase functions logs production-queue-control \
  --project-ref eafkhsmgrzywrhviisdl \
  --follow

# Últimos 100 logs
supabase functions logs production-queue-control \
  --project-ref eafkhsmgrzywrhviisdl \
  --limit 100
```

### Ver Status do Cron

```sql
-- Jobs ativos
SELECT * FROM cron.job WHERE jobname = 'production-queue-control';

-- Últimas 10 execuções
SELECT
  runid,
  jobid,
  status,
  start_time,
  end_time,
  (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'production-queue-control')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🧪 Testar Manualmente

### Via curl

```bash
# Testar a Edge Function diretamente
curl -X POST \
  'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/production-queue-control' \
  -H 'Authorization: Bearer ANON_KEY_AQUI' \
  -H 'Content-Type: application/json'
```

### Via Supabase Dashboard

1. Acesse: `https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/functions`
2. Clique em `production-queue-control`
3. Clique em "Invoke Function"
4. Veja o resultado

---

## 📊 Respostas Esperadas

### Caso 1: Queue Bloqueada (vídeo já processando)
```json
{
  "status": "blocked",
  "message": "A video is already being processed",
  "processing_video_id": 12345
}
```

### Caso 2: Sem vídeos na fila
```json
{
  "status": "idle",
  "message": "No videos in queue"
}
```

### Caso 3: Vídeo processado com sucesso
```json
{
  "status": "processed",
  "message": "Video moved to pending distribution",
  "video_id": 26388,
  "video_title": "On Mother's Day, My Millionaire Son..."
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
SELECT cron.unschedule('production-queue-control');

-- Reabilitar
SELECT cron.schedule(
  'production-queue-control',
  '*/2 * * * *',
  $$ ... $$  -- mesma query de antes
);

-- Deletar permanentemente
DELETE FROM cron.job WHERE jobname = 'production-queue-control';
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

### Vídeos não aparecem em /production/distribution
- Verificar se status foi atualizado: `SELECT id, status FROM benchmark_videos WHERE status = 'pending_distribution'`
- Verificar logs da Edge Function para erros

### Performance
- Se processar muitos vídeos, considerar aumentar intervalo (ex: 5 minutos)
- Monitorar execuções via `cron.job_run_details`

---

## 📝 Notas Importantes

1. **Não confundir com WF1:** Esta função apenas MOVE vídeos para `pending_distribution`. A seleção de canais é feita na UI.

2. **Catraca:** Garante que só 1 vídeo é processado por vez (evita sobrecarga).

3. **Idempotente:** Se rodar múltiplas vezes, não causa problemas (pega sempre o mais antigo).

4. **Timeout:** Edge Functions têm timeout de 150s no plano Free, 500s no Pro. Esta função é rápida (~1s).
