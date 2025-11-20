# 🚀 Production Pipeline - Guia de Deploy

**Data:** 2025-11-16
**Status:** Pronto para Deploy
**Objetivo:** Implementar fila de produção com processamento sequencial

---

## 📋 O Que Foi Implementado

### ✅ Mudanças no Código

1. **Status Inicial Corrigido** (`actions.ts:235`)
   - **Antes:** `status: 'create_title'`
   - **Agora:** `status: 'queued'`
   - Vídeos agora entram na fila ao invés de ir direto para produção

2. **Edge Function Criada** (`production-pipeline-starter`)
   - Verifica se já tem vídeo processando (catraca)
   - Pega próximo vídeo em `queued`
   - Inicia processamento: `is_processing = true` + `status = create_title`

---

## 🔄 Fluxo Completo

```
┌────────────────────────────────────────────────────────────────┐
│ 1. USER DISTRIBUI VÍDEO (UI)                                   │
│    /production/distribution                                     │
│    → Seleciona canais                                          │
│    → Clica "Distribute"                                        │
└─────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. SERVER ACTION: distributeVideoToChannels()                  │
│    → Cria production_videos com status = 'queued'              │
│    → Marca benchmark_video como 'used'                         │
│    → Video SAI da tela /production/distribution                │
└─────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. PRODUCTION VIDEOS PAGE                                      │
│    /production-videos                                           │
│    → Vídeo aparece com status "Queued"                         │
└─────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. CRON #2: production-pipeline-starter (a cada 2min)          │
│    → Verifica: já tem vídeo processando?                       │
│    → Se NÃO: pega primeiro 'queued'                           │
│    → Marca: is_processing = true                               │
│    → Muda: status = 'create_title' (1ª etapa)                 │
└─────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. PRODUCTION PIPELINE (15 stages)                             │
│    → create_title → create_hook → ... → completed              │
│    (Isso já está implementado no N8N por enquanto)             │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Passos de Deploy

### PASSO 1: Verificar Cron Job #1 (5 min)

O Cron Job #1 (`production-queue-control`) já deveria estar rodando. Vamos verificar:

1. Acesse o **SQL Editor** do Gobbi:
   ```
   https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/sql/new
   ```

2. Cole e execute as queries do arquivo:
   ```
   verify-cron-jobs.sql
   ```

3. **Verifique especificamente a seção #2** (production-queue-control)

**Resultados Esperados:**
- ✅ Job existe e está ativo (`active = true`)
- ✅ Schedule é `*/2 * * * *` (a cada 2min)
- ✅ Últimas execuções têm `status = 'succeeded'`

**Se o job NÃO existir:**
- Ele foi criado antes mas pode ter sido deletado
- Recriar seguindo o guia em `CHECKPOINT-2025-11-16.md`

---

### PASSO 2: Deploy da Edge Function (5 min)

No terminal local:

```bash
# Certifique-se de estar no diretório correto
cd /Users/daviluis/Documents/automedia-platform/automedia

# Deploy da Edge Function
supabase functions deploy production-pipeline-starter \
  --project-ref eafkhsmgrzywrhviisdl \
  --no-verify-jwt

# Verificar deploy
supabase functions list --project-ref eafkhsmgrzywrhviisdl
```

**Resultado esperado:**
```
production-pipeline-starter (deployed)
```

---

### PASSO 3: Testar Edge Function Manualmente (5 min)

Antes de configurar o cron, teste se a função funciona:

```bash
# Obter ANON_KEY do dashboard do Gobbi
# https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/settings/api

# Testar função (trocar ANON_KEY_AQUI)
curl -X POST \
  'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/production-pipeline-starter' \
  -H 'Authorization: Bearer ANON_KEY_AQUI' \
  -H 'Content-Type: application/json'
```

**Respostas esperadas:**

Se não tem vídeos em queued:
```json
{"status":"idle","message":"No videos in queue"}
```

Se tem vídeo processando:
```json
{"status":"blocked","message":"A video is already being processed",...}
```

Se iniciou vídeo:
```json
{"status":"started","video_id":123,"new_status":"create_title",...}
```

---

### PASSO 4: Configurar Cron Job #2 (10 min)

1. Acesse o **SQL Editor** do Gobbi

2. **Obtenha a ANON_KEY:**
   ```
   https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/settings/api
   ```
   Copie o valor de "anon public"

3. Cole e execute (substituindo `ANON_KEY_AQUI`):

```sql
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

4. **Verificar criação:**

```sql
SELECT * FROM cron.job WHERE jobname = 'production-pipeline-starter';
```

Deve retornar 1 linha com `active = true`.

---

### PASSO 5: Monitorar Execuções (10 min)

#### Verificar Logs da Edge Function

```bash
# Terminal local - logs em tempo real
supabase functions logs production-pipeline-starter \
  --project-ref eafkhsmgrzywrhviisdl \
  --follow
```

Aguarde até 2 minutos. Você deve ver:
```
[Pipeline Starter] Starting production queue check...
[Pipeline Starter] No videos processing - queue is clear
[Pipeline Starter] No videos in queue
```

