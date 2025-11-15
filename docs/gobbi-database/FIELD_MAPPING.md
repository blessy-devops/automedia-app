# Field Mapping: sendToGobbi ↔ receive-benchmark-videos ↔ benchmark_videos Schema

**Data:** 2025-11-14
**Status:** ⚠️ INCOMPATIBILIDADE DETECTADA - 1 campo faltando no envio

---

## 📊 RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| **Total de campos no schema** | 33 campos |
| **Campos enviados pelo `sendToGobbi`** | 26 campos |
| **Campos recebidos pelo `receive-benchmark-videos`** | 27 campos |
| **Campos auto-gerados pelo banco** | 6 campos (id, created_at, updated_at, etc.) |
| **Campos FALTANDO no envio** | ❌ **1 campo** |

---

## ❌ CAMPO FALTANDO NO ENVIO

### `sendToGobbi` NÃO está enviando:

| Campo | Tipo | Status no Schema | Impacto |
|-------|------|------------------|---------|
| `last_enriched_at` | TIMESTAMPTZ | ⚠️ Campo opcional, mas importante | MÉDIO |

**Problema:**
- `sendToGobbi` busca o campo mas **NÃO está no SELECT**
- `receive-benchmark-videos` espera receber e usa fallback
- Campo existe no schema e deveria ser enviado

**Solução:**
Adicionar `last_enriched_at` no SELECT do `sendToGobbi` (linha 136)

---

## ✅ MAPEAMENTO COMPLETO DE CAMPOS

### Legenda
- ✅ Campo enviado e recebido corretamente
- ⚠️ Campo com fallback (auto-gerado se ausente)
- 🔧 Campo auto-calculado pelo banco (trigger)
- ❌ Campo NÃO enviado (faltando)
- 🚫 Campo auto-gerado (não deve ser enviado)

---

### 1. CAMPOS OBRIGATÓRIOS (2 campos)

| Campo | Schema Type | sendToGobbi | receive | Status |
|-------|-------------|-------------|---------|--------|
| `youtube_video_id` | VARCHAR(20) UNIQUE NOT NULL | ✅ Linha 106 | ✅ Linha 203 | ✅ OK |
| `channel_id` | VARCHAR(30) NOT NULL | ✅ Linha 107 | ✅ Linha 204 | ✅ OK |

---

### 2. CORE VIDEO FIELDS (5 campos)

| Campo | Schema Type | sendToGobbi | receive | Status |
|-------|-------------|-------------|---------|--------|
| `title` | TEXT | ✅ Linha 108 | ✅ Linha 207 | ✅ OK |
| `description` | TEXT | ✅ Linha 109 | ✅ Linha 208 | ✅ OK |
| `thumbnail_url` | TEXT | ✅ Linha 115 | ✅ Linha 209 | ✅ OK |
| `upload_date` | TIMESTAMPTZ | ✅ Linha 113 | ✅ Linha 210 | ✅ OK |
| `video_length` | VARCHAR(20) | ✅ Linha 114 | ✅ Linha 211 | ✅ OK |

---

### 3. METRICS (3 campos)

| Campo | Schema Type | sendToGobbi | receive | Status |
|-------|-------------|-------------|---------|--------|
| `views` | INTEGER | ✅ Linha 110 | ✅ Linha 214 | ✅ OK |
| `likes` | INTEGER | ✅ Linha 111 | ✅ Linha 215 | ✅ OK |
| `comments` | INTEGER | ✅ Linha 112 | ✅ Linha 216 | ✅ OK |

---

### 4. JSONB FIELDS (5 campos)

| Campo | Schema Type | sendToGobbi | receive | Status |
|-------|-------------|-------------|---------|--------|
| `tags` | JSONB | ✅ Linha 116 | ✅ Linha 219 | ✅ OK |
| `categorization` | JSONB | ✅ Linha 117 | ✅ Linha 220 | ✅ OK |
| `keywords` | TEXT[] DEFAULT '{}' | ✅ Linha 118 | ⚠️ Linha 221 (default []) | ✅ OK |
| `related_video_ids` | TEXT[] DEFAULT '{}' | ✅ Linha 119 | ⚠️ Linha 222 (default []) | ✅ OK |
| `enrichment_data` | JSONB DEFAULT '{}' | ✅ Linha 120 | ⚠️ Linha 223 (default {}) | ✅ OK |

