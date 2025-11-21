# 🔧 RADAR CRON SETUP - ERROR FIX DOCUMENTATION

## ❌ PROBLEMA IDENTIFICADO

### Erro Original

```
Error: Failed to run sql query: ERROR: 42601: syntax error at or near "SELECT"
LINE 57: SELECT net.http_post(
```

---

## 🔍 CAUSA RAIZ

### Dollar-Quote Delimiter Incorreto

O PostgreSQL usa **dollar-quoted strings** para delimitar blocos de código SQL dentro de funções, triggers, e comandos dinâmicos. A sintaxe correta requer:

**❌ ERRADO:**
```sql
PERFORM cron.schedule(
  'job-name',
  '0 6 * * *',
  $           -- ← ERRO: delimitador incompleto
    SELECT ...
  $           -- ← ERRO: delimitador incompleto
);
```

**✅ CORRETO:**
```sql
PERFORM cron.schedule(
  'job-name',
  '0 6 * * *',
  $cron$      -- ← CORRETO: delimitador completo com identificador
    SELECT ...
  $cron$      -- ← CORRETO: delimitador completo
);
```

### Padrões Válidos de Dollar-Quote

| Padrão | Uso Comum | Exemplo |
|--------|-----------|---------|
| `$$` | Funções simples | `CREATE FUNCTION foo() ... AS $$ ... $$;` |
| `$func$` | Funções (clara identificação) | `AS $func$ ... $func$` |
| `$cron$` | Comandos cron | `cron.schedule(..., $cron$ ... $cron$)` |
| `$body$` | Corpo de função | `AS $body$ ... $body$` |

**Regra:** O identificador entre os `$` pode ser qualquer string (ou vazio), mas **DEVE SER O MESMO** na abertura e no fechamento.

---

## 🛠️ SOLUÇÃO APLICADA

### Mudanças na Migration

#### 1. Cron Schedule (linha 52-68 da migration original)

**ANTES:**
```sql
DO $
BEGIN
  PERFORM cron.schedule(
    'daily-radar-update',
    '0 6 * * *',
    $                    -- ← ERRO
    SELECT net.http_post(...)
    $                    -- ← ERRO
  );
END $;
```

**DEPOIS:**
```sql
DO $$
BEGIN
  PERFORM cron.schedule(
    'daily-radar-update',
    '0 6 * * *',
    $cron$               -- ← CORRETO
    SELECT net.http_post(...)
    $cron$               -- ← CORRETO
  );
END $$;
```

#### 2. Helper Function (linha 78-101 da migration original)

**ANTES:**
```sql
CREATE OR REPLACE FUNCTION trigger_radar_update_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $                     -- ← ERRO
DECLARE
  result jsonb;
BEGIN
  SELECT net.http_post(...) INTO result;
  RETURN result;
END;
$;                       -- ← ERRO
```

**DEPOIS:**
```sql
CREATE OR REPLACE FUNCTION trigger_radar_update_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$                -- ← CORRETO
DECLARE
  result jsonb;
BEGIN
  SELECT net.http_post(...) INTO result;
  RETURN result;
END;
$func$;                  -- ← CORRETO
```

---

## 📦 ARQUIVOS CORRIGIDOS

### 1. Migration Completa (com verbose logging)

**Arquivo:** `supabase/migrations/20251121000000_setup_radar_cron_fixed.sql`

- Delimitadores corretos: `$$`, `$func$`, `$cron$`
- Mensagens de progresso com `\echo` (para uso com psql CLI)
- Verificação de extensões disponíveis (net vs http)
- Configuração automática de variáveis do database
- Queries de verificação ao final

**Uso:**
```bash
psql "$DATABASE_URL_DIRECT" -f supabase/migrations/20251121000000_setup_radar_cron_fixed.sql
```

### 2. Script Simplificado (para Supabase SQL Editor)

**Arquivo:** `docs/sql-scripts/SETUP_RADAR_CRON.sql`

- Sem comandos `\echo` (que não funcionam no Supabase UI)
- Apenas comandos SQL puros
- Otimizado para copy-paste no SQL Editor

**Uso:**
1. Abra: https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/sql/new
2. Copie todo o conteúdo de `docs/sql-scripts/SETUP_RADAR_CRON.sql`
3. Cole no SQL Editor
4. Clique em "Run"
5. Verifique os resultados no final da execução

---

## ✅ VERIFICAÇÃO PÓS-EXECUÇÃO

### 1. Verificar se o Cron Job foi Criado

```sql
SELECT * FROM radar_cron_status;
```

**Output esperado:**
| jobid | jobname | schedule | active |
|-------|---------|----------|--------|
| [ID] | daily-radar-update | 0 6 * * * | true |

### 2. Verificar Configurações do Database

```sql
SELECT
  current_setting('app.settings.supabase_url', true) AS supabase_url,
  CASE
    WHEN current_setting('app.settings.service_role_key', true) IS NULL THEN 'NOT SET'
    ELSE 'CONFIGURED'
  END AS service_key_status;
```

**Output esperado:**
| supabase_url | service_key_status |
|--------------|-------------------|
| https://xlpkabexmwsugkmbngwm.supabase.co | CONFIGURED |

### 3. Verificar Extensões Instaladas

```sql
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pg_cron', 'http', 'net');
```

**Output esperado (mínimo):**
| extname | extversion |
|---------|-----------|
| pg_cron | 1.x.x |
| net | 0.x.x OR http | 1.x.x |

**Nota:** Você precisa ter **pg_cron** + (**net** OU **http**)

### 4. Verificar Tabela de Logs

