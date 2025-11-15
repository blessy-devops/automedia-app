# AUDITORIA: Server Actions para Multi-Tenancy

**Data**: 2025-11-15
**Objetivo**: Auditar TODAS as Server Actions, identificar queries que precisam de `tenant_id`

---

## 📋 RESUMO EXECUTIVO

**Total de Server Actions Files**: 10
**Total de Functions**: ~40+
**Functions que precisam de modificação**: ~35 (87%)
**Functions que NÃO precisam**: ~5 (apenas utilitárias)
**Risco Geral**: 🟡 ALTO

---

## METODOLOGIA

Para cada Server Action, documentar:

1. **Arquivo e Propósito**
2. **Functions Exportadas**
3. **Tabelas Acessadas** (reads e writes)
4. **Impacto Multi-Tenant**:
   - Onde adicionar tenant_id
   - Queries que mudam
   - Lógica que quebra
5. **Código Modificado** (antes/depois)
6. **Risco** (BAIXO / MÉDIO / ALTO / CRÍTICO)

---

## CATEGORIA 1: SETTINGS & CREDENTIALS (CRÍTICO)

### 1.1 - app/(dashboard)/settings/actions.ts

**Propósito**: Gerenciar API keys no Supabase Vault

**Functions Exportadas**:
- `saveRapidApiKey(apiKey: string)`
- `saveOpenRouterKey(apiKey: string)`
- `checkRapidApiKeyExists()`
- `checkOpenRouterKeyExists()`

**Tabelas Acessadas**:
- **Supabase Vault** (via RPC `insert_secret`, `list_secrets`)
- ⚠️ **PROBLEMA**: Vault é GLOBAL, não tem tenant_id!

**Impacto Multi-Tenant**:

```typescript
// ANTES (chave global no Vault)
const RAPID_API_SECRET_NAME = 'rapidapi_key_1760651731629'
const OPENROUTER_SECRET_NAME = 'openrouter_key_1760655833491'

export async function saveRapidApiKey(apiKey: string) {
  const supabase = createAdminClient()

  const { error } = await (supabase as any).rpc('insert_secret', {
    name: RAPID_API_SECRET_NAME,  // ← GLOBAL!
    secret: apiKey.trim(),
  })
}

// DEPOIS (chave POR TENANT em tabela nova)
// OPÇÃO 1: Criar tabela tenant_credentials
export async function saveRapidApiKey(apiKey: string) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { success: false, error: 'Not authenticated' }
  }

  // Salvar em tabela ao invés de Vault
  const { error } = await supabase
    .from('tenant_credentials')
    .upsert({
      tenant_id: tenantId,
      credential_type: 'rapidapi',
      credential_value: apiKey.trim(),  // ⚠️ Encrypt antes!
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'tenant_id,credential_type'
    })

  return { success: !error, error: error?.message }
}

// OPÇÃO 2: Vault com nomes por tenant
const SECRET_NAME = `tenant_${tenantId}_rapidapi_key`
```

**Breaking Changes**:
- ❌ **VAULT NÃO SUPORTA MULTI-TENANCY NATIVAMENTE**
- ❌ Precisa criar tabela `tenant_credentials`
- ❌ Precisa encriptar credenciais na tabela (não vai estar no Vault)
- ❌ Todas Edge Functions que usam Vault precisam mudar

**Risco**: 🔴 CRÍTICO (mudança de arquitetura de credenciais)

---

### 1.2 - app/(dashboard)/settings/webhooks/actions.ts

**Propósito**: CRUD de webhooks de produção

**Functions Exportadas**:
- `getWebhooks()`
- `getActiveWebhooks()`
- `getWebhook(id: number)`
- `createWebhook(data)`
- `updateWebhook(id, data)`
- `deleteWebhook(id)`
- `toggleWebhookStatus(id, is_active)`

**Tabelas Acessadas**:
- `production_webhooks` (READ + WRITE) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:

