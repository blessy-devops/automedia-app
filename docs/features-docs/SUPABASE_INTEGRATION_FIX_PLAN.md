# Plano de Correção da Integração Supabase - AutoMedia Platform

**Data:** 14 de Novembro de 2025
**Status:** Pendente Execução
**Prioridade:** CRÍTICA (Vulnerabilidade de Segurança Detectada)

---

## 📋 Sumário Executivo

A análise completa da integração Supabase revelou:

- ✅ **Arquitetura bem estruturada** com separação correta dos 3 tipos de clients
- 🚨 **1 VULNERABILIDADE CRÍTICA:** Service role key exposta no código
- ⚠️ **Múltiplos anti-patterns:** Tentativas de executar SQL direto via RPC inexistente
- 📝 **Workflow manual de migrations** que deveria usar Supabase CLI

### O Que Você Estava Fazendo Errado

1. **Tentando executar SQL direto via API** - Nunca foi suportado por segurança
2. **Usando APIs erradas** - Confundindo REST API, Management API e Client SDK
3. **Chaves de API incorretas** - Tentando buscar logs com anon/service_role ao invés de PAT
4. **Migrations manuais** - Copy-paste no dashboard ao invés de usar CLI

---

## 🚨 PRIORIDADE 1: SEGURANÇA CRÍTICA (FAZER IMEDIATAMENTE)

### 1.1 Service Role Key Exposta

**Problema:**
```javascript
// Arquivo: /automedia/run-migration.mjs (linha 4)
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGthYmV4bXdzdWdrbWJuZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4ODAyNSwiZXhwIjoyMDc1OTY0MDI1fQ.jdMI6Gxr7DC4XMyJ57Dax3TZ80wUiXThv0TjZdh3iOs';
```

**Impacto:**
- ❌ Acesso administrativo TOTAL ao banco de dados
- ❌ Bypass de TODAS as políticas RLS
- ❌ Pode ler/escrever/deletar QUALQUER dado
- ❌ Key commitada no Git (histórico permanente)

**Ação Imediata Necessária:**

1. **Rotacionar a chave** (você precisa fazer manualmente):
   - Ir em: Supabase Dashboard → Settings → API
   - Clicar em "Generate new service role key"
   - Copiar a nova chave

2. **Atualizar `.env.local`** com a nova chave:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=sua_nova_chave_aqui
   ```

3. **Deletar arquivos comprometidos** (eu farei):
   ```bash
   rm automedia/run-migration.mjs
   rm automedia/scripts/run-sql-direct.ts
   rm -rf automedia/supabase/functions/_run-migration/
   rm RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql
   rm automedia/verify-tables.mjs
   rm check-radar-table.mjs
   ```

4. **Adicionar ao `.gitignore`**:
   ```
   **/run-migration.*
   **/*RUN_THIS*.sql
   **/verify-tables.*
   **/check-*.mjs
   ```

5. **Remover do histórico Git** (se necessário):
   ```bash
   # Use BFG Repo-Cleaner ou git filter-branch
   # CUIDADO: Reescreve histórico!
   ```

### 1.2 Tempo Estimado
- **Rotacionar chave:** 5 minutos
- **Atualizar .env:** 2 minutos
- **Deletar arquivos:** 5 minutos
- **Total:** ~15 minutos

---

## ⚡ PRIORIDADE 2: CORREÇÕES IMPORTANTES (ESTA SEMANA)

### 2.1 Problema: Tentativas de Executar SQL Direto

**Arquivos afetados:**
1. `/automedia/run-migration.mjs` (linha 41)
2. `/automedia/scripts/run-sql-direct.ts` (linha 21)
3. `/automedia/supabase/functions/_run-migration/index.ts` (linhas 28, 45, 73)

**Código problemático:**
```javascript
// ❌ NUNCA FUNCIONOU - exec_sql não existe!
const { data, error } = await supabase.rpc('exec_sql', { query });
```

**Por que não funciona:**
- Supabase NUNCA permitiu execução de SQL arbitrário via API
- Motivos de segurança (SQL Injection, etc)
- Não existe função RPC `exec_sql` no banco

**Solução correta:**

**Opção A: Usar Supabase CLI** (RECOMENDADO)
```bash
# 1. Criar migration
npx supabase migration new nome_da_migration

