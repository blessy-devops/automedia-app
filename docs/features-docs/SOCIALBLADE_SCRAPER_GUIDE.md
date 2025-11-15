# Guia Completo: SocialBlade Scraper via Edge Function

## Contexto e Problema

O SocialBlade é uma plataforma de estatísticas para canais do YouTube que mostra dados diários de crescimento (inscritos, views, vídeos postados). Esses dados são valiosos para análise de performance de canais, mas o SocialBlade não oferece uma API pública.

### O Desafio

Precisávamos extrair dados históricos de canais do YouTube no SocialBlade, especificamente:
- Ganho/perda de inscritos por dia
- Views diárias
- Quantidade de vídeos postados
- Período: últimos 14 dias

### Tentativas Anteriores (V1)

**Abordagem inicial:** Scraper em Python + Playwright (automação de browser) hospedado na Vercel

**Problemas encontrados:**
- Erros HTTP 405 (incompatibilidade de handlers)
- Deployment Protection bloqueando requisições
- Bundle gigante (1.3MB)
- Execução lenta (15-20 segundos)
- Alto consumo de memória (300MB)
- Dependências pesadas (Playwright + Chrome headless)

## A Solução: Edge Function Lightweight (V2)

### Conceito Central

Em vez de usar automação de browser (Playwright/Puppeteer), descobrimos que podemos fazer um simples **HTTP fetch** da página HTML do SocialBlade e depois **parsear o HTML manualmente** usando regex.

### Por Que Isso Funciona?

1. **O SocialBlade renderiza os dados no HTML inicial** (não usa JavaScript dinâmico para a tabela de estatísticas)
2. **A estrutura HTML é consistente** (sempre a mesma tabela com as mesmas colunas)
3. **Não precisa executar JavaScript** (os dados já estão lá no HTML)

## Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────┐
│                  Edge Function (Deno)                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Fetch HTML                                    │  │
│  │     GET https://socialblade.com/youtube/channel/  │  │
│  │     {channelId}                                   │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  2. Parse HTML com Custom DOMParser              │  │
│  │     - Extrai tabelas com regex                    │  │
│  │     - Identifica tbody e rows                     │  │
│  │     - Processa células (td)                       │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  3. Extrai Dados (parseNumber)                    │  │
│  │     - "+1.2K" → 1200                              │  │
│  │     - "+58,654" → 58654                           │  │
│  │     - "-50" → -50                                 │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  4. Calcula Métricas Agregadas                    │  │
│  │     - Total subscribers (soma)                     │  │
│  │     - Total views (soma)                           │  │
│  │     - Médias por dia                               │  │
│  │     - Dias com novos vídeos                        │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  5. Retorna JSON estruturado                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Implementação Técnica

### 1. Custom DOMParser (Polyfill para Deno)

Como o Deno não tem um DOMParser nativo completo, criamos uma versão simplificada usando **regex** que é suficiente para nosso caso de uso:

```typescript
class DOMParser {
  parseFromString(html: string, type: string) {
    return {
      querySelectorAll: (selector: string) => {
        if (selector === 'table') {
          return this.parseTables(html)
        }
        return []
      },
    }
  }

  private parseTables(html: string) {
    // Encontra todas as tags <table>...</table>
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
    const matches = [...html.matchAll(tableRegex)]

    return matches.map((match) => {
      const tableHtml = match[0]
      return {
        querySelector: (selector: string) => {
          if (selector === 'tbody') {
            return this.parseTbody(tableHtml)
          }
          return null
        },
      }
    })
  }

  private parseTbody(tableHtml: string) {
    // Extrai <tbody>...</tbody>
    const tbodyRegex = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i
    const tbodyMatch = tableHtml.match(tbodyRegex)

    if (!tbodyMatch) return null

    return {
      querySelectorAll: (selector: string) => {
        if (selector === 'tr') {
          return this.parseRows(tbodyMatch[0])
        }
        return []
      },
    }
  }

  private parseRows(tbodyHtml: string) {
    // Extrai todas as <tr>...</tr>
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    const matches = [...tbodyHtml.matchAll(rowRegex)]

    return matches.map((match) => {
      return {
        querySelectorAll: (selector: string) => {
          if (selector === 'td') {
            return this.parseCells(match[0])
          }
          return []
        },
      }
    })
  }

  private parseCells(rowHtml: string) {
    // Extrai todas as <td>...</td>
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
    const matches = [...rowHtml.matchAll(cellRegex)]

    return matches.map((match) => {
      const cellHtml = match[0]
      const content = match[1]

      // Remove tags HTML internas
      const textContent = content.replace(/<[^>]*>/g, '').trim()

      // Extrai class attribute
      const classMatch = cellHtml.match(/class=["']([^"']*)["']/)
      const className = classMatch ? classMatch[1] : ''

      return {
        textContent,
        getAttribute: (attr: string) => {
          if (attr === 'class') return className
          return null
        },
      }
    })
  }
}
```