```typescript
// ANTES (webhooks globais - PERIGOSO!)
export async function getWebhooks() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('production_webhooks')
    .select('*')
    .order('created_at', { ascending: false })

  return { success: true, data, error: null }
}

// DEPOIS (webhooks POR TENANT)
export async function getWebhooks() {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { success: false, error: 'Not authenticated', data: null }
  }

  const { data, error } = await supabase
    .from('production_webhooks')
    .select('*')
    .eq('tenant_id', tenantId)  // ← ADICIONAR
    .order('created_at', { ascending: false })

  return { success: true, data, error: null }
}

// CREATE também precisa tenant_id
export async function createWebhook(data) {
  const tenantId = await getCurrentTenantId()

  const insertData = {
    tenant_id: tenantId,  // ← ADICIONAR
    name: data.name.trim(),
    webhook_url: data.webhook_url.trim(),
    // ...
  }

  const { data: webhook, error } = await supabase
    .from('production_webhooks')
    .insert(insertData)
    .select()
    .single()
}

// UPDATE/DELETE também precisam filtrar por tenant_id
export async function updateWebhook(id: number, data) {
  const tenantId = await getCurrentTenantId()

  const { data: webhook, error } = await supabase
    .from('production_webhooks')
    .update(updateData)
    .eq('tenant_id', tenantId)  // ← ADICIONAR (segurança!)
    .eq('id', id)
    .select()
    .single()
}
```

**Breaking Changes**:
- ❌ Tenant A NÃO pode ver/editar/deletar webhooks do Tenant B
- ❌ Unique constraint `unique_webhook_name` precisa incluir tenant_id
- ✅ RLS vai proteger automaticamente (se configurado)

**Risco**: 🔴 ALTO (isolamento crítico de webhooks)

---

## CATEGORIA 2: BENCHMARK & ENRICHMENT

### 2.1 - app/(dashboard)/benchmark/channels/actions.ts

**Propósito**: Iniciar pipeline de enrichment

**Functions Exportadas**:
- `startChannelBenchmark(channelId: string)`
- `getEnrichmentJobStatus(jobId: number)`

**Tabelas Acessadas**:
- `channel_enrichment_jobs` (WRITE) - ⚠️ Precisa tenant_id
- `channel_enrichment_tasks` (WRITE) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:

```typescript
// ANTES
export async function startChannelBenchmark(channelId: string) {
  const supabase = await createClient()

  const { data: job, error: jobError } = await supabase
    .from('channel_enrichment_jobs')
    .insert({
      channel_ids: [channelId],
      total_channels: 1,
      // ...
    })
    .select()
    .single()
}

// DEPOIS
export async function startChannelBenchmark(channelId: string) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: job, error: jobError } = await supabase
    .from('channel_enrichment_jobs')
    .insert({
      tenant_id: tenantId,  // ← ADICIONAR
      channel_ids: [channelId],
      total_channels: 1,
      // ...
    })
    .select()
    .single()

  // CRÍTICO: Passar tenant_id para Edge Function!
  const { error: invokeError } = await adminClient.functions.invoke(
    'enrichment-pipeline-starter',
    {
      headers: {
        'x-tenant-id': tenantId,  // ← ADICIONAR HEADER
      },
      body: {
        channelId,
        taskId: task.id,
      },
    }
  )
}

// getEnrichmentJobStatus também precisa filtrar
export async function getEnrichmentJobStatus(jobId: number) {
  const tenantId = await getCurrentTenantId()

  const { data: job, error } = await supabase
    .from('channel_enrichment_jobs')
    .select('*')
    .eq('tenant_id', tenantId)  // ← ADICIONAR (segurança!)
    .eq('id', jobId)
    .single()
}
```

**Breaking Changes**:
- ❌ Edge Functions precisam receber tenant_id via header
- ❌ Jobs de um tenant não podem ser vistos por outro

**Risco**: 🔴 ALTO (inicia pipeline crítico)

---

### 2.2 - app/(dashboard)/radar/actions.ts

**Propósito**: CRUD de canais no radar

**Functions Exportadas** (11 total):
- `addChannelToRadar(channelId, notes?)`
- `removeChannelFromRadar(channelId)`
- `bulkAddChannelsToRadar(channelIds[], notes?)`
- `getRadarChannels()`
- `triggerManualUpdate(channelId)`
- `toggleRadarActive(channelId, isActive)`
- `updateRadarNotes(channelId, notes)`
- `getRadarExecutionLogs(limit)`
- `getApproximateUpdateStats(...)`

**Tabelas Acessadas**:
- `channel_radar` (READ + WRITE) - ⚠️ Precisa tenant_id
- `channel_radar_cron_log` (READ) - ⚠️ Precisa tenant_id
- `benchmark_channels` (READ) - ⚠️ Precisa tenant_id
- `benchmark_videos` (READ) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:

