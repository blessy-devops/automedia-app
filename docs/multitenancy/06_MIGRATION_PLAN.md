# PLANO DE MIGRAÇÃO INCREMENTAL

**Data**: 2025-11-15
**Objetivo**: Plano DETALHADO de migração com ZERO breaking changes até fase final

---

## 🎯 PRINCÍPIO FUNDAMENTAL

**ZERO breaking changes até que TUDO esteja pronto e testado**

Estratégia:
1. Adicionar campos `NULLABLE` primeiro
2. Backfill dados com tenant "Legacy"
3. Habilitar RLS em modo READ-ONLY
4. Refatorar código incrementalmente
5. Habilitar RLS para WRITE apenas no final
6. Cada fase tem ROLLBACK plan

---

## 📊 OVERVIEW DAS FASES

| Fase | Nome | Duração | Pode Reverter? | Breaking? |
|------|------|---------|----------------|-----------|
| 0 | Setup | 3-5 dias | ✅ Sim | ❌ Não |
| 1 | Database Schema | 5-7 dias | ✅ Sim | ❌ Não |
| 2 | RLS Policies | 3-5 dias | ✅ Sim | ❌ Não |
| 3 | Credentials Migration | 3-5 dias | ✅ Sim | ⚠️ Parcial |
| 4 | Server Actions | 5-7 dias | ⚠️ Difícil | ⚠️ Sim |
| 5 | Edge Functions | 7-10 dias | ⚠️ Difícil | ⚠️ Sim |
| 6 | Frontend | 5-7 dias | ✅ Sim | ❌ Não |
| 7 | Testing & QA | 7-10 dias | N/A | ❌ Não |
| 8 | Launch | 2-3 dias | ❌ Não | ✅ Sim |

**Total**: 6-8 semanas

---

## 🚀 FASE 0: SETUP (3-5 dias)

### Objetivo
Preparar infraestrutura sem afetar código existente

### Tarefas

#### 0.1 - Criar Tabela `tenants`

```sql
-- Migration: 20251115_create_tenants.sql
BEGIN;

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,  -- URL-friendly: 'acme-corp'

  -- Settings
  tier VARCHAR(50) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT true,

  -- Branding (brand bibbles)
  brand_config JSONB DEFAULT '{}'::jsonb,
  -- Ex: { "logo_url": "...", "primary_color": "#...", "name": "Canal Dark" }

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CHECK (name <> ''),
  CHECK (slug ~ '^[a-z0-9-]+$')  -- Apenas lowercase, números e hífens
);

-- Indexes
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed tenant "Legacy" (dados existentes)
INSERT INTO tenants (id, name, slug, tier, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Legacy',
  'legacy',
  'enterprise',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

#### 0.2 - Criar Tabela `tenant_members`

```sql
-- Migration: 20251115_create_tenant_members.sql
BEGIN;

CREATE TABLE IF NOT EXISTS tenant_members (
  id SERIAL PRIMARY KEY,

  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (
    role IN ('owner', 'admin', 'member', 'viewer')
  ),

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'invited', 'suspended')
  ),

  -- Audit
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX idx_tenant_members_role ON tenant_members(role);

-- RLS Policies
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- Users can see members of their tenant
CREATE POLICY "Users can view their tenant members"
  ON tenant_members
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );

-- Only owners/admins can manage members
CREATE POLICY "Owners can manage members"
  ON tenant_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM tenant_members tm
      WHERE tm.tenant_id = tenant_members.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

COMMIT;
```

#### 0.3 - Criar Helper `getCurrentTenantId()`

```typescript
// lib/auth-helpers.ts
'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get the current authenticated user's tenant ID
 *
 * @returns Tenant UUID or null if not authenticated or not a member of any tenant
 */
export async function getCurrentTenantId(): Promise<string | null> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    // Get user's tenant membership
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      console.warn('[getCurrentTenantId] User has no active tenant membership:', user.id)
      return null
    }

    return membership.tenant_id
  } catch (error) {
    console.error('[getCurrentTenantId] Error:', error)
    return null
  }
}

/**
 * Get current tenant details
 */
export async function getCurrentTenant() {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return null

  const supabase = await createClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error) {
    console.error('[getCurrentTenant] Error:', error)
    return null
  }

  return tenant
}

/**
 * Check if current user is owner/admin of their tenant
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    return membership?.role === 'owner' || membership?.role === 'admin'
  } catch {
    return false
  }
}
```

#### 0.4 - Criar Feature Flag

```typescript
// lib/feature-flags.ts
/**
 * Feature flags for gradual rollout
 */

export const FEATURES = {
  MULTI_TENANT_ENABLED: process.env.NEXT_PUBLIC_ENABLE_MULTI_TENANT === 'true',
  MULTI_TENANT_WRITE_ENABLED: process.env.NEXT_PUBLIC_ENABLE_MULTI_TENANT_WRITE === 'true',
  TENANT_CREDENTIALS_ENABLED: process.env.NEXT_PUBLIC_ENABLE_TENANT_CREDENTIALS === 'true',
} as const

