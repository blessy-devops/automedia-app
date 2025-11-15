# MATRIZ DE RISCOS E DEPENDÊNCIAS

**Data**: 2025-11-15
**Objetivo**: Identificar TODOS os riscos, dependências e pontos de falha

---

## 📊 MATRIZ DE RISCOS

### LEGENDA
- 🔴 **CRÍTICO**: Pode quebrar o sistema completamente / Perda de dados
- 🟠 **ALTO**: Pode causar bugs severos / Dados misturados entre tenants
- 🟡 **MÉDIO**: Pode causar bugs menores / Degradação de performance
- 🟢 **BAIXO**: Impacto mínimo / Facilmente reversível

---

## 🔴 RISCOS CRÍTICOS

### R1: Dados Misturados Entre Tenants (GDPR/Security)

**Probabilidade**: ALTA (se não testar bem)
**Impacto**: CATASTRÓFICO

**Cenário**:
```typescript
// ❌ ESQUECEU tenant_id em uma query
const { data: videos } = await supabase
  .from('benchmark_videos')
  .select('*')
  // .eq('tenant_id', tenantId)  ← ESQUECEU!
  .limit(10)

// Resultado: Tenant A vê vídeos do Tenant B!
```

**Consequências**:
- ❌ Violação de privacidade (GDPR violation)
- ❌ Tenant A vê dados sensíveis do Tenant B
- ❌ Possível ação legal
- ❌ Perda de confiança

**Mitigações**:
1. ✅ **RLS Policies** (última linha de defesa)
2. ✅ **Helper getCurrentTenantId()** (obrigatório em toda function)
3. ✅ **E2E Tests** (testar isolamento entre tenants)
4. ✅ **Code Review** (checklist de tenant_id)
5. ✅ **Linter Rule** (detectar queries sem tenant_id)

**Como Testar**:
```typescript
// Test 1: Criar dados para Tenant A
const tenantA = createTestTenant('Tenant A')
const videoA = createTestVideo(tenantA.id, 'Video A')

// Test 2: Criar dados para Tenant B
const tenantB = createTestTenant('Tenant B')
const videoB = createTestVideo(tenantB.id, 'Video B')

// Test 3: Login como Tenant A
loginAs(tenantA)
const videos = await getVideos()

// Assertion: Deve ver APENAS Video A
expect(videos).toHaveLength(1)
expect(videos[0].id).toBe(videoA.id)
expect(videos).not.toContain(videoB)
```

---

### R2: Credenciais Vazadas / Expostas

**Probabilidade**: MÉDIA
**Impacto**: CATASTRÓFICO

**Cenário**:
```typescript
// ❌ Credencial não encriptada no banco
INSERT INTO tenant_credentials (credential_value)
VALUES ('sk-rapid-abc123xyz')  -- Texto plano!

// ❌ Log expõe credencial
console.log('API Key:', rapidApiKey)  // Aparece nos logs!

// ❌ Response retorna credencial
return { success: true, apiKey: rapidApiKey }  // Expõe na API!
```

**Consequências**:
- ❌ Credenciais roubadas
- ❌ Billing abuse (alguém usa as keys)
- ❌ Rate limiting / Ban de APIs
- ❌ Custos inesperados

**Mitigações**:
1. ✅ **pgcrypto Encryption** (credenciais sempre encriptadas)
2. ✅ **NEVER log credentials** (filtrar logs)
3. ✅ **RLS Policies** (só owner vê suas credenciais)
4. ✅ **SECURITY DEFINER** (functions privilegiadas)
5. ✅ **Rotate keys regularly** (expiration dates)

---

### R3: Pipeline de Enrichment Quebra

**Probabilidade**: ALTA (5 steps sequenciais)
**Impacto**: ALTO

**Cenário**:
```typescript
// Step 3 falha, mas Step 4 e 5 tentam rodar
// Resultado: Dados inconsistentes

// Exemplo:
// - Step 1: Categorização ✅
// - Step 2: SocialBlade ✅
// - Step 3: Recent Videos ❌ (falhou)
// - Step 4: Baseline Stats (calcula com dados incompletos) ⚠️
// - Step 5: Outliers (cálculos errados) ⚠️
```

**Consequências**:
- ❌ Dados corrompidos (stats erradas)
- ❌ Outliers falsos (falsos positivos)
- ❌ Usuário perde confiança