**Por que regex em vez de biblioteca?**
- Simplicidade: não precisamos de todas as features de um DOM completo
- Performance: regex é extremamente rápido
- Zero dependências: reduz o bundle size drasticamente
- Confiabilidade: a estrutura HTML do SocialBlade é estável

### 2. Parser de Números (parseNumber)

O SocialBlade usa diferentes formatos para números. Criamos um parser que lida com todos:

```typescript
function parseNumber(text: string): number {
  if (!text || text === '--' || text.trim() === '') {
    return 0
  }

  // Remove espaços e sinal de +
  let cleaned = text.trim().replace(/^\+/, '')

  // Detecta notação K (milhares) e M (milhões)
  const hasK = cleaned.includes('K')
  const hasM = cleaned.includes('M')

  // Remove K, M, vírgulas e outros caracteres não-numéricos
  // Mantém apenas números, ponto decimal e sinal negativo
  cleaned = cleaned.replace(/[KM,]/g, '')

  // Converte para número
  let num = parseFloat(cleaned)

  if (isNaN(num)) {
    return 0
  }

  // Aplica multiplicadores
  if (hasK) {
    num *= 1000
  } else if (hasM) {
    num *= 1000000
  }

  return Math.round(num)
}
```

**Exemplos de conversão:**
- `"+1.2K"` → `1200`
- `"+58,654"` → `58654`
- `"-50"` → `-50`
- `"+1.5M"` → `1500000`
- `"--"` → `0`

### 3. Estrutura de Dados

#### DailyStat (Dados Diários)

```typescript
interface DailyStat {
  subscribers: number      // Ganho/perda de inscritos (+1200, -50)
  views: number           // Views do dia
  videosPosted: number    // Vídeos postados no dia
  hasNewVideo: boolean    // Flag indicando se houve upload
}
```

#### AggregatedMetrics (Métricas Calculadas)

```typescript
interface AggregatedMetrics {
  totalSubscribers: number        // Soma total de inscritos ganhos/perdidos
  totalViews: number              // Soma total de views
  totalVideosPosted: number       // Soma total de vídeos postados
  daysWithNewVideos: number       // Quantidade de dias com novos vídeos
  averageSubscribersPerDay: number // Média de inscritos por dia
  averageViewsPerDay: number      // Média de views por dia
  daysAnalyzed: number            // Quantidade de dias analisados
}
```

#### SocialBladeData (Resposta Final)

```typescript
interface SocialBladeData {
  channelId: string
  dailyStats: DailyStat[]         // Array com 14 dias
  aggregated: AggregatedMetrics   // Métricas já calculadas
  scrapedAt: string               // Timestamp ISO
}
```

### 4. Mapeamento das Colunas da Tabela

A tabela do SocialBlade tem a seguinte estrutura:

```
┌──────┬──────────────┬────────────┬───────┬──────────┬────────┬──────────┬──────────┐
│ Col 0│    Col 1     │   Col 2    │ Col 3 │  Col 4   │ Col 5  │  Col 6   │  Col 7   │
├──────┼──────────────┼────────────┼───────┼──────────┼────────┼──────────┼──────────┤
│ Date │ Subscribers  │   Total    │ Views │  Total   │ Videos │  Total   │ Earnings │
│      │  (+/- daily) │ Subscribers│(daily)│  Views   │ Posted │  Videos  │          │
└──────┴──────────────┴────────────┴───────┴──────────┴────────┴──────────┴──────────┘
```

**O que extraímos:**
- **Column 1:** Subscribers ganhos/perdidos (`+1.2K`, `+800`, `-50`)
- **Column 3:** Views diárias (`+58,654`, `+166,763`)
- **Column 5:** Vídeos postados (`+5`, `+6`, `+1`)
- **Column 5 class:** Detectamos `class="positive"` para identificar quando houve novo vídeo

