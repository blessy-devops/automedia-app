# Production Pipeline - Guia Completo

**Data:** 2025-11-30
**Status:** Em Produção
**Versão:** 2.0.0

---

## Visão Geral

O Production Pipeline é o sistema de fila de produção de vídeos. Ele controla:
1. **Catraca** - Limite de vídeos simultâneos em produção
2. **Webhooks** - Integração com N8N para automação
3. **Status** - Ciclo de vida completo do vídeo

---

## Arquitetura

### Componentes Principais

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. UI: /production/distribution                                         │
│    → User seleciona canais e distribui vídeo                           │
│    → Server Action: distributeVideoToChannels()                         │
│    → Cria production_video com status = 'queued'                        │
└─────────────────┬──────────────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. CATRACA: production-pipeline-starter (Cron a cada 2min)             │
│    → Verifica slots disponíveis (MAX_CONCURRENT_VIDEOS = 3)            │
│    → Pega próximo vídeo em 'queued'                                    │
│    → Marca: is_processing = true, status = 'create_title'              │
│    → Chama webhook: create-tittle                                       │
└─────────────────┬──────────────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. N8N: Gera títulos para o vídeo                                      │
│    → Recebe: { production_video_id, triggered_at }                     │
│    → Gera 3 opções de título                                           │
│    → Atualiza: status = 'pending_approval'                             │
└─────────────────┬──────────────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. UI: /production/approval-queue                                       │
│    → User visualiza títulos gerados                                     │
│    → Escolhe: Approve (seleciona título) ou Put on Hold                │
└─────────────────┬──────────────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. SERVER ACTION: approveTitle()                                        │
│    → Salva título escolhido                                             │
│    → Atualiza: status = 'approved'                                      │
│    → Chama webhook: create-content                                      │
└─────────────────┬──────────────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 6. N8N: Pipeline de Produção (13+ etapas)                              │
│    → create_script → create_audio → ... → create_thumbnail             │
│    → Ao final: status = 'scheduled' ou 'published'                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Catraca (production-pipeline-starter)

### O Que É

A "catraca" é o controle de concorrência que limita quantos vídeos podem estar em produção simultânea. Funciona como uma catraca de metrô - só deixa passar quando tem espaço.

### Arquivo

`supabase/functions/production-pipeline-starter/index.ts`

### Configuração

```typescript
// Número máximo de vídeos em produção simultânea (default: 3)
const MAX_CONCURRENT_VIDEOS = parseInt(Deno.env.get('MAX_CONCURRENT_VIDEOS') || '3', 10)
```

Para alterar o limite:
```bash
# Via secrets do Supabase
npx supabase secrets set MAX_CONCURRENT_VIDEOS=5 --project-ref PROJECT_REF
```

### Lógica de Bloqueio

A catraca **NÃO** conta como "em processamento" vídeos com status:
- `canceled` - Vídeo cancelado
- `completed` - Vídeo finalizado (legacy)
- `scheduled` - Vídeo agendado para publicação
- `published` - Vídeo já publicado

Isso significa que vídeos `scheduled` e `published` **não bloqueiam** novos vídeos de entrar em produção.

```typescript
// Query que verifica vídeos em processamento
const { data: processingVideos } = await supabase
  .from('production_videos')
  .select('id, placeholder, status, is_processing')
  .eq('is_processing', true)
  .neq('status', 'canceled')
  .neq('status', 'completed')
  .neq('status', 'scheduled')
  .neq('status', 'published')
  .limit(MAX_CONCURRENT_VIDEOS)
```

### Fluxo de Execução

1. **Verifica slots** - Quantos vídeos estão em produção ativa?
2. **Se cheio** - Retorna `{ status: 'blocked' }` e não faz nada
3. **Se tem slot** - Busca próximo vídeo em `queued` (FIFO por `created_at`)
4. **Inicia produção** - Marca `is_processing = true`, `status = 'create_title'`
5. **Chama webhook** - Dispara `create-tittle` para N8N iniciar geração de títulos

### Resposta da Edge Function