**Mitigações**:
1. ✅ **Transaction-like behavior** (rollback se falhar)
2. ✅ **Retry logic** (retry steps que falharam)
3. ✅ **Status tracking** (saber qual step falhou)
4. ✅ **Alertas** (notificar se step falhar)
5. ✅ **Validation** (não rodar step 4 se step 3 falhou)

---

### R4: Baseline Stats Globais vs Por Tenant

**Probabilidade**: MÉDIA (se não planejar bem)
**Impacto**: ALTO

**Cenário**:
```typescript
// ANTES: Baseline era calculado globalmente
// Média de 10k views para um canal

// DEPOIS: Baseline por tenant
// Tenant A: Média de 5k views (50 vídeos)
// Tenant B: Média de 20k views (500 vídeos)

// PROBLEMA: As médias são DIFERENTES!
// Um vídeo com 15k views é:
// - Outlier para Tenant A (3x acima da média)
// - Normal para Tenant B (abaixo da média)
```

**Consequências**:
- ⚠️ **Mudança de lógica de negócio**
- ⚠️ Stats não comparáveis entre tenants
- ⚠️ Usuário estranha diferenças

**Mitigações**:
1. ✅ **Documentar mudança** (avisar que stats mudam)
2. ✅ **Recalcular stats** (após migration)
3. ✅ **UI clarity** (deixar claro que stats são por tenant)
4. ❓ **Global benchmarks?** (opcional: ter stats globais para comparação)

**Decisão Necessária**:
- Stats são APENAS por tenant? (isolamento total)
- Ou ter stats globais para benchmark? (comparar com outros tenants)

---

### R5: Supabase Vault Não Suporta Multi-Tenancy

**Probabilidade**: CERTA (já identificado)
**Impacto**: ALTO

**Problema**:
- Vault armazena secrets globalmente
- Não tem conceito de tenant_id
- Precisa migrar para tabela

**Mitigações**:
1. ✅ **Criar tenant_credentials** (substituir Vault)
2. ✅ **Encriptação pgcrypto** (segurança)
3. ✅ **Migration path** (mover credenciais existentes)

---

## 🟠 RISCOS ALTOS

### R6: RLS Policies Mal Configuradas

**Probabilidade**: MÉDIA
**Impacto**: ALTO

**Cenário**:
```sql
-- ❌ RLS policy errada
CREATE POLICY "Users can see videos"
  ON benchmark_videos
  FOR SELECT
  USING (true);  -- PERIGOSO! Permite ver TUDO!

-- ✅ RLS policy correta
CREATE POLICY "Users can see their tenant videos"
  ON benchmark_videos
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id
      FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );
```

**Mitigações**:
1. ✅ **Testar RLS** (criar test tenants)
2. ✅ **Code review** (revisar todas policies)
3. ✅ **Template policies** (copiar/colar reduz erros)

---

### R7: Edge Functions Recebem tenant_id Errado

**Probabilidade**: BAIXA
**Impacto**: ALTO

**Cenário**:
```typescript
// ❌ Frontend manda tenant_id errado
const { data, error } = await supabase.functions.invoke('my-function', {
  headers: {
    'x-tenant-id': 'tenant-malicioso',  // Tentando acessar outro tenant!
  },
})
```

**Mitigações**:
1. ✅ **Validar tenant_id** (Edge Function valida JWT)
2. ✅ **Extrair de JWT** (não confiar em header)
3. ✅ **RLS protege** (mesmo que passe tenant_id errado, RLS bloqueia)

---

### R8: AdminClient Bypassa RLS

**Probabilidade**: MÉDIA (radar/actions.ts usa AdminClient)
**Impacto**: ALTO

**Problema**:
```typescript
// ❌ AdminClient bypassa RLS
const supabase = createAdminClient()  // Service role key!

const { data } = await supabase
  .from('channel_radar')
  .select('*')
  // RLS NÃO FUNCIONA com AdminClient!
  // Retorna dados de TODOS os tenants!
```

**Mitigações**:
1. ✅ **NUNCA usar AdminClient** (exceto migrations)
2. ✅ **Substituir por createClient()** (user-level)
3. ✅ **Code review** (detectar uso de AdminClient)

---

### R9: Unique Constraints Não Incluem tenant_id

**Probabilidade**: ALTA
**Impacto**: MÉDIO

