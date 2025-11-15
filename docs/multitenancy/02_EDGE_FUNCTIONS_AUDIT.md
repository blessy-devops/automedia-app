# AUDITORIA: Edge Functions para Multi-Tenancy

**Data**: 2025-11-15
**Objetivo**: Auditar TODAS as Edge Functions, mapear fluxos de dados, identificar onde adicionar `tenant_id`

---

## 📋 RESUMO EXECUTIVO

**Total de Edge Functions**: 17 (+ duplicatas)
**Functions que precisam de modificação**: 15 (88%)
**Functions que NÃO precisam**: 2 (utilitárias)
**Risco Geral**: 🔴 MUITO ALTO

---

## METODOLOGIA

Para cada Edge Function, vou documentar:

1. **Nome e Propósito**
2. **Entrada** (parâmetros, headers, body)
3. **Fluxo de Dados** (o que ela faz)
4. **Tabelas Acessadas** (reads e writes)
5. **Dependências** (chama outras functions?)
6. **Impacto de Multi-Tenant**:
   - Onde adicionar tenant_id
   - Queries que quebram
   - Lógica que muda
7. **Código Modificado** (antes/depois)
8. **Risco** (BAIXO / MÉDIO / ALTO / CRÍTICO)

---

## CATEGORIA 1: ENRICHMENT PIPELINE (CRÍTICO)

### 1.1 - enrichment-pipeline-starter

**Propósito**: Inicia o pipeline de enrichment de 5 steps para um canal

**Entrada**:
```typescript
POST /enrichment-pipeline-starter
Body: {
  channel_id: string  // YouTube channel ID
}
```

**Fluxo**:
1. Valida se canal existe em `benchmark_channels`
2. Cria job em `channel_enrichment_jobs`
3. Cria 5 tasks em `channel_enrichment_tasks` (1 para cada step)
4. Retorna job_id

**Tabelas Acessadas**:
- `benchmark_channels` (READ) - ⚠️ Precisa tenant_id
- `channel_enrichment_jobs` (WRITE) - ⚠️ Precisa tenant_id
- `channel_enrichment_tasks` (WRITE) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:
```typescript
// ANTES
const { data: channel } = await supabase
  .from('benchmark_channels')
  .select('*')
  .eq('channel_id', channelId)
  .single();

if (!channel) {
  return new Response('Channel not found', { status: 404 });
}

// DEPOIS
const tenantId = req.headers.get('x-tenant-id'); // ← Extrair de header/JWT
if (!tenantId) {
  return new Response('Missing tenant_id', { status: 401 });
}

const { data: channel } = await supabase
  .from('benchmark_channels')
  .select('*')
  .eq('tenant_id', tenantId)  // ← ADICIONAR FILTRO
  .eq('channel_id', channelId)
  .single();

if (!channel) {
  return new Response('Channel not found', { status: 404 });
}

// Criar job COM tenant_id
const { data: job } = await supabase
  .from('channel_enrichment_jobs')
  .insert({
    tenant_id: tenantId,  // ← ADICIONAR
    channel_id: channelId,
    status: 'pending'
  })
  .select()
  .single();
```

**Breaking Changes**:
- ❌ Headers precisam incluir `x-tenant-id`
- ❌ Queries sem tenant_id falham
- ❌ Jobs órfãos se tenant_id for errado

**Risco**: 🔴 CRÍTICO (inicia pipeline inteiro)

---

### 1.2 - enrichment-step-1-categorization

**Propósito**: Step 1 - Categoriza o canal (niche, subniche, format)

**Entrada**:
```typescript
POST /enrichment-step-1-categorization
Body: {
  job_id: number,
  task_id: number,
  channel_id: string
}
```

**Fluxo**:
1. Busca dados do canal em `benchmark_channels`
2. Chama OpenRouter API para categorização
3. Atualiza `benchmark_channels.categorization`
4. Marca task como completed em `channel_enrichment_tasks`