```typescript
// ANTES
export async function addChannelToRadar(channelId: string, notes?: string) {
  const supabase = createAdminClient()  // ← Admin bypassa RLS!

  // Check if channel exists
  const { data: channel } = await supabase
    .from('benchmark_channels')
    .select('channel_id')
    .eq('channel_id', channelId)
    .single()

  const { data, error } = await supabase
    .from('channel_radar')
    .insert({
      channel_id: channelId,
      notes: notes || null,
    })
}

// DEPOIS
export async function addChannelToRadar(channelId: string, notes?: string) {
  const supabase = await createClient()  // ← NÃO usar admin!
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if channel exists FOR THIS TENANT
  const { data: channel } = await supabase
    .from('benchmark_channels')
    .select('channel_id')
    .eq('tenant_id', tenantId)  // ← ADICIONAR
    .eq('channel_id', channelId)
    .single()

  if (!channel) {
    return {
      success: false,
      error: 'Channel not found in your benchmark channels',
    }
  }

  const { data, error } = await supabase
    .from('channel_radar')
    .insert({
      tenant_id: tenantId,  // ← ADICIONAR
      channel_id: channelId,
      notes: notes || null,
    })
}

// getRadarChannels precisa filtrar
export async function getRadarChannels() {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from('channel_radar')
    .select(`
      id,
      channel_id,
      // ...
      benchmark_channels (
        id,
        channel_name,
        // ...
      )
    `)
    .eq('tenant_id', tenantId)  // ← ADICIONAR
    .eq('is_active', true)
    .order('added_at', { ascending: false })
}
```

**Breaking Changes**:
- ❌ **USAR createClient() ao invés de createAdminClient()**
  - AdminClient bypassa RLS (perigoso em multi-tenant!)
- ❌ Todas queries precisam filtrar por tenant_id
- ❌ `getApproximateUpdateStats` precisa filtrar vídeos por tenant

**Risco**: 🔴 ALTO (usa AdminClient, precisa mudar para user client)

---

## CATEGORIA 3: VIDEOS & FOLDERS

### 3.1 - app/(dashboard)/videos/actions.ts

**Propósito**: CRUD de pastas e vídeos

**Functions Exportadas** (16 total):
- `createFolder(data)`
- `updateFolder(folderId, data)`
- `deleteFolder(folderId, force?)`
- `addVideosToFolder(folderId, videoIds[])`
- `removeVideosFromFolder(folderId, videoIds[])`
- `getFolderTree()`
- `getFolderContents(folderId)`
- `getFolderPath(folderId)`
- `addVideoToQueue(videoId, channelId, ...)`
- `addMultipleVideosToQueue(videos[])`
- `processVideoQueue()`
- `deleteVideo(id)`
- `bulkDeleteVideos(ids[])`
- `sendVideosToProduction(videoIds[], webhookId)`

**Tabelas Acessadas**:
- `video_folders` (READ + WRITE) - ✅ **JÁ TEM RLS com user_id!**
- `video_folder_items` (READ + WRITE) - ⚠️ Precisa tenant_id
- `video_enrichment_queue` (WRITE) - ⚠️ Precisa tenant_id
- `benchmark_videos` (READ + WRITE) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:

