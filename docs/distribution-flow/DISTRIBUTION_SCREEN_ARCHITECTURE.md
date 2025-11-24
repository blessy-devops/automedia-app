# Distribution Screen Architecture

**Última atualização**: 2025-11-24

## 📋 Visão Geral

A tela de **Production Distribution** (`/production/distribution`) é responsável por gerenciar a distribuição de vídeos benchmark para canais de produção. Esta tela consulta o **banco do Gobbi** via RPC functions e exibe vídeos com status `pending_distribution` junto com os canais elegíveis para distribuição.

---

## 🏗️ Arquitetura

### Stack Tecnológica
- **Frontend**: Next.js 15 (App Router) + React 19
- **Backend**: Supabase Edge Functions + RPC Functions (PostgreSQL)
- **Banco de Dados**: Banco do Gobbi (Supabase separado)
- **UI**: shadcn/ui + Tailwind CSS

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│  Next.js Page (Server Component)                       │
│  /app/(dashboard)/production/distribution/page.tsx     │
│                                                         │
│  - Chama getVideosAwaitingDistribution()               │
│  - Passa initialVideos para DistributionList          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Server Action                                          │
│  /app/(dashboard)/production/distribution/actions.ts    │
│                                                         │
│  - gobbiClient.rpc('get_videos_awaiting_distribution') │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Banco do Gobbi (Supabase)                              │
│  RPC: get_videos_awaiting_distribution()                │
│                                                         │
│  - Retorna vídeos com status = 'pending_distribution'  │
│  - Inclui canais elegíveis (niche + subniche match)   │
│  - Inclui outlier scores (performance)                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Client Component                                       │
│  /app/(dashboard)/production/distribution/              │
│  DistributionList.tsx                                   │
│                                                         │
│  - Renderiza tabela com vídeos                         │
│  - Exibe performance badges (outlier scores)           │
│  - Permite seleção de canais para distribuição        │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Schema das Tabelas (Banco do Gobbi)

### 1. `benchmark_videos`

**Campos principais**:
```sql
id                          serial PRIMARY KEY
youtube_video_id            varchar(255) UNIQUE NOT NULL
channel_id                  text NOT NULL
title                       varchar(255) NOT NULL
description                 text
status                      text DEFAULT 'available'
categorization              jsonb
performance_vs_median_14d   numeric       -- ⭐ Outlier score (mediana 14d)
performance_vs_avg_14d      numeric       -- ⭐ Outlier score (média 14d)
performance_vs_median_historical numeric  -- Fallback histórico
performance_vs_avg_historical numeric     -- Fallback histórico
created_at                  timestamptz
```

**Status values**:
- `available` - Disponível para envio
- `pending_distribution` - Na fila de distribuição ⭐
- `used` - Já distribuído para produção

**Categorization JSONB**:
```json
{
  "niche": "entertainment",
  "subniche": "storytelling",
  "microniche": "universal_relationship_drama",
  "category": "narrative",
  "format": "live_action"
}
```

---

### 2. `benchmark_channels`

**Campos principais**:
```sql
id              serial PRIMARY KEY
channel_id      text UNIQUE NOT NULL
channel_name    varchar(255) NOT NULL
channel_handle  text (NÃO EXISTE - sempre retornar '')
categorization  jsonb
```

**⚠️ IMPORTANTE**:
- O campo é `channel_name`, NÃO `channel_title`
- `channel_handle` NÃO existe na tabela (usar string vazia)
- JOIN com `benchmark_videos` via `channel_id` (texto)

---

### 3. `structure_accounts`

**Campos principais**:
```sql
id                  serial PRIMARY KEY
unique_profile_id   text
placeholder         text UNIQUE
niche               varchar(100)
subniche            varchar(100)
language            language_enum
brand_id            uuid (FK → structure_brand_bible)
```

**Matching logic**:
- Canais são elegíveis quando `niche` E `subniche` correspondem ao vídeo
- Ordenados por `placeholder` ASC

---

### 4. `structure_brand_bible`

