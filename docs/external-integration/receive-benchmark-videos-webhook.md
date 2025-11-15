# Edge Function: receive-benchmark-videos

## Visão Geral

Esta Edge Function deve ser implementada no **banco de dados de produção** (destino) para receber vídeos enviados pela plataforma Automedia.

A função é responsável por:
1. Receber e validar o payload de vídeos
2. Processar e inserir/atualizar vídeos na tabela `benchmark_videos`
3. Retornar confirmação de sucesso ou erros detalhados

## Localização

```
supabase/functions/receive-benchmark-videos/index.ts
```

## Especificações Técnicas

### Método HTTP

```
POST
```

### Headers Esperados

```
Content-Type: application/json
```

### Payload de Entrada

```typescript
interface WebhookPayload {
  videos: BenchmarkVideo[]
  metadata: {
    sent_at: string // ISO 8601 timestamp
    source: string // "automedia-platform"
    video_count: number
  }
}

interface BenchmarkVideo {
  id?: number // Opcional - ID da origem (não usado no destino)
  youtube_video_id: string
  channel_id: string
  title: string | null
  description: string | null
  views: number | null
  likes: number | null
  comments: number | null
  upload_date: string | null
  video_length: string | null
  thumbnail_url: string | null
  tags: any | null // JSON
  categorization: any | null // JSON
  keywords?: string[] // Array de keywords
  related_video_ids?: string[] // Array de video IDs relacionados
  enrichment_data?: any // JSON completo do enrichment
  performance_vs_avg_historical: number | null
  performance_vs_median_historical: number | null
  performance_vs_recent_14d: number | null
  performance_vs_recent_30d: number | null
  performance_vs_recent_90d: number | null
  is_outlier: boolean | null
  outlier_threshold: number | null
  last_enriched_at?: string | null
  created_at?: string
  updated_at?: string
}
```

### Resposta de Sucesso

**Status**: `200 OK`

```json
{
  "success": true,
  "inserted": 10,
  "updated": 0,
  "failed": 0,
  "message": "Videos processed successfully"
}
```

### Resposta de Erro

**Status**: `400 Bad Request` ou `500 Internal Server Error`

```json
{
  "success": false,
  "error": "Invalid payload: missing required field 'videos'",
  "inserted": 0,
  "updated": 0,
  "failed": 10
}
```

### Resposta Parcial

**Status**: `200 OK` (com warnings)

```json
{
  "success": true,
  "inserted": 8,
  "updated": 0,
  "failed": 2,
  "message": "Partially processed",
  "errors": [
    {
      "youtube_video_id": "abc123",
      "error": "Duplicate video ID"
    },
    {
      "youtube_video_id": "def456",
      "error": "Invalid channel_id format"
    }
  ]
}
```

## Implementação Completa

### Código da Edge Function

```typescript
// supabase/functions/receive-benchmark-videos/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests (if needed)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BenchmarkVideo {
  id?: number
  youtube_video_id: string
  channel_id: string
  title: string | null
  description: string | null
  views: number | null
  likes: number | null
  comments: number | null
  upload_date: string | null
  video_length: string | null
  thumbnail_url: string | null
  tags: any | null
  categorization: any | null
  keywords?: string[]
  related_video_ids?: string[]
  enrichment_data?: any
  performance_vs_avg_historical: number | null
  performance_vs_median_historical: number | null
  performance_vs_recent_14d: number | null
  performance_vs_recent_30d: number | null
  performance_vs_recent_90d: number | null
  is_outlier: boolean | null
  outlier_threshold: number | null
  last_enriched_at?: string | null
  created_at?: string
  updated_at?: string
}

interface WebhookPayload {
  videos: BenchmarkVideo[]
  metadata: {
    sent_at: string
    source: string
    video_count: number
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const payload: WebhookPayload = await req.json()

    // Validate payload
    if (!payload.videos || !Array.isArray(payload.videos)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid payload: missing or invalid "videos" array',
          inserted: 0,
          updated: 0,
          failed: 0,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (payload.videos.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No videos provided',
          inserted: 0,
          updated: 0,
          failed: 0,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Process videos
    let inserted = 0
    let updated = 0
    let failed = 0
    const errors: Array<{ youtube_video_id: string; error: string }> = []

    for (const video of payload.videos) {
      try {
        // Validate required fields
        if (!video.youtube_video_id || !video.channel_id) {
          failed++
          errors.push({
            youtube_video_id: video.youtube_video_id || 'unknown',
            error: 'Missing required fields: youtube_video_id or channel_id',
          })
          continue
        }

        // Prepare data for insertion (exclude source 'id')
        const videoData = {
          youtube_video_id: video.youtube_video_id,
          channel_id: video.channel_id,
          title: video.title,
          description: video.description,
          views: video.views,
          likes: video.likes,
          comments: video.comments,
          upload_date: video.upload_date,
          video_length: video.video_length,
          thumbnail_url: video.thumbnail_url,
          tags: video.tags,
          categorization: video.categorization,
          keywords: video.keywords || [],
          related_video_ids: video.related_video_ids || [],
          enrichment_data: video.enrichment_data || {},
          performance_vs_avg_historical: video.performance_vs_avg_historical,
          performance_vs_median_historical: video.performance_vs_median_historical,
          performance_vs_recent_14d: video.performance_vs_recent_14d,
          performance_vs_recent_30d: video.performance_vs_recent_30d,
          performance_vs_recent_90d: video.performance_vs_recent_90d,
          is_outlier: video.is_outlier,
          outlier_threshold: video.outlier_threshold,
          last_enriched_at: video.last_enriched_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Upsert: Insert or update if youtube_video_id already exists
        const { error } = await supabase
          .from('benchmark_videos')
          .upsert(videoData, {
            onConflict: 'youtube_video_id',
            ignoreDuplicates: false,
          })

        if (error) {
          failed++
          errors.push({
            youtube_video_id: video.youtube_video_id,
            error: error.message,
          })
          console.error(`Error upserting video ${video.youtube_video_id}:`, error)
        } else {
          // Check if it was insert or update
          // For simplicity, we'll count as inserted (you can refine this)
          inserted++
        }
      } catch (videoError) {
        failed++
        errors.push({
          youtube_video_id: video.youtube_video_id || 'unknown',
          error: videoError instanceof Error ? videoError.message : 'Unknown error',
        })
        console.error('Error processing video:', videoError)
      }
    }

    // Prepare response
    const response = {
      success: failed === 0,
      inserted,
      updated,
      failed,
      message:
        failed === 0
          ? 'Videos processed successfully'
          : failed === payload.videos.length
          ? 'All videos failed to process'
          : 'Partially processed',
      ...(errors.length > 0 && { errors }),
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in receive-benchmark-videos function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        inserted: 0,
        updated: 0,
        failed: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
```

