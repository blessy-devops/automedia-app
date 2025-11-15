# MAPEAMENTO: Credenciais e API Keys

**Data**: 2025-11-15
**Objetivo**: Mapear TODAS as credenciais, onde são armazenadas e como serão isoladas por tenant

---

## 📋 RESUMO EXECUTIVO

**Total de Credenciais Identificadas**: 4 principais
**Armazenamento Atual**: Supabase Vault + Environment Variables
**Armazenamento Futuro**: Tabela `tenant_credentials` + Platform Pool
**Risco Geral**: 🔴 MUITO ALTO (billing e segurança)

---

## 🔑 CREDENCIAIS IDENTIFICADAS

### 1. Rapid API Key (YouTube Data API)

**O que é**: Chave para acessar YouTube Data API via RapidAPI
**Onde é usada**:
- `enrichment-step-3-recent-videos` Edge Function
- Busca vídeos recentes de canais (últimos 30 dias)

**Armazenamento Atual**:
```typescript
// settings/actions.ts
const RAPID_API_SECRET_NAME = 'rapidapi_key_1760651731629'

// Salvo no Supabase Vault
await supabase.rpc('insert_secret', {
  name: RAPID_API_SECRET_NAME,
  secret: apiKey,
})

// Recuperado em Edge Functions
const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')
```

**Custo**:
- ❌ **PAGO POR REQUEST**
- Varia de $0.001 a $0.01 por request (dependendo do plano)
- Volume alto pode custar caro

**Impacto Multi-Tenant**:
```typescript
// OPÇÃO 1: Tenant traz própria chave (BYOK - Bring Your Own Key)
const rapidApiKey = await getTenantCredential(tenantId, 'rapidapi')

if (!rapidApiKey) {
  return { error: 'Rapid API key not configured for your account' }
}

// OPÇÃO 2: Plataforma fornece com billing
const rapidApiKey = await getTenantCredential(tenantId, 'rapidapi')

if (!rapidApiKey) {
  // Fallback para pool da plataforma
  rapidApiKey = await getKeyFromPlatformPool('rapidapi')

  // ⚠️ Registrar uso para billing
  await trackApiUsage(tenantId, 'rapidapi', {
    endpoint: 'youtube_videos',
    cost_estimate: 0.005,
    timestamp: new Date(),
  })
}

// OPÇÃO 3: Híbrido (melhor)
// - Free tier: usa pool da plataforma com limite (ex: 100 requests/mês)
// - Paid tier: BYOK ilimitado
```

**Recomendação**:
- 🎯 **OPÇÃO 3 (Híbrido)**
- Free tier: Pool da plataforma + quota limit
- Paid tier: BYOK ilimitado
- Billing tracking para free tier

---

### 2. OpenRouter API Key (AI Categorization)

**O que é**: Chave para acessar modelos de AI via OpenRouter
**Onde é usada**:
- `enrichment-step-1-categorization` Edge Function
- Categoriza canais (niche, subniche, format)

**Armazenamento Atual**:
```typescript
// settings/actions.ts
const OPENROUTER_SECRET_NAME = 'openrouter_key_1760655833491'

// Edge Function
const openRouterKey = await getVaultSecret('openrouter_key_1760655833491')
```

**Custo**:
- ❌ **PAGO POR TOKEN**
- Varia por modelo (GPT-4: ~$0.03/1k tokens, Claude: ~$0.008/1k tokens)
- Categorização usa ~500-1000 tokens por canal

**Impacto Multi-Tenant**:
- Similar ao Rapid API
- BYOK ou pool da plataforma
- Billing tracking essencial

**Recomendação**:
- 🎯 **Híbrido com quotas**
- Free tier: 10 categorizações/mês
- Paid tier: BYOK ilimitado

---

### 3. Supabase URL & Anon Key

**O que é**: Credenciais para acessar Supabase (database)
**Onde é usada**: TODAS as Edge Functions e Server Actions

**Armazenamento Atual**:
```typescript
// Environment variables
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
```

**Impacto Multi-Tenant**:
- ✅ **NÃO MUDA**
- Credenciais da plataforma (não por tenant)
- RLS protege isolamento de dados