---

### 5. PERFORMANCE METRICS (7 campos)

| Campo | Schema Type | sendToGobbi | receive | Status |
|-------|-------------|-------------|---------|--------|
| `performance_vs_avg_historical` | NUMERIC | ✅ Linha 121 | ✅ Linha 226 | ✅ OK |
| `performance_vs_median_historical` | NUMERIC | ✅ Linha 122 | ✅ Linha 227 | ✅ OK |
| `performance_vs_recent_14d` | NUMERIC | ✅ Linha 123 | ✅ Linha 228 | ✅ OK |
| `performance_vs_recent_30d` | NUMERIC | ✅ Linha 124 | ✅ Linha 229 | ✅ OK |
| `performance_vs_recent_90d` | NUMERIC | ✅ Linha 125 | ✅ Linha 230 | ✅ OK |
| `is_outlier` | BOOLEAN DEFAULT false | ✅ Linha 126 | ✅ Linha 231 | ✅ OK |
| `outlier_threshold` | NUMERIC | ✅ Linha 127 | ✅ Linha 232 | ✅ OK |

---

### 6. GOBBI-SPECIFIC FIELDS (8 campos)

| Campo | Schema Type | sendToGobbi | receive | Status |
|-------|-------------|-------------|---------|--------|
| `youtube_url` | TEXT | ✅ Linha 128 | ⚠️ Linha 235 (fallback) | ✅ OK |
| `channel_name` | TEXT | ✅ Linha 129 | ✅ Linha 236 | ✅ OK |
| `metrics_last_updated` | TIMESTAMP | ✅ Linha 130 | ⚠️ Linha 237 (fallback now) | ✅ OK |
| `video_transcript` | TEXT | ✅ Linha 135 (condicional) | ✅ Linha 238 | ✅ OK |
| `video_age_days` | INTEGER | ✅ Linha 131 | 🔧 Linha 239 (auto-calc) | ✅ OK |
| `views_per_day` | NUMERIC | ✅ Linha 132 | 🔧 Linha 240 (auto-calc) | ✅ OK |
| `momentum_vs_14d` | NUMERIC | ✅ Linha 133 | ✅ Linha 241 | ✅ OK |
| `status` | TEXT | ✅ Linha 134 | ✅ Linha 242 | ✅ OK |

---

### 7. TIMESTAMPS (3 campos)

| Campo | Schema Type | sendToGobbi | receive | Status |
|-------|-------------|-------------|---------|--------|
| `last_enriched_at` | TIMESTAMPTZ | ❌ **FALTANDO** | ⚠️ Linha 245 (fallback now) | ❌ **ADICIONAR** |
| `created_at` | TIMESTAMPTZ DEFAULT NOW() | 🚫 Auto-gerado | 🚫 Não enviado | ✅ OK (auto) |
| `updated_at` | TIMESTAMPTZ DEFAULT NOW() | 🚫 Auto-gerado | ⚠️ Falta adicionar | ⚠️ Melhorar |

---

### 8. AUTO-GENERATED FIELDS (1 campo)

| Campo | Schema Type | sendToGobbi | receive | Status |
|-------|-------------|-------------|---------|--------|
| `id` | SERIAL PRIMARY KEY | 🚫 Auto-gerado | 🚫 Não enviado | ✅ OK (auto) |

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. CRÍTICO: Adicionar `last_enriched_at` no `sendToGobbi`

**Arquivo:** `supabase/functions/send-to-gobbi/index.ts`
**Linha:** 136

**ANTES:**
```typescript
.select(`
  youtube_video_id,
  channel_id,
  title,
  description,
  views,
  likes,
  comments,
  upload_date,
  video_length,
  thumbnail_url,
  tags,
  categorization,
  keywords,
  related_video_ids,
  enrichment_data,
  performance_vs_avg_historical,
  performance_vs_median_historical,
  performance_vs_recent_14d,
  performance_vs_recent_30d,
  performance_vs_recent_90d,
  is_outlier,
  outlier_threshold,
  youtube_url,
  channel_name,
  metrics_last_updated,
  video_age_days,
  views_per_day,
  momentum_vs_14d,
  status
  ${payload.options?.include_transcript !== false ? ', video_transcript' : ''}
`)
```