/**
 * Helper to check if multi-tenant mode is fully enabled
 */
export function isMultiTenantMode(): boolean {
  return FEATURES.MULTI_TENANT_ENABLED && FEATURES.MULTI_TENANT_WRITE_ENABLED
}
```

```bash
# .env.local
NEXT_PUBLIC_ENABLE_MULTI_TENANT=false
NEXT_PUBLIC_ENABLE_MULTI_TENANT_WRITE=false
NEXT_PUBLIC_ENABLE_TENANT_CREDENTIALS=false
```

### Checkpoint Fase 0

**Verificações**:
- [ ] Tabela `tenants` criada
- [ ] Tabela `tenant_members` criada
- [ ] Tenant "Legacy" existe
- [ ] Helper `getCurrentTenantId()` implementado
- [ ] Feature flags configurados (todos `false`)

**App Status**: ✅ **100% funcional** (nenhuma mudança visível)

**Rollback**: DROP TABLE tenant_members, tenants CASCADE

---

## 🗄️ FASE 1: DATABASE SCHEMA (5-7 dias)

### Objetivo
Adicionar `tenant_id NULLABLE` em todas as tabelas sem quebrar nada

### Tarefas

#### 1.1 - Adicionar tenant_id em benchmark_channels

```sql
-- Migration: 20251116_add_tenant_id_to_benchmark_channels.sql
BEGIN;

-- Add column (NULLABLE first!)
ALTER TABLE benchmark_channels
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_benchmark_channels_tenant
  ON benchmark_channels(tenant_id);

-- Backfill with Legacy tenant
UPDATE benchmark_channels
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE tenant_id IS NULL;

-- ⚠️ NÃO tornar NOT NULL ainda! Esperar Fase 2

COMMIT;
```

#### 1.2 - Adicionar tenant_id em benchmark_videos

```sql
-- Migration: 20251116_add_tenant_id_to_benchmark_videos.sql
BEGIN;

ALTER TABLE benchmark_videos
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_benchmark_videos_tenant
  ON benchmark_videos(tenant_id);

-- Backfill via join com benchmark_channels
UPDATE benchmark_videos bv
SET tenant_id = bc.tenant_id
FROM benchmark_channels bc
WHERE bv.channel_id = bc.channel_id
  AND bv.tenant_id IS NULL;

-- Videos órfãos (sem canal) vão para Legacy
UPDATE benchmark_videos
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE tenant_id IS NULL;

COMMIT;
```

#### 1.3 - Repetir para TODAS as 13 tabelas

**Ordem de execução** (respeitar foreign keys):

1. ✅ `benchmark_channels` (raiz)
2. ✅ `benchmark_videos` (depende de channels)
3. ✅ `benchmark_channels_baseline_stats`
4. ✅ `channel_enrichment_jobs`
5. ✅ `channel_enrichment_tasks` (depende de jobs)
6. ✅ `video_enrichment_queue`
7. ✅ `channel_radar`
8. ✅ `channel_radar_cron_log`
9. ✅ `production_webhooks`
10. ✅ `webhook_logs`
11. ✅ `video_folders` (já tem user_id)
12. ✅ `video_folder_items`
13. ✅ `structure_api_keys_pool` (opcional)

**Template para cada tabela**:
```sql
BEGIN;

-- 1. Add column
ALTER TABLE {table_name}
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_{table_name}_tenant
  ON {table_name}(tenant_id);

-- 3. Backfill (lógica específica por tabela)
UPDATE {table_name}
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE tenant_id IS NULL;

COMMIT;
```

#### 1.4 - Recriar Unique Constraints

```sql
-- Migration: 20251117_update_unique_constraints.sql
BEGIN;

-- benchmark_channels: channel_id deve ser único POR TENANT
ALTER TABLE benchmark_channels
DROP CONSTRAINT IF EXISTS benchmark_channels_channel_id_key;

ALTER TABLE benchmark_channels
ADD CONSTRAINT benchmark_channels_tenant_channel_unique
  UNIQUE (tenant_id, channel_id);

-- benchmark_videos: youtube_video_id deve ser único POR TENANT
ALTER TABLE benchmark_videos
DROP CONSTRAINT IF EXISTS benchmark_videos_youtube_video_id_key;

ALTER TABLE benchmark_videos
ADD CONSTRAINT benchmark_videos_tenant_video_unique
  UNIQUE (tenant_id, youtube_video_id);

-- channel_radar: channel_id único POR TENANT
ALTER TABLE channel_radar
DROP CONSTRAINT IF EXISTS channel_radar_channel_id_key;

ALTER TABLE channel_radar
ADD CONSTRAINT channel_radar_tenant_channel_unique
  UNIQUE (tenant_id, channel_id);

-- production_webhooks: name único POR TENANT
ALTER TABLE production_webhooks
DROP CONSTRAINT IF EXISTS unique_webhook_name;