# 2. Editar arquivo SQL gerado
# supabase/migrations/YYYYMMDD_nome_da_migration.sql

# 3. Aplicar localmente (dev)
npx supabase db reset

# 4. Aplicar em produção
npx supabase link --project-ref xlpkabexmwsugkmbngwm
npx supabase db push
```

**Opção B: Criar Database Functions (RPC)** para queries específicas
```sql
-- Criar função no Postgres
CREATE OR REPLACE FUNCTION get_channel_stats(channel_id_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_videos', COUNT(*),
    'avg_views', AVG(view_count),
    'latest_video', MAX(published_at)
  )
  INTO result
  FROM videos
  WHERE channel_id = channel_id_param;

  RETURN result;
END;
$$;
```

```javascript
// Chamar via JavaScript
const { data, error } = await supabase
  .rpc('get_channel_stats', { channel_id_param: 'UC123456' })
```

**Opção C: Edge Functions** para lógica complexa
```typescript
// supabase/functions/admin-query/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role seguro aqui
  )

  // Query complexa com privilégios
  const { data } = await supabase
    .from('channels')
    .select('*, videos(*), radar_history(*)')

  return new Response(JSON.stringify({ data }))
})
```

### 2.2 Corrigir Server Actions - Admin Client vs Server Client

**Arquivo:** `/automedia/app/(dashboard)/radar/actions.ts`

**Problema:** 9 funções usando `createAdminClient()` quando deveriam usar `createClient()`

**Funções afetadas:**
1. `addChannelToRadar()` - linha 28
2. `removeChannelFromRadar()` - linha 96
3. `bulkAddChannelsToRadar()` - linha 128
4. `getRadarChannels()` - linha 195
5. `triggerManualUpdate()` - linha 267
6. `toggleRadarActive()` - linha 318
7. `updateRadarNotes()` - linha 349
8. `getRadarExecutionLogs()` - linha 392
9. `getApproximateUpdateStats()` - linha 436

**Por que está errado:**
- Server Actions são acessíveis por usuários autenticados
- Admin client bypassa Row Level Security (RLS)
- Deveria usar Server Client que respeita RLS com contexto do usuário
- Políticas RLS já existem em `channel_radar`

**Correção:**
```typescript
// ❌ ERRADO - Bypassa RLS
export async function addChannelToRadar(channelId: string) {
  const supabase = createAdminClient()
  // ...
}