**Campos principais**:
```sql
id                      uuid PRIMARY KEY
brand_name              text UNIQUE NOT NULL
production_workflow_id  uuid
placeholder             text UNIQUE
```

**JOIN com `structure_accounts`**:
```sql
LEFT JOIN structure_brand_bible sbb ON sbb.id = sa.brand_id
```

**⚠️ Campos que NÃO existem**:
- `brand_context` (não usar)
- `visual_profile` (não usar)

---

## 🔧 RPC Function: `get_videos_awaiting_distribution()`

### Localização
**Arquivo**: `docs/gobbi-database/update-rpc-add-outlier-scores.sql`

### Retorno
```typescript
{
  videos: Array<{
    id: number
    title: string
    description: string | null
    categorization: {
      niche: string
      subniche: string
      microniche?: string
      category?: string
      format?: string
    }
    youtube_video_id: string
    youtube_url: string
    status: string
    performance_vs_median_14d: number | null
    performance_vs_avg_14d: number | null
    benchmark_channels: {
      channel_title: string  // ← Vem de bc.channel_name
      channel_handle: string // ← Sempre ''
    } | null
    eligibleChannels: Array<{
      unique_profile_id: string
      placeholder: string
      niche: string
      subniche: string
      language: string
      structure_brand_bible: {
        brand_name: string
        production_workflow_id: string
      } | null
    }>
  }>
  error: string | null
}
```

### Padrões SQL Importantes

#### ✅ CORRETO: ORDER BY dentro do json_agg()
```sql
SELECT json_agg(
  json_build_object(...) ORDER BY sa.placeholder ASC  -- ← DENTRO!
)
FROM structure_accounts sa
WHERE ...
```

#### ❌ ERRADO: ORDER BY fora causa erro de GROUP BY
```sql
SELECT json_agg(json_build_object(...))
FROM structure_accounts sa
WHERE ...
ORDER BY sa.placeholder ASC  -- ← ERRADO! Requer GROUP BY
```

#### ✅ CORRETO: Aliases para compatibilidade
```sql
bc.channel_name AS benchmark_channel_title,  -- ← Alias
'' AS benchmark_channel_handle,              -- ← Campo inexistente
```

#### ✅ CORRETO: JOINs
```sql
-- benchmark_channels
LEFT JOIN benchmark_channels bc ON bc.channel_id = bv.channel_id

-- structure_brand_bible
LEFT JOIN structure_brand_bible sbb ON sbb.id = sa.brand_id
```

---

## 🎨 UI Components

### Performance Badges (Outlier Scores)

**Função helper**: `getPerformanceBadge(score: number | null)`

**Lógica de cores**:
```typescript
score >= 5   → variant="destructive" + "VIRAL" (vermelho)
score >= 2   → variant="default" + "HIGH" (verde)
score >= 1   → variant="secondary" + "GOOD" (amarelo)
score < 1    → variant="outline" + "LOW" (cinza)
null         → variant="outline" + "N/A" (cinza)
```

**Renderização**:
```tsx
<Badge variant={getPerformanceBadge(score).variant}>
  {score.toFixed(1)}x {getPerformanceBadge(score).label}
</Badge>
```

---

## 🚀 Como Adicionar Novos Campos

### Passo 1: Verificar se o campo existe no banco
```sql
-- No SQL Editor do Gobbi:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'benchmark_videos'
  AND column_name = 'NOME_DO_CAMPO';
```

### Passo 2: Adicionar na RPC (CTE videos_data)
```sql
WITH videos_data AS (
  SELECT
    bv.id,
    bv.title,
    bv.NOVO_CAMPO,  -- ← Adicionar aqui
    ...
```

### Passo 3: Adicionar no JSON da resposta
```sql
json_build_object(
  'id', vd.id,
  'title', vd.title,
  'novo_campo', vd.NOVO_CAMPO,  -- ← Adicionar aqui
  ...
)
```

### Passo 4: Atualizar TypeScript types
```typescript
// actions.ts
interface BenchmarkVideo {
  id: number
  title: string
  novo_campo: string | null  // ← Adicionar aqui
  ...
}

// DistributionList.tsx
interface VideoWithChannels {
  id: number
  title: string
  novo_campo: string | null  // ← Adicionar aqui
  ...
}
```