**Cenário**:
```sql
-- ❌ Constraint global (problema!)
UNIQUE(channel_id)

-- Tenant A adiciona canal "UC123"
-- Tenant B tenta adicionar o MESMO canal "UC123"
-- ❌ ERRO: Unique constraint violation!

-- ✅ Constraint por tenant (correto)
UNIQUE(tenant_id, channel_id)
```

**Mitigações**:
1. ✅ **Recriar UNIQUE constraints** (incluir tenant_id)
2. ✅ **Drop old constraints** (remover antigos)
3. ✅ **Test duplicate data** (tenants podem ter mesmos canais)

---

### R10: Cron Jobs Processam Todos os Tenants

**Probabilidade**: CERTA
**Impacto**: MÉDIO

**Problema**:
```typescript
// Cron job processa 1000 canais
// Tenant A: 10 canais (1%)
// Tenant B: 990 canais (99%)

// Tenant A nunca é processado! (starvation)
```

**Mitigações**:
1. ✅ **Round-robin** (processar X canais por tenant)
2. ✅ **Fair scheduling** (garantir que todos tenants sejam processados)
3. ✅ **Quotas por tenant** (premium tenants têm prioridade?)

---

## 🟡 RISCOS MÉDIOS

### R11: Performance Degradation

**Probabilidade**: MÉDIA
**Impacto**: MÉDIO

**Problema**:
- Queries com `tenant_id` podem ser mais lentas
- Indexes precisam ser recriados

**Mitigações**:
1. ✅ **Indexes em tenant_id** (performance)
2. ✅ **Composite indexes** (tenant_id + outra coluna)
3. ✅ **EXPLAIN ANALYZE** (testar queries)

---

### R12: Migration Falha no Meio

**Probabilidade**: BAIXA
**Impacto**: ALTO

**Problema**:
```sql
-- Migration executa:
-- 1. ALTER TABLE ADD tenant_id ✅
-- 2. UPDATE SET tenant_id = 'legacy' ✅
-- 3. ALTER TABLE SET NOT NULL ❌ (falha)

-- Estado: Dados inconsistentes!
```

**Mitigações**:
1. ✅ **Transactions** (BEGIN/COMMIT)
2. ✅ **Rollback plan** (como reverter)
3. ✅ **Backup** (antes de migration)
4. ✅ **Test em staging** (nunca direto em prod)

---

### R13: Banco do Gobbi Não Tem Multi-Tenancy

**Probabilidade**: CERTA (já identificado)
**Impacto**: ALTO (se quiser usar produção)

**Problema**:
- Banco de produção (Gobbi) é separado
- Também precisa de tenant_id
- Pode ser projeto separado

**Mitigações**:
1. ✅ **Adicionar tenant_id no Gobbi** (mesma lógica)
2. ✅ **Ou isolar Gobbi** (cada tenant tem seu banco?)
3. ❓ **Decisão do usuário** (scope deste projeto?)

---

## 🟢 RISCOS BAIXOS

### R14: UI/UX Confusion

**Probabilidade**: BAIXA
**Impacto**: BAIXO

**Problema**:
- Usuário não entende que stats mudaram
- UI não deixa claro que está vendo dados do tenant

**Mitigações**:
1. ✅ **Tenant name no header** (clareza)
2. ✅ **Onboarding** (explicar multi-tenancy)
3. ✅ **Help docs** (documentar mudanças)

---

### R15: video_folders Já Tem user_id (Conflito?)

**Probabilidade**: BAIXA
**Impacto**: BAIXO

**Problema**:
- `video_folders` tem `user_id` (RLS)
- Adicionar `tenant_id` pode conflitar?

**Análise**:
```sql
-- Relação:
-- 1 tenant tem N users
-- 1 user pertence a 1 tenant
-- 1 user pode ter N folders

-- RLS atual: user_id = auth.uid()
-- RLS futuro: tenant_id = (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())

-- ✅ Não conflita! Ambos são necessários:
-- - user_id: Qual user criou a pasta
-- - tenant_id: Qual tenant a pasta pertence
```

**Mitigação**:
- ✅ Manter ambos (user_id + tenant_id)

---

## 📊 DEPENDÊNCIAS ENTRE COMPONENTES

### Grafo de Dependências

