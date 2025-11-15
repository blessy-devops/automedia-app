# Webhook Integration: AutoMedia ↔ Gobbi Database

**Data:** 2025-11-14
**Propósito:** Documentação completa para enviar vídeos do banco AutoMedia para o banco do Gobbi via webhook

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Compatibilidade de Schemas](#compatibilidade-de-schemas)
4. [Setup Inicial](#setup-inicial)
5. [Deployment](#deployment)
6. [Como Usar](#como-usar)
7. [Exemplos de Código](#exemplos-de-código)
8. [Troubleshooting](#troubleshooting)
9. [API Reference](#api-reference)

---

## Visão Geral

Esta integração permite que você envie vídeos da tabela `benchmark_videos` do seu banco AutoMedia para o banco do Gobbi de forma automatizada via webhook.

### Características

- ✅ **Bi-direcional**: Schemas compatíveis em ambos os bancos
- ✅ **Upsert Automático**: Atualiza ou insere baseado em `youtube_video_id`
- ✅ **Batch Processing**: Envia vídeos em lotes configuráveis
- ✅ **Error Handling**: Retry automático e logging detalhado
- ✅ **Type-safe**: TypeScript com tipos completos
- ✅ **Monitoring**: Logs detalhados e métricas de performance

### Fluxo de Dados

```
SEU BANCO                          BANCO DO GOBBI
┌─────────────────┐               ┌─────────────────┐
│ benchmark_videos│               │ benchmark_videos│
│ (27 campos)     │               │ (20 campos)     │
└────────┬────────┘               └────────┬────────┘
         │                                 │
         │ 1. Busca por IDs               │
         ↓                                 │
┌─────────────────┐                       │
│ Edge Function   │                       │
│ send-to-gobbi   │                       │
└────────┬────────┘                       │
         │                                 │
         │ 2. POST /receive-benchmark-videos
         │    (payload JSON)               │
         │                                 │
         └────────────────────────────────→│
                                           ↓
                                  ┌─────────────────┐
                                  │ Edge Function   │
                                  │ receive-videos  │
                                  └────────┬────────┘
                                           │
                                           │ 3. Upsert
                                           ↓
                                  ┌─────────────────┐
                                  │ benchmark_videos│
                                  │ (updated)       │
                                  └─────────────────┘
```

---

## Arquitetura

### Componentes

1. **Migration SQL** (`20251114_add_gobbi_compatible_fields.sql`)
   - Adiciona 8 campos faltantes no seu banco
   - Cria triggers para auto-cálculo (video_age_days, views_per_day, etc.)
   - Backfill de dados existentes

2. **Edge Function: send-to-gobbi** (seu Supabase)
   - Busca vídeos por IDs
   - Envia via HTTP POST
   - Retorna status e erros

3. **Edge Function: receive-benchmark-videos** (Supabase do Gobbi)
   - Recebe webhook POST
   - Valida payload
   - Faz upsert na tabela
   - Retorna resultado

---

## Compatibilidade de Schemas

### Campos Enviados (19 campos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `youtube_video_id` | text | ID único do YouTube (PK) |
| `channel_id` | text | ID do canal |
| `title` | text | Título do vídeo |
| `description` | text | Descrição |
| `thumbnail_url` | text | URL da thumbnail |
| `upload_date` | timestamp | Data de upload |
| `video_length` | text | Duração (HH:MM:SS) |
| `views` | integer | Visualizações |
| `likes` | integer | Curtidas |
| `comments` | integer | Comentários |
| `tags` | jsonb | Tags do vídeo |
| `categorization` | jsonb | Niche/subniche/microniche |
| `keywords` | text[] | Keywords extraídas |
| `related_video_ids` | text[] | IDs de vídeos relacionados |
| `enrichment_data` | jsonb | Dados de enriquecimento |
| `performance_vs_avg_historical` | numeric | Performance vs média histórica |
| `performance_vs_median_historical` | numeric | Performance vs mediana histórica |
| `performance_vs_recent_14d` | numeric | Performance vs 14 dias |
| `performance_vs_recent_30d` | numeric | Performance vs 30 dias |
| `performance_vs_recent_90d` | numeric | Performance vs 90 dias |
| `is_outlier` | boolean | É outlier? |
| `outlier_threshold` | numeric | Threshold usado |
| `youtube_url` | text | URL completo (auto-gerado) |
| `channel_name` | text | Nome do canal |
| `video_transcript` | text | Transcrição completa |
| `video_age_days` | integer | Idade em dias (auto-calculado) |
| `views_per_day` | numeric | Views/dia (auto-calculado) |
| `momentum_vs_14d` | numeric | Momentum vs 14d |
| `status` | text | Status do vídeo |

### Campos Auto-Calculados

Os seguintes campos são automaticamente calculados via triggers:

- **`youtube_url`**: Gerado de `youtube_video_id` se não fornecido
- **`video_age_days`**: Calculado de `upload_date`
- **`views_per_day`**: `views / video_age_days`
- **`metrics_last_updated`**: Atualizado quando views/likes/comments mudam

---

## Setup Inicial

### 1. Adicionar Campos no Seu Banco

Execute a migration para adicionar os campos compatíveis:

```bash
cd automedia
npx supabase migration up
```

Ou execute manualmente o SQL em:
```
supabase/migrations/20251114_add_gobbi_compatible_fields.sql
```

### 2. Configurar Secrets no Seu Supabase

Adicione as credenciais do Gobbi como secrets:

```bash
# URL do Supabase do Gobbi
npx supabase secrets set GOBBI_SUPABASE_URL=https://eafkhsmgrzywrhviisdl.supabase.co

# Service Role Key do Gobbi
npx supabase secrets set GOBBI_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZmtoc21ncnp5d3Jodmlpc2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1MjIzMywiZXhwIjoyMDYzNTI4MjMzfQ.Tiaai7QQLOhuRnd-l2mg1RVC_NXM7XVgOKNxjQQY98E
```

### 3. (Opcional) Adicionar Unique Constraint no Gobbi

Se o banco do Gobbi não tiver unique constraint em `youtube_video_id`, adicione:

```sql
-- Rode no SQL Editor do Gobbi
ALTER TABLE benchmark_videos
ADD CONSTRAINT unique_youtube_video_id UNIQUE (youtube_video_id);
```

**⚠️ Importante:** Esse constraint é necessário para o upsert funcionar corretamente!

---

## Deployment

### 1. Deploy da Edge Function de Envio (Seu Supabase)

```bash
cd automedia
npx supabase functions deploy send-to-gobbi
```

**Verificar deploy:**
```bash
npx supabase functions list
```

### 2. Deploy da Edge Function de Recebimento (Gobbi's Supabase)

**Passo 1:** Criar estrutura de pastas no projeto do Gobbi

```bash
mkdir -p supabase/functions/receive-benchmark-videos
```

**Passo 2:** Copiar o código

Copie o conteúdo de:
```
docs/gobbi-database/receive-benchmark-videos-function.ts
```

Para:
```
supabase/functions/receive-benchmark-videos/index.ts
```

**Passo 3:** Deploy (no Supabase do Gobbi)

```bash
npx supabase functions deploy receive-benchmark-videos --project-ref eafkhsmgrzywrhviisdl
```

**Passo 4:** (Opcional) Configurar autenticação

```bash
npx supabase secrets set WEBHOOK_API_KEY=seu-secret-key --project-ref eafkhsmgrzywrhviisdl
```

---

## Como Usar

### Exemplo 1: Enviar 1 Vídeo

```typescript
const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
  body: {
    video_ids: [123]  // ID do vídeo no SEU banco
  }
})

console.log(data)
// {
//   success: true,
//   videos_sent: 1,
//   videos_failed: 0,
//   message: "Successfully sent 1 videos to Gobbi's database",
//   duration_ms: 432
// }
```

### Exemplo 2: Enviar Múltiplos Vídeos

```typescript
const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
  body: {
    video_ids: [123, 456, 789, 1011]
  }
})
```

### Exemplo 3: Enviar com Opções

```typescript
const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
  body: {
    video_ids: [123, 456, 789],
    options: {
      include_transcript: false,  // Não enviar transcrição (campo grande)
      batch_size: 10               // Enviar em lotes de 10
    }
  }
})
```

### Exemplo 4: Enviar Todos os Outliers

```typescript
// 1. Buscar IDs de todos os outliers
const { data: outliers } = await supabase
  .from('benchmark_videos')
  .select('id')
  .eq('is_outlier', true)

const videoIds = outliers.map(v => v.id)

// 2. Enviar para o Gobbi
const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
  body: {
    video_ids: videoIds,
    options: {
      batch_size: 50  // Enviar em lotes de 50
    }
  }
})

console.log(`Enviados: ${data.videos_sent}/${videoIds.length}`)
```

---

## Exemplos de Código

### Server Action (Next.js)

```typescript
// app/actions/send-videos-to-gobbi.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendVideosToGobbi(videoIds: number[]) {
  const supabase = await createClient()

  const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
    body: { video_ids: videoIds }
  })

  if (error) {
    console.error('Error sending videos:', error)
    return { success: false, error: error.message }
  }

  return {
    success: data.success,
    sent: data.videos_sent,
    failed: data.videos_failed,
    message: data.message
  }
}
```

### Client Component (Next.js)

```typescript
'use client'

import { useState } from 'react'
import { sendVideosToGobbi } from '@/app/actions/send-videos-to-gobbi'

export function SendToGobbiButton({ videoIds }: { videoIds: number[] }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSend = async () => {
    setLoading(true)
    const res = await sendVideosToGobbi(videoIds)
    setResult(res)
    setLoading(false)
  }

  return (
    <div>
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Enviando...' : `Enviar ${videoIds.length} vídeos para Gobbi`}
      </button>

      {result && (
        <div>
          {result.success ? '✅' : '❌'} {result.message}
          {result.sent > 0 && <p>Enviados: {result.sent}</p>}
          {result.failed > 0 && <p>Falhas: {result.failed}</p>}
        </div>
      )}
    </div>
  )
}
```

### Edge Function (Deno)

```typescript
// supabase/functions/sync-outliers/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Buscar outliers
  const { data: outliers } = await supabase
    .from('benchmark_videos')
    .select('id')
    .eq('is_outlier', true)
    .limit(100)

  if (!outliers || outliers.length === 0) {
    return new Response(JSON.stringify({ message: 'No outliers found' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Enviar para Gobbi
  const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
    body: {
      video_ids: outliers.map(v => v.id),
      options: { batch_size: 25 }
    }
  })

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## Troubleshooting

### Erro: "Missing required environment variables"

**Causa:** Secrets não configurados

**Solução:**
```bash
npx supabase secrets set GOBBI_SUPABASE_URL=https://eafkhsmgrzywrhviisdl.supabase.co
npx supabase secrets set GOBBI_SERVICE_ROLE_KEY=eyJhbGci...
```

### Erro: "No videos found for the provided IDs"

**Causa:** IDs não existem no seu banco

**Solução:** Verificar se os IDs estão corretos:
```sql
SELECT id FROM benchmark_videos WHERE id IN (123, 456, 789);
```

### Erro: "duplicate key value violates unique constraint"

**Causa:** Tentando inserir `youtube_video_id` duplicado

**Solução:** Banco do Gobbi deve ter unique constraint. Se não tiver, adicione:
```sql
ALTER TABLE benchmark_videos
ADD CONSTRAINT unique_youtube_video_id UNIQUE (youtube_video_id);
```

### Erro: "All videos failed to send"

**Causa:** Problema de permissões ou schema incompatível

**Solução:**
1. Verificar se Service Role Key está correta
2. Verificar logs da Edge Function:
   ```bash
   npx supabase functions logs send-to-gobbi
   ```
3. Verificar se migration foi aplicada:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'benchmark_videos'
   ORDER BY ordinal_position;
   ```

### Performance: Envio muito lento

**Causa:** Muitos vídeos sendo enviados de uma vez

**Solução:** Usar `batch_size`:
```typescript
{
  video_ids: [...1000 IDs...],
  options: {
    batch_size: 50  // Enviar em lotes de 50
  }
}
```

---

## API Reference

### POST /functions/v1/send-to-gobbi

**Descrição:** Envia vídeos do seu banco para o banco do Gobbi

**Endpoint:**
```
https://[YOUR-PROJECT].supabase.co/functions/v1/send-to-gobbi
```

**Headers:**
```
Authorization: Bearer [SUPABASE_ANON_KEY]
Content-Type: application/json
```

**Body:**
```typescript
{
  video_ids: number[]          // Required: Array of video IDs (from your DB)
  options?: {
    include_transcript?: boolean  // Optional: Include video_transcript (default: true)
    batch_size?: number           // Optional: Send in batches (default: all at once)
  }
}
```

**Response (Success):**
```typescript
{
  success: true,
  videos_sent: 10,
  videos_failed: 0,
  message: "Successfully sent 10 videos to Gobbi's database",
  duration_ms: 1234
}
```

**Response (Partial Failure):**
```typescript
{
  success: false,
  videos_sent: 7,
  videos_failed: 3,
  message: "Partially successful: 7 sent, 3 failed",
  duration_ms: 1234,
  errors: [
    {
      video_id: 123,
      youtube_video_id: "abc123",
      error: "duplicate key value"
    }
  ]
}
```

**Status Codes:**
- `200`: All videos sent successfully
- `207`: Partial success (some videos failed)
- `400`: Invalid request (missing video_ids, etc.)
- `404`: No videos found for provided IDs
- `500`: Internal server error

---

### POST /functions/v1/receive-benchmark-videos

**Descrição:** Recebe vídeos via webhook (no banco do Gobbi)

**Endpoint:**
```
https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos
```

**Headers:**
```
Authorization: Bearer [WEBHOOK_API_KEY]  // Optional if configured
Content-Type: application/json
```

**Body:**
```typescript
{
  videos: Array<{
    youtube_video_id: string   // Required
    channel_id: string         // Required
    title?: string
    description?: string
    // ... outros campos
  }>,
  metadata?: {
    sent_at: string
    source: string
    video_count: number
  }
}
```

**Response:**
```typescript
{
  success: true,
  inserted: 5,
  updated: 3,
  failed: 0,
  message: "Successfully processed 8 videos (5 new, 3 updated)",
  duration_ms: 876
}
```

---

## Monitoramento

### Ver Logs da Edge Function

```bash
# Logs do send-to-gobbi (seu Supabase)
npx supabase functions logs send-to-gobbi --tail

# Logs do receive-benchmark-videos (Supabase do Gobbi)
npx supabase functions logs receive-benchmark-videos --tail --project-ref eafkhsmgrzywrhviisdl
```

### Verificar Vídeos Enviados

```sql
-- No banco do Gobbi
SELECT
  youtube_video_id,
  title,
  views,
  last_enriched_at,
  metrics_last_updated
FROM benchmark_videos
WHERE last_enriched_at > NOW() - INTERVAL '1 day'
ORDER BY last_enriched_at DESC
LIMIT 100;
```

### Estatísticas de Sync

```sql
-- Contar vídeos sincronizados
SELECT
  COUNT(*) as total_synced,
  MAX(last_enriched_at) as last_sync,
  AVG(views) as avg_views
FROM benchmark_videos
WHERE last_enriched_at IS NOT NULL;
```

---

## Próximos Passos

### Automação

Criar cron job para sync automático:

```typescript
// supabase/functions/auto-sync-outliers/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Rodar via cron diariamente
  // Ver docs: https://supabase.com/docs/guides/functions/schedule-functions
})
```

Configurar no `supabase/functions/auto-sync-outliers/index.ts`:
```typescript
// cron: "0 2 * * *"  // Rodar todo dia às 2am
```

### Webhooks Bidirecionais

Implementar sync reverso (Gobbi → AutoMedia):
- Criar `receive-from-gobbi` no seu Supabase
- Criar `send-to-automedia` no Supabase do Gobbi

---

## Segurança

### Boas Práticas

1. ✅ **Nunca commitar secrets**: Use `.env.local` e `.gitignore`
2. ✅ **Rotacionar API Keys**: Trocar Service Role Key periodicamente
3. ✅ **Rate Limiting**: Configurar rate limits nas Edge Functions
4. ✅ **Validação**: Sempre validar payload antes de processar
5. ✅ **Logging**: Logar todas as operações para auditoria

### Exemplo de Rate Limiting

```typescript
// Adicionar ao início da Edge Function
const RATE_LIMIT = 100 // requests por minuto
const rateLimiter = new Map()

const clientIp = req.headers.get('x-forwarded-for')
const requests = rateLimiter.get(clientIp) || 0

if (requests > RATE_LIMIT) {
  return new Response('Rate limit exceeded', { status: 429 })
}

rateLimiter.set(clientIp, requests + 1)
```

---

## Changelog

### v1.0.0 (2025-11-14)
- ✨ Implementação inicial
- ✨ Migration para adicionar campos compatíveis
- ✨ Edge Functions de envio e recebimento
- ✨ Documentação completa
- ✨ Triggers para auto-cálculo de campos

---

**Documentação criada por:** Claude Code
**Última atualização:** 2025-11-14
**Contato:** AutoMedia Platform Team
