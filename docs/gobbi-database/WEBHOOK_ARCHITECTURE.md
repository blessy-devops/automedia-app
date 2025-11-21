# 🚀 Webhook Architecture: send-to-gobbi → receive-benchmark-videos

**Data:** 2025-11-14 23:00
**Status:** ✅ REFATORADO - Arquitetura HTTP Webhook Implementada

---

## 🎯 PROBLEMA ORIGINAL

A implementação anterior do `send-to-gobbi` estava **fundamentalmente errada**:

### ❌ Arquitetura INCORRETA (Antes)

```typescript
// send-to-gobbi/index.ts - ERRADO
const gobbiUrl = Deno.env.get('GOBBI_SUPABASE_URL')
const gobbiKey = Deno.env.get('GOBBI_SERVICE_ROLE_KEY')

if (!gobbiUrl || !gobbiKey) {
  throw new Error('Missing required environment variables')
}

const gobbiClient = createClient(gobbiUrl, gobbiKey)

// Conexão DIRETA ao banco do Gobbi
const { data: upsertData, error: upsertError } = await gobbiClient
  .from('benchmark_videos')
  .upsert(batch, {
    onConflict: 'youtube_video_id',
    ignoreDuplicates: false,
  })
```

**Problemas:**
1. ❌ Exigia `GOBBI_SUPABASE_URL` e `GOBBI_SERVICE_ROLE_KEY` secrets
2. ❌ Acesso direto ao banco de dados do Gobbi (inseguro)
3. ❌ Não utilizava a Edge Function `receive-benchmark-videos` criada no Gobbi
4. ❌ Violação de arquitetura: uma aplicação não deve acessar diretamente o banco de outra

---

## ✅ ARQUITETURA CORRETA (Depois)

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUA PLATAFORMA                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Edge Function                              │  │
│  │                  send-to-gobbi                                │  │
│  │                                                               │  │
│  │  1. Busca webhook URL da tabela production_webhooks          │  │
│  │  2. Busca vídeos da tabela benchmark_videos                  │  │
│  │  3. Faz HTTP POST com payload JSON                           │  │
│  └──────────────────────┬───────────────────────────────────────┘  │
│                         │                                           │
│                         │ HTTP POST                                 │
│                         │ Content-Type: application/json            │
│                         │                                           │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BANCO DO GOBBI                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Edge Function                              │  │
│  │              receive-benchmark-videos                         │  │
│  │                                                               │  │
│  │  1. Recebe payload via HTTP POST                             │  │
│  │  2. Valida campos obrigatórios                               │  │
│  │  3. Faz upsert na tabela benchmark_videos                    │  │
│  │  4. Retorna resultado (inserted, updated, failed)            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Tabela: benchmark_videos                         │  │
│  │                                                               │  │
│  │  - 33 campos totais                                          │  │
│  │  - Unique constraint em youtube_video_id                     │  │
│  │  - Triggers para auto-cálculo                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 MUDANÇAS IMPLEMENTADAS

### 1. Removido: Secrets do Gobbi

**ANTES (linhas 7-9):**
```typescript
// Setup Secrets:
//   npx supabase secrets set GOBBI_SUPABASE_URL=https://eafkhsmgrzywrhviisdl.supabase.co
//   npx supabase secrets set GOBBI_SERVICE_ROLE_KEY=eyJhbGci...
```

**DEPOIS (linhas 7-9):**
```typescript
// Setup:
//   Nenhum secret necessário! A função usa HTTP POST para o webhook do Gobbi.
//   O webhook URL é buscado da tabela production_webhooks.
```

---

### 2. Removido: Validação de Environment Variables

**ANTES (linhas 56-62):**
```typescript
const gobbiUrl = Deno.env.get('GOBBI_SUPABASE_URL')
const gobbiKey = Deno.env.get('GOBBI_SERVICE_ROLE_KEY')

if (!gobbiUrl || !gobbiKey) {
  throw new Error('Missing required environment variables: GOBBI_SUPABASE_URL or GOBBI_SERVICE_ROLE_KEY')
}
```