**Recomendação**:
- 🎯 **Manter como está**
- Credenciais globais da plataforma
- RLS faz isolamento

---

### 4. Gobbi Database Credentials

**O que é**: Credenciais para banco de produção (Gobbi)
**Onde é usada**: `app/actions/production-videos.ts`

**Armazenamento Atual**:
```typescript
// lib/gobbi-client.ts (presumido)
const gobbiUrl = process.env.GOBBI_SUPABASE_URL
const gobbiKey = process.env.GOBBI_SUPABASE_KEY
```

**Impacto Multi-Tenant**:
- ⚠️ **BANCO EXTERNO TAMBÉM PRECISA MULTI-TENANCY**
- Todas queries precisam filtrar por tenant_id
- Pode ser projeto separado

**Recomendação**:
- 🎯 **Adicionar tenant_id no banco do Gobbi**
- RPCs do Gobbi precisam aceitar `p_tenant_id`
- Ou criar bancos separados por tenant (mais caro)

---

## 🗄️ ESTRUTURA PROPOSTA: tenant_credentials

### Schema SQL

```sql
CREATE TABLE tenant_credentials (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Tipo de credencial
  credential_type VARCHAR(50) NOT NULL CHECK (
    credential_type IN ('rapidapi', 'openrouter', 'custom_api', 'webhook_secret')
  ),

  -- Valor ENCRIPTADO
  credential_value TEXT NOT NULL,  -- pgcrypto encrypted

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  usage_quota INTEGER,  -- NULL = ilimitado, INT = limite mensal
  usage_current INTEGER DEFAULT 0,
  usage_reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(tenant_id, credential_type)
);

-- Indexes
CREATE INDEX idx_tenant_creds_tenant ON tenant_credentials(tenant_id);
CREATE INDEX idx_tenant_creds_type ON tenant_credentials(credential_type);

-- RLS Policies
ALTER TABLE tenant_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage credentials of their tenant
CREATE POLICY "Users can manage their tenant credentials"
  ON tenant_credentials
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_tenant_credentials_updated_at
  BEFORE UPDATE ON tenant_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Encriptação

**OPÇÃO 1**: PostgreSQL pgcrypto (recomendado)

```sql
-- Extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert (encriptar)
INSERT INTO tenant_credentials (tenant_id, credential_type, credential_value)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'rapidapi',
  pgp_sym_encrypt('sk-rapid-abc123xyz', current_setting('app.encryption_key'))
);

-- Select (decriptar)
SELECT
  id,
  tenant_id,
  credential_type,
  pgp_sym_decrypt(credential_value::bytea, current_setting('app.encryption_key')) AS decrypted_value
FROM tenant_credentials
WHERE tenant_id = '123e4567-e89b-12d3-a456-426614174000';
```

**OPÇÃO 2**: Application-level encryption (TypeScript)

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY // 32 bytes
const ALGORITHM = 'aes-256-gcm'

export function encryptCredential(value: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

  let encrypted = cipher.update(value, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
}

export function decryptCredential(encrypted: string): string {
  const parts = encrypted.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encryptedData = parts[1]
  const authTag = Buffer.from(parts[2], 'hex')

  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

**Recomendação**: OPÇÃO 1 (pgcrypto) - mais seguro e performático

---

## 📊 TABELA: api_usage_tracking

Para billing e quotas:

```sql
CREATE TABLE api_usage_tracking (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- API info
  api_type VARCHAR(50) NOT NULL,  -- 'rapidapi', 'openrouter', etc
  endpoint VARCHAR(255),  -- 'youtube_videos', 'categorization', etc

  -- Usage
  request_count INTEGER DEFAULT 1,
  cost_estimate NUMERIC(10, 6),  -- Estimativa em USD

  -- Source
  source_function VARCHAR(100),  -- 'enrichment-step-3-recent-videos'
  source_resource_id VARCHAR(255),  -- channel_id ou video_id

  -- Metadata
  request_payload JSONB,  -- Dados da request (sem credenciais!)
  response_status INTEGER,  -- HTTP status
  response_time_ms INTEGER,

  -- Timestamps
  used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_usage_tenant ON api_usage_tracking(tenant_id);
CREATE INDEX idx_api_usage_date ON api_usage_tracking(used_at);
CREATE INDEX idx_api_usage_type ON api_usage_tracking(api_type);

-- RLS
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant usage"
  ON api_usage_tracking
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );

