# 🔐 RADAR CRON - COMPARAÇÃO DE ABORDAGENS DE CREDENCIAIS

## 📊 COMPARAÇÃO DAS 3 ABORDAGENS

| Aspecto | ❌ Hardcoding | ⚠️ ALTER DATABASE | ✅ Supabase Vault |
|---------|--------------|-------------------|-------------------|
| **Segurança** | Baixa (exposta em plain text) | Média (protegida por permissões) | Alta (criptografada) |
| **Requer Superuser** | Não | **SIM** (não funciona no SQL Editor) | Não |
| **Fácil de atualizar** | Não (precisa redeployar) | Não (precisa redeployar) | **SIM** (UPDATE simples) |
| **Best Practice** | ❌ Não recomendado | ⚠️ OK para dev | ✅ Recomendado para produção |
| **Funciona no Supabase** | ✅ Sim | ❌ Não (falta permissão) | ✅ Sim |
| **Versionável no Git** | ❌ Expõe secrets | ❌ Expõe secrets | ✅ Sim (secrets fora do código) |

---

## 1️⃣ ABORDAGEM 1: HARDCODING (não recomendado)

### Código:
```sql
DO $$
DECLARE
  supabase_url TEXT := 'https://xlpkabexmwsugkmbngwm.supabase.co';
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
BEGIN
  SELECT cron.schedule(
    'job-name',
    '0 6 * * *',
    format($cron$
      SELECT net.http_post(
        url := '%s/functions/v1/...',
        headers := jsonb_build_object('Authorization', 'Bearer %s', ...)
      )
    $cron$, supabase_url, service_key)
  );
END $$;
```

### ✅ Prós:
- Funciona sem permissões especiais
- Simples de implementar
- Não depende de extensões adicionais

### ❌ Contras:
- **Secrets em plain text** no código SQL
- Difícil de atualizar (precisa redeployar a migration)
- Se o script vazar, as credenciais vão junto
- Não é best practice

### 📋 Use quando:
- Ambiente de desenvolvimento/teste local
- Prototipagem rápida
- Você tem certeza de que o script nunca será commitado no Git

---

## 2️⃣ ABORDAGEM 2: ALTER DATABASE (ideal mas não funciona no Supabase)

### Código:
```sql
-- Seta configurações do database (REQUER SUPERUSER)
ALTER DATABASE postgres
SET app.settings.supabase_url = 'https://xlpkabexmwsugkmbngwm.supabase.co';

ALTER DATABASE postgres
SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

-- Usa as configurações
SELECT cron.schedule(
  'job-name',
  '0 6 * * *',
  $cron$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/...',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        ...
      )
    )
  $cron$
);
```

### ✅ Prós:
- Configurações ficam no database (não em código)
- Pode ser lido por qualquer função/query
- Approach "padrão" do PostgreSQL

### ❌ Contras:
- **Requer permissões de superuser** (não disponível no SQL Editor do Supabase)
- Ainda expõe secrets (visíveis via `SELECT current_setting(...)`)
- Difícil de atualizar sem acesso direto ao database

### 📋 Use quando:
- Você tem acesso SSH/direto ao servidor PostgreSQL
- Ambiente self-hosted (não managed Supabase)
- Configurações não-sensíveis (URLs públicas, timeouts, etc.)

### ⚠️ Por que não funciona no Supabase:
```
ERROR: 42501: permission denied to set parameter "app.settings.supabase_url"
```
O SQL Editor roda com um usuário limitado que não tem permissões de superuser.

---

## 3️⃣ ABORDAGEM 3: SUPABASE VAULT ⭐ (RECOMENDADO)

### Código:
```sql
-- PASSO 1: Armazenar secrets no Vault (criptografado)
INSERT INTO vault.secrets (name, secret)
VALUES
  ('radar_supabase_url', 'https://xlpkabexmwsugkmbngwm.supabase.co'),
  ('radar_service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

-- PASSO 2: Ler do Vault nas funções
SELECT cron.schedule(
  'job-name',
  '0 6 * * *',
  $cron$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'radar_supabase_url') || '/functions/v1/...',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'radar_service_role_key'),
        ...
      )
    )
  $cron$
);
```

### ✅ Prós:
- **Secrets criptografados** no database
- Fácil de atualizar: `UPDATE vault.secrets SET secret = 'NEW_VALUE' WHERE name = 'xxx'`
- Best practice recomendada pela Supabase
- Não requer permissões de superuser
- Pode versionar o script no Git (sem secrets expostos)
- Auditável (tem logs de acesso)

### ❌ Contras:
- Requer extensão `vault` (geralmente já vem instalada no Supabase)
- Queries ficam um pouco mais longas (precisa fazer SELECT do Vault)

### 📋 Use quando:
- Produção (sempre!)
- Ambientes gerenciados (Supabase, AWS RDS, etc.)
- Precisa rotacionar credenciais sem redeploy
- Quer seguir security best practices