### 5. Função Principal (scrapeSocialBladeV2)

```typescript
export async function scrapeSocialBladeV2(channelId: string): Promise<SocialBladeData> {
  console.log(`[SocialBlade V2] Starting scrape for channel: ${channelId}`)

  // Validação do channel ID
  if (!channelId || channelId.length < 10) {
    throw new Error(`Invalid channel ID: ${channelId}`)
  }

  try {
    // 1. Fetch HTML do SocialBlade
    const url = `https://socialblade.com/youtube/channel/${channelId}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    console.log(`[SocialBlade V2] Fetched ${html.length} bytes of HTML`)

    // 2. Parse HTML usando Custom DOMParser
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const tables = doc.querySelectorAll('table')

    if (!tables || tables.length === 0) {
      throw new Error(`No statistics table found for channel ${channelId}`)
    }

    // 3. Extrai dados da primeira tabela (daily stats)
    const table = tables[0]
    const tbody = table.querySelector('tbody')
    const rows = tbody.querySelectorAll('tr')

    console.log(`[SocialBlade V2] Found ${rows.length} rows in statistics table`)

    // 4. Processa cada linha (máximo 14 dias)
    const dailyStats: DailyStat[] = []
    const daysToProcess = Math.min(rows.length, 14)

    for (let i = 0; i < daysToProcess; i++) {
      const row = rows[i]
      const cells = row.querySelectorAll('td')

      if (cells.length < 8) {
        console.warn(`[SocialBlade V2] Row ${i} has insufficient cells, skipping`)
        continue
      }

      // Extrai dados das colunas relevantes
      const subscribersText = cells[1].textContent?.trim() || ''
      const viewsText = cells[3].textContent?.trim() || ''
      const videosText = cells[5].textContent?.trim() || ''
      const videosClass = cells[5].getAttribute('class') || ''

      // Parse números
      const subscribersNum = parseNumber(subscribersText)
      const viewsNum = parseNumber(viewsText)
      const videosCount = parseNumber(videosText)

      // Detecta se houve novo vídeo
      const hasNewVideo = videosClass.includes('positive')

      // Filtra dados inválidos (views > 0 indica dia válido)
      if (viewsNum > 0) {
        dailyStats.push({
          subscribers: subscribersNum,
          views: viewsNum,
          videosPosted: videosCount,
          hasNewVideo: hasNewVideo,
        })
      }
    }

    console.log(`[SocialBlade V2] Successfully extracted ${dailyStats.length} days of statistics`)

    if (dailyStats.length === 0) {
      throw new Error('No valid statistics found in table')
    }

    // 5. Calcula métricas agregadas
    const totalSubscribers = dailyStats.reduce((sum, day) => sum + day.subscribers, 0)
    const totalViews = dailyStats.reduce((sum, day) => sum + day.views, 0)
    const totalVideosPosted = dailyStats.reduce((sum, day) => sum + day.videosPosted, 0)
    const daysWithNewVideos = dailyStats.filter(day => day.hasNewVideo).length
    const averageSubscribersPerDay = dailyStats.length > 0 ? totalSubscribers / dailyStats.length : 0
    const averageViewsPerDay = dailyStats.length > 0 ? totalViews / dailyStats.length : 0

    const aggregated: AggregatedMetrics = {
      totalSubscribers,
      totalViews,
      totalVideosPosted,
      daysWithNewVideos,
      averageSubscribersPerDay: Math.round(averageSubscribersPerDay),
      averageViewsPerDay: Math.round(averageViewsPerDay),
      daysAnalyzed: dailyStats.length,
    }

    // 6. Retorna dados estruturados
    return {
      channelId,
      dailyStats,
      aggregated,
      scrapedAt: new Date().toISOString(),
    }

  } catch (error) {
    console.error('[SocialBlade V2] Scraping failed:', error)
    throw new Error(`SocialBlade scraping failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
```

## Como Usar

### 1. Função de Teste (test-socialblade-scraper)

A Edge Function de teste permite testar o scraper sem afetar a produção:

**Arquivo:** `supabase/functions/test-socialblade-scraper/index.ts`

```typescript
import { scrapeSocialBladeV2 } from '../_shared/socialblade-scraper-v2.ts'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { channelId } = await req.json()

    if (!channelId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing channelId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()
    const scrapedData = await scrapeSocialBladeV2(channelId)
    const duration = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        duration: `${duration}ms`,
        data: scrapedData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 2. Testar via Script Bash

**Arquivo:** `test-socialblade.sh`

```bash
#!/bin/bash

CHANNEL_ID=${1:-"UCuAXFkgsw1L7xaCfnd5JJOw"}  # Default: Fireship
SUPABASE_URL="https://xlpkabexmwsugkmbngwm.supabase.co"
ANON_KEY="your-anon-key-here"

echo "Testing SocialBlade Scraper Edge Function"
echo "Channel ID: $CHANNEL_ID"

curl -X POST "$SUPABASE_URL/functions/v1/test-socialblade-scraper" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"channelId\": \"$CHANNEL_ID\"}" \
  | jq '.'
```

**Usar:**
```bash
chmod +x test-socialblade.sh
./test-socialblade.sh UCXrJc6KnSET4ZE3QqZGJSSA
```

### 3. Testar via cURL

```bash
curl -X POST https://xlpkabexmwsugkmbngwm.supabase.co/functions/v1/test-socialblade-scraper \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"channelId": "UCXrJc6KnSET4ZE3QqZGJSSA"}' \
  | jq '.'
```

### 4. Integração em Produção

**Arquivo:** `supabase/functions/enrichment-step-2-socialblade/index.ts`

```typescript
import { scrapeSocialBladeV2 } from '../_shared/socialblade-scraper-v2.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { channelId, taskId } = await req.json()

  // 1. Atualiza status da task
  await supabase
    .from('channel_enrichment_tasks')
    .update({ socialblade_status: 'processing' })
    .eq('id', taskId)

  // 2. Scrape SocialBlade
  const scrapedData = await scrapeSocialBladeV2(channelId)

  // 3. Extrai métricas
  const { aggregated, dailyStats } = scrapedData
  const totalViews14d = aggregated.totalViews
  const videosCount14d = aggregated.totalVideosPosted
  const avgViewsPerVideo14d = videosCount14d > 0
    ? totalViews14d / videosCount14d
    : 0

  // 4. Salva no banco (usando Drizzle)
  await db
    .insert(benchmarkChannelsBaselineStatsTable)
    .values({
      channelId,
      totalViews14d,
      videosCount14d,
      avgViewsPerVideo14d,
      // ... outras métricas
    })
    .onConflictDoUpdate({
      target: benchmarkChannelsBaselineStatsTable.channelId,
      set: { /* update values */ }
    })

  // 5. Atualiza status da task
  await supabase
    .from('channel_enrichment_tasks')
    .update({
      socialblade_status: 'completed',
      socialblade_result: aggregated,
    })
    .eq('id', taskId)

  // 6. Chama próxima step do pipeline
  await supabase.functions.invoke('enrichment-step-3-fetch-videos', {
    body: { channelId, taskId }
  })
})
```

## Exemplo de Resposta

```json
{
  "success": true,
  "duration": "2847ms",
  "data": {
    "channelId": "UCXrJc6KnSET4ZE3QqZGJSSA",
    "dailyStats": [
      {
        "subscribers": 1200,
        "views": 58654,
        "videosPosted": 5,
        "hasNewVideo": true
      },
      {
        "subscribers": 800,
        "views": 166763,
        "videosPosted": 6,
        "hasNewVideo": true
      },
      {
        "subscribers": -50,
        "views": 45000,
        "videosPosted": 0,
        "hasNewVideo": false
      }
      // ... mais 11 dias
    ],
    "aggregated": {
      "totalSubscribers": 13000,
      "totalViews": 1558595,
      "totalVideosPosted": 67,
      "daysWithNewVideos": 12,
      "averageSubscribersPerDay": 929,
      "averageViewsPerDay": 111328,
      "daysAnalyzed": 14
    },
    "scrapedAt": "2025-10-21T15:30:45.123Z"
  }
}
```

## Performance

### Comparação V1 vs V2

| Métrica | V1 (Playwright) | V2 (Fetch) | Melhoria |
|---------|----------------|------------|----------|
| **Bundle Size** | 1.3MB | 7.6KB | **171x menor** |
| **Tempo de Execução** | 15-20s | 2-5s | **4x mais rápido** |
| **Memória RAM** | 300MB | 20MB | **15x menos** |
| **Cold Start** | ~5s | <1s | **5x mais rápido** |
| **Dependências** | Playwright + Chrome | Zero (fetch nativo) | **Simplificado** |

## Deployment

### 1. Deploy da Função de Teste

```bash
cd automedia/supabase/functions
supabase functions deploy test-socialblade-scraper
```

**Saída esperada:**
```
Bundled test-socialblade-scraper size: 7.605kB
Deployed Function test-socialblade-scraper: https://xlpkabexmwsugkmbngwm.supabase.co/functions/v1/test-socialblade-scraper
```

### 2. Deploy da Função de Produção

```bash
supabase functions deploy enrichment-step-2-socialblade
```

### 3. Verificar Logs

```bash
supabase functions logs test-socialblade-scraper --follow
```

## Troubleshooting

### Erro: "No statistics table found"

**Causa:** O canal não existe ou é privado no SocialBlade

**Solução:** Verifique se o channelId está correto e se o canal tem estatísticas públicas

### Erro: "Invalid channel ID"

**Causa:** channelId tem menos de 10 caracteres

**Solução:** Use um channelId válido do YouTube (ex: `UCuAXFkgsw1L7xaCfnd5JJOw`)

### Números parecem errados

**Causa:** Formato de número no SocialBlade pode ter mudado

**Solução:**
1. Acesse manualmente `https://socialblade.com/youtube/channel/{channelId}`
2. Compare os números na tela com os retornados pelo scraper
3. Se diferentes, ajuste a função `parseNumber()`