**Tabelas Acessadas**:
- `benchmark_channels` (READ + WRITE) - ⚠️ Precisa tenant_id
- `channel_enrichment_tasks` (WRITE) - ⚠️ Precisa tenant_id

**Credenciais Usadas**:
- ✅ OpenRouter API Key (Supabase Vault) - **CRÍTICO**: Precisa ser por tenant!

**Impacto Multi-Tenant**:
```typescript
// ANTES (OpenRouter key global)
const openRouterKey = await getVaultSecret('openrouter_key_1760655833491');

// DEPOIS (OpenRouter key por tenant)
const openRouterKey = await getTenantCredential(tenantId, 'openrouter_key');

// Fallback para key da plataforma se tenant não tiver
if (!openRouterKey) {
  openRouterKey = await getVaultSecret('platform_openrouter_key');
}
```

**Breaking Changes**:
- ❌ Credenciais por tenant (nova tabela tenant_credentials)
- ❌ Fallback para credenciais da plataforma
- ❌ Billing/usage tracking por tenant

**Risco**: 🔴 ALTO (usa API key, custos por tenant)

---

### 1.3 - enrichment-step-2-socialblade

**Propósito**: Step 2 - Busca stats do SocialBlade

**Entrada**:
```typescript
POST /enrichment-step-2-socialblade
Body: {
  job_id: number,
  task_id: number,
  channel_id: string
}
```

**Fluxo**:
1. Scraping do SocialBlade para stats do canal
2. Atualiza `benchmark_channels` com stats
3. Marca task como completed

**Tabelas Acessadas**:
- `benchmark_channels` (READ + WRITE) - ⚠️ Precisa tenant_id
- `channel_enrichment_tasks` (WRITE) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:
- Similar ao step 1
- Scraping não precisa de credenciais (sem impacto)

**Risco**: 🟡 MÉDIO (sem credenciais, mas precisa tenant_id)

---

### 1.4 - enrichment-step-3-recent-videos

**Propósito**: Step 3 - Fetch vídeos recentes do canal (últimos 30 dias)

**Entrada**:
```typescript
POST /enrichment-step-3-recent-videos
Body: {
  job_id: number,
  task_id: number,
  channel_id: string
}
```

**Fluxo**:
1. Chama Rapid API (YouTube Data API) para buscar vídeos
2. Filtra vídeos dos últimos 30 dias
3. Insere vídeos em `benchmark_videos`
4. Adiciona vídeos relacionados à `video_enrichment_queue`
5. Marca task como completed

**Tabelas Acessadas**:
- `benchmark_channels` (READ) - ⚠️ Precisa tenant_id
- `benchmark_videos` (WRITE) - ⚠️ Precisa tenant_id
- `video_enrichment_queue` (WRITE) - ⚠️ Precisa tenant_id
- `channel_enrichment_tasks` (WRITE) - ⚠️ Precisa tenant_id

**Credenciais Usadas**:
- ✅ Rapid API Key - **CRÍTICO**: Precisa ser por tenant!

**Impacto Multi-Tenant**:
```typescript
// ANTES (Rapid API key global)
const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

// DEPOIS (Rapid API key por tenant)
const rapidApiKey = await getTenantCredential(tenantId, 'rapidapi_key');

// CRÍTICO: Pool de keys da plataforma como fallback
if (!rapidApiKey) {
  rapidApiKey = await getAvailableKeyFromPool();
  // Registrar uso para billing
  await trackKeyUsage(tenantId, 'platform_pool', costEstimate);
}
```

**Breaking Changes**:
- ❌ Billing por tenant (rastreamento de custos)
- ❌ Quotas por tenant (limitar uso)
- ❌ Pool de keys da plataforma para freemium tier

**Risco**: 🔴 CRÍTICO (custos de API, billing)

---

### 1.5 - enrichment-step-4-baseline-stats

