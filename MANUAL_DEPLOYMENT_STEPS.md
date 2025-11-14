# 🚀 Channel Radar - Manual Deployment Steps

## ✅ Status: Edge Function Deployed Successfully!

A Edge Function `enrichment-radar-updater` já foi deployada com sucesso!

**Function URL:** `https://xlpkabexmwsugkmbngwm.supabase.co/functions/v1/enrichment-radar-updater`

---

## 📋 O que falta fazer:

### Step 1: Aplicar Migrations do Banco de Dados

Você tem 2 opções:

#### Opção A: Via Supabase Dashboard (RECOMENDADO)

1. Acesse o SQL Editor do Supabase:
   ```
   https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/sql/new
   ```

2. Cole e execute o conteúdo do arquivo:
   ```
   supabase/migrations/20251113131610_create_channel_radar.sql
   ```

   **Nota:** Se der erro de "already exists", ignore - significa que já foi aplicado.

3. Cole e execute o conteúdo do arquivo:
   ```
   supabase/migrations/20251113131611_setup_radar_cron.sql
   ```

#### Opção B: Via CLI (se preferir)

```bash
cd automedia

# Instalar versão mais nova do Supabase CLI (opcional mas recomendado)
brew upgrade supabase

# Aplicar migrations
supabase db push --yes
```

---

### Step 2: Configurar Database Settings

No Supabase SQL Editor, execute:

```sql
-- Configure URL do Supabase para o cron job
ALTER DATABASE postgres
SET app.settings.supabase_url = 'https://xlpkabexmwsugkmbngwm.supabase.co';

-- Configure Service Role Key para o cron job
ALTER DATABASE postgres
SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGthYmV4bXdzdWdrbWJuZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4ODAyNSwiZXhwIjoyMDc1OTY0MDI1fQ.jdMI6Gxr7DC4XMyJ57Dax3TZ80wUiXThv0TjZdh3iOs';
```

---

### Step 3: Verificar Instalação

No Supabase SQL Editor, execute as seguintes queries para verificar:

```sql
-- 1. Verificar se cron job foi criado
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'daily-radar-update';
-- Deve retornar 1 linha com schedule: "0 6 * * *"

-- 2. Verificar se tabelas existem
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('channel_radar', 'channel_radar_cron_log')
AND table_schema = 'public';
-- Deve retornar 2 linhas

-- 3. Verificar se coluna in_radar foi adicionada
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'benchmark_channels'
AND column_name = 'in_radar';
-- Deve retornar 1 linha com type: boolean

-- 4. Verificar permissões
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'channel_radar'
AND grantee IN ('authenticated', 'service_role');
-- Deve retornar múltiplas linhas

-- 5. Testar função manual de trigger
SELECT trigger_radar_update_now();
-- Deve invocar a Edge Function e retornar resultado
```

---

## 🧪 Testes End-to-End

### 1. Testar Adicionar Canal ao Radar

1. Navegue até: `http://localhost:3000/channels`
2. Clique em "Add to Radar" em qualquer canal
3. Vá para: `http://localhost:3000/radar`
4. Verifique se o canal aparece na lista

### 2. Verificar Real-time Updates

1. Abra `/radar` em duas abas do navegador
2. Em uma aba, adicione/remova um canal
3. Na outra aba, verifique se aparece sem refresh

### 3. Testar Links de Navegação

1. Na página `/radar` (table ou gallery view)
2. Clique no nome do canal ou avatar
3. Deve navegar para `/channels/{id}` corretamente

### 4. Monitorar Cron Job

```sql
-- Ver últimas execuções
SELECT
    execution_started_at,
    execution_completed_at,
    status,
    channels_processed,
    channels_failed
FROM channel_radar_cron_log
ORDER BY execution_started_at DESC
LIMIT 10;
```

---

## 📊 Checklist Final

- [ ] Edge Function deployada ✅ (JÁ FEITO!)
- [ ] Migration 1 aplicada (`create_channel_radar.sql`)
- [ ] Migration 2 aplicada (`setup_radar_cron.sql`)
- [ ] Database settings configuradas (URL + service key)
- [ ] Cron job verificado (schedule 6 AM)
- [ ] Tabelas criadas
- [ ] Coluna `in_radar` adicionada
- [ ] Permissões configuradas
- [ ] Teste: Adicionar canal ao radar
- [ ] Teste: Navegar para canal a partir do radar
- [ ] Teste: Real-time updates funcionando
- [ ] Teste: Trigger manual funciona

---

## 🆘 Troubleshooting

### "Cron job not found"
Execute a migration 2 novamente no SQL Editor.

### "Permission denied on channel_radar"
Verifique se a migration 1 foi aplicada (grants estão lá).

### "Column in_radar does not exist"
Execute a migration 1 novamente no SQL Editor.

### "Function trigger_radar_update_now does not exist"
Execute a migration 2 novamente no SQL Editor.

### "Failed to invoke Edge Function"
Verifique se database settings foram configurados corretamente (Step 2).

---

## 🎯 Arquivo SQL Completo para Copiar/Colar

Também criei um arquivo com todas as queries necessárias:

```
scripts/finish-radar-deployment.sql
```

Você pode copiar todo o conteúdo desse arquivo e colar de uma vez no SQL Editor.

---

**Última atualização:** 2025-11-13
**Status:** Edge Function ✅ | Migrations ⏳ | Config ⏳