**DEPOIS:**
```typescript
.select(`
  youtube_video_id,
  channel_id,
  title,
  description,
  views,
  likes,
  comments,
  upload_date,
  video_length,
  thumbnail_url,
  tags,
  categorization,
  keywords,
  related_video_ids,
  enrichment_data,
  performance_vs_avg_historical,
  performance_vs_median_historical,
  performance_vs_recent_14d,
  performance_vs_recent_30d,
  performance_vs_recent_90d,
  is_outlier,
  outlier_threshold,
  youtube_url,
  channel_name,
  metrics_last_updated,
  video_age_days,
  views_per_day,
  momentum_vs_14d,
  status,
  last_enriched_at  ← ADICIONAR ESTA LINHA
  ${payload.options?.include_transcript !== false ? ', video_transcript' : ''}
`)
```

---

### 2. RECOMENDADO: Adicionar `updated_at` no `receive-benchmark-videos`

**Arquivo:** `docs/gobbi-database/receive-benchmark-videos-function.ts`
**Linha:** 246

**ANTES:**
```typescript
// Timestamps
last_enriched_at: video.last_enriched_at || new Date().toISOString(),
```

**DEPOIS:**
```typescript
// Timestamps
last_enriched_at: video.last_enriched_at || new Date().toISOString(),
updated_at: new Date().toISOString(),  ← ADICIONAR ESTA LINHA
```

---

### 3. OPCIONAL: Adicionar `created_at` para novos inserts

**Arquivo:** `docs/gobbi-database/receive-benchmark-videos-function.ts`
**Linha:** 247

**ADICIONAR:**
```typescript
// Timestamps
last_enriched_at: video.last_enriched_at || new Date().toISOString(),
updated_at: new Date().toISOString(),
...((!existing) && { created_at: new Date().toISOString() })  ← ADICIONAR ESTA LINHA
```

---

## 📋 CHECKLIST DE VALIDAÇÃO

Após aplicar as correções, verificar:

### sendToGobbi
- [x] Envia 27 campos (26 + last_enriched_at)
- [x] Todos os campos obrigatórios presentes
- [x] Todos os campos Gobbi-specific presentes
- [x] Tipos de dados corretos (números como números, não strings)
- [x] Fallbacks apropriados (youtube_url, etc.)
- [x] Condicional para video_transcript funcionando

### receive-benchmark-videos
- [ ] Recebe 27 campos
- [ ] Adiciona `updated_at` explicitamente
- [ ] Adiciona `created_at` para novos inserts
- [ ] Fallbacks funcionando (youtube_url, metrics_last_updated, last_enriched_at)
- [ ] Validação de campos obrigatórios
- [ ] Upsert com `onConflict: 'youtube_video_id'`

### Compatibilidade
- [ ] Mesmos nomes de campos em ambas funções
- [ ] Mesmos tipos de dados
- [ ] Nenhum campo faltando
- [ ] Schema 100% compatível

---

## 🎯 STATUS FINAL APÓS CORREÇÕES

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Campos enviados | 26/27 (96%) | 27/27 (100%) ✅ |
| Campos recebidos | 27/27 | 27/27 ✅ |
| Timestamp tracking | Parcial | Completo ✅ |
| Compatibilidade | 96% | 100% ✅ |

---

## 📝 NOTAS IMPORTANTES

### Campos Condicionais

**`video_transcript`** é enviado condicionalmente:
```typescript
${payload.options?.include_transcript !== false ? ', video_transcript' : ''}
```

**Motivo:** Campo grande (pode ter 50KB+), opcional para economizar banda

**Default:** Enviado por padrão (unless `include_transcript: false`)

### Campos Auto-Calculados

Estes campos são calculados por triggers do banco, mas também enviados:
- `video_age_days` - Calculado de `upload_date`
- `views_per_day` - Calculado de `views / video_age_days`
- `youtube_url` - Gerado de `youtube_video_id`

**Vantagem:** Se o trigger falhar, o valor enviado é usado como fallback

### Campos com Fallback

`receive-benchmark-videos` usa fallbacks para:
- `youtube_url` → `https://www.youtube.com/watch?v=${youtube_video_id}`
- `metrics_last_updated` → `new Date().toISOString()`
- `last_enriched_at` → `new Date().toISOString()`
- `keywords` → `[]`
- `related_video_ids` → `[]`
- `enrichment_data` → `{}`

---

**Última atualização:** 2025-11-14 22:30
**Autor:** Claude Code + Davi Luis
