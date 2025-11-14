# Database Schema - Channel Benchmark Module

Este documento descreve o schema do banco de dados para o módulo de Channel Benchmark.

## Configuração do Banco de Dados

### Duas Conexões com Supabase

O projeto usa **duas variáveis de ambiente** para conexão com o PostgreSQL no Supabase:

1. **`DATABASE_URL`** - Shared Connection Pooler (Padrão)
   - Uso: Queries rápidas, CRUD padrão, operações síncronas
   - Timeout: Mais agressivo (adequado para operações rápidas)

2. **`DATABASE_URL_DIRECT`** - Direct Connection
   - Uso: Workflows complexos, chamadas de IA, APIs externas
   - Timeout: Maior (adequado para operações longas)

### Exemplo de Uso

\`\`\`typescript
import { db, dbDirect } from '@/lib/drizzle'
import { benchmarkChannelsTable, channelEnrichmentTasksTable } from '@/lib/drizzle'

// Para queries rápidas - use db (pooler)
const channels = await db.select().from(benchmarkChannelsTable).limit(10)

// Para workflows de enrichment - use dbDirect (conexão direta)
const tasks = await dbDirect
  .select()
  .from(channelEnrichmentTasksTable)
  .where(eq(channelEnrichmentTasksTable.overallStatus, 'processing'))
\`\`\`

## ENUMs

### enrichment_job_status
Status de jobs de enriquecimento em batch.

\`\`\`typescript
'pending' | 'processing' | 'completed' | 'failed'
\`\`\`

### enrichment_task_status
Status geral de uma task de enriquecimento de canal.

\`\`\`typescript
'pending' | 'processing' | 'completed' | 'failed'
\`\`\`

### enrichment_sub_workflow_status
Status de cada sub-workflow dentro de uma task.

\`\`\`typescript
'pending' | 'processing' | 'completed' | 'failed'
\`\`\`

## Tabelas

### 1. benchmark_channels

Armazena dados dos canais do YouTube para benchmark.

**Campos principais:**
- `channel_id` (varchar, unique) - ID único do canal no YouTube
- `channel_name` (text) - Nome do canal
- `subscriber_count` (bigint) - Número de inscritos
- `total_views` (bigint) - Total de visualizações
- `categorization` (jsonb) - Categorização do canal (IA)

**Índices:**
- `channel_id` (unique)
- `metric_date`
- `subscriber_count`

### 2. benchmark_videos

Armazena dados dos vídeos do YouTube para análise de performance.

**Campos principais:**
- `youtube_video_id` (varchar, unique) - ID único do vídeo
- `channel_id` (varchar) - ID do canal proprietário
- `views`, `likes`, `comments` - Métricas de engajamento
- `performance_vs_avg_historical` - Score de outlier vs média histórica
- `performance_vs_recent_14d` - Score vs últimos 14 dias
- `is_outlier` (boolean) - Flag indicando se é outlier

**Índices:**
- `youtube_video_id` (unique)
- `channel_id`
- `upload_date`
- `views`
- `is_outlier`

### 3. benchmark_channels_baseline_stats

Armazena estatísticas baseline de canais em diferentes períodos (14d, 30d, 90d, histórico).

**Campos principais:**
- `channel_id` (varchar) - ID do canal
- `total_views_14d`, `total_views_30d`, `total_views_90d` - Views por período
- `avg_views_per_video_14d` - Média de views por vídeo
- `median_views_per_video_14d` - Mediana de views
- `std_dev_views_14d` - Desvio padrão

**Índices:**
- `channel_id`
- `calculated_at`

### 4. channel_enrichment_jobs

Rastreia jobs de enriquecimento de canais em batch.

**Campos principais:**
- `keyword_search_id` (varchar) - ID da busca de keyword (opcional)
- `channel_ids` (jsonb) - Array de IDs de canais a enriquecer
- `total_channels` (integer) - Total de canais no job
- `channels_completed` (integer) - Canais já processados
- `status` (enum) - Status geral do job

**Índices:**
- `status`
- `keyword_search_id`
- `created_at`

### 5. channel_enrichment_tasks

Rastreia o progresso de cada canal individual através dos 5 sub-workflows.

Esta é a **tabela mais complexa**, com status granular para cada etapa do enrichment.

#### 5 Sub-Workflows:

1. **Categorização** (Claude AI)
   - `categorization_status`, `categorization_result`, `categorization_error`
   - Campos: started_at, completed_at

2. **SocialBlade Scraping**
   - `socialblade_status`, `socialblade_result`, `socialblade_error`
   - Campos: started_at, completed_at

3. **Fetch Videos** (YouTube Data API)
   - `fetch_videos_status`, `fetch_videos_result`, `fetch_videos_error`
   - Campos: started_at, completed_at

4. **Cálculo de Baseline Stats**
   - `baseline_stats_status`, `baseline_stats_result`, `baseline_stats_error`
   - Campos: started_at, completed_at

5. **Análise de Outliers**
   - `outlier_analysis_status`, `outlier_analysis_result`, `outlier_analysis_error`
   - Campos: started_at, completed_at

**Campos principais:**
- `enrichment_job_id` (integer) - FK para channel_enrichment_jobs
- `channel_id` (varchar) - ID do canal sendo enriquecido
- `overall_status` (enum) - Status geral da task
- `retry_count` (integer) - Contador de tentativas
- `last_error` (text) - Último erro encontrado

**Índices:**
- `enrichment_job_id`
- `channel_id`
- `overall_status`
- Status de cada sub-workflow (5 índices)

## Comandos Drizzle

### Gerar migração
\`\`\`bash
pnpm db:generate
\`\`\`

### Aplicar migração ao banco
\`\`\`bash
pnpm db:migrate
\`\`\`

### Abrir Drizzle Studio (UI visual do banco)
\`\`\`bash
pnpm db:studio
\`\`\`

## Arquivos Importantes

- [`lib/drizzle.ts`](lib/drizzle.ts) - Schema das tabelas e configuração de conexões
- [`drizzle.config.ts`](drizzle.config.ts) - Configuração do Drizzle Kit
- [`scripts/cleanup-and-migrate.ts`](scripts/cleanup-and-migrate.ts) - Script de migração
- [`drizzle/migrations/`](drizzle/migrations/) - Pasta com arquivos SQL de migração

## Estrutura de Tipos TypeScript

Todos os tipos são automaticamente inferidos pelo Drizzle ORM:

\`\`\`typescript
import type {
  BenchmarkChannel,
  NewBenchmarkChannel,
  BenchmarkVideo,
  NewBenchmarkVideo,
  ChannelEnrichmentJob,
  ChannelEnrichmentTask,
} from '@/lib/drizzle'
\`\`\`

- Tipos com prefixo `New` são para inserção (insert)
- Tipos sem prefixo são para seleção (select)