```json
// Sem vídeos na fila
{ "status": "idle", "message": "No videos in queue" }

// Fila cheia
{
  "status": "blocked",
  "message": "Maximum concurrent videos reached (3/3)",
  "current_count": 3,
  "max_concurrent": 3,
  "processing_videos": [
    { "id": 189, "placeholder": "P-189", "status": "create_audio" },
    { "id": 190, "placeholder": "P-190", "status": "create_script" },
    { "id": 191, "placeholder": "P-191", "status": "pending_approval" }
  ]
}

// Vídeo iniciado
{
  "status": "started",
  "video_id": 192,
  "video_placeholder": "P-192",
  "benchmark_id": 26500,
  "new_status": "create_title",
  "webhook": { "called": true, "status": 200, "error": null }
}
```

---

## Webhooks

### Tabela: production_webhooks

```sql
CREATE TABLE public.production_webhooks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  webhook_url TEXT NOT NULL,
  api_key TEXT,
  webhook_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Webhooks Configurados

| name | webhook_type | Disparado quando | Payload |
|------|-------------|------------------|---------|
| `create-tittle` | creation | Vídeo entra em produção (queued → create_title) | `{ production_video_id, triggered_at }` |
| `create-content` | creation | Título é aprovado (pending_approval → approved) | `{ production_video_id, triggered_at }` |

### Autenticação

Os webhooks usam **Header Auth** com `X-API-Key`:

```typescript
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
}

if (webhook.api_key) {
  headers['X-API-Key'] = webhook.api_key
}
```

### Configuração no N8N

1. No node Webhook, selecione **Authentication: Header Auth**
2. Crie uma credential com:
   - **Header Name:** `X-API-Key`
   - **Header Value:** (a mesma key do banco)
3. Salve e ative o workflow

### Gerar API Key

```sql
-- Gerar e salvar uma API key
UPDATE production_webhooks
SET api_key = 'sk_prod_' || encode(gen_random_bytes(24), 'hex')
WHERE name = 'create-tittle'
RETURNING name, api_key;
```

---

## Status do Vídeo

### Ciclo de Vida Completo

```
queued
  │
  ▼ (catraca libera slot)
create_title ──────────────────────────┐
  │                                    │
  ▼ (N8N gera títulos)                 │
pending_approval                       │
  │                                    │
  ├──► on_hold (user pausou)           │
  │                                    │
  ▼ (user aprova título)               │
approved                               │
  │                                    │
  ▼ (N8N continua pipeline)            │
create_hook                            │
  │                                    │ (qualquer etapa pode falhar)
  ▼                                    │
create_script                          │
  │                                    │
  ▼                                    │
create_audio                           ├──► failed
  │                                    │
  ▼                                    │
create_segments                        │
  │                                    │
  ▼                                    │
create_images                          │
  │                                    │
  ▼                                    │
create_render                          │
  │                                    │
  ▼                                    │
create_thumbnail                       │
  │                                    │
  ▼                                    │
create_youtube_metadata ───────────────┘
  │
  ▼
scheduled (agendado para publicação)
  │
  ▼ (data de publicação chegou)
published (vídeo publicado no YouTube)
```

### Status Especiais

| Status | Cor | Descrição |
|--------|-----|-----------|
| `queued` | Yellow | Aguardando slot na fila |
| `pending_approval` | Amber | Aguardando aprovação de título |
| `on_hold` | Blue | Pausado pelo usuário |
| `scheduled` | Purple | Agendado para publicação |
| `published` | Green | Publicado no YouTube |
| `failed` | Red | Erro em alguma etapa |
| `canceled` | Gray | Cancelado pelo usuário |

### Flags Importantes

- `is_processing = true` → Vídeo está em produção ativa (conta para catraca)
- `is_processing = false` → Vídeo finalizado, pausado ou cancelado

---

## Aprovação de Títulos

### Arquivo

`app/(dashboard)/production/approval-queue/actions.ts`

### Função: approveTitle()

```typescript
export async function approveTitle(
  videoId: number,
  selectedTitleIndex: number
): Promise<{ success: boolean; error?: string }>
```

### Fluxo

1. Busca o vídeo e suas opções de título
2. Valida que o vídeo está em `pending_approval`
3. Salva o título escolhido no campo `title`
4. Atualiza status para `approved`
5. **Chama webhook `create-content`** para continuar o pipeline

### Webhook create-content

Disparado após aprovação do título:

```typescript
// Buscar webhook
const { data: webhook } = await supabase
  .from('production_webhooks')
  .select('webhook_url, api_key')
  .eq('name', 'create-content')
  .eq('is_active', true)
  .single()