ALTER TABLE production_webhooks
ADD CONSTRAINT production_webhooks_tenant_name_unique
  UNIQUE (tenant_id, name);

-- video_folder_items: folder_id + video_id únicos
ALTER TABLE video_folder_items
DROP CONSTRAINT IF EXISTS video_folder_items_folder_id_video_id_key;

ALTER TABLE video_folder_items
ADD CONSTRAINT video_folder_items_unique
  UNIQUE (folder_id, video_id);  -- Folder já tem tenant via RLS

COMMIT;
```

### Checkpoint Fase 1

**Verificações**:
- [ ] Todas 13 tabelas têm coluna `tenant_id`
- [ ] Todos registros têm `tenant_id = 'legacy'`
- [ ] Indexes criados
- [ ] Unique constraints atualizados
- [ ] `SELECT COUNT(*) FROM {table} WHERE tenant_id IS NULL` retorna 0

**App Status**: ✅ **100% funcional** (tenant_id ainda é NULLABLE, queries antigas funcionam)

**Rollback**:
```sql
-- Reverter unique constraints
-- Remover coluna tenant_id
ALTER TABLE benchmark_channels DROP COLUMN tenant_id;
-- (repetir para todas tabelas)
```

---

## 🔒 FASE 2: RLS POLICIES (3-5 dias)

### Objetivo
Habilitar RLS em modo READ-ONLY (não quebra writes)

### Tarefas

#### 2.1 - Tornar tenant_id NOT NULL

```sql
-- Migration: 20251118_make_tenant_id_not_null.sql
BEGIN;

-- Validação: garantir que NÃO há NULLs
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM benchmark_channels
  WHERE tenant_id IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Found % NULL tenant_ids in benchmark_channels. Fix before continuing.', null_count;
  END IF;
END $$;

-- Se passou na validação, tornar NOT NULL
ALTER TABLE benchmark_channels
ALTER COLUMN tenant_id SET NOT NULL;

-- Repetir para todas as 13 tabelas...

COMMIT;
```

#### 2.2 - Criar RLS Policies (READ-ONLY)

**Template para cada tabela**:

```sql
-- Migration: 20251118_rls_policies_benchmark_channels.sql
BEGIN;

-- Enable RLS
ALTER TABLE benchmark_channels ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT (leitura)
CREATE POLICY "Users can view their tenant channels"
  ON benchmark_channels
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
        AND status = 'active'
      LIMIT 1
    )
  );

-- ⚠️ NÃO criar policies para INSERT/UPDATE/DELETE ainda!
-- Deixar PERMISSIVE para não quebrar código existente

COMMIT;
```

**Aplicar em todas as tabelas**:
1. ✅ benchmark_channels
2. ✅ benchmark_videos
3. ✅ benchmark_channels_baseline_stats
4. ✅ channel_enrichment_jobs
5. ✅ channel_enrichment_tasks
6. ✅ video_enrichment_queue
7. ✅ channel_radar
8. ✅ channel_radar_cron_log
9. ✅ production_webhooks
10. ✅ webhook_logs
11. ✅ video_folders (atualizar policy existente)
12. ✅ video_folder_items

#### 2.3 - Atualizar video_folders (já tem RLS)

```sql
-- Migration: 20251118_update_video_folders_rls.sql
BEGIN;

-- Remover policy antiga
DROP POLICY IF EXISTS "Users can manage their own folders" ON video_folders;

-- Nova policy: usuários do mesmo tenant
CREATE POLICY "Users can view their tenant folders"
  ON video_folders
  FOR SELECT
  USING (
    -- Opção 1: Via tenant_id direto
    tenant_id = (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
    )
    -- Opção 2: Via user_id (mais restritivo)
    OR user_id = auth.uid()
  );

-- Writes ainda não controlados (vem na Fase 4)

COMMIT;
```

### Checkpoint Fase 2

**Verificações**:
- [ ] Todas tabelas têm `tenant_id NOT NULL`
- [ ] RLS habilitado em todas tabelas
- [ ] Policies de SELECT criadas
- [ ] Policies de INSERT/UPDATE/DELETE NÃO criadas (permissivo)

**App Status**: ✅ **100% funcional**
- SELECTs agora filtram por tenant (mas apenas 1 tenant existe: Legacy)
- INSERTs/UPDATEs/DELETEs ainda funcionam (sem policy = permissivo)

**Rollback**:
```sql
-- Desabilitar RLS
ALTER TABLE benchmark_channels DISABLE ROW LEVEL SECURITY;
-- Tornar tenant_id NULLABLE novamente
ALTER TABLE benchmark_channels ALTER COLUMN tenant_id DROP NOT NULL;
```

---

## 🔑 FASE 3: CREDENTIALS MIGRATION (3-5 dias)

### Objetivo
Migrar credenciais do Vault para tabela `tenant_credentials`

### Tarefas

#### 3.1 - Criar Tabela tenant_credentials

```sql
-- Migration: 20251119_create_tenant_credentials.sql
BEGIN;