-- Function to get monthly usage
CREATE OR REPLACE FUNCTION get_tenant_monthly_usage(
  p_tenant_id UUID,
  p_api_type VARCHAR
)
RETURNS TABLE (
  total_requests BIGINT,
  total_cost NUMERIC,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(request_count)::BIGINT,
    SUM(cost_estimate),
    DATE_TRUNC('month', NOW()),
    NOW()
  FROM api_usage_tracking
  WHERE tenant_id = p_tenant_id
    AND api_type = p_api_type
    AND used_at >= DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 FLUXO DE CREDENCIAIS

### 1. Tenant Configura Credencial

```typescript
// app/(dashboard)/settings/actions.ts
export async function saveRapidApiKey(apiKey: string) {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validar chave (opcional - fazer request teste)
  const isValid = await validateRapidApiKey(apiKey)
  if (!isValid) {
    return { success: false, error: 'Invalid API key' }
  }

  // Encriptar e salvar
  const { error } = await supabase.rpc('upsert_tenant_credential', {
    p_tenant_id: tenantId,
    p_credential_type: 'rapidapi',
    p_credential_value: apiKey,  // RPC vai encriptar com pgcrypto
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
```

### 2. Edge Function Usa Credencial

```typescript
// supabase/functions/enrichment-step-3-recent-videos/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const tenantId = req.headers.get('x-tenant-id')
  if (!tenantId) {
    return new Response('Missing tenant_id', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Buscar credencial do tenant
  let rapidApiKey = await getTenantCredential(supabase, tenantId, 'rapidapi')

  if (!rapidApiKey) {
    // Fallback para pool da plataforma
    const quota = await checkQuota(supabase, tenantId, 'rapidapi')

    if (!quota.available) {
      return new Response(
        JSON.stringify({
          error: 'Quota exceeded. Please add your own Rapid API key in Settings.',
          quota_limit: quota.limit,
          quota_used: quota.used,
        }),
        { status: 429 }
      )
    }

    rapidApiKey = await getKeyFromPlatformPool(supabase, 'rapidapi')

    // Marcar que vai usar pool
    var usingPlatformPool = true
  }

  // Fazer request para Rapid API
  const response = await fetch('https://youtube-v31.p.rapidapi.com/...', {
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': 'youtube-v31.p.rapidapi.com',
    },
  })

  // Se usou pool, registrar uso
  if (usingPlatformPool) {
    await trackApiUsage(supabase, tenantId, {
      api_type: 'rapidapi',
      endpoint: 'youtube_videos',
      cost_estimate: 0.005,
      request_count: 1,
      response_status: response.status,
    })
  }

  // ...
})

// Helper: Buscar credencial do tenant
async function getTenantCredential(
  supabase: SupabaseClient,
  tenantId: string,
  credentialType: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_tenant_credential', {
    p_tenant_id: tenantId,
    p_credential_type: credentialType,
  })

  if (error || !data) {
    return null
  }

  return data.decrypted_value
}

// Helper: Checar quota
async function checkQuota(
  supabase: SupabaseClient,
  tenantId: string,
  apiType: string
) {
  const { data } = await supabase.rpc('get_tenant_monthly_usage', {
    p_tenant_id: tenantId,
    p_api_type: apiType,
  })

  const { data: credential } = await supabase
    .from('tenant_credentials')
    .select('usage_quota, usage_current')
    .eq('tenant_id', tenantId)
    .eq('credential_type', apiType)
    .single()

  const limit = credential?.usage_quota || 100  // Default: 100/mês
  const used = data?.total_requests || 0

  return {
    available: used < limit,
    limit,
    used,
  }
}

// Helper: Pool da plataforma
async function getKeyFromPlatformPool(
  supabase: SupabaseClient,
  apiType: string
): Promise<string> {
  // Buscar de tabela platform_api_keys_pool (round-robin)
  const { data } = await supabase
    .from('structure_api_keys_pool')
    .select('api_key')
    .eq('api_type', apiType)
    .eq('is_active', true)
    .order('last_used_at', { ascending: true })  // Round-robin
    .limit(1)
    .single()

  // Atualizar last_used_at
  await supabase
    .from('structure_api_keys_pool')
    .update({ last_used_at: new Date().toISOString() })
    .eq('api_type', apiType)
    .eq('api_key', data.api_key)

  return data.api_key
}

// Helper: Registrar uso
async function trackApiUsage(
  supabase: SupabaseClient,
  tenantId: string,
  usage: {
    api_type: string
    endpoint: string
    cost_estimate: number
    request_count: number
    response_status: number
  }
) {
  await supabase.from('api_usage_tracking').insert({
    tenant_id: tenantId,
    ...usage,
  })

  // Incrementar contador de uso
  await supabase.rpc('increment_credential_usage', {
    p_tenant_id: tenantId,
    p_credential_type: usage.api_type,
    p_increment: usage.request_count,
  })
}
```

### 3. SQL Functions Necessárias

```sql
-- Upsert credential (com encriptação)
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

-- Get credential (com decriptação)
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

-- Increment usage counter
CREATE OR REPLACE FUNCTION increment_credential_usage(
  p_tenant_id UUID,
  p_credential_type VARCHAR,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE tenant_credentials
  SET
    usage_current = usage_current + p_increment,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND credential_type = p_credential_type;

  -- Reset counter se passou o mês
  UPDATE tenant_credentials
  SET
    usage_current = 0,
    usage_reset_at = NOW() + INTERVAL '1 month'
  WHERE tenant_id = p_tenant_id
    AND credential_type = p_credential_type
    AND usage_reset_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 TIER SYSTEM (OPCIONAL)

Se quiser implementar tiers (Free/Pro/Enterprise):

```sql
CREATE TABLE tenant_tiers (
  tier_name VARCHAR(50) PRIMARY KEY,

  -- Quotas
  rapidapi_quota INTEGER,  -- requests/mês (NULL = ilimitado)
  openrouter_quota INTEGER,  -- requests/mês
  enrichment_quota INTEGER,  -- enrichments/mês
  radar_channels_limit INTEGER,  -- canais no radar

  -- Features
  allow_byok BOOLEAN DEFAULT false,  -- Bring Your Own Key
  allow_webhooks BOOLEAN DEFAULT false,
  allow_custom_branding BOOLEAN DEFAULT false,

  -- Pricing
  price_monthly NUMERIC(10, 2),
  price_yearly NUMERIC(10, 2)
);

-- Seed tiers
INSERT INTO tenant_tiers VALUES
('free', 100, 10, 5, 3, false, false, false, 0, 0),
('pro', NULL, NULL, 50, 20, true, true, false, 49.99, 479.99),
('enterprise', NULL, NULL, NULL, NULL, true, true, true, NULL, NULL);

-- Add tier to tenants table
ALTER TABLE tenants ADD COLUMN tier VARCHAR(50) DEFAULT 'free' REFERENCES tenant_tiers(tier_name);
```

---

## 📊 RESUMO

### Credenciais Mapeadas:
1. ✅ Rapid API Key (YouTube Data)
2. ✅ OpenRouter Key (AI Categorization)
3. ✅ Supabase Credentials (não muda)
4. ✅ Gobbi Database (precisa tenant_id)

### Arquitetura Proposta:
- 📦 Tabela `tenant_credentials` (encriptada)
- 📦 Tabela `api_usage_tracking` (billing)
- 📦 Platform pool para free tier
- 📦 BYOK para paid tier
- 📦 Quotas por tenant

### Segurança:
- 🔒 Encriptação com pgcrypto
- 🔒 RLS policies
- 🔒 SECURITY DEFINER functions
- 🔒 Quotas e rate limiting

### Next Steps:
1. Criar migrations para tabelas
2. Implementar SQL functions
3. Migrar credenciais do Vault
4. Atualizar Edge Functions
5. Implementar tracking de uso
6. UI para gerenciar credenciais

---

**Status**: ✅ MAPEAMENTO COMPLETO
**Próximo**: [05_RISK_MATRIX.md](./05_RISK_MATRIX.md)