### Passo 5: Atualizar UI
```tsx
<td className="px-4 py-3">
  {video.novo_campo || 'N/A'}
</td>
```

### Passo 6: Deploy
```bash
# 1. Rodar SQL no Gobbi (SQL Editor)
# 2. Deploy Next.js
cd automedia
vercel --prod
```

---

## 🐛 Erros Comuns e Soluções

### Erro: "column bc.channel_title does not exist"
**Causa**: Tentando usar `channel_title` quando o campo é `channel_name`

**Solução**:
```sql
bc.channel_name AS benchmark_channel_title  -- ✅ CORRETO
```

---

### Erro: "column must appear in the GROUP BY clause"
**Causa**: `ORDER BY` está fora do `json_agg()`

**Solução**:
```sql
json_agg(
  json_build_object(...) ORDER BY field ASC  -- ✅ Dentro!
)
```

---

### Erro: "column sbb.brand_context does not exist"
**Causa**: Tentando usar campos que não existem no `structure_brand_bible`

**Solução**: Usar apenas campos que existem:
```sql
json_build_object(
  'brand_name', sbb.brand_name,
  'production_workflow_id', sbb.production_workflow_id
  -- NÃO incluir: brand_context, visual_profile
)
```

---

### Erro: RPC retorna array vazio mas deveria ter vídeos
**Causa**: Status incorreto ou vídeos não têm `categorization`

**Debug**:
```sql
-- Verificar vídeos pending
SELECT id, title, status, categorization
FROM benchmark_videos
WHERE status = 'pending_distribution';

-- Verificar canais elegíveis
SELECT unique_profile_id, placeholder, niche, subniche
FROM structure_accounts
WHERE niche = 'entertainment'
  AND subniche = 'storytelling';
```

---

## 📝 Checklist para Mudanças

Antes de fazer deploy de mudanças na tela de distribution:

- [ ] Schema das tabelas foi verificado no banco do Gobbi
- [ ] Campos usados existem nas tabelas (não adivinhar)
- [ ] `ORDER BY` está dentro do `json_agg()`, não fora
- [ ] Aliases estão corretos (`channel_name` → `benchmark_channel_title`)
- [ ] JOINs usam as colunas corretas (`channel_id`, `brand_id`)
- [ ] TypeScript types foram atualizados em `actions.ts` e `DistributionList.tsx`
- [ ] SQL foi testado no SQL Editor do Gobbi antes de deploy
- [ ] Código funciona localmente (`pnpm dev`)
- [ ] Deploy na Vercel foi feito (`vercel --prod`)

---

## 🔗 Arquivos Relacionados

**Backend (RPC)**:
- `docs/gobbi-database/update-rpc-add-outlier-scores.sql` - RPC atual
- `docs/gobbi-database/create-rpc-get-distributed-videos-paginated.sql` - RPC de referência (padrão SQL)

**Frontend**:
- `app/(dashboard)/production/distribution/page.tsx` - Server Component
- `app/(dashboard)/production/distribution/actions.ts` - Server Actions + Types
- `app/(dashboard)/production/distribution/DistributionList.tsx` - Client Component + UI

**Database**:
- `lib/gobbi-client.ts` - Cliente Supabase do Gobbi
- `supabase/gobbi-database-schema.sql` - Schema completo (referência)

---

## 💡 Dicas

1. **Sempre baseie-se em RPCs que funcionam**: Use `create-rpc-get-distributed-videos-paginated.sql` como referência para padrões SQL
2. **Teste SQL antes de deploy**: Cole no SQL Editor do Gobbi e execute manualmente
3. **Use aliases quando necessário**: Campos podem ter nomes diferentes entre bancos
4. **ORDER BY dentro do json_agg()**: Padrão obrigatório para evitar erros de GROUP BY
5. **Cache do Next.js**: Limpe com `router.refresh()` ou hard refresh (Cmd+Shift+R)