// ✅ CORRETO - Respeita RLS
export async function addChannelToRadar(channelId: string) {
  const supabase = await createClient()  // Uses RLS with user context
  // ...
}
```

**EXCEÇÃO:** `getRadarExecutionLogs()` pode precisar de admin se `channel_radar_cron_log` não tem RLS.

**Checklist de correção:**
- [ ] Trocar `createAdminClient()` por `await createClient()` em 8 funções
- [ ] Testar todas as operações do radar com usuário autenticado
- [ ] Verificar políticas RLS em `channel_radar` funcionam
- [ ] Criar política RLS em `channel_radar_cron_log` se necessário
- [ ] Manter admin client apenas em `getRadarExecutionLogs()` se necessário

### 2.3 Configurar Acesso a Logs via Management API

**Problema atual:**
- Tentando buscar logs com anon/service_role keys → Falha
- Logs do sistema não são acessíveis via REST API

**Solução correta:**

1. **Gerar Personal Access Token:**
   - Ir em: https://supabase.com/dashboard/account/tokens
   - Clicar em "Generate new token"
   - Dar nome: "AutoMedia Logs Access"
   - Copiar o token: `sbp_...`

2. **Adicionar ao `.env.local`:**
   ```bash
   SUPABASE_PERSONAL_ACCESS_TOKEN=sbp_seu_token_aqui
   ```

3. **Criar script helper** (`scripts/fetch-logs.ts`):
   ```typescript
   const projectRef = 'xlpkabexmwsugkmbngwm'
   const pat = process.env.SUPABASE_PERSONAL_ACCESS_TOKEN
   const startTime = new Date(Date.now() - 3600000).toISOString() // 1 hora atrás
   const endTime = new Date().toISOString()

   const response = await fetch(
     `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/logs.all?iso_timestamp_start=${startTime}&iso_timestamp_end=${endTime}`,
     {
       headers: {
         'Authorization': `Bearer ${pat}`,
         'Content-Type': 'application/json'
       }
     }
   )

   const logs = await response.json()
   console.log(JSON.stringify(logs, null, 2))
   ```

4. **Executar:**
   ```bash
   npx tsx scripts/fetch-logs.ts
   ```

**Limitações da Management API:**
- Rate limit: 120 requisições/minuto
- Intervalo máximo: 24 horas por request
- Arredondado para o minuto mais próximo
- Endpoint marcado como experimental

### 2.4 Tempo Estimado
- **Workflow de migrations:** 2 horas
- **Corrigir Server Actions:** 3 horas
- **Configurar logs:** 1 hora
- **Total:** ~6 horas

---

## 📚 PRIORIDADE 3: ORGANIZAÇÃO E DOCUMENTAÇÃO (PRÓXIMA SEMANA)

### 3.1 Consolidar Diretório Supabase

**Problema:**
- Migrations em 2 lugares: `/supabase/migrations/` e `/automedia/supabase/migrations/`
- Configuração aponta para `/automedia/supabase/`
- Duplicação causa confusão

**Ação:**
```bash
# Mover migrations duplicadas
mv /supabase/migrations/* /automedia/supabase/migrations/

# Deletar pasta duplicada
rm -rf /supabase/

# Atualizar .gitignore se necessário
```

### 3.2 Criar Biblioteca de RPC Functions

**Estrutura proposta:**
```
/automedia/supabase/rpc-functions/
├── README.md              # Documentação das RPC functions
├── folders.sql            # Funções de gestão de pastas
├── vault.sql              # Funções de gestão do Vault
├── queue.sql              # Funções de gestão de fila
├── stats.sql              # Funções de estatísticas/analytics
└── radar.sql              # Funções específicas do Radar
```

**RPC Functions já existentes:**

**Folders** (`20251113_create_folder_functions.sql`):
- `get_folder_descendants(INT)` - Busca descendentes (previne ref circular)
- `get_folder_path(INT)` - Busca breadcrumb path
- `check_folder_has_content(INT)` - Verifica se pasta tem conteúdo

**Vault** (`vault-functions.sql`):
- `list_secrets()` - Lista secrets do Vault
- `update_vault_secret(text, text)` - Atualiza secret
- `read_secret(text)` - Lê secret

**Queue** (em migrations):
- `get_pending_queue_items(INTEGER)` - Row-level locking para processamento

**Exemplo de uso:**
```typescript
// ✅ Uso correto de RPC
const { data } = await supabase
  .rpc('get_folder_descendants', { p_folder_id: folderId })

const { data } = await supabase
  .rpc('check_folder_has_content', { p_folder_id: folderId })
```

### 3.3 Documentação de Uso

**Criar:** `/automedia/docs/supabase-guide.md`

**Conteúdo:**

```markdown
# Guia de Uso do Supabase - AutoMedia

## Quando Usar Cada Client

### Browser Client (`lib/supabase/client.ts`)
- **Uso:** Client Components, event handlers, React hooks
- **Chave:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon - público)
- **RLS:** ✅ Respeita Row Level Security
- **Exemplo:**
  ```typescript
  import { createClient } from '@/lib/supabase/client'

  const supabase = createClient()
  const { data } = await supabase.from('channels').select('*')
  ```

### Server Client (`lib/supabase/server.ts`)
- **Uso:** Server Components, Server Actions, Route Handlers
- **Chave:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon)
- **RLS:** ✅ Respeita RLS com contexto do usuário
- **Exemplo:**
  ```typescript
  import { createClient } from '@/lib/supabase/server'

  export async function myServerAction() {
    const supabase = await createClient()
    const { data } = await supabase.from('channels').select('*')
  }
  ```

### Admin Client (`lib/supabase/admin.ts`)
- **Uso:** Edge Functions, operações administrativas, Vault
- **Chave:** `SUPABASE_SERVICE_ROLE_KEY` (service role - SECRETA!)
- **RLS:** ❌ BYPASSA Row Level Security completamente
- **Quando usar:**
  - Edge Functions
  - Operações que precisam bypass de RLS
  - Acesso ao Vault
  - NUNCA em código acessível por usuários!
- **Exemplo:**
  ```typescript
  import { createAdminClient } from '@/lib/supabase/admin'

  // Apenas em Edge Functions!
  const supabase = createAdminClient()
  const { data } = await supabase.from('vault').select('*')
  ```

## As 3 APIs do Supabase

### 1. REST API (Data API)
- **URL:** `https://xlpkabexmwsugkmbngwm.supabase.co/rest/v1/`
- **Uso:** CRUD nas tabelas
- **Auth:** Header `apikey: ANON_OR_SERVICE_KEY`
- **Limitações:** Não executa SQL arbitrário

### 2. Management API
- **URL:** `https://api.supabase.com/v1/`
- **Uso:** Gerenciar projetos, buscar logs, operações de infraestrutura
- **Auth:** Header `Authorization: Bearer sbp_PAT`
- **Rate Limit:** 120 req/min

### 3. Client SDK
- **Uso:** Interface conveniente para desenvolvimento
- **Wrapper:** Para REST API e Realtime

## Workflow de Migrations

### ❌ ERRADO (Manual)
```bash
# Copiar SQL
# Colar no Supabase Dashboard SQL Editor
# Rodar manualmente
# Criar arquivo "RUN_THIS_IN_SUPABASE..."
```

### ✅ CORRETO (CLI)
```bash
# 1. Criar migration
npx supabase migration new nome_da_migration

# 2. Editar SQL gerado
# supabase/migrations/YYYYMMDD_nome_da_migration.sql

# 3. Testar localmente
npx supabase db reset

# 4. Deploy em produção
npx supabase link --project-ref xlpkabexmwsugkmbngwm
npx supabase db push
```

## Como Executar SQL Customizado

### Opção 1: Database Functions (RPC) - RECOMENDADO
```sql
-- Criar no Postgres
CREATE FUNCTION my_custom_query(param TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
  -- SQL aqui
$$;
```

```typescript
// Chamar via JS
const { data } = await supabase.rpc('my_custom_query', { param: 'value' })
```

### Opção 2: Edge Functions
```typescript
// Para lógica complexa server-side
Deno.serve(async (req) => {
  const supabase = createClient(url, serviceRoleKey)
  // Query com privilégios
})
```

### Opção 3: Views
```sql
CREATE VIEW my_complex_view AS
SELECT ...
```

```typescript
const { data } = await supabase.from('my_complex_view').select('*')
```

## Segurança - Checklist

### ✅ FAZER:
- Habilitar RLS em todas as tabelas públicas
- Usar anon key no frontend
- Usar service_role APENAS em Edge Functions/backend
- Criar políticas RLS específicas
- Usar RPC para lógica complexa
- Rotar chaves comprometidas IMEDIATAMENTE

### ❌ NUNCA FAZER:
- Expor service_role key no código cliente
- Commitar chaves no Git
- Passar chaves em URLs
- Desabilitar RLS sem medidas alternativas
- Confiar apenas em validação client-side
- Usar mesma chave para todos ambientes
```

### 3.4 Tempo Estimado
- **Consolidar diretórios:** 1 hora
- **Criar biblioteca RPC:** 3 horas
- **Documentação:** 4 horas
- **Total:** ~8 horas

---

## 📊 ANÁLISE COMPLETA DO CÓDIGO ATUAL

### Estado Atual da Integração

**✅ O QUE ESTÁ BOM (Manter):**

1. **Separação correta dos 3 clients:**
   - Browser Client: `/automedia/lib/supabase/client.ts`
   - Server Client: `/automedia/lib/supabase/server.ts`
   - Admin Client: `/automedia/lib/supabase/admin.ts`

2. **Edge Functions bem estruturadas:**
   - 23 functions ativas
   - Uso correto de service role key
   - Proper error handling
   - Fire-and-forget invocations

3. **RPC Functions existentes:**
   - Folder management (3 functions)
   - Vault access (3 functions)
   - Queue processing (1 function)

4. **Configurações:**
   - Supabase CLI configurado (`config.toml`)
   - Environment variables corretas
   - Real-time subscriptions funcionando

5. **Segurança:**
   - Browser environment check em admin client
   - RLS policies na maioria das tabelas
   - Vault integration para secrets

**⚠️ O QUE PRECISA CORRIGIR:**

1. **CRÍTICO:**
   - Service role key exposta em `run-migration.mjs`

2. **ALTO:**
   - Tentativas de usar `exec_sql` inexistente (3 arquivos)
   - Admin client em Server Actions (9 funções)
   - Workflow manual de migrations

3. **MÉDIO:**
   - Diretórios de migrations duplicados
   - Falta de documentação de uso
   - Arquivos temporários não deletados

### Arquivos a Deletar

```
/automedia/run-migration.mjs                              # Service role exposta
/automedia/scripts/run-sql-direct.ts                      # exec_sql inexistente
/automedia/supabase/functions/_run-migration/             # Edge Function temporária
/RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql                     # Workaround manual
/automedia/verify-tables.mjs                              # Script temporário
/check-radar-table.mjs                                    # Script temporário
```

### Migrations Existentes (15 arquivos)

**Diretório:** `/automedia/supabase/migrations/`

1. `20251021222957_add_media_diaria_and_taxa_crescimento.sql`
2. `20251021_add_unique_channel_id_to_baseline_stats.sql`
3. `20251021_add_video_age_and_views_per_day.sql`
4. `20251022_create_metrics_materialized_views.sql`
5. `20251022_remove_automatic_view_refresh_triggers.sql`
6. `20251113131610_create_channel_radar.sql`
7. `20251113131611_setup_radar_cron.sql`
8. `20251113140000_add_video_enrichment.sql`
9. `20251113_create_folder_functions.sql` ✅ (RPC functions)
10. `20251113_remove_orphaned_pipeline_fields.sql`
11. `20251114000000_fix_video_enrichment_queue_schema.sql`
12. `setup-radar-cron-fixed.sql`
13. `setup-radar-cron-simple.sql`

**Duplicada na raiz:** `/supabase/migrations/20251112_create_video_folders.sql`

### Edge Functions (23 total)

**Ativos:**
1. `enrichment-pipeline-starter`
2. `enrichment-step-1-categorization`
3. `enrichment-step-2-socialblade`
4. `enrichment-step-3-recent-videos`
5. `enrichment-step-4-trending-videos`
6. `enrichment-step-5-outlier-calc`
7. `enrichment-radar-updater`
8. `enrichment-orchestrator`
9. `video-categorization-manager`
10. `video-enrichment`
11. `video-queue-callback`
12. `video-queue-cron`
13. `video-queue-processor`
14. `video-transcript`
15. `test-socialblade-scraper`

**Temporário (deletar):**
16. `_run-migration` ⚠️

**Todos usam service role corretamente:**
```typescript
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
```

---

## 🎯 CHECKLIST DE EXECUÇÃO

### Fase 1: Segurança (HOJE)
- [ ] **VOCÊ:** Rotacionar service role key no dashboard
- [ ] **VOCÊ:** Copiar nova service role key
- [ ] **EU:** Atualizar `.env.local` com nova key
- [ ] **EU:** Deletar arquivos comprometidos
- [ ] **EU:** Adicionar padrões ao `.gitignore`
- [ ] **EU:** Commitar: "Security: Remove exposed service role key"

### Fase 2: Migrations (ESTA SEMANA)
- [ ] **EU:** Consolidar diretório de migrations
- [ ] **EU:** Rodar migrations pendentes: `npx supabase db push`
- [ ] **EU:** Testar Edge Functions funcionam
- [ ] **EU:** Deletar arquivos temporários de migration

### Fase 3: Server Actions (ESTA SEMANA)
- [ ] **EU:** Atualizar 8 funções em `radar/actions.ts`
- [ ] **EU:** Trocar `createAdminClient()` por `await createClient()`
- [ ] **VOCÊ:** Testar operações do radar
- [ ] **EU:** Adicionar RLS a `channel_radar_cron_log` se necessário

### Fase 4: Logs (ESTA SEMANA)
- [ ] **VOCÊ:** Gerar Personal Access Token
- [ ] **VOCÊ:** Adicionar PAT ao `.env.local`
- [ ] **EU:** Criar script `scripts/fetch-logs.ts`
- [ ] **VOCÊ:** Testar busca de logs

### Fase 5: Documentação (PRÓXIMA SEMANA)
- [ ] **EU:** Criar guia `/automedia/docs/supabase-guide.md`
- [ ] **EU:** Documentar RPC functions existentes
- [ ] **EU:** Criar estrutura de biblioteca de RPC
- [ ] **EU:** Adicionar exemplos de uso

---

## 📚 REFERÊNCIAS E APRENDIZADOS

### O Que Você Aprendeu (via Context7)

#### As 3 APIs do Supabase

1. **REST API (Data API)**
   - Para operações CRUD
   - Não executa SQL arbitrário
   - Auto-gerada do schema

2. **Management API**
   - Para gerenciar projetos
   - Buscar logs do sistema
   - Requer Personal Access Token
   - Rate limit: 120 req/min

3. **Client Libraries**
   - Wrapper conveniente
   - Melhor DX (Developer Experience)

#### As Chaves de API

1. **Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - ✅ Segura para frontend
   - ✅ Respeita RLS
   - Role: `anon` do Postgres

2. **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`)
   - ❌ NUNCA no frontend
   - ❌ BYPASSA RLS completamente
   - ✅ Apenas backend/Edge Functions
   - Tem atributo `BYPASSRLS`

3. **Personal Access Token** (`sbp_...`)
   - Para Management API
   - Gerenciar projetos e logs
   - Gerar em: https://supabase.com/dashboard/account/tokens

#### Como Executar SQL Customizado

**❌ IMPOSSÍVEL:**
```javascript
// Nunca funcionou, nunca vai funcionar
await supabase.rpc('exec_sql', { query: 'SELECT ...' })
```

**✅ ALTERNATIVAS:**

1. **Database Functions (RPC)** - RECOMENDADO
2. **Edge Functions** - Para lógica complexa
3. **Views** - Para queries de leitura
4. **Conexão direta ao Postgres** - Backend apenas

#### Erros Comuns

1. **"Row is not visible"**
   - RLS ativado sem políticas
   - Usar service_role ou criar políticas

2. **"permission denied for table X"**
   - Role sem permissões
   - `GRANT SELECT, INSERT ON table TO authenticated`

3. **UPDATE falha mesmo com permissão**
   - UPDATE requer SELECT também
   - Criar política SELECT ou usar `returning: 'minimal'`

4. **Service role não funciona no navegador**
   - Por segurança, retorna 401
   - Usar Edge Functions

5. **Rate limit exceeded (429)**
   - Management API: 120 req/min
   - Implementar retry com backoff

---

## 🔧 COMANDOS ÚTEIS

### Supabase CLI

```bash
# Linkar ao projeto
npx supabase link --project-ref xlpkabexmwsugkmbngwm

# Criar migration
npx supabase migration new nome_da_migration

# Aplicar migrations localmente
npx supabase db reset

# Aplicar migrations em produção
npx supabase db push

# Ver diferenças
npx supabase db diff

# Gerar types TypeScript
npx supabase gen types typescript --project-id xlpkabexmwsugkmbngwm > lib/supabase/types.ts

# Configurar secrets (Edge Functions)
npx supabase secrets set RAPIDAPI_KEY=xxx --project-ref xlpkabexmwsugkmbngwm

# Deploy Edge Function
npx supabase functions deploy enrichment-radar-updater

# Ver logs de Edge Function
npx supabase functions logs enrichment-radar-updater
```

### Buscar Logs via Management API

```bash
# Usando cURL
curl "https://api.supabase.com/v1/projects/xlpkabexmwsugkmbngwm/analytics/endpoints/logs.all?iso_timestamp_start=2025-01-14T10:00:00Z&iso_timestamp_end=2025-01-14T11:00:00Z" \
  -H "Authorization: Bearer $SUPABASE_PERSONAL_ACCESS_TOKEN"

# Usando script TypeScript
npx tsx scripts/fetch-logs.ts
```

### Git Cleanup (Se necessário)

```bash
# Adicionar ao .gitignore
echo "**/run-migration.*" >> .gitignore
echo "**/*RUN_THIS*.sql" >> .gitignore