### Tabela HTML mudou de estrutura

**Causa:** SocialBlade alterou o layout da página

**Solução:**
1. Inspecione o HTML atual da página
2. Identifique as novas posições das colunas
3. Atualize os índices em `scrapeSocialBladeV2()`:
   ```typescript
   const subscribersCell = cells[1]  // Ajustar índice se necessário
   const viewsCell = cells[3]        // Ajustar índice se necessário
   const videosCell = cells[5]       // Ajustar índice se necessário
   ```

## Casos de Uso e Aplicações

### 1. Análise de Crescimento de Canais

Use os dados agregados para identificar canais com crescimento acelerado:

```typescript
// Canal com alto crescimento?
if (aggregated.averageSubscribersPerDay > 1000 && aggregated.taxaCrescimento > 10) {
  console.log('Canal em rápido crescimento!')
}
```

### 2. Detecção de Viralização

Identifique quando um canal teve um pico de views:

```typescript
// Teve algum dia com views muito acima da média?
const maxViews = Math.max(...dailyStats.map(d => d.views))
if (maxViews > aggregated.averageViewsPerDay * 3) {
  console.log('Possível vídeo viral detectado!')
}
```

### 3. Cadência de Publicação

Analise a consistência de uploads:

```typescript
const uploadRate = aggregated.daysWithNewVideos / aggregated.daysAnalyzed
if (uploadRate > 0.8) {
  console.log('Canal com alta cadência de publicação (quase diária)')
}
```

