# MULTI-TENANCY: ANÁLISE RESUMIDA E ROADMAP

**Data**: 2025-11-15
**Objetivo**: Converter Automedia para multi-tenant permitindo múltiplos canais dark usarem a plataforma

---

## 📋 ÍNDICE DE DOCUMENTOS

Esta análise está dividida em múltiplos documentos para facilitar navegação e evitar perda de contexto:

1. **SUMMARY.md** (este arquivo) - Visão geral e roadmap
2. **01_DATABASE_SCHEMA_ANALYSIS.md** - Análise detalhada de cada tabela
3. **02_EDGE_FUNCTIONS_AUDIT.md** - Auditoria das 17 Edge Functions
4. **03_SERVER_ACTIONS_AUDIT.md** - Auditoria das Server Actions
5. **04_CREDENTIALS_MAPPING.md** - Mapeamento de API keys e credenciais
6. **05_RISK_MATRIX.md** - Matriz de riscos e dependências
7. **06_MIGRATION_PLAN.md** - Plano detalhado de migração incremental
8. **07_ROLLBACK_PROCEDURES.md** - Procedimentos de rollback por fase
9. **08_TESTING_CHECKLIST.md** - Checklist de testes por fase
10. **09_CHECKPOINTS.md** - Estados seguros para pausar

---

## 🎯 MOTIVAÇÃO

- Permitir que amigos com canais dark usem a plataforma
- Cada canal terá:
  - ✅ Seus próprios logins
  - ✅ Suas próprias credenciais (Rapid API, OpenRouter)
  - ✅ Seus próprios brand bibbles
  - ✅ Seus próprios dados isolados
  - ✅ Seus próprios webhooks de produção

---

## 📊 ESTADO ATUAL

### Tabelas Mapeadas: 13

**Core (Benchmark)**:
1. `benchmark_channels` - Canais selecionados
2. `benchmark_videos` - Vídeos dos canais
3. `benchmark_channels_baseline_stats` - Stats de baseline

**Enrichment Pipeline**:
4. `channel_enrichment_jobs` - Jobs de enrichment
5. `channel_enrichment_tasks` - Tasks de enrichment
6. `video_enrichment_queue` - Fila de vídeos

**Channel Radar**:
7. `channel_radar` - Monitoramento de canais
8. `channel_radar_cron_log` - Logs do cron

**Production**:
9. `video_folders` - ✅ **JÁ TEM RLS** (user_id)
10. `production_webhooks` - Webhooks para produção
11. `webhook_logs` - Logs de webhooks

**Structure/Config**:
12. `structure_api_keys_pool` - Pool de API keys
13. `structure_categorization_*` - Categorizações (4 tabelas)

### Edge Functions Identificadas: 17+

**Enrichment Pipeline** (5 steps):
1. `enrichment-pipeline-starter` - Inicia pipeline
2. `enrichment-step-1-categorization` - Categorização
3. `enrichment-step-2-socialblade` - Dados do SocialBlade
4. `enrichment-step-3-recent-videos` - Fetch de vídeos recentes
5. `enrichment-step-4-baseline-stats` - Cálculo de baseline
6. `enrichment-step-5-outlier-calc` - Cálculo de outliers

**Orchestration**:
7. `enrichment-orchestrator` - Orquestra pipeline
8. `enrichment-radar-updater` - Atualiza radar

**Video Processing**:
9. `video-transcript` - Transcrição de vídeos
10. `video-categorization-manager` - Gerencia categorização
11. `video-enrichment` - Enrichment de vídeos
12. `video-queue-processor` - Processa fila
13. `video-queue-cron` - Cron da fila
14. `video-queue-callback` - Callback da fila

**Production**:
15. `send-to-gobbi` - Envia para produção

**Utilities**:
16. `test-socialblade-scraper` - Testa scraper
17. `_run-migration` - Migrations

---

## 🔴 RISCOS IDENTIFICADOS

### CRÍTICO (Podem quebrar sistema completamente)
- Pipeline de enrichment (5 steps sequenciais)
- Baseline stats (cálculo global → por tenant)
- Cron jobs (processam dados globalmente)

### ALTO (Requerem atenção especial)
- benchmark_channels (mais referenciada)
- benchmark_videos (volume alto)
- Todas as Edge Functions (17 precisam ser modificadas)
- Webhooks (recém implementados)

### MÉDIO (Gerenciáveis)
- channel_radar (feature mais isolada)
- webhook_logs (apenas logs)
- Enrichment queue (pode ser pausada)

### BAIXO (Já prontos ou fáceis)
- video_folders (JÁ TEM RLS!)
- Structure tables (dados estáticos)

---

## 📈 ESFORÇO ESTIMADO

**Total**: 6-8 semanas (1 dev sênior full-time)

### Breakdown por Fase:

1. **Database Schema** - 2-3 semanas
   - Criar tabela tenants
   - Adicionar tenant_id em 13 tabelas
   - Recriar unique constraints
   - Adicionar RLS policies
   - Migrar dados existentes

