# 🧪 Guia de Testes - Integração de Webhooks

**Última atualização:** 2025-11-15
**Versão:** 1.0.0

---

## 📋 Índice

1. [Overview](#overview)
2. [Manual Testing](#manual-testing)
3. [Automated Testing](#automated-testing)
4. [Test Scenarios](#test-scenarios)
5. [Validation Queries](#validation-queries)
6. [CI/CD Integration](#cicd-integration)
7. [Performance Testing](#performance-testing)

---

## 🎯 Overview

Este guia cobre **todos os tipos de testes** para a integração de webhooks entre Automedia Platform e Gobbi Database:

- ✅ **Manual Testing** - Testes via UI e scripts
- ✅ **Integration Testing** - End-to-end com test-webhook.mjs
- ✅ **Validation Testing** - SQL queries para verificar dados
- ✅ **Error Scenario Testing** - Testar casos de falha
- ✅ **Performance Testing** - Benchmarks e stress tests
- 🔄 **CI/CD Integration** - Automação futura

---

## 🖐️ Manual Testing

### 1.1 Teste via UI (Recomendado)

**Pré-requisitos:**

```bash
# Garantir que o dev server está rodando
cd /Users/daviluis/Documents/automedia-platform/automedia
npm run dev

# Abrir no browser
open http://localhost:3000/videos
```

**Passo-a-passo:**

**✅ Teste 1: Enviar 1 Vídeo**

1. Ir para http://localhost:3000/videos
2. Selecionar **1 vídeo** (checkbox)
3. Clicar em **"Enviar para Produção"** (botão verde)
4. **Modal abre** com dropdown de webhooks
5. Selecionar **"receive-benchmark-videos"**
6. Clicar em **"Enviar para Produção"** (botão no modal)
7. **Aguardar toast de sucesso**: "1 vídeo enviado com sucesso!"

**Resultado esperado:**
```
✅ Toast verde: "1 vídeo enviado com sucesso!"
✅ Modal fecha automaticamente
✅ Nenhum erro no console do browser
```

**✅ Teste 2: Enviar Múltiplos Vídeos**

1. Selecionar **10 vídeos**
2. Clicar em **"Enviar para Produção"**
3. Selecionar webhook
4. Clicar em **"Enviar para Produção"**
5. **Aguardar toast**: "10 vídeos enviados com sucesso!"

**Resultado esperado:**
```
✅ Toast verde: "10 vídeos enviados com sucesso!"
✅ Tempo de resposta: 2-5 segundos
✅ Nenhum erro
```

**✅ Teste 3: Erro - Nenhum Webhook Ativo**

1. **Desativar webhook:**
   ```sql
   UPDATE production_webhooks
   SET is_active = false
   WHERE name = 'receive-benchmark-videos';
   ```

2. Tentar enviar vídeos via UI
3. **Modal deve mostrar aviso**: "Nenhum Webhook Configurado"
4. Botão "Configurar Webhooks" aparece

5. **Reativar webhook:**
   ```sql
   UPDATE production_webhooks
   SET is_active = true
   WHERE name = 'receive-benchmark-videos';
   ```

**Resultado esperado:**
```
⚠️ Modal mostra aviso amarelo
⚠️ Botão "Enviar" desabilitado
⚠️ Link para /settings/webhooks
```

### 1.2 Teste via Script test-webhook.mjs

**Script de Teste Automatizado:**

```bash
cd /Users/daviluis/Documents/automedia-platform/automedia
node test-webhook.mjs
```

**O que o script faz:**

1. Busca os 2 primeiros vídeos do banco
2. Chama Edge Function `send-to-gobbi` via HTTP
3. Mostra response detalhado

**Resultado esperado:**

```
🔍 Buscando vídeos do banco local...
✅ Encontrados 2 vídeos

📤 Enviando para Edge Function...
✅ Edge Function succeeded!
Status: 200 OK

Response:
{
  "success": true,
  "channels_sent": 2,
  "channels_failed": 0,
  "videos_sent": 2,
  "videos_failed": 0,
  "message": "Successfully sent 2 channels and 2 videos to Gobbi's database",
  "duration_ms": 1543
}
```

**Se houver erro:**

```
❌ Edge Function failed!
Status: 500 Internal Server Error

Response:
{
  "success": false,
  "error": "Webhook \"receive-benchmark-videos\" not found or inactive in production_webhooks table",
  "channels_sent": 0,
  "videos_sent": 0
}
```

### 1.3 Teste Manual via CURL

**Testar Edge Function send-to-gobbi diretamente:**

```bash
# Buscar anon key do Supabase
ANON_KEY="your-anon-key-here"

# Testar send-to-gobbi
curl -X POST \
  https://xlpkabexmwsugkmbngwm.supabase.co/functions/v1/send-to-gobbi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "video_ids": [1, 2],
    "options": {
      "include_transcript": false,
      "batch_size": 50
    }
  }'
```

**Testar Edge Function receive-benchmark-videos diretamente (Gobbi):**

```bash
# Testar receive-benchmark-videos no Gobbi
curl -X POST \
  https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: your-api-key-here" \
  -d '{
    "channels": [
      {
        "channel_id": "UCtest123",
        "channel_name": "Test Channel",
        "subscriber_count": 1000
      }
    ],
    "videos": [
      {
        "youtube_video_id": "test_video_123",
        "channel_id": "UCtest123",
        "title": "Test Video",
        "views": 1000,
        "status": "add_to_production"
      }
    ],
    "metadata": {
      "sent_at": "2025-11-15T10:00:00Z",
      "source": "manual-test",
      "video_count": 1,
      "channel_count": 1
    }
  }'
```

---

## 🤖 Automated Testing

### 2.1 Script test-webhook.mjs (Detalhado)

**Código atual:**

```javascript
// test-webhook.mjs
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testWebhook() {
  console.log('🔍 Buscando vídeos do banco local...')

  // Fetch 2 videos
  const { data: videos, error: fetchError } = await supabase
    .from('benchmark_videos')
    .select('id')
    .limit(2)

  if (fetchError) {
    console.error('❌ Erro ao buscar vídeos:', fetchError)
    process.exit(1)
  }

  const videoIds = videos.map(v => v.id)
  console.log(`✅ Encontrados ${videoIds.length} vídeos`)

  // Call Edge Function
  console.log('\n📤 Enviando para Edge Function...')
  const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
    body: {
      video_ids: videoIds,
      options: {
        include_transcript: false,
        batch_size: 50,
      },
    },
  })

  if (error) {
    console.error('❌ Edge Function failed!')
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('✅ Edge Function succeeded!')
  console.log('Status: 200 OK')
  console.log('\nResponse:')
  console.log(JSON.stringify(data, null, 2))
}

testWebhook()
```

**Rodar:**

```bash
node test-webhook.mjs
```

### 2.2 Testes Adicionais a Implementar (Futuro)

**Teste de Edge Function send-to-gobbi:**

```typescript
// tests/edge-functions/send-to-gobbi.test.ts
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('send-to-gobbi Edge Function', () => {
  it('should send videos successfully', async () => {
    const supabase = createClient(URL, KEY)

    const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
      body: { video_ids: [1, 2] }
    })

    expect(error).toBeNull()
    expect(data.success).toBe(true)
    expect(data.videos_sent).toBeGreaterThan(0)
  })

  it('should handle empty video_ids', async () => {
    const supabase = createClient(URL, KEY)

    const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
      body: { video_ids: [] }
    })

    expect(error).not.toBeNull()
    expect(data.success).toBe(false)
  })
})
```

**Teste de Server Action:**

```typescript
// tests/actions/sendVideosToProduction.test.ts
import { describe, it, expect } from 'vitest'
import { sendVideosToProduction } from '@/app/(dashboard)/videos/actions'

describe('sendVideosToProduction', () => {
  it('should return success for valid video IDs', async () => {
    const result = await sendVideosToProduction([1, 2], 1)

    expect(result.success).toBe(true)
    expect(result.data?.sent).toBeGreaterThan(0)
  })

  it('should return error for empty array', async () => {
    const result = await sendVideosToProduction([], 1)

    expect(result.success).toBe(false)
    expect(result.error).toBe('No videos selected')
  })
})
```

---

## 🎬 Test Scenarios

### 3.1 Happy Path Scenarios

**✅ Scenario 1: First-Time Sync (Canais + Vídeos)**

```
Given: Banco do Gobbi vazio
When: Enviar 10 vídeos com 5 canais únicos
Then:
  - 5 canais inseridos (channels_inserted = 5)
  - 10 vídeos inseridos (videos_inserted = 10)
  - 0 falhas
  - Todos os campos populados corretamente
```

**Validação:**

```sql
-- No Gobbi
SELECT COUNT(*) FROM benchmark_channels;  -- Deve ser 5
SELECT COUNT(*) FROM benchmark_videos;    -- Deve ser 10

SELECT * FROM benchmark_channels ORDER BY created_at;
SELECT * FROM benchmark_videos ORDER BY created_at;
```

**✅ Scenario 2: Update Existing Videos**

```
Given: Vídeos já existem no Gobbi
When: Enviar mesmos vídeos com views atualizadas
Then:
  - 0 vídeos inseridos (videos_inserted = 0)
  - 10 vídeos atualizados (videos_updated = 10)
  - 0 falhas
  - Campo `views` atualizado
```

**Validação:**

```sql
-- Verificar que updated_at mudou
SELECT
  youtube_video_id,
  views,
  created_at,
  updated_at
FROM benchmark_videos
ORDER BY updated_at DESC
LIMIT 10;
```

**✅ Scenario 3: Mixed Insert + Update**

```
Given: 5 vídeos já existem, 5 são novos
When: Enviar 10 vídeos
Then:
  - 5 vídeos inseridos (videos_inserted = 5)
  - 5 vídeos atualizados (videos_updated = 5)
  - 0 falhas
```

**Validação:**

```sql
SELECT
  CASE
    WHEN created_at = updated_at THEN 'inserted'
    ELSE 'updated'
  END as operation_type,
  COUNT(*) as count
FROM benchmark_videos
WHERE updated_at >= NOW() - INTERVAL '5 minutes'
GROUP BY operation_type;
```

### 3.2 Error Scenarios

**❌ Scenario 4: Missing Required Field**

```
Given: Vídeo sem youtube_video_id
When: Enviar via webhook
Then:
  - 1 vídeo falhado (videos_failed = 1)
  - Error: "Missing required fields: youtube_video_id or channel_id"
```

**Teste:**

```bash
curl -X POST \
  https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos \
  -H "Content-Type: application/json" \
  -d '{
    "videos": [
      {
        "channel_id": "UCtest",
        "title": "Test without youtube_video_id"
      }
    ]
  }'
```

**Resultado esperado:**

```json
{
  "success": false,
  "channels_inserted": 0,
  "videos_inserted": 0,
  "videos_failed": 1,
  "errors": [
    {
      "type": "video",
      "id": "unknown",
      "error": "Missing required fields: youtube_video_id or channel_id"
    }
  ]
}
```

**❌ Scenario 5: Foreign Key Violation (Canal não existe)**

```
Given: Vídeo com channel_id que não existe
When: Enviar sem enviar o canal primeiro
Then:
  - FK error (se canais não forem enviados junto)
```

**Nota:** Isso NÃO deve acontecer porque `send-to-gobbi` sempre envia canais primeiro!

**Validação:**

```sql
-- Verificar se há vídeos órfãos
SELECT
  v.youtube_video_id,
  v.channel_id,
  v.title
FROM benchmark_videos v
LEFT JOIN benchmark_channels c ON v.channel_id = c.channel_id
WHERE c.channel_id IS NULL;

-- Deve retornar 0 rows
```

**❌ Scenario 6: Malformed Payload**

```bash
# Payload inválido (JSON malformado)
curl -X POST \
  https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos \
  -H "Content-Type: application/json" \
  -d '{ "videos": [ invalid json'
```

**Resultado esperado:**

```
HTTP 400 Bad Request
{
  "success": false,
  "error": "Invalid JSON payload"
}
```

**❌ Scenario 7: Webhook Não Existe**

```bash
# test-webhook.mjs com webhook desativado
UPDATE production_webhooks SET is_active = false;

node test-webhook.mjs
```

**Resultado esperado:**

```
❌ Edge Function failed!
Error: {
  message: "Webhook \"receive-benchmark-videos\" not found or inactive in production_webhooks table"
}
```

### 3.3 Edge Cases

**🔄 Scenario 8: Large Batch (100+ vídeos)**

```bash
# Modificar test-webhook.mjs para enviar 100 vídeos
const { data: videos } = await supabase
  .from('benchmark_videos')
  .select('id')
  .limit(100)  // ← Aumentar para 100

node test-webhook.mjs
```

**Resultado esperado:**

```
✅ Batching funciona (2 batches de 50)
✅ Tempo total: 5-10s
✅ Todos os 100 vídeos inseridos/atualizados
```

**Validação:**

```sql
SELECT COUNT(*) FROM benchmark_videos
WHERE updated_at >= NOW() - INTERVAL '1 minute';
-- Deve ser 100
```

**🔄 Scenario 9: Special Characters no Título**

```sql
-- Inserir vídeo com caracteres especiais
INSERT INTO benchmark_videos (
  youtube_video_id,
  channel_id,
  title
) VALUES (
  'test_special_chars',
  'UCtest',
  'Test 特殊文字 émojis 🎉 quotes "test" apostrophe''s'
);

-- Enviar via webhook
node test-webhook.mjs
```

**Validação no Gobbi:**

```sql
SELECT title FROM benchmark_videos
WHERE youtube_video_id = 'test_special_chars';

-- Deve preservar todos os caracteres especiais
```

---

## ✔️ Validation Queries

### 4.1 Post-Sync Validation (Gobbi)

**Após cada sync, rodar essas queries no banco do Gobbi:**

**✅ Query 1: Count Totals**

```sql
SELECT
  'channels' as table_name,
  COUNT(*) as total,
  MAX(created_at) as latest_entry
FROM benchmark_channels

UNION ALL

SELECT
  'videos' as table_name,
  COUNT(*) as total,
  MAX(created_at) as latest_entry
FROM benchmark_videos;
```

**✅ Query 2: Verify No Orphans**

```sql
-- Vídeos sem canal (FK violation)
SELECT COUNT(*) as orphaned_videos
FROM benchmark_videos v
LEFT JOIN benchmark_channels c ON v.channel_id = c.channel_id
WHERE c.channel_id IS NULL;

-- Deve retornar 0
```

**✅ Query 3: Data Quality Checks**

```sql
-- Vídeos sem título
SELECT COUNT(*) as videos_sem_titulo
FROM benchmark_videos
WHERE title IS NULL;

-- Vídeos sem views
SELECT COUNT(*) as videos_sem_views
FROM benchmark_videos
WHERE views IS NULL;

-- Canais sem nome
SELECT COUNT(*) as canais_sem_nome
FROM benchmark_channels
WHERE channel_name IS NULL;

-- Todos devem retornar 0 (idealmente)
```

**✅ Query 4: Recent Syncs**

```sql
-- Últimos 10 vídeos recebidos
SELECT
  youtube_video_id,
  channel_id,
  title,
  views,
  status,
  created_at,
  updated_at,
  CASE
    WHEN created_at = updated_at THEN 'inserted'
    ELSE 'updated'
  END as operation
FROM benchmark_videos
ORDER BY GREATEST(created_at, updated_at) DESC
LIMIT 10;
```

### 4.2 Pre-Sync Validation (Automedia)

**Antes de enviar, verificar dados na origem:**

```sql
-- Vídeos sem canal (vai dar erro no Gobbi)
SELECT
  v.id,
  v.youtube_video_id,
  v.channel_id,
  v.title
FROM benchmark_videos v
LEFT JOIN benchmark_channels c ON v.channel_id = c.channel_id
WHERE c.channel_id IS NULL
LIMIT 10;

-- Se retornar rows, CORRIGIR antes de enviar!
```

### 4.3 Comparison Validation

**Comparar dados entre Automedia e Gobbi:**

```sql
-- Automedia: Contar vídeos
SELECT COUNT(*) FROM benchmark_videos;

-- Gobbi: Contar vídeos
SELECT COUNT(*) FROM benchmark_videos;

-- Diferença indica vídeos não sincronizados
```

**Query avançada para encontrar diferenças:**

```sql
-- No Automedia
SELECT youtube_video_id, title, views
FROM benchmark_videos
WHERE youtube_video_id IN ('video_id_1', 'video_id_2', 'video_id_3');

-- No Gobbi (rodar mesma query)
SELECT youtube_video_id, title, views
FROM benchmark_videos
WHERE youtube_video_id IN ('video_id_1', 'video_id_2', 'video_id_3');

-- Comparar resultados manualmente
```

---

## 🚀 CI/CD Integration

### 5.1 GitHub Actions Workflow (Futuro)

**Arquivo:** `.github/workflows/test-webhooks.yml`

```yaml
name: Test Webhook Integration

on:
  push:
    branches: [main, develop]
    paths:
      - 'supabase/functions/send-to-gobbi/**'
      - 'app/(dashboard)/videos/actions.ts'
      - 'docs/gobbi-database/**'
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run webhook integration test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: node test-webhook.mjs

      - name: Validate response
        run: |
          # Add validation logic here
          echo "✅ Webhook test passed"
```

### 5.2 Pre-Deployment Checklist

**Antes de fazer deploy de changes em Edge Functions:**

- [ ] Rodar `node test-webhook.mjs` localmente
- [ ] Verificar logs do Supabase (send-to-gobbi)
- [ ] Verificar logs do Supabase (receive-benchmark-videos no Gobbi)
- [ ] Rodar validation queries no Gobbi
- [ ] Verificar que nenhum vídeo órfão foi criado
- [ ] Performance ainda está dentro do esperado (< 5s para 50 vídeos)

---

## ⚡ Performance Testing

### 6.1 Benchmark Tests

**Teste de Latência (Small Batch):**

```bash
# Testar latência com 10 vídeos
time node test-webhook.mjs

# Resultado esperado: 1-3 seconds
```

**Teste de Throughput (Large Batch):**

```javascript
// test-webhook-100.mjs
// Modificar para enviar 100 vídeos
const { data: videos } = await supabase
  .from('benchmark_videos')
  .select('id')
  .limit(100)

// Rodar
time node test-webhook-100.mjs

// Resultado esperado: 5-10 seconds
// Throughput: ~10-20 vídeos/segundo
```

**Teste de Concurrency:**

```bash
# Enviar múltiplos batches em paralelo (stress test)
for i in {1..5}; do
  node test-webhook.mjs &
done
wait

# Resultado esperado: Todos os 5 testes devem passar
```

### 6.2 Performance Benchmarks

| Batch Size | Expected Latency | Expected Throughput |
|------------|------------------|---------------------|
| 1 vídeo    | 500ms - 1s       | N/A                 |
| 10 vídeos  | 1-3s             | ~5 vídeos/s         |
| 50 vídeos  | 3-7s             | ~10 vídeos/s        |
| 100 vídeos | 7-15s            | ~10 vídeos/s        |

**Se performance degradar:**

1. Verificar logs para erros
2. Verificar database load (CPU, memory)
3. Considerar reduzir `batch_size` de 50 para 25
4. Verificar network latency (ping Supabase)

### 6.3 Load Testing (Stress Test)

**Simular carga alta:**

```bash
# Criar script de load test
# test-load.sh

#!/bin/bash
CONCURRENT_REQUESTS=10

for i in $(seq 1 $CONCURRENT_REQUESTS); do
  echo "Starting request $i..."
  node test-webhook.mjs > /tmp/test-$i.log 2>&1 &
done

wait

# Verificar resultados
grep -c "success.*true" /tmp/test-*.log

# Resultado esperado: 10/10 testes passaram
```

---

## 📚 Recursos Adicionais

### Links Úteis

- **Script de Teste:** `test-webhook.mjs` (raiz do projeto)
- **Edge Function send-to-gobbi:** `/supabase/functions/send-to-gobbi/index.ts`
- **Edge Function receive-benchmark-videos:** `/docs/gobbi-database/receive-benchmark-videos-function.ts`
- **Server Action:** `/app/(dashboard)/videos/actions.ts` (linha 694)
- **Monitoramento:** [MONITORING_AND_TROUBLESHOOTING.md](./MONITORING_AND_TROUBLESHOOTING.md)
- **Troubleshooting:** [MONITORING_AND_TROUBLESHOOTING.md#troubleshooting-guide](./MONITORING_AND_TROUBLESHOOTING.md#troubleshooting-guide)

### Checklist de Testes

**Antes de cada release:**

- [ ] ✅ Teste manual via UI (1 vídeo)
- [ ] ✅ Teste manual via UI (10 vídeos)
- [ ] ✅ Teste via script (node test-webhook.mjs)
- [ ] ✅ Validation queries no Gobbi
- [ ] ✅ Performance test (100 vídeos)
- [ ] ✅ Error scenario tests (webhook desativado, payload inválido)
- [ ] ✅ Verificar logs (sem erros críticos)
- [ ] ✅ Verificar métricas de performance (< 5s para 50 vídeos)

---

**Última revisão:** 2025-11-15
**Mantido por:** Claude Code + Davi Luis