### 4. Benchmark entre Canais

Compare performance de múltiplos canais:

```typescript
const channels = ['UCChannelA', 'UCChannelB', 'UCChannelC']
const results = await Promise.all(
  channels.map(id => scrapeSocialBladeV2(id))
)

const ranking = results
  .sort((a, b) => b.aggregated.totalViews - a.aggregated.totalViews)
  .map(r => ({
    channelId: r.channelId,
    totalViews: r.aggregated.totalViews,
    avgViewsPerDay: r.aggregated.averageViewsPerDay
  }))

console.log('Ranking por views:', ranking)
```

## Possíveis Extensões

### 1. Dados Mensais

O SocialBlade também tem uma view de dados mensais. Você poderia criar uma variante do scraper:

```typescript
async function scrapeSocialBladeMonthly(channelId: string)
```

### 2. Scraping de Outros Dados

A página do SocialBlade tem outros dados interessantes:
- Total de inscritos atual
- Ranking global do canal
- Ranking por país
- Estimativa de receita

### 3. Cache Inteligente

Para reduzir requests ao SocialBlade:

```typescript
// Verifica se já tem dados frescos (< 6 horas)
const cached = await getCachedData(channelId)
if (cached && (Date.now() - cached.timestamp < 6 * 60 * 60 * 1000)) {
  return cached.data
}

// Se não, scrape novo
const fresh = await scrapeSocialBladeV2(channelId)
await cacheData(channelId, fresh)
return fresh
```