```
tenants (raiz)
├── tenant_members
├── tenant_credentials
├── api_usage_tracking
└── benchmark_channels
    ├── benchmark_videos
    │   ├── video_folder_items
    │   └── video_enrichment_queue
    ├── benchmark_channels_baseline_stats
    ├── channel_enrichment_jobs
    │   └── channel_enrichment_tasks
    └── channel_radar
        └── channel_radar_cron_log

production_webhooks (isolado)
└── webhook_logs

video_folders (isolado, tem user_id)
└── video_folder_items (conecta com benchmark_videos)
```

### Ordem de Migration (Dependências)

**Fase 1** (Fundação):
1. ✅ `tenants` (criar primeiro)
2. ✅ `tenant_members` (depende de tenants)
3. ✅ `tenant_credentials` (depende de tenants)

**Fase 2** (Core Data):
1. ✅ `benchmark_channels` (adicionar tenant_id)
2. ✅ `benchmark_videos` (depende de channels)
3. ✅ `benchmark_channels_baseline_stats` (depende de channels)

**Fase 3** (Enrichment):
1. ✅ `channel_enrichment_jobs`
2. ✅ `channel_enrichment_tasks` (depende de jobs)
3. ✅ `video_enrichment_queue`

**Fase 4** (Features):
1. ✅ `channel_radar`
2. ✅ `channel_radar_cron_log`
3. ✅ `production_webhooks`
4. ✅ `webhook_logs`
5. ✅ `video_folders` (adicionar tenant_id)
6. ✅ `video_folder_items`

---

## 🎯 TOP 5 RISCOS PRIORIZADOS

| # | Risco | Severidade | Probabilidade | Prioridade |
|---|-------|-----------|---------------|------------|
| 1 | Dados misturados entre tenants (R1) | 🔴 CRÍTICO | ALTA | **P0** |
| 2 | Credenciais vazadas (R2) | 🔴 CRÍTICO | MÉDIA | **P0** |
| 3 | Pipeline de enrichment quebra (R3) | 🔴 CRÍTICO | ALTA | **P1** |
| 4 | RLS policies mal configuradas (R6) | 🟠 ALTO | MÉDIA | **P1** |
| 5 | AdminClient bypassa RLS (R8) | 🟠 ALTO | MÉDIA | **P1** |

---

## ✅ CHECKLIST DE MITIGAÇÃO

### Antes de Começar Migration:
- [ ] Backup completo do database
- [ ] Staging environment configurado
- [ ] E2E tests escritos
- [ ] Rollback plan documentado

### Durante Migration:
- [ ] Usar transactions (BEGIN/COMMIT)
- [ ] Testar cada fase antes de continuar
- [ ] Monitorar logs de erro
- [ ] Ter alguém de prontidão para rollback

### Depois de Migration:
- [ ] Executar E2E tests
- [ ] Testar isolamento entre tenants
- [ ] Validar RLS policies
- [ ] Revisar logs de erros
- [ ] Performance testing

### Code Review Checklist:
- [ ] Toda query tem `tenant_id`?
- [ ] Helper `getCurrentTenantId()` é chamado?
- [ ] RLS policies estão corretas?
- [ ] Não usa `createAdminClient()`?
- [ ] Unique constraints incluem `tenant_id`?
- [ ] Edge Functions recebem `x-tenant-id`?
- [ ] Credenciais são encriptadas?
- [ ] Logs não expõem credenciais?

---

## 📈 PROBABILIDADE vs IMPACTO

```
         IMPACTO
         ^
ALTO     │  R2  │ R1,R3,R5 │
         │      │ R6,R7,R8 │
         │------+----------│
MÉDIO    │ R11  │  R4,R9   │
         │      │  R10,R12 │
         │------+----------│
BAIXO    │ R14  │  R13     │
         │ R15  │          │
         └──────+──────────> PROBABILIDADE
           BAIXA   ALTA
```

---

## 🚨 RED FLAGS (Sinais de Alerta)

Durante implementação, **PARE IMEDIATAMENTE** se:

1. ❌ Queries começam a retornar mais dados que antes (vazamento!)
2. ❌ Tests de isolamento falham
3. ❌ RLS policy permite `USING (true)`
4. ❌ AdminClient sendo usado em production code
5. ❌ Credenciais aparecem em logs
6. ❌ Migration não tem rollback plan
7. ❌ Performance degradou >50%
8. ❌ Unique constraint violations em produção

---

**Status**: ✅ MATRIZ COMPLETA
**Próximo**: [06_MIGRATION_PLAN.md](./06_MIGRATION_PLAN.md)
