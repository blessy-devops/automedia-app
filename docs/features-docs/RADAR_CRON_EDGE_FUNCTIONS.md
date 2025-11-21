# 🚀 RADAR CRON - USANDO SUPABASE EDGE FUNCTIONS CRON

## 🎯 SOLUÇÃO FINAL - Edge Functions Cron (Built-in)

Devido à falta das extensões `net` e `http` no PostgreSQL, a solução **RECOMENDADA** é usar o **Supabase Edge Functions Cron** nativo, que não depende de `pg_cron` ou extensões HTTP.

---

## 📊 COMPARAÇÃO: pg_cron vs Edge Functions Cron

| Aspecto | pg_cron | Edge Functions Cron |
|---------|---------|---------------------|
| **Onde roda** | Dentro do PostgreSQL | Infraestrutura Supabase |
| **Requer extensões** | `pg_cron` + `net`/`http` | Nenhuma |
| **Configuração** | SQL scripts complexos | Arquivo JSON simples |
| **Gerenciamento** | SQL queries | Supabase Dashboard |
| **Logs** | Customizado (nossa tabela) | Built-in + nossa tabela |
| **Confiabilidade** | Depende do database | Gerenciado pela Supabase |
| **Melhor para** | Self-hosted PostgreSQL | Supabase managed |

**Conclusão:** Para Supabase managed, **Edge Functions Cron é superior**.

---

## 🛠️ IMPLEMENTAÇÃO

### PASSO 1: Configurar o Cron na Edge Function

Já foi criado o arquivo de configuração:

**Arquivo:** `supabase/functions/enrichment-radar-updater/cron.json`

```json
{
  "schedule": "0 6 * * *",
  "description": "Daily radar update at 6 AM UTC"
}
```

**Formato do schedule:** Mesma sintaxe do cron padrão
- `0 6 * * *` = todo dia às 6 AM UTC
- `*/15 * * * *` = a cada 15 minutos
- `0 */4 * * *` = a cada 4 horas
- `0 0 * * 0` = todo domingo à meia-noite

### PASSO 2: Criar Tabela de Logs no Database

Execute o script SQL no Supabase SQL Editor:

**Arquivo:** `docs/sql-scripts/SETUP_RADAR_LOGS_ONLY.sql`

**O que faz:**
- ✅ Cria `channel_radar_cron_log` (tabela de logs)
- ✅ Cria `trigger_radar_update_now()` (função auxiliar)
- ✅ Configura permissões

**Execute:**
1. Abra: https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/sql/new
2. Cole o conteúdo de `SETUP_RADAR_LOGS_ONLY.sql`
3. Clique em **"Run"**

### PASSO 3: Deploy da Edge Function com Cron

No terminal, execute:

```bash
cd /Users/daviluis/Documents/automedia-platform/automedia

npx supabase functions deploy enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm
```

**Output esperado:**
```
Deploying function enrichment-radar-updater...
✓ Function deployed successfully
✓ Cron schedule configured: 0 6 * * *
```

### PASSO 4: Verificar se o Cron foi Configurado

#### Opção A: Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/functions
2. Clique em **`enrichment-radar-updater`**
3. Procure por **"Cron Schedule"** ou **"Scheduled Executions"**
4. Deve mostrar: `0 6 * * *` (Daily at 6 AM UTC)

#### Opção B: Via CLI

```bash
npx supabase functions list --project-ref xlpkabexmwsugkmbngwm
```

Procure pela coluna **"CRON"** ou **"SCHEDULE"** na linha do `enrichment-radar-updater`.

---

## 🧪 TESTES

### 1. Trigger Manual via Dashboard

1. Acesse: https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/functions
2. Clique em **`enrichment-radar-updater`**
3. Clique em **"Invoke Function"** ou **"Test"**
4. Cole no body:
```json
{
  "trigger": "manual"
}
```
5. Clique em **"Send Request"**

**Response esperado:**
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

### 2. Verificar Logs de Execução

No Supabase SQL Editor:

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

### 3. Verificar Canais Atualizados

```sql
SELECT
  channel_id,
  last_update_at,
  next_update_at,
  is_active
FROM channel_radar
ORDER BY last_update_at DESC NULLS LAST;
```

Após o trigger manual:
- `last_update_at` deve ser recente
- `next_update_at` deve ser amanhã às 6 AM

---

## 📊 MONITORAMENTO

### Logs da Edge Function

No terminal:

```bash
npx supabase functions logs enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm --follow
```

Busque por:
- `[Radar Updater] Starting daily radar update`
- `[Radar Updater] Found X channel(s) to update`
- `[Radar Updater] ✓ Channel completed successfully`

### Logs no Dashboard