**Propósito**: Step 4 - Calcula estatísticas de baseline (médias, medianas)

**Entrada**:
```typescript
POST /enrichment-step-4-baseline-stats
Body: {
  job_id: number,
  task_id: number,
  channel_id: string
}
```

**Fluxo**:
1. Busca TODOS os vídeos do canal em `benchmark_videos`
2. Calcula estatísticas:
   - Média de views
   - Mediana de views
   - Média de likes
   - etc.
3. Insere/atualiza em `benchmark_channels_baseline_stats`
4. Marca task como completed

**Tabelas Acessadas**:
- `benchmark_videos` (READ) - ⚠️ Precisa tenant_id
- `benchmark_channels_baseline_stats` (WRITE) - ⚠️ Precisa tenant_id
- `channel_enrichment_tasks` (WRITE) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:
```typescript
// ANTES (stats globais - ERRADO para multi-tenant!)
const { data: videos } = await supabase
  .from('benchmark_videos')
  .select('views, likes, comments')
  .eq('channel_id', channelId);

// DEPOIS (stats POR TENANT - correto!)
const { data: videos } = await supabase
  .from('benchmark_videos')
  .select('views, likes, comments')
  .eq('tenant_id', tenantId)  // ← ADICIONAR
  .eq('channel_id', channelId);

// CRÍTICO: Stats são DIFERENTES por tenant!
// Tenant A pode ter 100 vídeos do canal
// Tenant B pode ter 500 vídeos do canal
// As médias serão DIFERENTES!
```

**Breaking Changes**:
- ⚠️ **MUDANÇA DE LÓGICA**: Stats não são mais globais!
- ⚠️ Cada tenant terá suas próprias stats (correto para isolamento)
- ⚠️ Comparação entre tenants NÃO faz sentido

**Risco**: 🔴 CRÍTICO (mudança de lógica de negócio)

---

### 1.6 - enrichment-step-5-outlier-calc

**Propósito**: Step 5 - Calcula outliers (vídeos 10x+ acima da média)

**Entrada**:
```typescript
POST /enrichment-step-5-outlier-calc
Body: {
  job_id: number,
  task_id: number,
  channel_id: string
}
```

**Fluxo**:
1. Busca baseline stats de `benchmark_channels_baseline_stats`
2. Para cada vídeo em `benchmark_videos`:
   - Calcula ratio vs média
   - Calcula ratio vs mediana
   - Marca como outlier se > threshold
3. Atualiza `benchmark_videos` com ratios
4. Atualiza `channel_radar.has_10x_outlier` se houver outliers
5. Marca task como completed

**Tabelas Acessadas**:
- `benchmark_channels_baseline_stats` (READ) - ⚠️ Precisa tenant_id
- `benchmark_videos` (READ + WRITE) - ⚠️ Precisa tenant_id
- `channel_radar` (WRITE) - ⚠️ Precisa tenant_id
- `channel_enrichment_tasks` (WRITE) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:
- Similar ao step 4
- Depende de baseline stats (que mudam por tenant)
- Outliers são relativos ao tenant (correto)

**Risco**: 🟡 ALTO (depende de step 4)

---

## CATEGORIA 2: ORCHESTRATION

### 2.1 - enrichment-orchestrator

**Propósito**: Orquestra execução sequencial dos 5 steps

**Fluxo**:
1. Busca jobs pendentes em `channel_enrichment_jobs`
2. Para cada job:
   - Executa steps 1-5 em ordem
   - Espera cada step completar antes de próximo
   - Atualiza status do job
3. Marca job como completed