-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table
CREATE TABLE tenant_credentials (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  credential_type VARCHAR(50) NOT NULL CHECK (
    credential_type IN ('rapidapi', 'openrouter', 'custom_api', 'webhook_secret')
  ),

  credential_value TEXT NOT NULL,  -- Encrypted with pgcrypto

  -- Quotas
  usage_quota INTEGER,  -- NULL = unlimited
  usage_current INTEGER DEFAULT 0,
  usage_reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(tenant_id, credential_type)
);

CREATE INDEX idx_tenant_creds_tenant ON tenant_credentials(tenant_id);

-- RLS
ALTER TABLE tenant_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant credentials"
  ON tenant_credentials
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );

COMMIT;
```

#### 3.2 - Criar SQL Functions

```sql
-- Migration: 20251119_credential_functions.sql
BEGIN;

-- Set encryption key (call once per session)
-- ⚠️ ENCRYPTION_KEY deve estar em environment variable
CREATE OR REPLACE FUNCTION set_encryption_key()
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.encryption_key', current_setting('env.ENCRYPTION_KEY'), false);
END;
$$ LANGUAGE plpgsql;

-- Upsert credential (encrypted)
CREATE OR REPLACE FUNCTION upsert_tenant_credential(
  p_tenant_id UUID,
  p_credential_type VARCHAR,
  p_credential_value TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO tenant_credentials (tenant_id, credential_type, credential_value)
  VALUES (
    p_tenant_id,
    p_credential_type,
    pgp_sym_encrypt(p_credential_value, current_setting('app.encryption_key'))
  )
  ON CONFLICT (tenant_id, credential_type)
  DO UPDATE SET
    credential_value = pgp_sym_encrypt(p_credential_value, current_setting('app.encryption_key')),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get credential (decrypted)
CREATE OR REPLACE FUNCTION get_tenant_credential(
  p_tenant_id UUID,
  p_credential_type VARCHAR
)
RETURNS TABLE (
  credential_type VARCHAR,
  decrypted_value TEXT,
  usage_quota INTEGER,
  usage_current INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.credential_type,
    pgp_sym_decrypt(tc.credential_value::bytea, current_setting('app.encryption_key')) AS decrypted_value,
    tc.usage_quota,
    tc.usage_current
  FROM tenant_credentials tc
  WHERE tc.tenant_id = p_tenant_id
    AND tc.credential_type = p_credential_type
    AND tc.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
```

#### 3.3 - Migrar Credenciais Existentes

```typescript
// scripts/migrate-credentials.ts
import { createClient } from '@supabase/supabase-js'

const LEGACY_TENANT_ID = '00000000-0000-0000-0000-000000000000'

async function migrateCredentials() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🔑 Migrating credentials from Vault to tenant_credentials...')

  // 1. Get credentials from Vault
  const { data: secrets } = await (supabase as any).rpc('list_secrets')

  const rapidApiSecret = secrets.find((s: any) =>
    s.name === 'rapidapi_key_1760651731629'
  )
  const openRouterSecret = secrets.find((s: any) =>
    s.name === 'openrouter_key_1760655833491'
  )

  // 2. Get decrypted values (only possible with service role)
  const rapidApiKey = rapidApiSecret ? await getVaultSecret('rapidapi_key_1760651731629') : null
  const openRouterKey = openRouterSecret ? await getVaultSecret('openrouter_key_1760655833491') : null

  // 3. Insert into tenant_credentials (encrypted)
  if (rapidApiKey) {
    await supabase.rpc('upsert_tenant_credential', {
      p_tenant_id: LEGACY_TENANT_ID,
      p_credential_type: 'rapidapi',
      p_credential_value: rapidApiKey,
    })
    console.log('✅ Migrated Rapid API key')
  }

  if (openRouterKey) {
    await supabase.rpc('upsert_tenant_credential', {
      p_tenant_id: LEGACY_TENANT_ID,
      p_credential_type: 'openrouter',
      p_credential_value: openRouterKey,
    })
    console.log('✅ Migrated OpenRouter key')
  }

  console.log('✅ Credentials migration complete!')
}

migrateCredentials().catch(console.error)
```

```bash
# Run migration
tsx scripts/migrate-credentials.ts
```

#### 3.4 - Atualizar Server Actions (Settings)

```typescript
// app/(dashboard)/settings/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentTenantId } from '@/lib/auth-helpers'

export async function saveRapidApiKey(apiKey: string) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate key (optional)
  // const isValid = await validateRapidApiKey(apiKey)
  // if (!isValid) return { success: false, error: 'Invalid API key' }

  // Save encrypted credential
  const { error } = await supabase.rpc('upsert_tenant_credential', {
    p_tenant_id: tenantId,
    p_credential_type: 'rapidapi',
    p_credential_value: apiKey,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Similar for saveOpenRouterKey, etc
```

### Checkpoint Fase 3

**Verificações**:
- [ ] Tabela `tenant_credentials` criada
- [ ] SQL functions criadas
- [ ] Credenciais migradas do Vault
- [ ] Server Actions atualizadas
- [ ] ⚠️ **BREAKING**: Settings UI vai tentar salvar no Vault (vai falhar)

**App Status**: ⚠️ **Parcialmente funcional**
- Enrichment ainda usa Vault (vai funcionar)
- Settings UI não funciona (ainda não atualizada)

**Rollback**: Reverter Server Actions para usar Vault

---

## 🔄 FASE 4: SERVER ACTIONS (5-7 dias)

### Objetivo
Refatorar TODAS as Server Actions para usar `tenant_id`

### Tarefas

Refatorar 1 arquivo por vez, testar, depois próximo.

**Ordem recomendada** (do menos crítico ao mais crítico):

#### 4.1 - lib/dashboard-queries.ts (READ-ONLY)

```typescript
// ANTES
export async function getDashboardKPIs() {
  const supabase = await createClient()

  const { count: total10xCount } = await supabase
    .from("benchmark_videos")
    .select("*", { count: "exact", head: true })
    .gte("performance_vs_avg_historical", 10)
}

// DEPOIS
export async function getDashboardKPIs() {
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

  const { count: total10xCount } = await supabase
    .from("benchmark_videos")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)  // ← ADICIONAR
    .gte("performance_vs_avg_historical", 10)
}
```

**Testar**:
```typescript
// Test isolamento
const kpis = await getDashboardKPIs()
expect(kpis.total10xVideos).toBe(expectedForLegacyTenant)
```

#### 4.2 - app/(dashboard)/videos/actions.ts

**Ações mais críticas**:
- `deleteVideo()` - PRECISA filtrar por tenant!
- `sendVideosToProduction()` - Passar tenant_id para Edge Function

```typescript
export async function deleteVideo(id: number) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get video (with tenant filter!)
  const { data: video, error } = await supabase
    .from('benchmark_videos')
    .select('id, title')
    .eq('tenant_id', tenantId)  // ← SEGURANÇA!
    .eq('id', id)
    .single()

  if (!video) {
    return { success: false, error: 'Video not found' }
  }

  // Delete (também filtrar!)
  const { error: deleteError } = await supabase
    .from('benchmark_videos')
    .delete()
    .eq('tenant_id', tenantId)  // ← SEGURANÇA!
    .eq('id', id)

  return { success: !deleteError }
}
```

#### 4.3 - app/(dashboard)/radar/actions.ts

**IMPORTANTE**: Substituir `createAdminClient()` por `createClient()`!

```typescript
// ANTES (PERIGOSO!)
export async function addChannelToRadar(channelId: string) {
  const supabase = createAdminClient()  // ❌ Bypassa RLS!
}

// DEPOIS (SEGURO)
export async function addChannelToRadar(channelId: string) {
  const supabase = await createClient()  // ✅ Respeita RLS
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { success: false, error: 'Not authenticated' }
  }

  // ... resto do código
}
```

#### 4.4 - Repetir para TODOS os arquivos

**Checklist para cada Server Action**:
- [ ] Importa `getCurrentTenantId()`
- [ ] Chama `getCurrentTenantId()` no início
- [ ] Valida `if (!tenantId)` e retorna erro
- [ ] Adiciona `.eq('tenant_id', tenantId)` em SELECTs
- [ ] Adiciona `tenant_id: tenantId` em INSERTs
- [ ] Adiciona `.eq('tenant_id', tenantId)` em UPDATEs (segurança!)
- [ ] Adiciona `.eq('tenant_id', tenantId)` em DELETEs (segurança!)
- [ ] Não usa `createAdminClient()`
- [ ] Testa isolamento

### Checkpoint Fase 4

**Verificações**:
- [ ] Todas Server Actions refatoradas
- [ ] Tests de isolamento passam
- [ ] Nenhum `createAdminClient()` em código de produção
- [ ] Logs não expõem credenciais

**App Status**: ⚠️ **Funcional mas com breaking changes**
- SELECTs filtram por tenant
- INSERTs/UPDATEs/DELETEs exigem tenant_id
- Edge Functions ainda não atualizadas (podem falhar)

**Rollback**: Difícil (precisa reverter código)

---

## ⚡ FASE 5: EDGE FUNCTIONS (7-10 dias)

### Objetivo
Refatorar TODAS as 17 Edge Functions

### Tarefas

**Ordem recomendada**:

1. ✅ Utilities (não críticas)
2. ✅ Video Processing (médio risco)
3. ✅ Enrichment Pipeline (alto risco)
4. ✅ Orchestration (crítico)

#### 5.1 - Template para Edge Functions

```typescript
// supabase/functions/{function-name}/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  // 1. Extract tenant_id from header or JWT
  const tenantId = req.headers.get('x-tenant-id')

  if (!tenantId) {
    return new Response(
      JSON.stringify({ error: 'Missing tenant_id' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 2. Validate tenant_id (check JWT claims)
  // const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  // const decoded = decodeJwt(jwt)
  // if (decoded.tenant_id !== tenantId) {
  //   return new Response('Invalid tenant_id', { status: 403 })
  // }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 3. All queries must filter by tenant_id
  const { data: channels } = await supabase
    .from('benchmark_channels')
    .select('*')
    .eq('tenant_id', tenantId)  // ← SEMPRE!
    .limit(10)

  // 4. Credentials: try tenant first, fallback to pool
  let apiKey = await getTenantCredential(supabase, tenantId, 'rapidapi')

  if (!apiKey) {
    const quota = await checkQuota(supabase, tenantId, 'rapidapi')

    if (!quota.available) {
      return new Response(
        JSON.stringify({
          error: 'Quota exceeded',
          quota: quota,
        }),
        { status: 429 }
      )
    }

    apiKey = await getPlatformPoolKey(supabase, 'rapidapi')
    // Track usage
    await trackUsage(supabase, tenantId, 'rapidapi', 1, 0.005)
  }

  // ... rest of function logic
})
```

#### 5.2 - Refatorar Enrichment Pipeline (CRÍTICO)

**enrichment-pipeline-starter**:
```typescript
Deno.serve(async (req) => {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) {
    return new Response('Missing tenant_id', { status: 401 })
  }

  const { channelId, taskId } = await req.json()

  const supabase = createClient(...)

  // Validate channel belongs to tenant
  const { data: channel } = await supabase
    .from('benchmark_channels')
    .select('*')
    .eq('tenant_id', tenantId)  // ← VALIDAR!
    .eq('channel_id', channelId)
    .single()

  if (!channel) {
    return new Response('Channel not found or unauthorized', { status: 404 })
  }

  // Create job
  const { data: job } = await supabase
    .from('channel_enrichment_jobs')
    .insert({
      tenant_id: tenantId,  // ← ADICIONAR
      channel_ids: [channelId],
      status: 'pending',
    })
    .select()
    .single()

  // ... continue pipeline
})
```

**enrichment-step-1-categorization** (usa OpenRouter):
```typescript
Deno.serve(async (req) => {
  const tenantId = req.headers.get('x-tenant-id')
  const { jobId, taskId, channelId } = await req.json()

  const supabase = createClient(...)

  // Get tenant credential
  let openRouterKey = await getTenantCredential(supabase, tenantId, 'openrouter')

  if (!openRouterKey) {
    // Fallback to platform pool
    const quota = await checkQuota(supabase, tenantId, 'openrouter')
    if (!quota.available) {
      return new Response('Quota exceeded', { status: 429 })
    }

    openRouterKey = await getPlatformPoolKey(supabase, 'openrouter')
  }

  // Call OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ /* ... */ }),
  })

  // Track usage if using platform pool
  if (!await getTenantCredential(supabase, tenantId, 'openrouter')) {
    await trackUsage(supabase, tenantId, 'openrouter', 1, 0.01)
  }

  // ... rest
})
```

#### 5.3 - Refatorar Orchestrator (CRÍTICO)

**enrichment-orchestrator** (round-robin por tenant):

```typescript
Deno.serve(async (req) => {
  const supabase = createClient(...)

  // Get all active tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('is_active', true)

  console.log(`Processing enrichment for ${tenants.length} tenants`)

  const results = []

  // Round-robin: Process N jobs per tenant
  for (const tenant of tenants) {
    const { data: pendingJobs } = await supabase
      .from('channel_enrichment_jobs')
      .select('*')
      .eq('tenant_id', tenant.id)  // ← POR TENANT
      .eq('status', 'pending')
      .limit(2)  // Max 2 jobs per tenant per run (fair quota)

    for (const job of pendingJobs || []) {
      try {
        // Execute pipeline for this job
        await executePipeline(job, tenant.id)
        results.push({ tenant: tenant.name, job: job.id, status: 'success' })
      } catch (error) {
        results.push({ tenant: tenant.name, job: job.id, status: 'failed', error })
      }
    }
  }

  return new Response(JSON.stringify({ results }), { status: 200 })
})
```

### Checkpoint Fase 5

**Verificações**:
- [ ] Todas 17 Edge Functions refatoradas
- [ ] Credenciais vêm de `tenant_credentials`
- [ ] Fallback para platform pool funciona
- [ ] Usage tracking implementado
- [ ] Orchestrator usa round-robin

**App Status**: ⚠️ **Funcional com multi-tenancy**
- Pipeline funciona por tenant
- Credenciais isoladas
- Quotas respeitadas

**Rollback**: Difícil (precisa reverter Edge Functions)

---

## 🎨 FASE 6: FRONTEND (5-7 dias)

### Objetivo
Criar UI para gerenciar tenants e credenciais

### Tarefas

#### 6.1 - Tenant Switcher (Header)

```tsx
// components/TenantSwitcher.tsx
'use client'