## Schema da Tabela de Destino

A tabela `benchmark_videos` no banco de produção deve ter o seguinte schema:

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

-- Index for unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_benchmark_videos_youtube_video_id
  ON benchmark_videos(youtube_video_id);

-- Index for channel lookups
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_channel_id
  ON benchmark_videos(channel_id);

-- Index for keywords search (GIN index for array)
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_keywords
  ON benchmark_videos USING GIN(keywords);

-- Index for enrichment timestamp
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_last_enriched
  ON benchmark_videos(last_enriched_at);
```

## Configuração no Supabase

### 1. Criar a Edge Function

```bash
# No diretório do projeto Supabase de produção
supabase functions new receive-benchmark-videos
```

### 2. Adicionar o código

Cole o código da função em `supabase/functions/receive-benchmark-videos/index.ts`

### 3. Deploy da função

```bash
supabase functions deploy receive-benchmark-videos
```

### 4. Obter a URL da função

Após o deploy, a URL será:

```
https://[SEU-PROJECT-ID].supabase.co/functions/v1/receive-benchmark-videos
```

### 5. Configurar variáveis de ambiente

As seguintes variáveis de ambiente são necessárias (já configuradas automaticamente):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Segurança

### Recomendações

1. **Autenticação via API Key** (Opcional mas recomendado):

```typescript
// Adicione no início da função
const authHeader = req.headers.get('Authorization')
const expectedKey = Deno.env.get('WEBHOOK_API_KEY')

if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
  return new Response(
    JSON.stringify({ success: false, error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

Configure a variável de ambiente:
```bash
supabase secrets set WEBHOOK_API_KEY=sua-chave-secreta-aqui
```

E no lado do Automedia, envie o header:
```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer sua-chave-secreta-aqui'
}
```

2. **Rate Limiting**: Implemente rate limiting para prevenir abuse

3. **IP Whitelist**: Configure firewall para aceitar apenas IPs confiáveis

4. **Validação de Dados**: Sempre valide todos os campos antes de inserir

5. **Logging**: Adicione logs detalhados para auditoria

## Testes

### Teste Local com Supabase CLI

```bash
# Servir função localmente
supabase functions serve receive-benchmark-videos

# Testar com curl
curl -X POST http://localhost:54321/functions/v1/receive-benchmark-videos \
  -H "Content-Type: application/json" \
  -d '{
    "videos": [
      {
        "youtube_video_id": "test123",
        "channel_id": "UC123",
        "title": "Test Video",
        "views": 1000,
        "likes": 50,
        "comments": 10
      }
    ],
    "metadata": {
      "sent_at": "2024-11-14T15:00:00Z",
      "source": "automedia-platform",
      "video_count": 1
    }
  }'
```

### Teste em Produção

Use a mesma requisição acima, mas com a URL de produção:

```bash
curl -X POST https://[SEU-PROJECT-ID].supabase.co/functions/v1/receive-benchmark-videos \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

## Troubleshooting

### Erro: "Invalid payload"

- Verifique se o campo `videos` está presente e é um array
- Confirme que o JSON está bem formatado

### Erro: "Missing required fields"

- Certifique-se de que `youtube_video_id` e `channel_id` estão presentes em cada vídeo

### Erro: "Duplicate video ID"

- O vídeo já existe no banco. Use `upsert` em vez de `insert` para atualizar

### Função não responde

- Verifique os logs: `supabase functions logs receive-benchmark-videos`
- Confirme que a função foi deployada: `supabase functions list`
- Teste localmente primeiro

### Timeout

- Se processar muitos vídeos, considere processar em batches
- Aumente o timeout da função se necessário

## Monitoramento

### Logs

Visualize logs em tempo real:

```bash
supabase functions logs receive-benchmark-videos --follow
```

### Métricas

Monitore através do Dashboard do Supabase:
- Taxa de requisições
- Taxa de erros
- Tempo de resposta
- Uso de recursos

## Próximos Passos

Depois de implementar esta Edge Function:

1. Teste localmente
2. Deploy para produção
3. Obtenha a URL completa da função
4. Configure o webhook na plataforma Automedia (`/settings/webhooks`)
5. Teste o envio de vídeos
6. Monitore os logs para garantir que tudo funciona
