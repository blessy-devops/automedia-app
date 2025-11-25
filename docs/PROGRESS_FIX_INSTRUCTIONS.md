# Instruções para Correção do Bug de Progresso

## Problema Identificado

O vídeo #177 estava com status **'queued'** (válido - na fila de produção), mas o cálculo de progresso estava incorreto:
- Lista: 25% de progresso (ELSE da primeira RPC)
- Detalhes: 50% de progresso (ELSE diferente da segunda RPC)

**'queued' deveria mostrar 0%** já que o vídeo ainda não começou a produção (apenas UM vídeo pode estar em produção por vez).

## Alterações Realizadas

### 1. ✅ SQL Atualizado ([create-production-rpcs.sql](../docs/gobbi-database/create-production-rpcs.sql))

**Mudanças em `get_production_videos_list` (linhas 37-62):**
```sql
CASE
  WHEN pv.status = 'queued' THEN 0  -- ✅ ADICIONADO
  WHEN pv.status = 'published' THEN 100
  WHEN pv.status LIKE 'create_%' THEN ...
  ...
```

**Mudanças em `get_production_video_details` (linhas 136-162):**
```sql
CASE
  WHEN pv.status = 'queued' THEN 0  -- ✅ ADICIONADO
  WHEN pv.status = 'published' THEN 100
  WHEN pv.status LIKE 'create_%' THEN ...
  WHEN pv.status = 'approved' THEN 99  -- ✅ ADICIONADO
  WHEN pv.status = 'failed' THEN 0    -- ✅ ADICIONADO
  WHEN pv.status = 'on_hold' THEN 50  -- ✅ ADICIONADO
  ...
```

### 2. ✅ Validação Adicionada ([production-videos.ts](../app/actions/production-videos.ts))

**Status 'queued' adicionado:**
```typescript
export const VALID_PRODUCTION_STATUSES = [
  // Queue (not started yet - only ONE video can be in production at a time)
  'queued',  // ✅ ADICIONADO
  // Production stages (in order)
  'create_title',
  ...
] as const
```

**Função formatStageName atualizada:**
```typescript
if (status === 'queued') return 'Queued'  // ✅ ADICIONADO
```

## 🚨 AÇÃO NECESSÁRIA

**As alterações no SQL precisam ser executadas no banco do Gobbi:**

1. Acesse: https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/sql/new

2. Copie o conteúdo de:
   `/Users/daviluis/Documents/automedia-platform/automedia/docs/gobbi-database/create-production-rpcs.sql`

3. Cole no SQL Editor e execute

## Testes Antes e Depois

### Antes da Correção:
```
❌ Vídeo #176: create_title → 8% (correto)
❌ Vídeo #177: queued → 25% (lista) / 50% (detalhes) - INCONSISTENTE
```

### Depois da Correção (após executar SQL):
```
✅ Vídeo #176: create_title → 8%
✅ Vídeo #177: queued → 0% (lista e detalhes) - CONSISTENTE
```

## Status Válidos de Produção

**0. queued (0%)** - Enfileirado, aguardando início (apenas 1 vídeo em produção por vez)

### Produção:
1. create_title (8%)
2. create_outline (16%)
3. create_cast (24%)
4. create_rich_outline (32%)
5. create_script (40%)
6. review_script (48%)
7. create_seo_description (56%)
8. create_thumbnail (64%)
9. create_audio_segments (72%)
10. create_video_segments (80%)
11. create_concatenated_audios (88%)
12. create_final_video (96%)

### Pós-produção:
13. pending_approval (98%)
14. approved (99%)
15. published (100%)

### Especiais:
16. failed (0%)
17. on_hold (50%)

## Regra Importante

⚠️ **Apenas UM vídeo pode estar em produção por vez** (status create_*).
Todos os outros devem estar com status 'queued' até que seja sua vez.