import { useEffect, useState } from 'react'
import { getCurrentTenant } from '@/lib/auth-helpers'

export function TenantSwitcher() {
  const [tenant, setTenant] = useState<any>(null)

  useEffect(() => {
    getCurrentTenant().then(setTenant)
  }, [])

  if (!tenant) return null

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Tenant:</span>
      <span className="font-medium">{tenant.name}</span>
    </div>
  )
}
```

#### 6.2 - Settings Page (Credentials)

```tsx
// app/(dashboard)/settings/page.tsx
import { getCurrentTenantId } from '@/lib/auth-helpers'
import { CredentialsForm } from '@/components/CredentialsForm'

export default async function SettingsPage() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return <div>Not authenticated</div>
  }

  return (
    <div>
      <h1>Settings</h1>
      <CredentialsForm />
    </div>
  )
}
```

```tsx
// components/CredentialsForm.tsx
'use client'

import { useState } from 'react'
import { saveRapidApiKey, saveOpenRouterKey } from '@/app/(dashboard)/settings/actions'

export function CredentialsForm() {
  const [rapidApiKey, setRapidApiKey] = useState('')
  const [openRouterKey, setOpenRouterKey] = useState('')

  const handleSaveRapidApi = async () => {
    const result = await saveRapidApiKey(rapidApiKey)
    if (result.success) {
      alert('Rapid API key saved!')
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label>Rapid API Key</label>
        <input
          type="password"
          value={rapidApiKey}
          onChange={(e) => setRapidApiKey(e.target.value)}
        />
        <button onClick={handleSaveRapidApi}>Save</button>
      </div>

      {/* Similar for OpenRouter */}
    </div>
  )
}
```

#### 6.3 - Tenant Management (Admin)

```tsx
// app/(dashboard)/settings/organization/page.tsx
import { getCurrentTenant, isCurrentUserAdmin } from '@/lib/auth-helpers'

export default async function OrganizationPage() {
  const tenant = await getCurrentTenant()
  const isAdmin = await isCurrentUserAdmin()

  if (!isAdmin) {
    return <div>Access denied. Admins only.</div>
  }

  return (
    <div>
      <h1>Organization Settings</h1>

      <div>
        <h2>Tenant: {tenant.name}</h2>
        <p>Slug: {tenant.slug}</p>
        <p>Tier: {tenant.tier}</p>
      </div>

      {/* Edit tenant settings */}
      {/* Manage team members */}
    </div>
  )
}
```

### Checkpoint Fase 6

**Verificações**:
- [ ] Tenant switcher no header
- [ ] Settings page funciona
- [ ] Credenciais podem ser salvas/editadas
- [ ] Organization page (admin only)
- [ ] Team management (convidar membros)

**App Status**: ✅ **Funcional com UI completa**

**Rollback**: Fácil (apenas UI)

---

## 🧪 FASE 7: TESTING & QA (7-10 dias)

### Objetivo
Testar TUDO antes de lançar

### Tarefas

#### 7.1 - E2E Tests (Playwright)

```typescript
// tests/e2e/multi-tenancy.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Multi-Tenancy Isolation', () => {
  test('Tenant A cannot see Tenant B data', async ({ page, context }) => {
    // Create Tenant A
    const tenantA = await createTestTenant('Tenant A')
    const userA = await createTestUser(tenantA.id)
    const videoA = await createTestVideo(tenantA.id, 'Video A')

    // Create Tenant B
    const tenantB = await createTestTenant('Tenant B')
    const userB = await createTestUser(tenantB.id)
    const videoB = await createTestVideo(tenantB.id, 'Video B')

    // Login as User A
    await loginAs(page, userA)
    await page.goto('/videos')

    // Should see only Video A
    await expect(page.getByText('Video A')).toBeVisible()
    await expect(page.getByText('Video B')).not.toBeVisible()

    // Try to access Video B by URL (should 404)
    await page.goto(`/videos/${videoB.id}`)
    await expect(page.getByText('Not found')).toBeVisible()
  })

  test('Credentials are isolated', async ({ page }) => {
    // ... test credential isolation
  })

  test('Webhooks are isolated', async ({ page }) => {
    // ... test webhook isolation
  })
})
```

#### 7.2 - Security Audit

**Checklist**:
- [ ] RLS policies impedem vazamento entre tenants
- [ ] Credenciais são encriptadas
- [ ] Logs não expõem secrets
- [ ] Rate limiting por tenant
- [ ] SQL injection tests
- [ ] XSS tests
- [ ] CSRF protection

#### 7.3 - Performance Testing

```typescript
// tests/performance/load-test.ts
import { check } from 'k6'
import http from 'k6/http'