**Tabelas Acessadas**:
- `channel_enrichment_jobs` (READ + WRITE) - ⚠️ Precisa tenant_id
- `channel_enrichment_tasks` (READ + WRITE) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:
```typescript
// ANTES (processa TODOS os jobs globalmente)
const { data: pendingJobs } = await supabase
  .from('channel_enrichment_jobs')
  .select('*')
  .eq('status', 'pending')
  .limit(10);

// DEPOIS (processa jobs POR TENANT)
// OPÇÃO 1: Processa todos tenants de forma justa (round-robin)
const tenants = await getAllActiveTenants();
for (const tenant of tenants) {
  const { data: pendingJobs } = await supabase
    .from('channel_enrichment_jobs')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('status', 'pending')
    .limit(2);  // Limitar por tenant para justiça

  for (const job of pendingJobs) {
    await executeJob(job, tenant.id);
  }
}

// OPÇÃO 2: Fila global com prioridade por tenant
// (mais complexo, implementar depois se necessário)
```

**Breaking Changes**:
- ❌ Lógica de processamento muda (round-robin por tenant)
- ❌ Quotas por tenant (limitar jobs concorrentes)
- ❌ Priorização por tenant (premium vs free tier)

**Risco**: 🔴 CRÍTICO (coração do sistema)

---

### 2.2 - enrichment-radar-updater

**Propósito**: Cron job que atualiza canais no radar diariamente

**Fluxo**:
1. Busca canais ativos em `channel_radar`
2. Para cada canal, inicia pipeline de enrichment
3. Atualiza `channel_radar.last_update_at`

**Tabelas Acessadas**:
- `channel_radar` (READ + WRITE) - ⚠️ Precisa tenant_id
- `channel_radar_cron_log` (WRITE) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:
- Similar ao orchestrator
- Processa canais de TODOS os tenants
- Precisa round-robin por tenant

**Risco**: 🔴 ALTO (cron job global)

---

## CATEGORIA 3: VIDEO PROCESSING

### 3.1 - video-transcript

**Propósito**: Extrai transcrição de vídeos do YouTube

**Entrada**:
```typescript
POST /video-transcript
Body: {
  youtube_video_id: string
}
```

**Fluxo**:
1. Chama API do YouTube para buscar transcrição
2. Retorna transcrição em texto

**Tabelas Acessadas**:
- Nenhuma (função utilitária)

**Impacto Multi-Tenant**:
- ⚠️ Precisa rastrear usage por tenant (billing)
- ✅ Sem mudanças no código (stateless)

**Risco**: 🟢 BAIXO (stateless, mas billing)

---

### 3.2 - video-categorization-manager

**Propósito**: Gerencia categorização de vídeos

**Risco**: 🟡 MÉDIO (precisa análise detalhada - TBD)

---

### 3.3 - video-enrichment

**Propósito**: Enriquece vídeos com dados adicionais

**Risco**: 🟡 MÉDIO (precisa análise detalhada - TBD)

---

### 3.4 - video-queue-processor

**Propósito**: Processa fila de vídeos para enrichment

**Tabelas Acessadas**:
- `video_enrichment_queue` - ⚠️ Precisa tenant_id

**Risco**: 🟡 ALTO (processa fila)

---

### 3.5 - video-queue-cron

**Propósito**: Cron job da fila de vídeos

**Risco**: 🟡 ALTO (cron job)

---

### 3.6 - video-queue-callback

**Propósito**: Callback após processamento de vídeo

**Risco**: 🟢 MÉDIO

---

## CATEGORIA 4: PRODUCTION

### 4.1 - send-to-gobbi

**Propósito**: Envia vídeos selecionados para database de produção (Gobbi)

**Entrada**:
```typescript
POST /send-to-gobbi
Body: {
  webhook_id: number,
  video_ids: number[]
}
```

**Fluxo**:
1. Busca webhook em `production_webhooks`
2. Busca vídeos em `benchmark_videos`
3. Envia para webhook URL
4. Cria log em `webhook_logs`

