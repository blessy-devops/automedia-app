# Phase 4: Queue Control (Substituir WF0)

**⚠️ ARQUITETURA ANTIGA - NÃO MAIS NECESSÁRIA (2025-11-19)**

Esta fase descreve a implementação da arquitetura CRON-controlled que **não é mais usada**.

**Arquitetura Antiga (esta fase):**
```
Video → add_to_production → [CRON a cada 2min] → pending_distribution → Distribution UI
```

**Arquitetura Nova (atual):**
```
Video → pending_distribution → Distribution UI → [catraca ao distribuir] → production_videos
```

**Ver:** `docs/gobbi-database/WEBHOOK_ARCHITECTURE.md` (seção "MUDANÇA DE ARQUITETURA DA FILA")

---

## 📖 Documentação Original (Arquitetura Antiga)

**Status:** Pronto para Deploy (mas não mais necessário)
**Tempo estimado:** 30 minutos
**Pré-requisitos:** Phases 0-3 implementadas ✅

---

## 📋 O Que É

Substituir o **WF0 do N8N** (controle de fila) por uma **Edge Function + Cron** no Supabase.

### Fluxo Atual (N8N)
```
┌─────────────────────────────────────────┐
│ CRON: A cada 2 minutos                  │
│ ↓                                       │
│ Verifica: já tem vídeo processando?     │
│ ↓                                       │
│ Se NÃO: pega próximo em add_to_production│
│ ↓                                       │
│ Marca como pending_distribution         │
└─────────────────────────────────────────┘
```

### Fluxo Novo (Supabase)
```
┌─────────────────────────────────────────┐
│ pg_cron: A cada 2 minutos               │
│ ↓                                       │
│ Chama Edge Function                     │
│ ↓                                       │
│ Edge Function faz a mesma lógica        │
└─────────────────────────────────────────┘
```

---

## 🚀 Passos de Implementação

### 1. Deploy da Edge Function (5 min)

```bash
# No diretório do projeto
cd /Users/daviluis/Documents/automedia-platform/automedia

# Deploy
supabase functions deploy production-queue-control \
  --project-ref eafkhsmgrzywrhviisdl \
  --no-verify-jwt

# Verificar
supabase functions list --project-ref eafkhsmgrzywrhviisdl
```

**Secrets necessários:**
- Nenhum! A Edge Function usa as variáveis padrão do Supabase (`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`) que já existem automaticamente no projeto.

### 2. Configurar Cron Job (10 min)

**Via Dashboard do Gobbi:**

1. Acesse: https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/database/cron-jobs

2. Clique "Create a new cron job"

3. Preencha:
   - **Name:** `production-queue-control`
   - **Schedule:** `*/2 * * * *` (a cada 2 minutos)
   - **Command:**
     ```sql
     SELECT
       net.http_post(
         url := 'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/production-queue-control',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer ' || current_setting('app.settings.anon_key')
         ),
         body := '{}'::jsonb
       ) as request_id;
     ```

4. Salvar

**OU via SQL Editor:**

```sql
-- Habilitar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar job
SELECT cron.schedule(
  'production-queue-control',
  '*/2 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/production-queue-control',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

**⚠️ IMPORTANTE:** Trocar `ANON_KEY` pela chave anon do projeto Gobbi.

### 3. Testar (5 min)

#### Teste Manual
```bash
curl -X POST \
  'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/production-queue-control' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json'
```

**Resposta esperada (sem vídeos na fila):**
```json
{
  "status": "idle",
  "message": "No videos in queue"
}
```

#### Criar Vídeo de Teste
```sql
-- No banco do Gobbi
UPDATE benchmark_videos
SET status = 'add_to_production'
WHERE id = 26388;  -- usar um ID real
```

Espere 2 minutos e verifique:
```sql
SELECT id, title, status
FROM benchmark_videos
WHERE id = 26388;
-- Deve estar 'pending_distribution'
```

### 4. Monitorar (10 min)

#### Ver Logs da Edge Function
```bash
supabase functions logs production-queue-control \
  --project-ref eafkhsmgrzywrhviisdl \
  --follow
```

#### Ver Execuções do Cron
```sql
-- Últimas 10 execuções
SELECT
  runid,
  status,
  start_time,
  end_time,
  (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'production-queue-control')
ORDER BY start_time DESC
LIMIT 10;
```

---

## ✅ Checklist de Validação

- [ ] Edge Function deployed
- [ ] Cron job criado e ativo
- [ ] Teste manual funciona (retorna JSON correto)
- [ ] Vídeo de teste muda de `add_to_production` → `pending_distribution`
- [ ] Vídeo aparece na tela `/production/distribution`
- [ ] Logs da Edge Function mostram execuções bem-sucedidas
- [ ] Cron executa a cada 2 minutos

---

## 🔧 Configurações Opcionais

### Ajustar Frequência

```sql
-- Mudar para 5 minutos (menos agressivo)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'production-queue-control'),
  schedule := '*/5 * * * *'
);

-- Voltar para 2 minutos
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'production-queue-control'),
  schedule := '*/2 * * * *'
);
```

### Pausar Temporariamente

```sql
-- Desabilitar
SELECT cron.unschedule('production-queue-control');

-- Reabilitar (rodar o SELECT cron.schedule novamente)
```

---

## 📊 Métricas de Sucesso

Após 1 hora rodando:
- ✅ Pelo menos 30 execuções (1 a cada 2min)
- ✅ Nenhum erro crítico nos logs
- ✅ Vídeos movendo de `add_to_production` → `pending_distribution` automaticamente
- ✅ Sistema não processando 2 vídeos ao mesmo tempo (catraca funcionando)

---

## 🛑 Rollback (Se Necessário)

Se algo der errado, voltar para o N8N:

```sql
-- Parar cron
SELECT cron.unschedule('production-queue-control');

-- Reativar WF0 no N8N
```

---

## 🎯 Próximos Passos (Futuro)

Depois que Phase 4 estiver estável:

1. **Desativar WF0 do N8N** completamente
2. **Modo automático:** Adicionar flag `auto_distribute` para pular seleção manual
3. **Notificações:** Slack/email quando vídeo chega em pending_distribution
4. **Analytics:** Dashboard de métricas da fila

---

## 📝 Notas

- **Não confundir:** Esta Edge Function NÃO processa os 15 stages. Ela apenas move vídeos para a fila de distribuição.
- **WF1 substituído:** A seleção de canais já foi migrada para UI (Phases 1-3).
- **WF0 sendo substituído:** É isso que a Phase 4 faz.
