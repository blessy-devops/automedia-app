# ANÁLISE COMPLETA: Database Schema para Multi-Tenancy

**Data**: 2025-11-15
**Objetivo**: Mapear TODAS as tabelas, relacionamentos, constraints e identificar impacto da adição de `tenant_id`

## RESUMO EXECUTIVO

**Status**: EM PROGRESSO - Mapeamento inicial
**Tabelas Total**: TBD (analisando...)
**Tabelas que precisam de tenant_id**: TBD
**Tabelas já preparadas**: 1 (video_folders com RLS)
**Risco Geral**: MUITO ALTO

---

## METODOLOGIA DE ANÁLISE

Para cada tabela, vou documentar:

1. **Nome e Propósito**
2. **Colunas Atuais** (tipos, constraints)
3. **Foreign Keys** (relacionamentos)
4. **Unique Constraints** (o que muda com multi-tenant)
5. **Indexes** (performance)
6. **RLS Policies** (segurança atual)
7. **Impacto de adicionar tenant_id**:
   - Breaking changes (queries existentes)
   - Mudanças em unique constraints
   - Novos indexes necessários
   - Migração de dados
8. **Risco** (BAIXO / MÉDIO / ALTO / CRÍTICO)

---

## CHECKPOINT 1: TABELAS CORE (Benchmark System)

### 1.1 - benchmark_channels

**Propósito**: Armazena informações de canais do YouTube selecionados para benchmarking

**Schema Atual**:
```sql
-- Analisando...
```

**Análise**:
- [ ] Ler schema completo
- [ ] Identificar FKs
- [ ] Identificar unique constraints
- [ ] Avaliar impacto de tenant_id

**Risco Preliminar**: ALTO (tabela core, muitas referências)

---

### 1.2 - benchmark_videos

**Propósito**: Armazena vídeos dos canais benchmarkados

**Schema Atual**:
```sql
-- Analisando...
```

**Análise**:
- [ ] Ler schema completo
- [ ] Identificar FKs para benchmark_channels
- [ ] Identificar unique constraints
- [ ] Avaliar impacto de tenant_id

**Risco Preliminar**: ALTO (volume alto, queries complexas)

---

### 1.3 - benchmark_channels_baseline_stats

**Propósito**: Estatísticas de baseline por canal (médias, medianas)

**Schema Atual**:
```sql
-- Analisando...
```

**Análise**:
- [ ] Ler schema completo
- [ ] Entender cálculo de stats
- [ ] Avaliar se stats são globais ou por canal
- [ ] Impacto: stats precisam ser recalculadas por tenant

**Risco Preliminar**: CRÍTICO (mudança de lógica de cálculo)

---

## CHECKPOINT 2: ENRICHMENT PIPELINE

### 2.1 - channel_enrichment_jobs

**Propósito**: Jobs de enrichment de canais

**Risco Preliminar**: ALTO (pipeline sequencial)

---

### 2.2 - channel_enrichment_tasks

**Propósito**: Tasks individuais de enrichment

**Risco Preliminar**: ALTO (dependências entre tasks)

---

### 2.3 - video_enrichment_queue

**Propósito**: Fila de vídeos para enrichment

**Risco Preliminar**: ALTO (cron jobs)

---

## CHECKPOINT 3: CHANNEL RADAR

### 3.1 - channel_radar

**Propósito**: Radar de canais para monitoramento

**Risco Preliminar**: MÉDIO (feature isolada)

---

## CHECKPOINT 4: PRODUCTION SYSTEM

### 4.1 - video_folders

**Propósito**: Pastas/organização de vídeos (ÚNICO COM RLS!)

**Schema Atual**:
```sql
CREATE TABLE video_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS JÁ EXISTE!
CREATE POLICY "Users can view own folders"
  ON video_folders FOR SELECT
  USING (auth.uid() = user_id);
```

**Análise**:
- ✅ Já tem isolamento (user_id)
- ✅ Já tem RLS policies
- ⚠️ Precisa converter user_id → tenant_id (mas não quebra)

**Risco**: BAIXO (já está 90% pronto)

---

### 4.2 - production_webhooks

**Propósito**: Webhooks para enviar vídeos para DBs de produção

**Risco Preliminar**: ALTO (recém implementado, precisa isolamento)

---

### 4.3 - webhook_logs

**Propósito**: Logs de execução de webhooks

**Risco Preliminar**: MÉDIO (precisa isolamento)

---

## CHECKPOINT 5: OUTRAS TABELAS

**TODO**: Identificar todas as outras tabelas do schema

---

## MATRIZ DE RELACIONAMENTOS

```
[Será preenchido após análise completa]

benchmark_channels → benchmark_videos (1:N)
benchmark_channels → baseline_stats (1:1)
benchmark_videos → enrichment_queue (1:N)
...
```

---

## PRÓXIMOS PASSOS

1. [ ] Ler TODAS as migrations para mapear tabelas completas
2. [ ] Executar `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` no Supabase
3. [ ] Para cada tabela, preencher seções acima
4. [ ] Criar diagrama ER completo
5. [ ] Calcular impacto total de adicionar tenant_id

---

## NOTAS E OBSERVAÇÕES

- **Unique Constraints**: A maioria precisará mudar de `UNIQUE(column)` → `UNIQUE(tenant_id, column)`
- **Foreign Keys**: Não mudam estruturalmente, mas queries precisam filtrar por tenant
- **Cron Jobs**: CRÍTICO - jobs atuais processam dados globais, precisarão iterar por tenant
- **Materialized Views**: Algumas tabelas têm views, precisam ser recriadas por tenant

---

**Status**: 🔴 EM ANDAMENTO
**Última Atualização**: 2025-11-15 (iniciando mapeamento)