```typescript
// ✅ FOLDER OPERATIONS - JÁ PRONTOS!
// video_folders já tem user_id e RLS configurado
// Apenas precisa adicionar tenant_id para completude

export async function createFolder(data) {
  const supabase = await createClient()
  const userId = await getCurrentUserId()  // ← Já faz isso!
  const tenantId = await getCurrentTenantId()  // ← Adicionar

  const { data: folder, error } = await supabase
    .from('video_folders')
    .insert({
      name: data.name.trim(),
      user_id: userId,  // ← Já existe
      tenant_id: tenantId,  // ← ADICIONAR
      // ...
    })
}

// ❌ VIDEO OPERATIONS - PRECISAM TENANT_ID
export async function deleteVideo(id: number) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()  // ← Adicionar

  // ANTES (qualquer user pode deletar qualquer vídeo!)
  const { data: video, error } = await supabase
    .from('benchmark_videos')
    .select('id, title')
    .eq('id', id)
    .single()

  // DEPOIS (só pode deletar vídeos do próprio tenant)
  const { data: video, error } = await supabase
    .from('benchmark_videos')
    .select('id, title')
    .eq('tenant_id', tenantId)  // ← ADICIONAR
    .eq('id', id)
    .single()

  // Delete também precisa filtrar
  const { error: deleteError } = await supabase
    .from('benchmark_videos')
    .delete()
    .eq('tenant_id', tenantId)  // ← ADICIONAR (segurança!)
    .eq('id', id)
}

// ❌ QUEUE OPERATIONS - PRECISAM TENANT_ID
export async function addVideoToQueue(videoId, channelId, ...) {
  const tenantId = await getCurrentTenantId()

  const { error } = await supabase
    .from('video_enrichment_queue')
    .insert({
      tenant_id: tenantId,  // ← ADICIONAR
      youtube_video_id: videoId,
      channel_id: channelId,
      // ...
    })
}

// ❌ PRODUCTION WEBHOOK - PRECISA TENANT_ID
export async function sendVideosToProduction(videoIds, webhookId) {
  const tenantId = await getCurrentTenantId()

  // Passar tenant_id para Edge Function
  const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
    headers: {
      'x-tenant-id': tenantId,  // ← ADICIONAR
    },
    body: {
      video_ids: videoIds,
      webhook_id: webhookId,  // Edge Function vai validar ownership
    },
  })
}
```

**Breaking Changes**:
- ✅ `video_folders` já está quase pronto (tem user_id + RLS)
- ❌ `benchmark_videos` precisa tenant_id em todas queries
- ❌ `video_enrichment_queue` precisa tenant_id
- ❌ Edge Function invocations precisam passar tenant_id

**Risco**: 🟡 MÉDIO (pastas já protegidas, vídeos precisam ajuste)

---

## CATEGORIA 4: DASHBOARD QUERIES

### 4.1 - lib/dashboard-queries.ts

**Propósito**: Queries para KPIs e stats da home

**Functions Exportadas**:
- `getDashboardKPIs()` - KPIs principais
- `getCloneWorthyVideos(limit)` - Top outliers
- `getTrendingNiches(limit)` - Nichos em alta
- `getRadarAlerts(limit)` - Alertas recentes

**Tabelas Acessadas**:
- `benchmark_videos` (READ) - ⚠️ Precisa tenant_id
- `benchmark_channels` (READ) - ⚠️ Precisa tenant_id
- `channel_radar` (READ) - ⚠️ Precisa tenant_id

**Impacto Multi-Tenant**:

```typescript
// ANTES (stats globais de TODOS os tenants!)
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase = await createClient()

  // Total 10x+ videos (TODOS os tenants!)
  const { count: total10xCount } = await supabase
    .from("benchmark_videos")
    .select("*", { count: "exact", head: true })
    .gte("performance_vs_avg_historical", 10)

  return {
    total10xVideos: total10xCount ?? 0,
    // ...
  }
}

// DEPOIS (stats POR TENANT)
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return {
      newOutliersThisWeek: 0,
      total10xVideos: 0,
      activeRadarChannels: 0,
      videosEnrichedToday: 0,
    }
  }

  // Total 10x+ videos DESTE TENANT
  const { count: total10xCount } = await supabase
    .from("benchmark_videos")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)  // ← ADICIONAR
    .gte("performance_vs_avg_historical", 10)
}

// getCloneWorthyVideos também precisa filtrar
export async function getCloneWorthyVideos(limit = 10) {
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from("benchmark_videos")
    .select(`
      youtube_video_id,
      title,
      // ...
      benchmark_channels!inner(channel_name)
    `)
    .eq("tenant_id", tenantId)  // ← ADICIONAR
    .gte("performance_vs_avg_historical", 5)
    .order("performance_vs_avg_historical", { ascending: false })
    .limit(limit)
}

// getTrendingNiches precisa filtrar
export async function getTrendingNiches(limit = 10) {
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from("benchmark_videos")
    .select("categorization, performance_vs_avg_historical")
    .eq("tenant_id", tenantId)  // ← ADICIONAR
    .gte("performance_vs_avg_historical", 5)
}

// getRadarAlerts precisa filtrar
export async function getRadarAlerts(limit = 10) {
  const tenantId = await getCurrentTenantId()

  const { data, error } = await supabase
    .from("benchmark_videos")
    .select(`
      youtube_video_id,
      // ...
      benchmark_channels!inner(
        channel_name,
        channel_radar!inner(is_active, last_update_at)
      )
    `)
    .eq("tenant_id", tenantId)  // ← ADICIONAR
    .gte("performance_vs_avg_historical", 5)
}
```