**Tabelas Acessadas**:
- `production_webhooks` (READ) - ⚠️ Precisa tenant_id
- `benchmark_videos` (READ) - ⚠️ Precisa tenant_id
- `webhook_logs` (WRITE) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:
```typescript
// ANTES
const { data: webhook } = await supabase
  .from('production_webhooks')
  .select('*')
  .eq('id', webhookId)
  .single();

// DEPOIS
const { data: webhook } = await supabase
  .from('production_webhooks')
  .select('*')
  .eq('tenant_id', tenantId)  // ← ADICIONAR
  .eq('id', webhookId)
  .single();

// CRÍTICO: Tenant A NÃO pode usar webhooks do Tenant B!
```

**Breaking Changes**:
- ❌ Isolamento de webhooks por tenant
- ❌ Logs separados por tenant

**Risco**: 🔴 ALTO (recém implementado, isolamento crítico)

---

## CATEGORIA 5: UTILITIES

### 5.1 - test-socialblade-scraper

**Propósito**: Testa scraper do SocialBlade

**Impacto Multi-Tenant**: Nenhum (utilitário)

**Risco**: 🟢 BAIXO (teste)

---

### 5.2 - _run-migration

**Propósito**: Executa migrations

**Impacto Multi-Tenant**: Nenhum (utilitário)

**Risco**: 🟢 BAIXO (migration)

---

## 📊 RESUMO DE IMPACTO

### Por Risco:
- 🔴 CRÍTICO: 6 functions (35%)
  - enrichment-pipeline-starter
  - enrichment-step-1-categorization
  - enrichment-step-3-recent-videos
  - enrichment-step-4-baseline-stats
  - enrichment-orchestrator
  - send-to-gobbi

- 🟡 ALTO: 5 functions (29%)
  - enrichment-step-2-socialblade
  - enrichment-step-5-outlier-calc
  - enrichment-radar-updater
  - video-queue-processor
  - video-queue-cron

- 🟢 MÉDIO: 4 functions (24%)
  - video-categorization-manager
  - video-enrichment
  - video-queue-callback

- 🟢 BAIXO: 2 functions (12%)
  - video-transcript
  - test-socialblade-scraper
  - _run-migration

### Mudanças Necessárias:
- ✅ Adicionar extração de `tenant_id` de headers/JWT: 15 functions
- ✅ Adicionar filtros `tenant_id` em queries: 13 functions
- ✅ Credenciais por tenant: 2 functions (step-1, step-3)
- ✅ Billing/usage tracking: 3 functions (step-1, step-3, video-transcript)
- ✅ Lógica de processamento (round-robin): 2 functions (orchestrator, radar-updater)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

Para CADA Edge Function modificada:

- [ ] Adicionar extração de `tenant_id`:
  ```typescript
  const tenantId = req.headers.get('x-tenant-id') ||
                   await extractTenantFromJWT(req);
  if (!tenantId) throw new Error('Missing tenant_id');
  ```

- [ ] Adicionar validação de acesso:
  ```typescript
  const hasAccess = await verifyTenantAccess(tenantId, resourceId);
  if (!hasAccess) throw new Error('Unauthorized');
  ```

- [ ] Adicionar filtros em queries:
  ```typescript
  .eq('tenant_id', tenantId)
  ```

- [ ] Adicionar tenant_id em inserts:
  ```typescript
  .insert({ tenant_id: tenantId, ...data })
  ```

- [ ] Credenciais por tenant (se aplicável):
  ```typescript
  const apiKey = await getTenantCredential(tenantId, 'api_key_name');
  ```

- [ ] Usage tracking (se usa APIs pagas):
  ```typescript
  await trackApiUsage(tenantId, 'api_name', cost);
  ```

- [ ] Testes:
  - [ ] Teste com tenant válido
  - [ ] Teste sem tenant_id (deve falhar)
  - [ ] Teste com tenant_id errado (deve falhar)
  - [ ] Teste isolamento (tenant A não vê dados de B)

---

**Status**: 🟡 AUDITORIA EM PROGRESSO
**Próximo**: [03_SERVER_ACTIONS_AUDIT.md](./03_SERVER_ACTIONS_AUDIT.md)