```sql
SELECT COUNT(*) as log_table_exists
FROM information_schema.tables
WHERE table_name = 'channel_radar_cron_log';
```

**Output esperado:**
| log_table_exists |
|------------------|
| 1 |

---

## 🧪 TESTES

### 1. Trigger Manual (Teste Imediato)

```sql
SELECT trigger_radar_update_now();
```

**Output esperado (se bem-sucedido):**
```json
{
  "success": true,
  "message": "Radar update completed",
  "stats": {
    "total_channels": 2,
    "success_count": 2,
    "error_count": 0
  }
}
```

**Output em caso de erro:**
```json
{
  "error": "net extension not available",
  "message": "Use Supabase Dashboard to trigger manually"
}
```

### 2. Verificar Logs de Execução

```sql
SELECT
  id,
  execution_started_at,
  execution_completed_at,
  status,
  channels_processed,
  channels_failed,
  error_message
FROM channel_radar_cron_log
ORDER BY execution_started_at DESC
LIMIT 5;
```

### 3. Verificar Atualização dos Canais

```sql
SELECT
  channel_id,
  last_update_at,
  next_update_at,
  is_active
FROM channel_radar
ORDER BY last_update_at DESC NULLS LAST;
```

**Após trigger manual, espera-se:**
- `last_update_at` atualizado para timestamp recente
- `next_update_at` setado para amanhã às 6 AM

---

## 🔐 SEGURANÇA

### Service Role Key Hardcoded

**⚠️ ATENÇÃO:** A migration atual tem a service_role_key **hardcoded** no arquivo SQL:

```sql
ALTER DATABASE postgres
SET app.settings.service_role_key = 'eyJhbGciOiJ...';
```

**Isso é aceitável APENAS porque:**
1. A migration roda **diretamente no database do Supabase** (não em código versionado)
2. A chave já está exposta no arquivo `.env` (que NÃO deve estar no Git)
3. A configuração fica no database (não em arquivos de código)

**Alternativa mais segura (recomendada para produção):**

1. Use Supabase Vault para armazenar a chave:
```sql
SELECT vault.create_secret('radar_service_key', 'eyJhbGciOiJ...');
```

2. Modifique a função para buscar do vault:
```sql
headers := jsonb_build_object(
  'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'radar_service_key'),
  ...
)
```

**Importante:** NUNCA commite arquivos `.env` ou `.sql` com chaves reais no Git!

---

## 📊 MONITORAMENTO

### Verificação Diária Recomendada

```sql
-- Resumo das últimas 7 execuções
SELECT
  DATE(execution_started_at) AS execution_date,
  status,
  channels_processed,
  channels_failed,
  EXTRACT(EPOCH FROM (execution_completed_at - execution_started_at)) AS duration_seconds
FROM channel_radar_cron_log
WHERE execution_started_at >= NOW() - INTERVAL '7 days'
ORDER BY execution_started_at DESC;
```

### Alertas Recomendados

Configure alertas para:
1. `status = 'failed'` em `channel_radar_cron_log`
2. `channels_failed > 0`
3. Execuções com duração > 5 minutos
4. Canais com `next_update_at` no passado

---

## 🐛 TROUBLESHOOTING

### Problema: "relation radar_cron_status does not exist"

**Causa:** Migration não foi completada com sucesso

**Solução:**
1. Re-rode a migration corrigida: `docs/sql-scripts/SETUP_RADAR_CRON.sql`
2. Verifique erros no output
3. Se persistir, rode cada step manualmente

### Problema: "Neither net nor http extension is available"

**Causa:** Extensões HTTP não estão habilitadas no Supabase

**Solução:**
1. Entre em contato com o suporte do Supabase
2. Ou use um webhook externo (ex: GitHub Actions scheduled workflow) para chamar a Edge Function

### Problema: Cron roda mas canais não atualizam

**Causa:** Edge Function pode estar falhando

**Solução:**
1. Verifique logs da Edge Function:
```bash
npx supabase functions logs enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm
```
2. Verifique `error_message` em `channel_radar_cron_log`
3. Teste manual: `SELECT trigger_radar_update_now();`

### Problema: "password authentication failed"

**Causa:** `DATABASE_URL_DIRECT` tem senha incorreta

**Solução:**
1. Verifique a senha no Supabase Dashboard > Settings > Database
2. Atualize o `.env`:
```bash
DATABASE_URL_DIRECT="postgresql://postgres:SENHA_CORRETA@db.xlpkabexmwsugkmbngwm.supabase.co:5432/postgres"
```

---

## 📚 REFERÊNCIAS

- [PostgreSQL Dollar-Quoted Strings](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-DOLLAR-QUOTING)
- [pg_cron Extension Documentation](https://github.com/citusdata/pg_cron)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ✅ CHECKLIST FINAL

Após rodar a migration, verifique:

- [ ] Tabela `channel_radar_cron_log` existe
- [ ] View `radar_cron_status` existe e retorna 1 job
- [ ] Função `trigger_radar_update_now()` existe
- [ ] Configurações do database estão setadas (supabase_url + service_role_key)
- [ ] Extensão `pg_cron` está instalada
- [ ] Extensão `net` OU `http` está instalada
- [ ] Cron job está ativo (`active = true` em `radar_cron_status`)
- [ ] Trigger manual funciona: `SELECT trigger_radar_update_now();`
- [ ] Canais foram atualizados (`last_update_at` recente)
- [ ] Logs de execução aparecem em `channel_radar_cron_log`

**Se todos os itens estão ✅, o sistema está funcionando corretamente!**