**Breaking Changes**:
- ❌ **TODAS as queries retornam dados GLOBAIS atualmente**
- ❌ Precisa filtrar por tenant_id em TODAS as 4 functions
- ❌ Stats mudam completamente (cada tenant vê apenas seus dados)

**Risco**: 🟡 MÉDIO (queries read-only, mas afeta UX)

---

## CATEGORIA 5: PRODUCTION VIDEOS (EXTERNO)

### 5.1 - app/actions/production-videos.ts

**Propósito**: Queries para banco do Gobbi (produção)

**Functions Exportadas**:
- `getProductionVideos(filters)`
- `getProductionVideoDetails(videoId)`
- `getProductionStats()`

**Tabelas Acessadas**:
- **BANCO EXTERNO** (Gobbi) via `gobbiClient`
- ⚠️ Precisa passar tenant_id para RPCs

**Impacto Multi-Tenant**:

```typescript
// ANTES (acessa banco do Gobbi sem tenant_id)
export async function getProductionVideos(filters = {}) {
  const { data, error } = await gobbiClient.rpc('get_production_videos_list', {
    p_status: status === 'all' ? null : status,
    p_search: search || null,
    p_page: page,
    p_per_page: perPage,
  })
}

// DEPOIS (passa tenant_id para RPC do Gobbi)
export async function getProductionVideos(filters = {}) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return {
      videos: [],
      total: 0,
      stats: { /* ... */ },
    }
  }

  // RPC do Gobbi precisa aceitar tenant_id
  const { data, error } = await gobbiClient.rpc('get_production_videos_list', {
    p_tenant_id: tenantId,  // ← ADICIONAR
    p_status: status === 'all' ? null : status,
    p_search: search || null,
    p_page: page,
    p_per_page: perPage,
  })
}
```

**Breaking Changes**:
- ❌ **BANCO DO GOBBI TAMBÉM PRECISA MULTI-TENANCY**
- ❌ Todas as RPCs do Gobbi precisam aceitar `p_tenant_id`
- ❌ Tabelas do banco Gobbi precisam ter `tenant_id`

**Risco**: 🔴 ALTO (sistema externo também precisa ser modificado!)

---

## 📊 RESUMO DE IMPACTO

### Por Categoria:

**1. Settings & Credentials** (2 files):
- 🔴 CRÍTICO: Vault não suporta multi-tenancy
- Precisa criar tabela `tenant_credentials`
- Encriptação de credenciais necessária

**2. Benchmark & Enrichment** (2 files):
- 🔴 ALTO: Precisam passar tenant_id para Edge Functions
- Todas queries precisam filtrar por tenant

**3. Videos & Folders** (1 file):
- 🟡 MÉDIO: Pastas já têm RLS
- Vídeos precisam tenant_id em queries

**4. Dashboard Queries** (1 file):
- 🟡 MÉDIO: Todas retornam dados globais
- Precisa filtrar por tenant em todas

**5. Production Videos** (1 file):
- 🔴 ALTO: Banco externo também precisa modificação

### Por Risco:

- 🔴 CRÍTICO: 3 arquivos (30%)
  - settings/actions.ts (Vault)
  - app/actions/production-videos.ts (banco externo)

- 🔴 ALTO: 3 arquivos (30%)
  - settings/webhooks/actions.ts
  - benchmark/channels/actions.ts
  - radar/actions.ts

- 🟡 MÉDIO: 4 arquivos (40%)
  - videos/actions.ts
  - dashboard-queries.ts
  - channels-v2/actions.ts
  - videos/[id]/actions.ts

### Mudanças Necessárias:

1. ✅ **Criar Helper getCurrentTenantId()**: Todas as ~40 functions precisam
2. ✅ **Adicionar tenant_id em queries**: ~90% das queries
3. ✅ **Passar tenant_id para Edge Functions**: Via header `x-tenant-id`
4. ✅ **Mudar de AdminClient para createClient()**: radar/actions.ts
5. ✅ **Criar tabela tenant_credentials**: Substituir Vault
6. ✅ **Modificar banco do Gobbi**: Adicionar tenant_id lá também

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. Uso de AdminClient (Bypassa RLS)