### 4. Webhook/Notificações

Monitore canais e notifique quando houver anomalias:

```typescript
const data = await scrapeSocialBladeV2(channelId)

// Detecta ganho massivo de inscritos
if (data.aggregated.averageSubscribersPerDay > 10000) {
  await sendSlackNotification(`Canal ${channelId} ganhou ${data.aggregated.totalSubscribers} inscritos em 14 dias!`)
}
```

### 5. Rate Limiting

Para scraping em massa, adicione rate limiting:

```typescript
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function scrapeMultipleChannels(channelIds: string[]) {
  const results = []

  for (const channelId of channelIds) {
    const data = await scrapeSocialBladeV2(channelId)
    results.push(data)

    // Aguarda 2 segundos entre requests
    await delay(2000)
  }

  return results
}
```

## Racional Técnico e Learnings

### Por que Edge Functions?

1. **Baixa latência:** Executam próximo ao usuário
2. **Escalabilidade automática:** Supabase gerencia isso
3. **Integração nativa:** Acesso direto ao banco Postgres
4. **Custo efetivo:** Pay-per-use

### Por que Fetch em vez de Browser Automation?

1. **Simplicidade:** SocialBlade não precisa de JS para renderizar os dados
2. **Performance:** Fetch é ordens de magnitude mais rápido que Playwright
3. **Recursos:** Não precisa instanciar um browser headless
4. **Confiabilidade:** Menos pontos de falha

### Por que Custom Parser em vez de Biblioteca?

1. **Bundle size:** Bibliotecas como `cheerio` ou `linkedom` são pesadas
2. **Over-engineering:** Não precisamos de todas as features de um DOM completo
3. **Controle:** Sabemos exatamente o que estamos parseando
4. **Manutenibilidade:** Menos dependencies = menos bugs

### O que aprendemos?

1. **Nem sempre precisa de automação de browser:** Analise o site primeiro
2. **Regex é poderoso:** Para casos específicos, é mais rápido que parsers genéricos
3. **Edge Functions são ideais para scraping leve:** Quando não precisa de browser
4. **Estrutura HTML é surpreendentemente estável:** SocialBlade não muda muito
5. **Trade-off entre robustez e performance:** Custom parser é frágil mas rápido

## Limitações e Considerações

### 1. Fragilidade

Se o SocialBlade mudar a estrutura HTML, o scraper quebra. Para mitigar:
- Monitore erros em produção
- Mantenha logs detalhados
- Tenha alertas configurados

### 2. Rate Limiting

O SocialBlade pode bloquear IPs com muitas requests. Para mitigar:
- Adicione delays entre requests
- Use cache agressivo
- Considere rotating proxies para alto volume

### 3. Ética e Legalidade

Web scraping está em área cinzenta. Considerações:
- Não sobrecarregue o servidor deles
- Respeite robots.txt (SocialBlade não bloqueia bots)
- Use User-Agent honesto
- Não revenda os dados

### 4. Alternativas

Se o scraping se tornar problemático:
- SocialBlade oferece API paga
- YouTube Data API tem alguns dados similares
- Considere parcerias com agregadores de dados

## Conclusão

Este scraper é uma solução elegante e eficiente para extrair dados do SocialBlade sem usar automação de browser. A chave foi perceber que:

1. **Nem todo site precisa de Playwright/Puppeteer**
2. **Fetch + Regex pode ser suficiente**
3. **Edge Functions são perfeitas para isso**
4. **Custom parsers podem ser mais eficientes que bibliotecas**

O resultado é uma solução **171x menor**, **4x mais rápida** e muito mais confiável que a versão anterior.

---

**Autor:** David Luis
**Data:** Outubro 2025
**Versão:** 2.0
**Status:** Produção

Para dúvidas ou melhorias, consulte:
- [socialblade-scraper-v2.ts](automedia/supabase/functions/_shared/socialblade-scraper-v2.ts)
- [test-socialblade-scraper/index.ts](automedia/supabase/functions/test-socialblade-scraper/index.ts)
- [enrichment-step-2-socialblade/index.ts](automedia/supabase/functions/enrichment-step-2-socialblade/index.ts)