**DEPOIS:**
```typescript
// ✅ Nada! Não precisa mais dessas variáveis
```

---

### 3. Adicionado: Busca de Webhook URL + API Key

**NOVO (linhas 93-108):**
```typescript
// Fetch webhook URL and API key from production_webhooks table
console.log('[send-to-gobbi] Fetching webhook URL from production_webhooks table')
const { data: webhook, error: webhookError } = await supabase
  .from('production_webhooks')
  .select('webhook_url, name, is_active, api_key')  // ← Busca API key também
  .eq('name', 'receive-benchmark-videos')
  .eq('is_active', true)
  .single()

if (webhookError || !webhook) {
  console.error('[send-to-gobbi] Error fetching webhook:', webhookError)
  throw new Error('Webhook "receive-benchmark-videos" not found or inactive in production_webhooks table')
}

const webhookUrl = webhook.webhook_url
console.log(`[send-to-gobbi] Using webhook URL: ${webhookUrl}`)
```

---

### 4. Substituído: Database Upsert → HTTP POST

**ANTES (linhas 162-189):**
```typescript
const gobbiClient = createClient(gobbiUrl, gobbiKey)

const { data: upsertData, error: upsertError } = await gobbiClient
  .from('benchmark_videos')
  .upsert(batch, {
    onConflict: 'youtube_video_id',
    ignoreDuplicates: false,
  })

if (upsertError) {
  console.error('[send-to-gobbi] Upsert error:', upsertError)
  // ...
}
```

**DEPOIS (linhas 189-251):**
```typescript
// Prepare webhook payload
const webhookPayload = {
  videos: batch,
  metadata: {
    sent_at: new Date().toISOString(),
    source: 'automedia-platform',
    video_count: batch.length,
  },
}

// Send HTTP POST to webhook
const webhookResponse = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(webhook.api_key && { 'X-Webhook-Key': webhook.api_key }),  // ← Adiciona header customizado se api_key existir
  },
  body: JSON.stringify(webhookPayload),
})

if (!webhookResponse.ok) {
  const errorText = await webhookResponse.text()
  console.error('[send-to-gobbi] Webhook error:', errorText)
  // Handle error...
} else {
  const webhookResult = await webhookResponse.json()
  console.log(`[send-to-gobbi] Webhook response:`, webhookResult)

  // Track success/failure based on webhook response
  if (webhookResult.success) {
    totalSent += webhookResult.inserted + webhookResult.updated
    if (webhookResult.failed > 0) {
      totalFailed += webhookResult.failed
      // Add webhook-reported errors...
    }
  }
}
```

---

## 📊 FORMATO DO PAYLOAD

### Payload Enviado (send-to-gobbi → webhook)

```json
{
  "videos": [
    {
      "youtube_video_id": "abc123",
      "channel_id": "UC...",
      "title": "Video Title",
      "description": "Video Description",
      "views": 10000,
      "likes": 500,
      "comments": 100,
      "upload_date": "2025-11-01T00:00:00Z",
      "video_length": "10:30",
      "thumbnail_url": "https://...",
      "tags": {...},
      "categorization": {...},
      "keywords": ["keyword1", "keyword2"],
      "related_video_ids": ["xyz789"],
      "enrichment_data": {...},
      "performance_vs_avg_historical": 1.5,
      "performance_vs_median_historical": 1.3,
      "performance_vs_recent_14d": 1.2,
      "performance_vs_recent_30d": 1.1,
      "performance_vs_recent_90d": 1.0,
      "is_outlier": false,
      "outlier_threshold": 2.0,
      "youtube_url": "https://www.youtube.com/watch?v=abc123",
      "channel_name": "Channel Name",
      "metrics_last_updated": "2025-11-14T22:00:00Z",
      "video_age_days": 14,
      "views_per_day": 714.29,
      "momentum_vs_14d": 1.1,
      "status": "pending_distribution",  // ⚠️ UPDATED: Videos now go directly to distribution queue
      "last_enriched_at": "2025-11-14T22:00:00Z",
      "video_transcript": "Full transcript here..." // Opcional
    }
    // ... mais vídeos
  ],
  "metadata": {
    "sent_at": "2025-11-14T22:00:00Z",
    "source": "automedia-platform",
    "video_count": 10
  }
}
```

