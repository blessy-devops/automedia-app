# Guia de Deployment: Sistema de Sincronização para Produção

Este guia contém todos os passos necessários para configurar e usar o sistema de envio de vídeos para produção.

## Índice

1. [Setup no Banco de Origem (Automedia)](#setup-no-banco-de-origem-automedia)
2. [Setup no Banco de Destino (Produção)](#setup-no-banco-de-destino-produção)
3. [Configuração do Webhook](#configuração-do-webhook)
4. [Testes](#testes)
5. [Monitoramento](#monitoramento)
6. [Troubleshooting](#troubleshooting)

---

## Setup no Banco de Origem (Automedia)

### Passo 1: Aplicar Migration

Execute a migration para criar as tabelas necessárias:

```bash
# No diretório do projeto
cd automedia

# Se usando Supabase CLI
supabase db push

# OU aplicar manualmente via SQL Editor no Dashboard
```

Migration: `supabase/migrations/20251114_create_production_webhooks.sql`

Isso criará:
- Tabela `production_webhooks`
- Tabela `webhook_logs`
- Índices e triggers necessários

### Passo 2: Verificar Tabelas

Confirme que as tabelas foram criadas:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('production_webhooks', 'webhook_logs');
```

Resultado esperado:
```
 table_name
-----------------------
 production_webhooks
 webhook_logs
```

### Passo 3: Verificar Tipos TypeScript

Os tipos já foram adicionados em `types/supabase.ts`. Verifique se estão presentes:

```typescript
// types/supabase.ts
export interface Database {
  public: {
    Tables: {
      production_webhooks: { ... }
      webhook_logs: { ... }
      // ... outras tabelas
    }
  }
}
```

### Passo 4: Deploy do Frontend

Se estiver usando Next.js em produção:

```bash
# Build
npm run build

# Deploy (exemplo Vercel)
vercel --prod
```

---

## Setup no Banco de Destino (Produção)

### Passo 1: Criar Schema da Tabela

No banco de destino, crie a tabela `benchmark_videos` se ainda não existir:

```sql
CREATE TABLE IF NOT EXISTS benchmark_videos (
  id SERIAL PRIMARY KEY,
  youtube_video_id VARCHAR(20) UNIQUE NOT NULL,
  channel_id VARCHAR(30) NOT NULL,
  title TEXT,
  description TEXT,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  upload_date TIMESTAMPTZ,
  video_length VARCHAR(20),
  thumbnail_url TEXT,
  tags JSONB,
  categorization JSONB,

  -- Enrichment fields
  keywords TEXT[] DEFAULT '{}',
  related_video_ids TEXT[] DEFAULT '{}',
  enrichment_data JSONB DEFAULT '{}',
  last_enriched_at TIMESTAMPTZ,

  -- Performance metrics
  performance_vs_avg_historical NUMERIC,
  performance_vs_median_historical NUMERIC,
  performance_vs_recent_14d NUMERIC,
  performance_vs_recent_30d NUMERIC,
  performance_vs_recent_90d NUMERIC,
  is_outlier BOOLEAN DEFAULT false,
  outlier_threshold NUMERIC,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_benchmark_videos_youtube_video_id
  ON benchmark_videos(youtube_video_id);

CREATE INDEX IF NOT EXISTS idx_benchmark_videos_channel_id
  ON benchmark_videos(channel_id);

CREATE INDEX IF NOT EXISTS idx_benchmark_videos_keywords
  ON benchmark_videos USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_benchmark_videos_last_enriched
  ON benchmark_videos(last_enriched_at);
```

### Passo 2: Criar Edge Function

**2.1. Criar novo projeto Supabase ou usar existente**

Se for um novo projeto:
```bash
# Link ao projeto
supabase link --project-ref [SEU-PROJECT-ID]
```

**2.2. Criar a função**

```bash
supabase functions new receive-benchmark-videos
```

**2.3. Adicionar código da função**

Copie o código da documentação ([receive-benchmark-videos-webhook.md](../external-integration/receive-benchmark-videos-webhook.md)) para:

```
supabase/functions/receive-benchmark-videos/index.ts
```

**2.4. (Opcional) Adicionar autenticação**

Para maior segurança, adicione autenticação via API Key:

```bash
# Gerar uma chave secreta
openssl rand -hex 32

# Configurar como secret no Supabase
supabase secrets set WEBHOOK_API_KEY=sua-chave-secreta-gerada
```

E adicione a validação no código da função:

```typescript
const authHeader = req.headers.get('Authorization')
const expectedKey = Deno.env.get('WEBHOOK_API_KEY')

if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
  return new Response(
    JSON.stringify({ success: false, error: 'Unauthorized' }),
    { status: 401, headers: corsHeaders }
  )
}
```

### Passo 3: Deploy da Edge Function

```bash
supabase functions deploy receive-benchmark-videos
```

Saída esperada:
```
Deploying function receive-benchmark-videos (project ref: xxx-yyy-zzz)
✓ Function deployed successfully
Function URL: https://xxx-yyy-zzz.supabase.co/functions/v1/receive-benchmark-videos
```

**⚠️ IMPORTANTE**: Anote a URL da função - você precisará dela!

### Passo 4: Testar a Edge Function

Teste localmente antes de integrar:

```bash
curl -X POST https://[SEU-PROJECT-ID].supabase.co/functions/v1/receive-benchmark-videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SUA-API-KEY]" \
  -d '{
    "videos": [{
      "youtube_video_id": "test_video_123",
      "channel_id": "test_channel_456",
      "title": "Test Video",
      "views": 1000,
      "likes": 100,
      "comments": 10
    }],
    "metadata": {
      "sent_at": "2024-11-14T15:00:00Z",
      "source": "automedia-platform",
      "video_count": 1
    }
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "inserted": 1,
  "updated": 0,
  "failed": 0,
  "message": "Videos processed successfully"
}
```

Verifique no banco:
```sql
SELECT * FROM benchmark_videos WHERE youtube_video_id = 'test_video_123';
```

---

## Configuração do Webhook

### Passo 1: Acessar Configurações

1. Acesse a plataforma Automedia
2. Vá para **Configurações** → **Webhooks**
3. URL: `/settings/webhooks`

### Passo 2: Criar Novo Webhook

Clique em **"Novo Webhook"** e preencha:

**Campos:**
- **Nome**: `Produção Principal` (ou nome descritivo)
- **URL do Webhook**: `https://[SEU-PROJECT-ID].supabase.co/functions/v1/receive-benchmark-videos`
- **Descrição**: `Banco de dados de produção principal` (opcional)
- **Ativo**: ✅ (marcado)

Clique em **"Criar Webhook"**

### Passo 3: (Opcional) Configurar Múltiplos Webhooks

Se tiver múltiplos ambientes (staging, QA, etc), repita o Passo 2 para cada um:

```
Webhook 1: Produção Principal
  URL: https://prod.supabase.co/functions/v1/receive-benchmark-videos

Webhook 2: Staging
  URL: https://staging.supabase.co/functions/v1/receive-benchmark-videos

Webhook 3: QA
  URL: https://qa.supabase.co/functions/v1/receive-benchmark-videos
```

---

## Testes

### Teste End-to-End Completo

#### 1. Selecionar Vídeos

1. Acesse **Videos** (`/videos`)
2. Selecione 1-3 vídeos usando as checkboxes
3. Verifique que o botão verde **"Enviar para Produção"** aparece

#### 2. Enviar para Webhook

1. Clique em **"Enviar para Produção"**
2. No dialog, selecione o webhook de destino
3. Verifique que a URL está correta
4. Clique em **"Enviar para Produção"**

#### 3. Verificar Sucesso

Você deve ver:
- ✅ Toast de sucesso: "3 vídeos enviados com sucesso!"
- Os vídeos selecionados são desmarcados

#### 4. Verificar no Banco de Destino

```sql
-- Verificar os vídeos recebidos
SELECT
  youtube_video_id,
  title,
  views,
  last_enriched_at,
  created_at
FROM benchmark_videos
ORDER BY created_at DESC
LIMIT 10;
```

#### 5. Verificar Logs

No banco de origem (Automedia):

```sql
SELECT
  wl.id,
  wl.video_count,
  wl.status,
  wl.response_code,
  wl.sent_at,
  pw.name as webhook_name
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
ORDER BY wl.sent_at DESC
LIMIT 10;
```

Verifique:
- `status` = 'success'
- `response_code` = 200
- `video_count` = número de vídeos enviados

---

## Monitoramento

### Logs da Edge Function

Visualize logs em tempo real:

```bash
supabase functions logs receive-benchmark-videos --follow
```

Filtre por erros:
```bash
supabase functions logs receive-benchmark-videos --filter "error"
```

### Dashboard de Webhooks (Futuro)

Crie uma view SQL para monitorar estatísticas:

```sql
CREATE VIEW webhook_statistics AS
SELECT
  pw.id,
  pw.name as webhook_name,
  COUNT(wl.id) as total_requests,
  COUNT(CASE WHEN wl.status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN wl.status = 'failed' THEN 1 END) as failed,
  SUM(wl.video_count) as total_videos_sent,
  MAX(wl.sent_at) as last_request,
  AVG(wl.video_count) as avg_videos_per_request
FROM production_webhooks pw
LEFT JOIN webhook_logs wl ON wl.webhook_id = pw.id
GROUP BY pw.id, pw.name;

-- Query
SELECT * FROM webhook_statistics;
```

### Alertas de Falhas

Configure alertas para falhas consecutivas:

```sql
-- Últimas 10 tentativas para cada webhook
SELECT
  pw.name,
  wl.status,
  wl.error_message,
  wl.sent_at
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
WHERE wl.status = 'failed'
ORDER BY wl.sent_at DESC
LIMIT 10;
```

---

## Troubleshooting

### Problema: Webhook não aparece na lista de seleção

**Diagnóstico:**
```sql
SELECT * FROM production_webhooks;
```

**Possíveis causas:**
1. Webhook está inativo → Ative em Configurações
2. Nenhum webhook criado → Crie um novo
3. Erro na query → Verifique logs do browser

**Solução:**
```sql
-- Ativar webhook
UPDATE production_webhooks
SET is_active = true
WHERE id = [ID_DO_WEBHOOK];
```

---

### Problema: Erro "Failed to send videos to production"

**Diagnóstico:**
```sql
SELECT * FROM webhook_logs
WHERE status = 'failed'
ORDER BY sent_at DESC
LIMIT 5;
```

**Possíveis causas:**

**1. URL incorreta**
```sql
SELECT name, webhook_url FROM production_webhooks WHERE is_active = true;
```
Verifique se a URL está correta e acessível.

**2. Edge Function não deployada**
```bash
supabase functions list
```
Se não aparecer, faça deploy novamente.

**3. Timeout/Erro de rede**
Teste manualmente com curl:
```bash
curl -X POST [WEBHOOK_URL] \
  -H "Content-Type: application/json" \
  -d '{"videos":[],"metadata":{"sent_at":"2024-11-14T00:00:00Z","source":"test","video_count":0}}'
```

**4. Erro na Edge Function**
```bash
supabase functions logs receive-benchmark-videos --filter "error" --limit 20
```

---

### Problema: Vídeos não aparecem no banco de destino

**Diagnóstico:**

**1. Verificar se a requisição chegou**
```bash
supabase functions logs receive-benchmark-videos --limit 10
```

**2. Verificar se houve erros de inserção**
```sql
-- No banco de destino
SELECT * FROM benchmark_videos
WHERE youtube_video_id IN ('id1', 'id2', 'id3');
```

**3. Verificar constraints e validações**
```sql
-- Verificar se há constraint violations
SELECT * FROM pg_stat_user_tables WHERE relname = 'benchmark_videos';
```

**Possíveis causas:**
1. Constraint UNIQUE violada (vídeo já existe)
2. Campo NOT NULL faltando
3. Tipo de dado incompatível
4. Erro de permissões

**Solução:**
- Use `UPSERT` em vez de `INSERT` na Edge Function
- Valide dados antes de enviar
- Verifique schema da tabela

---

### Problema: Timeout ao enviar muitos vídeos

**Sintoma:** Requisição demora muito ou falha com timeout

**Solução:**

**Opção 1: Enviar em lotes menores**
Selecione menos vídeos por vez (máx 50-100)

**Opção 2: Processar em background na Edge Function**
```typescript
// Processar em chunks
const CHUNK_SIZE = 50
for (let i = 0; i < videos.length; i += CHUNK_SIZE) {
  const chunk = videos.slice(i, i + CHUNK_SIZE)
  await processChunk(chunk)
}
```

**Opção 3: Implementar fila assíncrona**
- Enviar vídeos para uma fila
- Processar em background worker
- Notificar usuário quando concluir

---

### Problema: Erro de CORS

**Sintoma:** Erro de CORS no browser console

**Solução:**

Na Edge Function, certifique-se de incluir headers CORS:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Em todas as responses
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

---

## Checklist de Deployment

### Banco de Origem (Automedia)

- [ ] Migration aplicada (`production_webhooks`, `webhook_logs`)
- [ ] Tipos TypeScript atualizados
- [ ] Página `/settings/webhooks` acessível
- [ ] Botão "Enviar para Produção" visível em `/videos`
- [ ] Frontend deployado

### Banco de Destino (Produção)

- [ ] Tabela `benchmark_videos` criada com schema completo
- [ ] Índices criados
- [ ] Edge Function `receive-benchmark-videos` criada
- [ ] Edge Function deployada
- [ ] URL da função anotada
- [ ] (Opcional) API Key configurada
- [ ] Teste manual com curl passou

### Configuração

- [ ] Webhook criado em `/settings/webhooks`
- [ ] URL correta cadastrada
- [ ] Webhook marcado como ativo
- [ ] Teste end-to-end realizado
- [ ] Vídeos aparecem no banco de destino
- [ ] Logs registrados corretamente

### Monitoramento

- [ ] Logs da Edge Function acessíveis
- [ ] Query de estatísticas criada
- [ ] Alertas de falha configurados (opcional)

---

## Próximos Passos

Após completar este guia:

1. ✅ Sistema pronto para uso
2. 📊 Configure monitoramento contínuo
3. 🔒 Implemente autenticação se não fez
4. 📈 Crie dashboard de métricas (opcional)
5. 🔄 Configure retry automático (futuro)
6. 📧 Configure notificações de falhas (futuro)

---

## Suporte

Para questões ou problemas:

1. Verifique os logs em ambos os bancos
2. Consulte a documentação:
   - [Feature Documentation](../features/video-production-sync.md)
   - [Edge Function Spec](../external-integration/receive-benchmark-videos-webhook.md)
3. Abra uma issue no repositório
4. Entre em contato com o time de desenvolvimento