#### Verificar Execuções do Cron (SQL)

```sql
-- Últimas 5 execuções
SELECT
  runid,
  status,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'production-pipeline-starter')
ORDER BY start_time DESC
LIMIT 5;
```

**Resultado esperado:**
- `status = 'succeeded'`
- Execuções a cada 2 minutos

---

### PASSO 6: Teste End-to-End (15 min)

Agora vamos testar o fluxo completo:

#### 6.1. Criar Vídeo de Teste

1. Acesse: `http://localhost:7001/production/distribution`

2. Se não tiver vídeos, crie um manualmente no banco:

```sql
-- Verificar vídeos disponíveis
SELECT id, title, status
FROM benchmark_videos
WHERE status = 'available'
LIMIT 5;

-- Marcar um como add_to_production
UPDATE benchmark_videos
SET status = 'add_to_production'
WHERE id = 26388;  -- usar ID real
```

3. Aguarde até 2min (Cron #1 vai mover para pending_distribution)

4. Verifique que apareceu em `/production/distribution`

#### 6.2. Distribuir Vídeo

1. Na UI, selecione canais (mesmo que não tenha match, use "Remove from Queue" se necessário, ou crie canais matching)

2. Clique "Distribute"

3. **Verificar no banco:**

```sql
-- Vídeo deve estar em 'queued'
SELECT id, placeholder, status, is_processing
FROM production_videos
WHERE benchmark_id = 26388;
-- Esperado: status = 'queued', is_processing = false

-- Benchmark video deve estar 'used'
SELECT id, status
FROM benchmark_videos
WHERE id = 26388;
-- Esperado: status = 'used'
```

#### 6.3. Aguardar Pipeline Starter

Aguarde até 2 minutos. Monitore os logs:

```bash
supabase functions logs production-pipeline-starter \
  --project-ref eafkhsmgrzywrhviisdl \
  --follow
```

Deve ver:
```
[Pipeline Starter] Found next video: {...}
[Pipeline Starter] Video started processing: 123
```

#### 6.4. Verificar Mudança de Status

```sql
-- Vídeo deve estar em 'create_title'
SELECT id, placeholder, status, is_processing
FROM production_videos
WHERE benchmark_id = 26388;
-- Esperado: status = 'create_title', is_processing = true
```

#### 6.5. Verificar na UI

1. Acesse: `http://localhost:7001/production-videos`
2. Vídeo deve aparecer com badge "Create Title" (ou equivalente)
3. Status deve mostrar que está em processamento

---

## ✅ Checklist Final

- [ ] Cron Job #1 (production-queue-control) está ativo
- [ ] Cron Job #1 executando a cada 2min sem erros
- [ ] Edge Function production-pipeline-starter deployed
- [ ] Teste manual da Edge Function funcionando
- [ ] Cron Job #2 (production-pipeline-starter) criado
- [ ] Cron Job #2 executando a cada 2min sem erros
- [ ] Teste end-to-end: vídeo vai de distribution → queued → create_title
- [ ] UI de distribution remove vídeo após distribuir (status = used)
- [ ] UI de production mostra vídeo com status correto

---

## 🐛 Troubleshooting

### Vídeo não sai de 'queued'

**Possíveis causas:**
1. Cron Job #2 não está rodando
   - Verificar: `SELECT * FROM cron.job WHERE jobname = 'production-pipeline-starter'`
2. Já tem vídeo processando (catraca bloqueada)
   - Verificar: `SELECT * FROM production_videos WHERE is_processing = true`
3. Edge Function com erro
   - Ver logs: `supabase functions logs production-pipeline-starter`

**Solução:**
```sql
-- Se vídeo está travado (is_processing = true há muito tempo)
UPDATE production_videos
SET is_processing = false
WHERE id = 123 AND is_processing = true;
```

### Vídeo não aparece em /production/distribution

**Possíveis causas:**
1. Cron Job #1 não está rodando
2. Status não é 'pending_distribution'

**Verificar:**
```sql
SELECT id, status FROM benchmark_videos WHERE id = 26388;
```

### Cron Jobs não executando

**Verificar extensão pg_cron:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

Se não existir:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

## 📊 Métricas de Sucesso

Após 1 hora rodando:

- ✅ Pelo menos 30 execuções de cada cron (1 a cada 2min)
- ✅ Nenhum erro crítico nos logs
- ✅ Vídeos movendo automaticamente: distribution → queued → create_title
- ✅ Sistema não processando 2 vídeos ao mesmo tempo (catraca funcionando)
- ✅ UI de distribution funcionando perfeitamente

---

## 🎯 Próximos Passos (Futuro)

Depois que o sistema estiver estável:

1. **Substituir N8N Pipeline** - Migrar as 15 etapas para Edge Functions
2. **Dashboard de Monitoramento** - Métricas em tempo real
3. **Notificações** - Slack/email quando vídeo completa ou falha
4. **Auto-retry** - Reprocessar vídeos que falharam
5. **Priorização** - Flag para vídeos prioritários pularem fila

---

**Última atualização:** 2025-11-16
**Versão:** 1.0.0
**Status:** ✅ Pronto para Deploy