**Arquivo**: `radar/actions.ts`

```typescript
// ❌ PROBLEMA
const supabase = createAdminClient()  // Bypassa RLS!

// ✅ SOLUÇÃO
const supabase = await createClient()  // Respeita RLS
const tenantId = await getCurrentTenantId()
```

### 2. Supabase Vault Não Tem Multi-Tenancy

**Arquivo**: `settings/actions.ts`

**Problema**: Vault armazena secrets globalmente, sem isolamento por tenant.

**Soluções**:

**OPÇÃO 1**: Criar tabela `tenant_credentials`
```sql
CREATE TABLE tenant_credentials (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  credential_type VARCHAR(50) NOT NULL,  -- 'rapidapi', 'openrouter', etc
  credential_value TEXT NOT NULL,  -- ENCRYPTED!
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, credential_type)
);

-- RLS
ALTER TABLE tenant_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant credentials"
  ON tenant_credentials
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
```

**OPÇÃO 2**: Vault com nomes dinâmicos
```typescript
const SECRET_NAME = `tenant_${tenantId}_rapidapi_key`
```
⚠️ Mas Vault tem limites de secrets (1000?)

**Recomendação**: OPÇÃO 1 (tabela dedicada com encriptação)

### 3. Banco do Gobbi (Produção)

**Arquivo**: `app/actions/production-videos.ts`

**Problema**: Banco do Gobbi é SEPARADO e também precisa de multi-tenancy.

**Impacto**:
- Todas RPCs precisam aceitar `tenant_id`
- Tabelas do Gobbi precisam ter `tenant_id`
- Pode ser um projeto separado (fora do escopo?)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

Para CADA Server Action modificada:

### 1. Adicionar Helper de Tenant
```typescript
import { getCurrentTenantId } from '@/lib/auth-helpers'

export async function myAction() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { success: false, error: 'Not authenticated' }
  }
}
```

### 2. Filtrar Queries por Tenant
```typescript
// SELECT
.eq('tenant_id', tenantId)

// INSERT
.insert({ tenant_id: tenantId, ...data })

// UPDATE (segurança!)
.update(data)
.eq('tenant_id', tenantId)
.eq('id', resourceId)

// DELETE (segurança!)
.delete()
.eq('tenant_id', tenantId)
.eq('id', resourceId)
```

### 3. Edge Function Invocations
```typescript
await supabase.functions.invoke('function-name', {
  headers: {
    'x-tenant-id': tenantId,  // ← Passar tenant_id
  },
  body: { /* ... */ }
})
```

### 4. Substituir AdminClient
```typescript
// ❌ ANTES
const supabase = createAdminClient()

// ✅ DEPOIS
const supabase = await createClient()
const tenantId = await getCurrentTenantId()
```

### 5. Testes
- [ ] Teste com tenant válido (deve funcionar)
- [ ] Teste sem tenant_id (deve falhar gracefully)
- [ ] Teste acessar recurso de outro tenant (deve retornar 404/unauthorized)
- [ ] Teste criação de recurso (deve ter tenant_id)
- [ ] Teste listagem (deve retornar apenas recursos do tenant)

---

## 🔄 ORDEM DE IMPLEMENTAÇÃO

**Fase 1** (Fundação):
1. Criar helper `getCurrentTenantId()`
2. Criar tabela `tenant_credentials`
3. Migrar credenciais do Vault para tabela

**Fase 2** (Core Queries):
1. `dashboard-queries.ts` (read-only, menos risco)
2. `videos/actions.ts` (já tem RLS em folders)
3. `settings/webhooks/actions.ts`

**Fase 3** (Enrichment Pipeline):
1. `benchmark/channels/actions.ts`
2. `radar/actions.ts` (substituir AdminClient!)

**Fase 4** (Settings & Credentials):
1. `settings/actions.ts` (mudar de Vault para tabela)

**Fase 5** (External - Opcional):
1. `app/actions/production-videos.ts` (banco do Gobbi)

---

**Status**: 🟡 AUDITORIA COMPLETA
**Próximo**: [04_CREDENTIALS_MAPPING.md](./04_CREDENTIALS_MAPPING.md)
