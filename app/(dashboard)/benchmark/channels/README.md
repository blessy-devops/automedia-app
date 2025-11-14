# Channel Benchmark Page

Esta página permite que usuários iniciem um processo de benchmark completo para um canal do YouTube.

## Estrutura de Arquivos

```
app/(dashboard)/benchmark/channels/
├── page.tsx                        # Server Component (página principal)
├── actions.ts                      # Server Actions (lógica de backend)
├── components/
│   └── channel-benchmark-form.tsx  # Client Component (formulário)
└── README.md                       # Esta documentação
```

## Componentes

### `page.tsx` (Server Component)

Página principal que renderiza o título e o formulário de benchmark.

**Características:**
- Server Component (renderizado no servidor)
- SEO-friendly
- Carrega rápido

### `channel-benchmark-form.tsx` (Client Component)

Formulário interativo para iniciar o benchmark.

**Características:**
- ✅ Validação com Zod
- ✅ React Hook Form para gerenciamento de estado
- ✅ Loading state com spinner
- ✅ Feedback visual de sucesso/erro
- ✅ Desabilita formulário durante submissão
- ✅ Reset automático após sucesso

**Validações:**
- Channel ID não pode estar vazio
- Deve conter apenas letras, números, hífens e underscores

### `actions.ts` (Server Actions)

Lógica de backend executada no servidor.

**Actions disponíveis:**

#### `startChannelBenchmark(channelId: string)`

Inicia um novo job de benchmark:

1. Valida o Channel ID
2. Cria um registro em `channel_enrichment_jobs`
3. Cria um registro em `channel_enrichment_tasks`
4. Retorna o Job ID para tracking

**Retorno:**
```typescript
{
  success: boolean
  jobId?: number
  taskId?: number
  message?: string
  error?: string
}
```

#### `getEnrichmentJobStatus(jobId: number)`

Busca o status de um job de enrichment.

**Retorno:**
```typescript
{
  success: boolean
  job?: ChannelEnrichmentJob
  error?: string
}
```

## Fluxo de Uso

1. **Usuário acessa** `/benchmark/channels`
2. **Insere** um Channel ID do YouTube
3. **Clica** "Start Channel Benchmark"
4. **Formulário:**
   - Valida o input
   - Mostra loading state
   - Desabilita campos
5. **Server Action:**
   - Cria job no banco
   - Cria task no banco
   - Retorna Job ID
6. **Feedback:**
   - ✅ Sucesso: Mostra Job ID e mensagem
   - ❌ Erro: Mostra mensagem de erro

## Conexão com Banco de Dados

O sistema usa **`dbDirect`** (direct connection) para estas operações porque:

- São operações críticas que podem demorar
- Envolvem múltiplas inserções no banco
- Precisam de maior timeout que o pooler oferece

```typescript
import { dbDirect } from '@/lib/drizzle'
```

## Próximos Passos

### 1. Background Worker

Atualmente, o sistema apenas cria os registros no banco. É necessário implementar um worker para processar os jobs:

**Opções:**
- Supabase Edge Function triggered por database webhook
- Queue system (BullMQ, Redis Queue)
- Cron job que busca jobs `pending`

### 2. Status Dashboard

Criar página para visualizar:
- Jobs em andamento
- Progress de cada sub-workflow
- Histórico de jobs completados
- Estatísticas gerais

### 3. Webhooks / Real-time Updates

Implementar updates em tempo real para mostrar progresso:
- Supabase Realtime
- Server-Sent Events (SSE)
- WebSockets

### 4. Validação Avançada

Adicionar validações extras:
- Verificar se Channel ID existe no YouTube
- Verificar se canal já foi benchmarked recentemente
- Rate limiting

### 5. Workflows de Enrichment

Implementar os 5 sub-workflows:

1. **Categorização** (Claude AI)
   - Analisar descrição e conteúdo do canal
   - Categorizar por nicho/vertical

2. **SocialBlade Scraping**
   - Buscar métricas adicionais
   - Ranking e estimativas

3. **Fetch Videos** (YouTube Data API)
   - Buscar últimos vídeos do canal
   - Armazenar em `benchmark_videos`

4. **Baseline Stats**
   - Calcular estatísticas (14d, 30d, 90d)
   - Armazenar em `benchmark_channels_baseline_stats`

5. **Outlier Analysis**
   - Identificar vídeos outliers
   - Calcular scores de performance

## Exemplo de Uso

```typescript
// Iniciar benchmark
const result = await startChannelBenchmark('UC1234567890ABCDEFGHIJ')

if (result.success) {
  console.log(`Job criado: ${result.jobId}`)
  // Monitorar status do job
  const status = await getEnrichmentJobStatus(result.jobId)
  console.log(status.job?.status) // 'pending' | 'processing' | 'completed' | 'failed'
}
```

## Variáveis de Ambiente Necessárias

```bash
# Banco de Dados
DATABASE_URL_DIRECT=postgresql://...

# Supabase (quando implementar Edge Functions)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# APIs Externas (futuros workflows)
YOUTUBE_API_KEY=...
OPENAI_API_KEY=... # Para Claude via OpenAI-compatible API
```

## Testes

Para testar manualmente:

1. Acesse: http://localhost:3003/benchmark/channels
2. Insira um Channel ID válido (ex: `UCuAXFkgsw1L7xaCfnd5JJOw`)
3. Clique em "Start Channel Benchmark"
4. Verifique o banco de dados:

```sql
-- Ver jobs criados
SELECT * FROM channel_enrichment_jobs ORDER BY created_at DESC LIMIT 10;

-- Ver tasks criadas
SELECT * FROM channel_enrichment_tasks ORDER BY created_at DESC LIMIT 10;
```

## Troubleshooting

### Erro: "Channel ID is required"
- Certifique-se de preencher o campo
- Não use espaços em branco

### Erro: "Failed to create job"
- Verifique conexão com banco de dados
- Confira variável `DATABASE_URL_DIRECT` no `.env`
- Verifique logs do servidor

### Formulário não submete
- Abra o DevTools Console
- Verifique erros de validação
- Confirme que JavaScript está habilitado