# Remover arquivos do Git (mas manter localmente)
git rm --cached automedia/run-migration.mjs

# Commit
git commit -m "Security: Remove exposed credentials"
```

---

## 📞 PRÓXIMOS PASSOS

1. **VOCÊ faz primeiro:**
   - [ ] Rotacionar service role key
   - [ ] Gerar Personal Access Token
   - [ ] Me passar as novas chaves

2. **EU faço depois:**
   - [ ] Atualizar `.env.local`
   - [ ] Deletar arquivos comprometidos
   - [ ] Implementar correções
   - [ ] Criar documentação

3. **Testamos juntos:**
   - [ ] Migrations funcionam
   - [ ] Server Actions funcionam
   - [ ] Logs são acessíveis
   - [ ] Tudo está documentado

---

## ⏱️ ESTIMATIVA TOTAL DE TEMPO

| Fase | Tempo | Prioridade |
|------|-------|-----------|
| Segurança (Fase 1) | 15 min | CRÍTICA |
| Migrations (Fase 2) | 2h | ALTA |
| Server Actions (Fase 3) | 3h | ALTA |
| Logs (Fase 4) | 1h | ALTA |
| Documentação (Fase 5) | 8h | MÉDIA |
| **TOTAL** | **~14h** | - |

**Distribuição:**
- Hoje (Crítico): 15 minutos
- Esta semana: 6 horas
- Próxima semana: 8 horas

---

## 📝 NOTAS IMPORTANTES

### Por Que Isso Aconteceu

1. **Falta de conhecimento sobre as APIs do Supabase**
   - Confusão entre REST API, Management API, SDK
   - Não sabia que SQL direto não é suportado

2. **Tentativa de contornar limitações**
   - Criou `exec_sql` RPC que nunca funcionou
   - Scripts manuais ao invés de usar CLI

3. **Workflow incorreto de migrations**
   - Copy-paste no dashboard
   - Arquivos "RUN_THIS_IN_SUPABASE..."

4. **Hardcoded credentials**
   - Service role key no código
   - Commitado no Git

### Como Evitar No Futuro

1. **Sempre usar Supabase CLI para migrations**
2. **Nunca commitar credentials**
3. **Entender as 3 APIs e quando usar cada uma**
4. **Usar RPC functions para SQL customizado**
5. **Consultar documentação atualizada (Context7)**
6. **Seguir o guia de segurança**

### Recursos

- **Documentação Supabase:** https://supabase.com/docs
- **Context7:** Use `use context7` nos prompts
- **Management API:** https://supabase.com/docs/reference/api
- **Supabase CLI:** https://supabase.com/docs/guides/cli
- **Este documento:** Para referência futura

---

**Última atualização:** 14 de Novembro de 2025
**Autor:** Claude (via Context7)
**Status:** Aguardando execução