// Payload enviado ao N8N
const payload = {
  production_video_id: videoId,
  triggered_at: new Date().toISOString(),
}
```

---

## Deploy

### 1. Deploy da Edge Function

```bash
cd /Users/daviluis/Documents/automedia-platform/automedia

npx supabase functions deploy production-pipeline-starter \
  --project-ref PROJECT_REF

# Verificar deploy
npx supabase functions list --project-ref PROJECT_REF
```

### 2. Configurar Cron Job

```sql
-- No SQL Editor do Supabase
SELECT cron.schedule(
  'production-pipeline-starter',
  '*/2 * * * *',  -- a cada 2 minutos
  $$
  SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/production-pipeline-starter',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### 3. Verificar Cron

```sql
-- Listar jobs
SELECT jobname, schedule, active FROM cron.job;

-- Ver execuções recentes
SELECT runid, status, start_time, end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'production-pipeline-starter')
ORDER BY start_time DESC
LIMIT 10;
```

### 4. Monitorar Logs

```bash
npx supabase functions logs production-pipeline-starter \
  --project-ref PROJECT_REF \
  --follow
```

---

## Troubleshooting

### Vídeo travado em 'queued'

**Possíveis causas:**
1. Cron não está rodando
2. Fila cheia (3 vídeos em produção)
3. Edge function com erro

**Solução:**
```sql
-- Verificar vídeos em produção
SELECT id, placeholder, status, is_processing
FROM production_videos
WHERE is_processing = true
  AND status NOT IN ('canceled', 'completed', 'scheduled', 'published');

-- Se travado, resetar
UPDATE production_videos
SET is_processing = false
WHERE id = XXX;
```

### Vídeo cancelado ainda aparece como "Processing"

**Causa:** `is_processing` ficou `true` mesmo após cancelamento

**Solução:**
```sql
UPDATE production_videos
SET is_processing = false
WHERE status = 'canceled' AND is_processing = true;
```

### Webhook não está sendo chamado

**Verificar:**
1. Webhook existe e está ativo?
```sql
SELECT name, webhook_url, api_key, is_active
FROM production_webhooks
WHERE name IN ('create-tittle', 'create-content');
```

2. URL está correta?
3. API Key bate com o N8N?

### Catraca bloqueando mesmo com slots disponíveis

**Verificar status dos vídeos:**
```sql
SELECT id, placeholder, status, is_processing
FROM production_videos
WHERE is_processing = true
ORDER BY created_at DESC;
```

Se há vídeos `scheduled` ou `published` com `is_processing = true`, corrija:
```sql
UPDATE production_videos
SET is_processing = false
WHERE status IN ('scheduled', 'published') AND is_processing = true;
```

---

## Testes

### Testar Catraca Manualmente

```bash
curl -X POST \
  'https://PROJECT_REF.supabase.co/functions/v1/production-pipeline-starter' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Testar Webhook Diretamente

```bash
# Testar create-tittle
curl -X POST 'WEBHOOK_URL' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: API_KEY' \
  -d '{"production_video_id": 999, "triggered_at": "2025-11-30T12:00:00Z"}'
```

---

## Checklist de Produção

- [ ] Edge Function deployed
- [ ] Cron Job configurado (2min)
- [ ] MAX_CONCURRENT_VIDEOS definido (default: 3)
- [ ] Webhook `create-tittle` ativo com API key
- [ ] Webhook `create-content` ativo com API key
- [ ] N8N configurado com Header Auth
- [ ] Monitoramento de logs ativo

---

**Última atualização:** 2025-11-30
**Autor:** Claude Code + Davi Luis
