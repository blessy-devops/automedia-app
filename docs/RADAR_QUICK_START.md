# ⚡ RADAR CRON - GUIA RÁPIDO DE CONFIGURAÇÃO

## 🎯 O QUE VOCÊ PRECISA FAZER (3 passos)

### ✅ JÁ FOI FEITO
- Secrets no Vault (você já fez)
- Arquivo `cron.json` criado (acabei de criar)

### ⏳ FALTA FAZER

---

## PASSO 1: Rodar Script SQL (2 minutos)

### 1.1. Copie o arquivo
Abra: `docs/sql-scripts/SETUP_RADAR_LOGS_ONLY.sql`

### 1.2. Cole no Supabase SQL Editor
👉 https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/sql/new

### 1.3. Execute
Clique em **"Run"**

### 1.4. Verifique
Você deve ver no final:
```
✅ RADAR LOGS TABLE CREATED!
```

---

## PASSO 2: Deploy da Edge Function (1 minuto)

### 2.1. Abra o terminal

### 2.2. Execute:
```bash
cd /Users/daviluis/Documents/automedia-platform/automedia

npx supabase functions deploy enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm
```

### 2.3. Aguarde o deploy
Você deve ver:
```
Deploying function enrichment-radar-updater...
✓ Function deployed successfully
✓ Cron schedule configured: 0 6 * * *
```

---

## PASSO 3: Testar Manualmente (1 minuto)

### 3.1. Acesse o Dashboard
👉 https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/functions

### 3.2. Clique em `enrichment-radar-updater`

### 3.3. Clique em "Invoke" ou "Test"

### 3.4. Cole no body:
```json
{
  "trigger": "manual"
}
```

### 3.5. Clique em "Send Request"

### 3.6. Verifique a resposta:
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

---

## ✅ VERIFICAÇÃO FINAL

### Verifique se os canais foram atualizados:

No Supabase SQL Editor:
```sql
SELECT
  channel_id,
  last_update_at,
  next_update_at,
  is_active
FROM channel_radar
ORDER BY last_update_at DESC NULLS LAST;
```

**Esperado:**
- `last_update_at` deve estar recente (agora)
- `next_update_at` deve ser amanhã às 6 AM

---

## 🎉 PRONTO!

Se tudo deu certo:
- ✅ Tabela de logs criada
- ✅ Edge Function deployada com cron
- ✅ Cron agendado para 6 AM diário
- ✅ Canais atualizados manualmente
- ✅ Sistema funcionando 100%

**A partir de amanhã, às 6 AM UTC, o radar vai rodar automaticamente!**

---

## 🐛 ALGO DEU ERRADO?

### Erro no PASSO 1 (SQL):
- Copie o erro completo
- Me mostre aqui

### Erro no PASSO 2 (Deploy):
- Copie o output completo do terminal
- Me mostre aqui

### Erro no PASSO 3 (Teste):
- Copie a resposta do "Invoke"
- Me mostre aqui

---

## 📊 DIFERENÇA: pg_cron vs Edge Functions Cron

**Antes (tentamos fazer):**
```
PostgreSQL (pg_cron) → Extensão HTTP → Edge Function
                ↑
            ❌ Faltam extensões net/http
```

**Agora (solução final):**
```
Supabase Scheduler → Edge Function
    ↑
✅ Built-in, não precisa de extensões
```

---

## 🔍 COMO MONITORAR

### Ver logs da última execução:
```sql
SELECT * FROM channel_radar_cron_log
ORDER BY execution_started_at DESC
LIMIT 1;
```

### Ver próxima execução:
```sql
SELECT
  channel_id,
  next_update_at,
  next_update_at - NOW() as "Time Until Next Update"
FROM channel_radar
WHERE is_active = true;
```

### Ver logs em tempo real (terminal):
```bash
npx supabase functions logs enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm --follow
```

---

## ⏰ ALTERAR O HORÁRIO DO CRON

Se quiser mudar de 6 AM para outro horário:

1. Edite: `supabase/functions/enrichment-radar-updater/cron.json`
2. Altere `schedule`:
```json
{
  "schedule": "0 12 * * *",  // Meio-dia em vez de 6 AM
  "description": "Daily radar update at 12 PM UTC"
}
```
3. Re-deploy:
```bash
npx supabase functions deploy enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm
```

**Exemplos de schedules:**
- `0 6 * * *` - Todo dia às 6 AM
- `0 */6 * * *` - A cada 6 horas
- `0 0 * * 1` - Toda segunda-feira à meia-noite
- `*/30 * * * *` - A cada 30 minutos

**Ferramenta útil:** https://crontab.guru (valida sintaxe cron)

---

## 🎯 PRÓXIMOS PASSOS

Execute os 3 passos acima e me avise:
- [ ] PASSO 1 concluído ✅
- [ ] PASSO 2 concluído ✅
- [ ] PASSO 3 concluído ✅

**Depois me mostre:**
- O resultado do teste manual (response JSON)
- A query dos canais atualizados

**Se tudo funcionar, o radar estará 100% operacional! 🚀**