---

## 🔍 COMO O VAULT FUNCIONA

### Tabelas do Vault:

```sql
-- Tabela encriptada (você NÃO consegue ler diretamente)
vault.secrets
  - id
  - name (plain text - identificador)
  - secret (ENCRYPTED - não consegue ler)
  - created_at

-- View para DESCRIPTOGRAFAR (só acessível com permissões)
vault.decrypted_secrets
  - id
  - name
  - decrypted_secret (plain text - só aqui você vê o valor real)
  - created_at
```

### Fluxo de Segurança:

```
┌─────────────────────────────────────────────────┐
│  INSERT INTO vault.secrets                      │
│  VALUES ('meu_secret', 'valor_sensivel')        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  PostgreSQL Vault    │
        │  (pgsodium ext)      │
        │  Encrypts with       │
        │  database master key │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ vault.secrets table  │
        │ secret = 0x3f9a7b... │ ← Encrypted blob
        └──────────┬───────────┘
                   │
                   ▼ (quando você faz SELECT)
        ┌──────────────────────────────┐
        │ vault.decrypted_secrets view │
        │ decrypted_secret = 'valor... │ ← Plain text
        └──────────────────────────────┘
```

### Exemplo de uso:

```sql
-- Criar secret
INSERT INTO vault.secrets (name, secret)
VALUES ('minha_api_key', 'sk_live_1234567890abcdef');

-- Ler secret (descriptografado)
SELECT decrypted_secret
FROM vault.decrypted_secrets
WHERE name = 'minha_api_key';
-- Retorna: 'sk_live_1234567890abcdef'

-- Atualizar secret
UPDATE vault.secrets
SET secret = 'sk_live_NOVA_CHAVE_AQUI'
WHERE name = 'minha_api_key';

-- Deletar secret
DELETE FROM vault.secrets WHERE name = 'minha_api_key';
```

---

## 🚀 QUAL USAR NO NOSSO CASO?

### Recomendação: **SUPABASE VAULT** ✅

**Motivo:**
1. Você está usando Supabase managed (não tem acesso superuser)
2. É produção (precisa de security best practices)
3. Pode precisar rotacionar a chave no futuro
4. O script pode ser versionado no Git sem expor secrets

### Script recomendado:
👉 **`docs/sql-scripts/SETUP_RADAR_CRON_WITH_VAULT.sql`**

---

## 📚 REFERÊNCIAS

- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault)
- [pgsodium Extension (base do Vault)](https://github.com/michelp/pgsodium)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/auth-methods.html)

---

## ❓ FAQ

### Q: Por que não usar environment variables como nas Edge Functions?

**A:** Environment variables (`SUPABASE_URL`, etc.) só existem no **runtime Deno** (Edge Functions), não no PostgreSQL. O cron job roda **DENTRO** do PostgreSQL, então não tem acesso a essas variáveis.

### Q: O Vault é realmente seguro?

**A:** Sim! O Vault usa a extensão `pgsodium` que implementa criptografia de nível militar (libsodium). Os secrets são criptografados com a master key do database.

### Q: E se eu quiser rotacionar a chave?

**A:** Super fácil:
```sql
UPDATE vault.secrets
SET secret = 'NOVA_CHAVE_AQUI'
WHERE name = 'radar_service_role_key';
```
Pronto! O cron vai usar a nova chave na próxima execução.

### Q: Posso usar Vault para outros secrets?

**A:** Sim! Use para qualquer coisa sensível:
- API keys de terceiros (OpenAI, RapidAPI, etc.)
- Database credentials
- Webhooks URLs com tokens
- Encryption keys

### Q: O que acontece se a extensão Vault não estiver instalada?

**A:** O script vai falhar na linha `CREATE EXTENSION IF NOT EXISTS vault`. Nesse caso, use a **Abordagem 1 (Hardcoding)** temporariamente e entre em contato com o suporte do Supabase para habilitar o Vault.

---

## ✅ CHECKLIST DE DECISÃO

Use este checklist para escolher a abordagem:

```
[ ] Estou em produção?
    ✅ Sim → Use VAULT
    ❌ Não → Pode usar Hardcoding (dev/test)

[ ] Tenho acesso superuser ao PostgreSQL?
    ✅ Sim → Pode usar ALTER DATABASE
    ❌ Não → Use VAULT ou Hardcoding

[ ] O script será versionado no Git?
    ✅ Sim → Use VAULT (secrets não ficam expostos)
    ❌ Não → Qualquer abordagem funciona

[ ] Preciso rotacionar credenciais facilmente?
    ✅ Sim → Use VAULT
    ❌ Não → Qualquer abordagem funciona

[ ] A extensão Vault está disponível?
    ✅ Sim → Use VAULT
    ❌ Não → Use Hardcoding (e peça ao suporte para habilitar)
```

**Se 3+ respostas positivas → USE VAULT** ✅