export let options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up
    { duration: '3m', target: 50 },   // Peak load
    { duration: '1m', target: 0 },    // Ramp down
  ],
}

export default function () {
  // Test dashboard KPIs
  const res = http.get('https://your-app.com/api/dashboard-kpis', {
    headers: {
      'Authorization': `Bearer ${__ENV.TEST_TOKEN}`,
    },
  })

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

### Checkpoint Fase 7

**Verificações**:
- [ ] Todos E2E tests passam
- [ ] Security audit completo
- [ ] Performance aceitável (<500ms p95)
- [ ] Nenhum vazamento de dados
- [ ] Rollback testado

**App Status**: ✅ **Pronto para produção**

---

## 🚀 FASE 8: LAUNCH (2-3 dias)

### Objetivo
Lançar multi-tenancy em produção

### Tarefas

#### 8.1 - Backup Final

```bash
# Backup completo do database
pg_dump $DATABASE_URL > backup-pre-multitenancy-$(date +%Y%m%d).sql

# Upload para S3/Cloud Storage
aws s3 cp backup-pre-multitenancy-*.sql s3://your-backups/
```

#### 8.2 - Migration em Produção

```bash
# 1. Enable maintenance mode
echo "Maintenance mode ON"

# 2. Run migrations
supabase db push

# 3. Migrate credentials
tsx scripts/migrate-credentials.ts

# 4. Validate data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM benchmark_channels WHERE tenant_id IS NULL;"
# Should return 0

# 5. Deploy new code
vercel deploy --prod

# 6. Smoke tests
curl https://your-app.com/api/health

# 7. Disable maintenance mode
echo "Maintenance mode OFF"
```

#### 8.3 - Habilitar RLS para WRITE

```sql
-- Migration: 20251125_enable_rls_write_policies.sql
-- ⚠️ ÚLTIMO PASSO! Breaking change!
BEGIN;

-- benchmark_channels: Write policies
CREATE POLICY "Users can insert channels for their tenant"
  ON benchmark_channels
  FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their tenant channels"
  ON benchmark_channels
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their tenant channels"
  ON benchmark_channels
  FOR DELETE
  USING (
    tenant_id = (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );

-- Repetir para TODAS as 13 tabelas...

COMMIT;
```

#### 8.4 - Habilitar Feature Flags

```bash
# .env.production
NEXT_PUBLIC_ENABLE_MULTI_TENANT=true
NEXT_PUBLIC_ENABLE_MULTI_TENANT_WRITE=true
NEXT_PUBLIC_ENABLE_TENANT_CREDENTIALS=true
```

```bash
# Redeploy
vercel deploy --prod
```

#### 8.5 - Monitoramento

```bash
# Watch logs
vercel logs --follow

# Monitor errors
sentry issues list

# Monitor performance
datadog dashboard open

# Monitor database
supabase db inspect
```

### Checkpoint Fase 8

**Verificações**:
- [ ] Backup completo
- [ ] Migrations rodaram com sucesso
- [ ] RLS write policies habilitadas
- [ ] Feature flags ON
- [ ] Smoke tests passam
- [ ] Nenhum erro em logs
- [ ] Performance OK

**App Status**: 🎉 **MULTI-TENANT EM PRODUÇÃO!**

**Rollback**: ⚠️ **Muito difícil!** (precisa backup)

---

## 🔄 ROLLBACK PROCEDURES

Ver documento: [07_ROLLBACK_PROCEDURES.md](./07_ROLLBACK_PROCEDURES.md)

---

## ✅ TESTING CHECKLIST

Ver documento: [08_TESTING_CHECKLIST.md](./08_TESTING_CHECKLIST.md)

---

## 🛑 CHECKPOINTS

Ver documento: [09_CHECKPOINTS.md](./09_CHECKPOINTS.md)

---

## 📊 RESUMO FINAL

### Timeline Total: 6-8 semanas

| Fase | Duração | Breaking? | Rollback? |
|------|---------|-----------|-----------|
| 0. Setup | 3-5 dias | ❌ | ✅ Fácil |
| 1. Database | 5-7 dias | ❌ | ✅ Fácil |
| 2. RLS Policies | 3-5 dias | ❌ | ✅ Médio |
| 3. Credentials | 3-5 dias | ⚠️ Parcial | ⚠️ Médio |
| 4. Server Actions | 5-7 dias | ⚠️ Sim | ❌ Difícil |
| 5. Edge Functions | 7-10 dias | ⚠️ Sim | ❌ Difícil |
| 6. Frontend | 5-7 dias | ❌ | ✅ Fácil |
| 7. Testing | 7-10 dias | ❌ | N/A |
| 8. Launch | 2-3 dias | ✅ Sim | ❌ Muito difícil |

### Recursos Necessários

- 1 dev sênior full-time (full-stack + infra)
- Staging environment (Supabase + Vercel)
- Monitoring (Sentry, Datadog, ou similar)
- Backup storage (S3 ou similar)

### Pontos de Não-Retorno

**Fase 3**: Depois de migrar credenciais, Settings UI não funciona até atualizar
**Fase 4**: Depois de refatorar Server Actions, hard to rollback
**Fase 5**: Depois de refatorar Edge Functions, hard to rollback
**Fase 8**: Depois de habilitar RLS write, MUITO difícil rollback

---

**Status**: ✅ PLANO COMPLETO
**Próximo**: Começar Fase 0 (aguardar aprovação do usuário!)