### Resposta do Webhook (receive-benchmark-videos → send-to-gobbi)

**Sucesso Total:**
```json
{
  "success": true,
  "inserted": 5,
  "updated": 5,
  "failed": 0,
  "message": "Successfully processed 10 videos (5 new, 5 updated)",
  "duration_ms": 1234
}
```

**Sucesso Parcial:**
```json
{
  "success": false,
  "inserted": 5,
  "updated": 3,
  "failed": 2,
  "message": "Partially processed: 5 new, 3 updated, 2 failed",
  "duration_ms": 1234,
  "errors": [
    {
      "youtube_video_id": "abc123",
      "error": "Missing required fields: channel_id"
    },
    {
      "youtube_video_id": "xyz789",
      "error": "Database constraint violation"
    }
  ]
}
```

**Falha Total:**
```json
{
  "success": false,
  "inserted": 0,
  "updated": 0,
  "failed": 10,
  "message": "All 10 videos failed to process",
  "duration_ms": 500,
  "errors": [...]
}
```

---

## 🔧 CONFIGURAÇÃO NECESSÁRIA

### 1. Tabela `production_webhooks`

Certifique-se de que o webhook está cadastrado:

```sql
SELECT * FROM production_webhooks
WHERE name = 'receive-benchmark-videos'
AND is_active = true;
```

**Resultado esperado:**
| id | name | webhook_url | api_key | is_active |
|----|------|-------------|---------|-----------|
| 1 | receive-benchmark-videos | https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos | your-secret-key | true |

**⚠️ IMPORTANTE: Configurar API Key**

Se o webhook do Gobbi exigir autenticação (como é o caso), você PRECISA adicionar a `api_key`:

```sql
-- Atualizar webhook com API key
UPDATE production_webhooks
SET api_key = 'YOUR_GOBBI_WEBHOOK_API_KEY'
WHERE name = 'receive-benchmark-videos';
```

**Como configurar autenticação:**

**Passo 1: Gerar uma API key segura**
```bash
# Usar uuidgen (macOS/Linux) ou gerar online
uuidgen
# Resultado exemplo: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Passo 2: Configurar no Supabase do Gobbi**
```bash
cd [GOBBI_PROJECT]
npx supabase secrets set WEBHOOK_API_KEY=a1b2c3d4-e5f6-7890-abcd-ef1234567890 --project-ref eafkhsmgrzywrhviisdl
```

**Passo 3: Adicionar a MESMA key no seu banco**
```sql
UPDATE production_webhooks
SET api_key = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'  -- A MESMA do Passo 2
WHERE name = 'receive-benchmark-videos';
```

**Notas de Segurança:**
- A API key deve ter pelo menos 16 caracteres
- Use `X-Webhook-Key` header (não `Authorization`) para evitar conflito com JWT do Supabase
- Nunca commite a API key no código - ela fica apenas no banco de dados
- A migration `20251114_add_api_key_to_webhooks.sql` adiciona a coluna `api_key`

### 2. Deploy da Migration (adicionar coluna api_key)

```bash
cd /Users/daviluis/Documents/automedia-platform/automedia
npx supabase db push
```

### 3. Deploy da Edge Function `send-to-gobbi`

```bash
cd /Users/daviluis/Documents/automedia-platform/automedia
npx supabase functions deploy send-to-gobbi --project-ref YOUR_PROJECT_REF
```

### 4. Deploy da Edge Function `receive-benchmark-videos` (no Gobbi)

```bash
# Copiar arquivo
cp docs/gobbi-database/receive-benchmark-videos-function.ts \
   [GOBBI_PROJECT]/supabase/functions/receive-benchmark-videos/index.ts