2. **Edge Functions** - 2-3 semanas
   - Modificar 17 Edge Functions
   - Adicionar extração de tenant_id
   - Propagar tenant_id pela pipeline
   - Credenciais por tenant

3. **Server Actions** - 1 semana
   - Modificar todas as Server Actions
   - Adicionar filtros por tenant
   - Helper getCurrentTenant()

4. **Frontend** - 1 semana
   - Páginas de settings (organization, team)
   - Onboarding de novos tenants
   - API keys por tenant

5. **Testing & QA** - Sobreposto em todas fases
   - E2E tests
   - Security audit
   - Performance testing

---

## ✅ ESTRATÉGIA: MIGRAÇÃO INCREMENTAL

**Princípio**: ZERO breaking changes até fase final

### Fase 0: Setup (Sem Breaking Changes)
- [ ] Criar tabela `tenants`
- [ ] Criar tabela `tenant_members`
- [ ] Adicionar `tenant_id NULLABLE` em todas tabelas
- [ ] Criar helper `getCurrentTenant()`
- [ ] Páginas de login/signup

**Checkpoint**: App continua funcionando 100%

### Fase 1: Data Migration (Reversível)
- [ ] Criar tenant "Legacy"
- [ ] Backfill: `UPDATE * SET tenant_id = 'legacy'`
- [ ] Tornar `tenant_id NOT NULL`
- [ ] RLS policies em modo READ-ONLY

**Checkpoint**: Dados migrados, app ainda funciona

### Fase 2: Application Layer (Incremental)
- [ ] Refatorar Server Actions (uma por vez)
- [ ] Refatorar Edge Functions (uma por vez)
- [ ] Habilitar RLS para writes
- [ ] Testar MUITO antes de cada deploy

**Checkpoint**: Cada função refatorada é testada isoladamente

### Fase 3: Frontend (Sem Breaking Changes)
- [ ] Settings de organização
- [ ] Team management
- [ ] API keys por tenant
- [ ] Onboarding

**Checkpoint**: UI pronto, tudo funciona

### Fase 4: QA & Launch (Final)
- [ ] E2E testing completo
- [ ] Security audit
- [ ] Performance testing
- [ ] Docs e training
- [ ] Rollout gradual

**Checkpoint Final**: Produção multi-tenant

---

## 🛡️ PROTEÇÕES CONTRA BREAKING CHANGES

### 1. Feature Flags
```typescript
const MULTI_TENANT_ENABLED = process.env.ENABLE_MULTI_TENANT === 'true'

if (MULTI_TENANT_ENABLED) {
  // Novo código multi-tenant
} else {
  // Código legacy (atual)
}
```

### 2. Database Migrations Reversíveis
```sql
-- Cada migration tem um DOWN:
BEGIN;
  -- Fazer mudanças
COMMIT;

-- Rollback explícito documentado
```

### 3. Testes Automáticos
- E2E tests rodam antes de cada deploy
- Se falhar, rollback automático

### 4. Deploy Gradual
- Deploy em staging primeiro
- Teste com 1 tenant de teste
- Só depois rollout produção

---

## 📝 PRÓXIMAS AÇÕES IMEDIATAS

### Esta Sessão (Análise)
- [x] Mapear todas as tabelas
- [ ] Auditar todas Edge Functions (próximo)
- [ ] Auditar Server Actions
- [ ] Mapear credenciais
- [ ] Criar matriz de riscos
- [ ] Documentar plano completo

### Próxima Sessão (Implementação Fase 0)
- [ ] Criar migrations para tabelas tenants
- [ ] Implementar helper getCurrentTenant()
- [ ] Adicionar tenant_id NULLABLE em tabelas
- [ ] Páginas de auth

**IMPORTANTE**: NÃO começar implementação até análise completa estar aprovada!

---

## 🎓 LIÇÕES APRENDIDAS (Para Não Esquecer)

1. **NUNCA fazer Big Bang**
   - Migração incremental SEMPRE
   - Feature flags são seus amigos
   - Cada fase deve ser reversível

2. **Testar MUITO antes de deploy**
   - E2E tests salvam vidas
   - Staging environment é obrigatório
   - Rollback deve ser ensaiado

3. **Documentar TUDO**
   - Estado atual
   - O que muda
   - Como reverter
   - O que testar

4. **Comunicação é chave**
   - Avisar usuários sobre manutenção
   - Ter plano B sempre pronto
   - Monitorar após cada deploy

---

## 📞 QUANDO PEDIR AJUDA

Se em algum momento:
- ❌ Queries começarem a falhar em produção
- ❌ Pipeline de enrichment travar
- ❌ Dados começarem a misturar entre tenants
- ❌ Performance degradar significativamente
- ❌ Rollback não funcionar

**PARE IMEDIATAMENTE** e peça ajuda antes de continuar.

---

**Status Geral**: 🟡 ANÁLISE EM PROGRESSO
**Última Atualização**: 2025-11-15
**Próximo Documento**: [02_EDGE_FUNCTIONS_AUDIT.md](./02_EDGE_FUNCTIONS_AUDIT.md)