1. Acesse: https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/logs/edge-functions
2. Filtre por: `enrichment-radar-updater`
3. Verifique execuções agendadas (aparecerão como `trigger: 'cron'`)

### Alertas Recomendados

Configure alertas para:
- Execuções falhadas (`status = 'failed'`)
- Duração > 5 minutos
- Canais não atualizados há 2+ dias

---

## 🔧 CONFIGURAÇÃO AVANÇADA

### Alterar Schedule

1. Edite `supabase/functions/enrichment-radar-updater/cron.json`
2. Altere o campo `schedule`:
```json
{
  "schedule": "0 */12 * * *",  // A cada 12 horas
  "description": "Radar update every 12 hours"
}
```
3. Re-deploy:
```bash
npx supabase functions deploy enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm
```

### Desabilitar Cron Temporariamente

**Opção 1:** Deletar o arquivo `cron.json` e re-deploy

**Opção 2:** Via Dashboard (se disponível)

**Opção 3:** Setar canais como `is_active = false`:
```sql
UPDATE channel_radar SET is_active = false;
```

### Re-habilitar Cron

Recrie `cron.json` e re-deploy, ou:
```sql
UPDATE channel_radar SET is_active = true;
```

---

## 🐛 TROUBLESHOOTING

### Problema: Cron não aparece no Dashboard

**Causa:** Deploy falhou ou `cron.json` tem sintaxe inválida

**Solução:**
1. Verifique o output do `npx supabase functions deploy`
2. Valide `cron.json` em https://jsonlint.com
3. Re-deploy com `--debug`:
```bash
npx supabase functions deploy enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm --debug
```

### Problema: Cron roda mas canais não atualizam

**Causa:** Edge Function está falhando

**Solução:**
1. Verifique logs:
```bash
npx supabase functions logs enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm
```
2. Teste manualmente via Dashboard
3. Verifique se `channel_radar` tem canais ativos:
```sql
SELECT COUNT(*) FROM channel_radar WHERE is_active = true;
```

### Problema: "Function not found" ao deployar

**Causa:** Caminho incorreto ou função não existe

**Solução:**
```bash
# Liste as funções locais
ls -la supabase/functions/

# Verifique se existe index.ts
cat supabase/functions/enrichment-radar-updater/index.ts

# Re-deploy do zero
npx supabase functions deploy enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm --no-verify-jwt
```

---

## ✅ CHECKLIST FINAL

Após completar todos os passos:

- [ ] Arquivo `cron.json` existe em `supabase/functions/enrichment-radar-updater/`
- [ ] Script SQL `SETUP_RADAR_LOGS_ONLY.sql` foi executado sem erros
- [ ] Tabela `channel_radar_cron_log` existe
- [ ] Secrets estão no Vault (`radar_supabase_url`, `radar_service_role_key`)
- [ ] Edge Function foi deployada: `npx supabase functions deploy enrichment-radar-updater`
- [ ] Cron schedule aparece no Dashboard (ou via `functions list`)
- [ ] Trigger manual funciona via Dashboard
- [ ] Logs aparecem em `channel_radar_cron_log` após trigger manual
- [ ] Canais foram atualizados (`last_update_at` recente)

**Se todos os itens estão ✅, o sistema está funcionando!**

---

## 📚 REFERÊNCIAS

- [Supabase Edge Functions Cron](https://supabase.com/docs/guides/functions/schedule-functions)
- [Cron Syntax Reference](https://crontab.guru)
- [Edge Functions Logs](https://supabase.com/docs/guides/functions/logging)

---

## 🎯 RESUMO EXECUTIVO

### O que fizemos:

1. ✅ Criamos `cron.json` na Edge Function (schedule: 6 AM diário)
2. ✅ Criamos tabela de logs no database (via SQL script)
3. ✅ Secrets já estão no Vault (você fez isso antes)

### O que falta fazer:

1. ⏳ Rodar `SETUP_RADAR_LOGS_ONLY.sql` no Supabase SQL Editor
2. ⏳ Deploy da Edge Function: `npx supabase functions deploy enrichment-radar-updater`
3. ⏳ Testar manualmente via Dashboard
4. ⏳ Verificar se funciona

### Por que Edge Functions Cron é melhor que pg_cron:

- ✅ Não precisa de extensões PostgreSQL (`net`, `http`)
- ✅ Gerenciado pela Supabase (mais confiável)
- ✅ Configuração simples (arquivo JSON)
- ✅ Logs built-in no Dashboard
- ✅ Fácil de desabilitar/re-habilitar
- ✅ Escala automaticamente

**Próximo passo:** Rode o script SQL e depois faça o deploy da função! 🚀