# Deploy
cd [GOBBI_PROJECT]
npx supabase functions deploy receive-benchmark-videos --project-ref eafkhsmgrzywrhviisdl
```

---

## 🧪 TESTANDO A INTEGRAÇÃO

### 1. Teste Manual via CURL

```bash
curl -X POST 'https://[YOUR-PROJECT].supabase.co/functions/v1/send-to-gobbi' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_ids": [123, 456],
    "options": {
      "include_transcript": true,
      "batch_size": 10
    }
  }'
```

### 2. Verificar Logs

**Sua plataforma:**
```bash
npx supabase functions logs send-to-gobbi --project-ref YOUR_PROJECT_REF
```

**Gobbi:**
```bash
npx supabase functions logs receive-benchmark-videos --project-ref eafkhsmgrzywrhviisdl
```

### 3. Verificar Banco do Gobbi

```sql
-- Verificar vídeos recebidos nos últimos 5 minutos
SELECT
  youtube_video_id,
  title,
  status,
  last_enriched_at,
  created_at,
  updated_at
FROM benchmark_videos
WHERE updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC;
```

---

## ✅ VANTAGENS DA NOVA ARQUITETURA

1. ✅ **Segurança:** Não expõe service role key do Gobbi
2. ✅ **Desacoplamento:** Cada sistema gerencia seu próprio banco
3. ✅ **Escalabilidade:** Webhook pode ser facilmente substituído ou replicado
4. ✅ **Flexibilidade:** Webhook URL vem do banco, fácil de mudar
5. ✅ **Auditoria:** Logs em ambos os lados (sender + receiver)
6. ✅ **Resiliência:** Erros são tratados e reportados adequadamente
7. ✅ **Transparência:** Payload e response são JSON fáceis de debugar

---

## 🎯 RESUMO EXECUTIVO

### Antes
- ❌ Acesso direto ao banco do Gobbi via Supabase client
- ❌ Exigia secrets do Gobbi (GOBBI_SUPABASE_URL, GOBBI_SERVICE_ROLE_KEY)
- ❌ Violação de arquitetura de microserviços
- ❌ Dificuldade em debugar (conexão direta)

### Depois
- ✅ HTTP POST para webhook (arquitetura RESTful)
- ✅ Zero secrets do Gobbi necessários
- ✅ Arquitetura correta: webhook-based communication
- ✅ Fácil de debugar (payloads JSON visíveis nos logs)

---

## 🔄 MUDANÇA DE ARQUITETURA DA FILA (2025-11-19)

**Status Antigo:** Vídeos eram enviados com `status: 'add_to_production'`
**Status Novo:** Vídeos são enviados com `status: 'pending_distribution'`

### Por que mudamos?

#### ❌ Arquitetura Antiga (CRON-controlled)
```
Video → add_to_production → [CRON a cada 2min] → pending_distribution → Distribution UI
```

**Problemas:**
- Delay de até 2 minutos para vídeo aparecer na tela
- CRON desnecessário apenas para mudar status
- Complexidade adicional sem benefício

#### ✅ Arquitetura Nova (Direct-to-distribution)
```
Video → pending_distribution → Distribution UI → [catraca ao distribuir] → production_videos
```

**Vantagens:**
- Vídeos aparecem instantaneamente na tela de distribuição
- Simplicidade: menos componentes = menos bugs
- Controle de fila ("catraca") acontece no momento certo: ao distribuir para production_videos

### Implicações

1. **send-to-gobbi Edge Function**: Agora força `status: 'pending_distribution'` (linha 214)
2. **production-queue-control Edge Function**: Não é mais necessária no novo fluxo (ver seu README para detalhes)
3. **Tela de Distribuição**: Funciona exatamente igual, vídeos aparecem mais rápido

---

**Última atualização:** 2025-11-19 (arquitetura de fila), 2025-11-14 (webhook HTTP)
**Autor:** Claude Code + Davi Luis
**Status:** ✅ Implementado e testado

