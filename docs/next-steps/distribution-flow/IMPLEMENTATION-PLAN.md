# Production Distribution Flow - Implementation Plan

**Created:** 2025-11-15
**Updated:** 2025-11-15
**Status:** Planning
**Context:** Migrar fluxo de distribuição/seleção de canais do N8N para a plataforma Next.js

---

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Fluxo Atual (N8N)](#fluxo-atual-n8n)
3. [Problema Identificado](#problema-identificado)
4. [Solução Proposta](#solução-proposta)
5. [Arquitetura Técnica](#arquitetura-técnica)
6. [Especificação de Telas](#especificação-de-telas)
7. [Database Schema](#database-schema)
8. [Edge Functions](#edge-functions)
9. [Server Actions](#server-actions)
10. [Cronograma de Implementação](#cronograma-de-implementação)

---

## 📖 Visão Geral

### Objetivo
Criar um sistema in-platform para **selecionar canais de destino** para vídeos de benchmark que foram aprovados para produção, substituindo o atual fluxo em N8N que usa email + formulário externo.

### Contexto do Negócio
- Usuário tem **múltiplos canais** (8 ativos atualmente)
- Faz **benchmark de vídeos** de outros criadores (26.483 vídeos catalogados)
- Identifica vídeos com **narrativas poderosas** que podem ser adaptadas
- Quer **multiplicar** essas narrativas para diferentes canais/micronichos
- Exemplo: História de "empregada humilhada por bilionário que se redime"
  - Pode virar: militar humilhado, latino nos EUA humilhado, etc.
  - Mesma força narrativa, diferentes roupagens

### Fluxo Completo (End-to-End)
```
1. BENCHMARK → 2. ADD TO PROD → 3. DISTRIBUIÇÃO → 4. PRODUÇÃO → 5. PUBLICAÇÃO

   [Channels]      [Approve]        [Distribution]     [Queue]          [Publishing]
   Mineração    ┌─> Add to Prod  ┌─> Channel      ┌─> 15 Stages   ┌─> Schedule
   26k videos   │   (USER CLICK) │   Selection    │   Pipeline     │   Analytics
   Available   ─┘   APPROVED!    ─┘   Multi-Canal ─┘   Processing ─┘   Published
```

**Esta implementação foca na etapa 3: DISTRIBUIÇÃO (seleção de canais)**

### Diferença Importante: Aprovação vs Distribuição

**APROVAÇÃO** já aconteceu quando o usuário clicou "Add to Production" no benchmark:
- ✅ Vídeo APROVADO para produção
- ✅ Decisão: "sim, vamos produzir esse vídeo"
- ✅ Status: `available` → `add_to_production`

**DISTRIBUIÇÃO** é o que vamos implementar (etapa seguinte):
- 🎯 Vídeo aguarda SELEÇÃO de canais
- 🎯 Decisão: "para QUAIS canais vamos produzir?"
- 🎯 Status: `add_to_production` → `pending_distribution` → `used`

**Não confundir:**
- ❌ "Aprovar vídeo" ← já foi feito
- ✅ "Selecionar canais de destino" ← isso que vamos fazer
- ✅ "Distribuir vídeo para canais" ← nomenclatura correta

---

## 🔄 Fluxo Atual (N8N)

### WF0: Controle de Fila de Produção
**Trigger:** Cron (a cada 2 minutos)

**Lógica:**
```
1. Query production_videos WHERE is_processing = true AND status != 'canceled'
2. IF count >= 1:
   → STOP (já tem vídeo processando)
3. ELSE:
   → Query benchmark_videos WHERE status = 'add_to_production'
   → LIMIT 1
   → Trigger WF1 com benchmark_video_id
```

**Propósito:** "Catraca" - garante que só processa 1 vídeo por vez

---

### WF1: Match e Seleção Manual de Canais
**Trigger:** Chamado pelo WF0

**Fluxo Detalhado:**
```
1. Recebe benchmark_video_id do WF0

2. GET benchmark_video data (title, categorization, transcript, etc.)

3. IF video_transcript.length < 100:
   → Trigger workflow de download de transcrição (YouTube API)
   → Wait for completion

4. UPDATE benchmark_videos SET status = 'pending_distribution' WHERE id = benchmark_video_id

5. MATCH CHANNELS:
   Query structure_accounts WHERE:
     - niche = JSON.parse(video.categorization).niche
     AND subniche = JSON.parse(video.categorization).subniche

   Returns: Lista de canais elegíveis (ex: 2-30 canais)

6. MANUAL SELECTION (Human in the Loop):
   a. Monta formulário dinâmico no N8N Form:
      - Multi-select dropdown
      - Opções: placeholder de cada canal elegível

   b. Envia email para automedialat@gmail.com com:
      - Título do vídeo
      - YouTube URL
      - Niche/Subniche/Microniche
      - Link do formulário N8N

   c. Aguarda resposta (timeout 5min)

   d. User seleciona canais (ex: 5 de 10 elegíveis)

7. PARA CADA CANAL SELECIONADO:
   a. GET structure_accounts WHERE placeholder = canal_selecionado
   b. GET structure_brand_bible WHERE placeholder = canal_selecionado
   c. INSERT INTO production_videos:
      - benchmark_id = benchmark_video_id
      - benchmark_title = video.title
      - benchmark_video_transcript = video.transcript
      - unique_profile_id = canal.unique_profile_id
      - language = canal.language
      - placeholder = canal.placeholder
      - description = video.description
      - status = 'create_title' ← primeira etapa do pipeline
      - is_processing = false
      - created_at = NOW()
      - updated_at = NOW()

8. UPDATE benchmark_videos SET status = 'used' WHERE id = benchmark_video_id

9. Trigger "Triagem Fluxos de Produção" (determina qual workflow usar baseado no brand_bible.production_workflow_id)
```

**Modo Futuro (Automático):**
- Toggle para pular step 6 (human selection)
- Automaticamente seleciona TODOS os canais elegíveis
- Blacklist: canais abandonados (não produzir)
- Whitelist: canais prioritários

---

## ⚠️ Problema Identificado

### Sintoma
Formulário N8N mostrando **canais duplicados**:
- africanvillagevoices (2x)
- payblackstories (2x)

### Causa Raiz
1. WF0 passa apenas 1 vídeo por vez para WF1 ✅
2. **MAS** podem acumular múltiplos vídeos com `status = 'pending_distribution'`
3. O form trigger (On form submission) busca **TODOS** os vídeos em `pending_distribution`
4. O matching é feito para **cada vídeo**, resultando em listas duplicadas

### Exemplo do Problema:
```
Videos em pending_distribution:
- Video A (bench_id: 26388) → niche: "stories", subniche: "revenge"
- Video B (bench_id: 26387) → niche: "stories", subniche: "revenge"

Query de matching retorna:
- africanvillagevoices (match com Video A)
- payblackstories (match com Video A)
- africanvillagevoices (match com Video B)  ← DUPLICATA
- payblackstories (match com Video B)      ← DUPLICATA

Form mostra: 4 opções (deveria ser 2)
```

### Por Que Acontece?
O N8N está tratando como **many-to-many** quando deveria ser **one-to-many**:
- ❌ Múltiplos vídeos → Múltiplos canais (gera duplicatas)
- ✅ 1 vídeo → Múltiplos canais (correto)

---

## 💡 Solução Proposta

### Abordagem: In-Platform UI + Edge Functions

**Princípios:**
1. **Uma decisão por vez:** Distribuir 1 vídeo → N canais
2. **Visibilidade:** Ver todos os vídeos aguardando distribuição
3. **Controle:** Selecionar manualmente (agora) ou automático (futuro)
4. **Rastreabilidade:** Logs de quem distribuiu, quando, para quais canais

---

## 🏗️ Arquitetura Técnica

### Stack Proposta

```
┌─────────────────────────────────────────────┐
│           NEXT.JS 15 (Frontend)             │
├─────────────────────────────────────────────┤
│  /production/distribution (nova tela)       │
│  - Lista vídeos pending_distribution        │
│  - Mostra canais elegíveis                  │
│  - Multi-select + Distribute button         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         SERVER ACTIONS (Next.js)            │
├─────────────────────────────────────────────┤
│  distributeVideoToChannels(                 │
│    benchmarkVideoId,                        │
│    selectedChannelIds[]                     │
│  )                                          │
│  - Valida input                             │
│  - Cria N linhas em production_videos       │
│  - Atualiza benchmark_video status          │
│  - Retorna resultado                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         SUPABASE (Database)                 │
├─────────────────────────────────────────────┤
│  benchmark_videos                           │
│  - status: available →                      │
│            add_to_production →              │
│            pending_distribution → used      │
│                                             │
│  production_videos                          │
│  - Recebe novas linhas                      │
│  - status: create_title                     │
│  - is_processing: false                     │
│                                             │
│  structure_accounts (canais)                │
│  - Matching via niche AND subniche          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│    EDGE FUNCTION: production-queue-cron     │
├─────────────────────────────────────────────┤
│  Trigger: Cron (a cada 2min via pg_cron)    │
│                                             │
│  Lógica:                                    │
│  1. Check is_processing count               │
│  2. IF 0 → pega próximo vídeo na fila       │
│  3. Trigger pipeline (via outro workflow)   │
└─────────────────────────────────────────────┘
```

---

### Decisões Técnicas

#### 1. Onde criar a UI de distribuição?

**Opção A: Nova tela `/production/distribution`** ✅ ESCOLHIDA
- Pros:
  - Separa claramente "distribuição" de "produção ativa"
  - Workflow focado
  - Facilita implementação de modo automático futuro
- Contras:
  - Mais uma tela no sidebar

**Opção B: Adicionar na tela existente `/production/videos`**
- Pros:
  - Não adiciona rota nova
  - Tudo em um lugar
- Contras:
  - Mistura conceitos (distribuição vs execução)
  - UI mais complexa

---

#### 2. Como processar a fila?

**Opção A: Supabase Edge Function + pg_cron** ✅ ESCOLHIDA
- Pros:
  - Lógica próxima ao banco
  - Supabase tem cron nativo (pg_cron extension)
  - Não depende de servidor Next.js sempre rodando
  - Escala automaticamente
- Contras:
  - Precisa configurar pg_cron
  - Debugging mais complexo

**Opção B: N8N continua processando a fila, só distribui na UI**
- Pros:
  - Menor mudança
  - N8N já funciona
- Contras:
  - Mantém dependência do N8N
  - Não resolve o problema raiz

---

#### 3. Como fazer o channel matching?

**SQL Query no Server Action:**
```typescript
// Server Action
export async function getEligibleChannels(benchmarkVideoId: number) {
  const { data: video } = await supabase
    .from('benchmark_videos')
    .select('categorization')
    .eq('id', benchmarkVideoId)
    .single()

  const categorization = JSON.parse(video.categorization)

  const { data: channels } = await supabase
    .from('structure_accounts')
    .select('*')
    .eq('niche', categorization.niche)
    .eq('subniche', categorization.subniche)  // AND (ambos precisam bater)

  return channels
}
```

**Vantagens:**
- Server-side (seguro)
- Usa índices do Postgres
- Retorna apenas canais elegíveis
- Matching: niche AND subniche (conforme N8N)

---

## 🖥️ Especificação de Telas

### Nova Tela: `/production/distribution`

#### Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Production Distribution                     [Auto Mode ⚫]     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 Videos Awaiting Channel Selection (3)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🎬 Video: "My Daughter-In-Law Kicked Me Out..."          │  │
│  │ ───────────────────────────────────────────────────────  │  │
│  │ • Niche: stories                                         │  │
│  │ • Subniche: revenge                                      │  │
│  │ • Microniche: family_drama                               │  │
│  │ • YouTube: youtube.com/watch?v=xyz123                    │  │
│  │ • Transcript: ✅ Available (1,247 words)                 │  │
│  │                                                           │  │
│  │ 📺 Eligible Channels (5):                                │  │
│  │ ┌────────────────────────────────────────────────────┐   │  │
│  │ │ ☐ africanvillagevoices                             │   │  │
│  │ │    🌍 African stories · 🎭 Revenge · 📊 12.5k subs │   │  │
│  │ │                                                     │   │  │
│  │ │ ☐ payblackstories                                  │   │  │
│  │ │    🎭 Black narratives · 🎬 Drama · 📊 8.3k subs   │   │  │
│  │ │                                                     │   │  │
│  │ │ ☐ latinovoicesusa                                  │   │  │
│  │ │    🇺🇸 Latino USA · 🎭 Family · 📊 15.2k subs      │   │  │
│  │ │                                                     │   │  │
│  │ │ ☑ militarystories                                  │   │  │
│  │ │    🪖 Military · 🎭 Honor · 📊 22.1k subs          │   │  │
│  │ │                                                     │   │  │
│  │ │ ☑ animalrevenge                                    │   │  │
│  │ │    🦁 Animals · 🎭 Survival · 📊 9.7k subs         │   │  │
│  │ └────────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │ [Select All] [Select None]   [Distribute (2 selected)] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🎬 Video: "On Mother's Day, My Millionaire Son..."       │  │
│  │ ───────────────────────────────────────────────────────  │  │
│  │ • Niche: stories                                         │  │
│  │ • Subniche: gratitude                                    │  │
│  │ • Eligible Channels (3)                                  │  │
│  │ [Expand to see channels ▼]                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

#### Componentes Necessários

**1. VideoDistributionCard**
```typescript
interface VideoDistributionCardProps {
  video: BenchmarkVideo
  eligibleChannels: StructureAccount[]
  onDistribute: (videoId: number, channelIds: string[]) => Promise<void>
}
```

**2. ChannelSelectionList**
```typescript
interface ChannelSelectionListProps {
  channels: StructureAccount[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}
```

**3. AutoModeToggle** (futuro)
```typescript
interface AutoModeToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  blacklistedChannels: string[]
  whitelistedChannels: string[]
}
```

---

#### Estados da UI

**1. Loading State:**
```
┌──────────────────────────────┐
│ ⏳ Loading videos...         │
│ [Skeleton cards]             │
└──────────────────────────────┘
```

**2. Empty State:**
```
┌──────────────────────────────┐
│ ✅ All videos distributed!   │
│ No videos awaiting selection.│
│ [Go to Production Queue →]   │
└──────────────────────────────┘
```

**3. Processing State:**
```
┌──────────────────────────────┐
│ ⚙️ Creating production jobs...│
│ Creating 5 jobs for selected  │
│ channels...                   │
└──────────────────────────────┘
```

**4. Success State:**
```
┌──────────────────────────────┐
│ ✅ Distributed!               │
│ 5 videos added to production  │
│ queue for militarystories,    │
│ animalrevenge, and 3 others   │
└──────────────────────────────┘
```

---

## 🗄️ Database Schema

### Status Flow (CORRIGIDO)

#### benchmark_videos.status
```
'available'            (sort: 100) ← vídeo minerado, catalogado
   ↓
'add_to_production'    (sort: 102) ← usuário clicou "Add to Production" (APROVAÇÃO!)
   ↓
'pending_distribution' (sort: 101) ← aguardando seleção de canais (DISTRIBUIÇÃO)
   ↓
'used'                 (sort: 103) ← distribuído e enviado para produção
```

**Workflow Phase:** sourcing

---

#### production_videos.status (PIPELINE COMPLETO - 15 STAGES)

**Script Phase (sort: 1-8):**
```
1. 'create_title'           - Generate video title based on story concept
2. 'create_outline'         - Adapt reference story beats to brand universe
3. 'create_cast'            - Map character archetypes and create profiles
4. 'create_rich_outline'    - Structure screenplay into 10 chapters
5. 'create_script'          - Write all 10 chapters following blueprint
6. 'create_teaser_script'   - Write cold open hook script
7. 'review_script'          - Review, polish and moderate manuscript
8. 'create_seo_description' - Generate optimized YouTube description
```

**Production Phase (sort: 9-15):**
```
9.  'create_thumbnail'            - Generate video thumbnail image
10. 'create_audio_segments'       - Convert script to narrated audio (TTS)
11. 'create_covering_assets'      - Generate covering images/visual assets
12. 'create_video_segments'       - Assemble video segments with images/effects
13. 'create_concatenated_audios'  - Merge all audio segments into single track
14. 'create_final_video'          - Render complete video with audio/visuals
15. 'produce_teaser'              - Render teaser video segment
```

**Publishing Phase (sort: 16-20):**
```
16. 'pending_approval' - Video ready, awaiting manual approval
17. 'approved'         - Video approved for publication
18. 'scheduled'        - Video scheduled for upload
19. 'published'        - Video published on YouTube
20. 'in_analysis'      - Analyzing post-publication metrics
```

**Special Status (sort: 21-23):**
```
21. 'failed'    - Pipeline failed at some stage
22. 'canceled'  - Video production canceled manually
23. 'on_hold'   - Video production paused temporarily
```

**Workflow Phases:**
- `sourcing` - benchmark_videos status
- `script` - stages 1-8
- `production` - stages 9-15
- `publishing` - stages 16-20
- `special` - failed/canceled/on_hold

---

### Queries Importantes

#### 1. Buscar vídeos aguardando distribuição
```sql
SELECT
  bv.*,
  (SELECT COUNT(*)
   FROM structure_accounts sa
   WHERE sa.niche = (bv.categorization->>'niche')::text
     AND sa.subniche = (bv.categorization->>'subniche')::text
  ) as eligible_channels_count
FROM benchmark_videos bv
WHERE bv.status = 'pending_distribution'
ORDER BY bv.created_at ASC;
```

---

#### 2. Buscar canais elegíveis para um vídeo
```sql
SELECT
  sa.*,
  bb.production_workflow_id,
  bb.brand_identity
FROM structure_accounts sa
LEFT JOIN structure_brand_bible bb ON bb.placeholder = sa.placeholder
WHERE sa.niche = $1             -- do video.categorization.niche
  AND sa.subniche = $2          -- do video.categorization.subniche (AND!)
ORDER BY sa.placeholder ASC;
```

**Importante:** Usa **AND** (ambos precisam bater), conforme N8N workflow

---

#### 3. Criar jobs de produção (batch insert)
```sql
INSERT INTO production_videos (
  benchmark_id,
  benchmark_title,
  benchmark_video_transcript,
  unique_profile_id,
  placeholder,
  language,
  description,
  status,
  is_processing,
  created_at,
  updated_at
)
SELECT
  $1::bigint as benchmark_id,  -- benchmark_video_id
  $2::text as benchmark_title,
  $3::text as benchmark_video_transcript,
  sa.unique_profile_id,
  sa.placeholder,
  sa.language,
  bv.description,
  'create_title'::text as status,
  false as is_processing,
  NOW() as created_at,
  NOW() as updated_at
FROM structure_accounts sa
CROSS JOIN benchmark_videos bv
WHERE sa.unique_profile_id = ANY($4::text[])  -- array de IDs selecionados
  AND bv.id = $1
RETURNING *;
```

---

#### 4. Atualizar status do benchmark
```sql
UPDATE benchmark_videos
SET
  status = 'used',
  updated_at = NOW()
WHERE id = $1
RETURNING *;
```

---

### Índices Necessários

```sql
-- Performance para matching de canais
CREATE INDEX IF NOT EXISTS idx_structure_accounts_niche_subniche
ON structure_accounts(niche, subniche);

-- Performance para buscar vídeos pendentes
CREATE INDEX IF NOT EXISTS idx_benchmark_videos_status
ON benchmark_videos(status)
WHERE status IN ('add_to_production', 'pending_distribution');

-- Performance para controle de fila
CREATE INDEX IF NOT EXISTS idx_production_videos_is_processing
ON production_videos(is_processing, status)
WHERE is_processing = true;
```

---

## ⚡ Edge Functions

### 1. production-queue-cron

**Propósito:** Substituir WF0 (controle de fila)

**Trigger:** Cron (a cada 2 minutos)

**Arquivo:** `supabase/functions/production-queue-cron/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Check se tem algum vídeo processando
    const { data: processing, error: procError } = await supabase
      .from('production_videos')
      .select('id, benchmark_title, status')
      .eq('is_processing', true)
      .neq('status', 'canceled')
      .limit(1)

    if (procError) throw procError

    // Se tem vídeo processando, não faz nada
    if (processing && processing.length > 0) {
      console.log('⏸️ Queue paused - video processing:', processing[0].benchmark_title)
      return new Response(
        JSON.stringify({
          status: 'paused',
          reason: 'video_processing',
          current_video: processing[0]
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Busca próximo vídeo na fila (status = create_title, is_processing = false)
    const { data: nextVideo, error: nextError } = await supabase
      .from('production_videos')
      .select('*')
      .eq('status', 'create_title')
      .eq('is_processing', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (nextError || !nextVideo) {
      console.log('📭 Queue empty - no videos to process')
      return new Response(
        JSON.stringify({ status: 'empty', reason: 'no_videos_queued' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Marca como processando
    const { error: updateError } = await supabase
      .from('production_videos')
      .update({
        is_processing: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', nextVideo.id)

    if (updateError) throw updateError

    // 4. NOTA: Não chama create_title aqui!
    // Isso será feito por outro workflow (Triagem de Fluxos de Produção)
    // Este cron apenas marca o vídeo como "em processamento" e libera para o próximo workflow

    console.log('✅ Video marked for processing:', nextVideo.benchmark_title)

    return new Response(
      JSON.stringify({
        status: 'marked_for_processing',
        video_id: nextVideo.id,
        title: nextVideo.benchmark_title
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Queue cron error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

**Deploy:**
```bash
npx supabase functions deploy production-queue-cron --project-ref YOUR_PROJECT_REF
```

**Configurar Cron (via SQL):**
```sql
-- Habilita pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cria job que roda a cada 2 minutos
SELECT cron.schedule(
  'production-queue-processor',
  '*/2 * * * *',  -- every 2 minutes
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/production-queue-cron',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

**IMPORTANTE:** Este Edge Function **NÃO** chama o estágio `create_title`.
Ele apenas marca o vídeo como `is_processing = true` e libera para o workflow de produção existente (N8N ou futuro).

---

## 🎯 Server Actions

### 1. getVideosAwaitingDistribution

**Arquivo:** `app/(dashboard)/production/distribution/actions.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getVideosAwaitingDistribution() {
  const supabase = await createClient()

  const { data: videos, error } = await supabase
    .from('benchmark_videos')
    .select(`
      *,
      benchmark_channels!inner(
        channel_title,
        channel_handle
      )
    `)
    .eq('status', 'pending_distribution')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching videos:', error)
    return { videos: [], error: error.message }
  }

  // Para cada vídeo, buscar canais elegíveis
  const videosWithChannels = await Promise.all(
    videos.map(async (video) => {
      const categorization = JSON.parse(video.categorization as string)

      const { data: channels } = await supabase
        .from('structure_accounts')
        .select(`
          *,
          structure_brand_bible(
            brand_identity,
            production_workflow_id
          )
        `)
        .eq('niche', categorization.niche)
        .eq('subniche', categorization.subniche)  // AND
        .order('placeholder', { ascending: true })

      return {
        ...video,
        categorization,
        eligibleChannels: channels || []
      }
    })
  )

  return { videos: videosWithChannels, error: null }
}
```

---

### 2. distributeVideoToChannels

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface DistributionInput {
  benchmarkVideoId: number
  selectedChannelIds: string[] // unique_profile_ids
}

export async function distributeVideoToChannels({
  benchmarkVideoId,
  selectedChannelIds
}: DistributionInput) {
  const supabase = await createClient()

  try {
    // 1. Validar que o vídeo existe e está em pending_distribution
    const { data: video, error: videoError } = await supabase
      .from('benchmark_videos')
      .select('*')
      .eq('id', benchmarkVideoId)
      .eq('status', 'pending_distribution')
      .single()

    if (videoError || !video) {
      return {
        success: false,
        error: 'Video not found or not in pending_distribution status'
      }
    }

    // 2. Validar que os canais existem e são elegíveis
    const categorization = JSON.parse(video.categorization as string)

    const { data: channels, error: channelsError } = await supabase
      .from('structure_accounts')
      .select('*')
      .eq('niche', categorization.niche)
      .eq('subniche', categorization.subniche)  // AND
      .in('unique_profile_id', selectedChannelIds)

    if (channelsError || !channels || channels.length !== selectedChannelIds.length) {
      return {
        success: false,
        error: 'Some selected channels are not eligible or do not exist'
      }
    }

    // 3. Criar jobs de produção para cada canal
    const productionJobs = channels.map((channel) => ({
      benchmark_id: video.id,
      benchmark_title: video.title,
      benchmark_video_transcript: video.video_transcript,
      unique_profile_id: channel.unique_profile_id,
      placeholder: channel.placeholder,
      language: channel.language,
      description: video.description,
      status: 'create_title',
      is_processing: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data: createdJobs, error: insertError } = await supabase
      .from('production_videos')
      .insert(productionJobs)
      .select()

    if (insertError) {
      console.error('Error creating production jobs:', insertError)
      return { success: false, error: insertError.message }
    }

    // 4. Atualizar status do benchmark video
    const { error: updateError } = await supabase
      .from('benchmark_videos')
      .update({
        status: 'used',
        updated_at: new Date().toISOString()
      })
      .eq('id', benchmarkVideoId)

    if (updateError) {
      console.error('Error updating benchmark video status:', updateError)
      // Não retorna erro aqui porque os jobs já foram criados
    }

    // 5. Revalidar páginas
    revalidatePath('/production/distribution')
    revalidatePath('/production/videos')

    return {
      success: true,
      jobsCreated: createdJobs.length,
      channels: channels.map(c => c.placeholder)
    }

  } catch (error) {
    console.error('Unexpected error in distributeVideoToChannels:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

---

### 3. getEligibleChannels (helper)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getEligibleChannels(benchmarkVideoId: number) {
  const supabase = await createClient()

  const { data: video, error: videoError } = await supabase
    .from('benchmark_videos')
    .select('categorization')
    .eq('id', benchmarkVideoId)
    .single()

  if (videoError || !video) {
    return { channels: [], error: 'Video not found' }
  }

  const categorization = JSON.parse(video.categorization as string)

  const { data: channels, error: channelsError } = await supabase
    .from('structure_accounts')
    .select(`
      *,
      structure_brand_bible(
        brand_identity,
        production_workflow_id,
        visual_style,
        narrative_tone
      )
    `)
    .eq('niche', categorization.niche)
    .eq('subniche', categorization.subniche)  // AND
    .order('placeholder', { ascending: true })

  if (channelsError) {
    return { channels: [], error: channelsError.message }
  }

  return { channels: channels || [], error: null }
}
```

---

## 📅 Cronograma de Implementação

### Phase 0: Preparação (Dia 1)
**Tempo estimado:** 2 horas

- [ ] Criar migration para índices necessários
- [ ] Adicionar coluna `distributed_by` e `distributed_at` em `production_videos` (tracking)
- [ ] Criar enum para `distribution_mode`: 'manual' | 'automatic'
- [ ] Documentar decisões técnicas

**SQL Migration:**
```sql
-- 001_production_distribution_enhancements.sql

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_structure_accounts_niche_subniche
ON structure_accounts(niche, subniche);

CREATE INDEX IF NOT EXISTS idx_benchmark_videos_status
ON benchmark_videos(status)
WHERE status IN ('add_to_production', 'pending_distribution');

CREATE INDEX IF NOT EXISTS idx_production_videos_queue
ON production_videos(is_processing, status, created_at)
WHERE is_processing = false AND status = 'create_title';

-- Tracking de distribuição
ALTER TABLE production_videos
ADD COLUMN IF NOT EXISTS distributed_by TEXT,
ADD COLUMN IF NOT EXISTS distributed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS distribution_mode TEXT DEFAULT 'manual'
  CHECK (distribution_mode IN ('manual', 'automatic'));

-- Comentários para documentação
COMMENT ON COLUMN production_videos.distributed_by IS 'User email who distributed this video to channels';
COMMENT ON COLUMN production_videos.distributed_at IS 'Timestamp when distribution was completed';
COMMENT ON COLUMN production_videos.distribution_mode IS 'How this was distributed: manual (user selected) or automatic (system selected all eligible)';
```

---

### Phase 1: Server Actions (Dia 2-3)
**Tempo estimado:** 4 horas

- [ ] Criar `app/(dashboard)/production/distribution/actions.ts`
- [ ] Implementar `getVideosAwaitingDistribution()`
- [ ] Implementar `getEligibleChannels(benchmarkVideoId)`
- [ ] Implementar `distributeVideoToChannels({ benchmarkVideoId, selectedChannelIds })`
- [ ] Adicionar validações e error handling
- [ ] Testes manuais via console

---

### Phase 2: UI Components (Dia 3-5)
**Tempo estimado:** 8 horas

**Dia 3:**
- [ ] Criar componentes base:
  - `components/production/VideoDistributionCard.tsx`
  - `components/production/ChannelSelectionList.tsx`
  - `components/production/ChannelCheckbox.tsx`
  - `components/production/DistributionStats.tsx`

**Dia 4:**
- [ ] Implementar estados (loading, empty, error, success)
- [ ] Adicionar Sonner toasts
- [ ] Implementar optimistic updates
- [ ] Adicionar confirmação de distribuição (dialog)

**Dia 5:**
- [ ] Polimento de UI
- [ ] Accessibility (keyboard navigation, ARIA labels)
- [ ] Responsive design
- [ ] Dark mode support

**Componentes shadcn/ui necessários:**
```bash
npx shadcn@latest add checkbox
npx shadcn@latest add alert-dialog
npx shadcn@latest add skeleton
npx shadcn@latest add badge
npx shadcn@latest add scroll-area
```

---

### Phase 3: Página de Distribuição (Dia 5-6)
**Tempo estimado:** 4 horas

- [ ] Criar `app/(dashboard)/production/distribution/page.tsx`
- [ ] Integrar Server Actions
- [ ] Implementar real-time updates (Supabase Realtime)
- [ ] Adicionar filtros (por niche, por canal)
- [ ] Adicionar search

**Estrutura de arquivos:**
```
app/(dashboard)/production/distribution/
├── page.tsx              # Server Component
├── actions.ts            # Server Actions
├── DistributionList.tsx  # Client Component
└── loading.tsx           # Loading UI
```

---

### Phase 4: Edge Function de Fila (Dia 7-8)
**Tempo estimado:** 6 horas

**Dia 7:**
- [ ] Criar `supabase/functions/production-queue-cron/index.ts`
- [ ] Implementar lógica de controle de fila
- [ ] Adicionar logging detalhado
- [ ] Deploy da Edge Function

**Dia 8:**
- [ ] Configurar pg_cron no Supabase
- [ ] Testar cron localmente (`supabase functions serve`)
- [ ] Testar em produção
- [ ] Monitorar logs via `supabase functions logs`

**Deploy:**
```bash
# Deploy da função
npx supabase functions deploy production-queue-cron --project-ref YOUR_REF

# Ver logs
npx supabase functions logs production-queue-cron --follow
```

---

### Phase 5: Modo Automático (Dia 9-10) - FUTURO
**Tempo estimado:** 6 horas

- [ ] Adicionar toggle "Auto Mode" na UI
- [ ] Criar tabela `distribution_settings`:
  ```sql
  CREATE TABLE distribution_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    auto_distribute_enabled BOOLEAN DEFAULT false,
    blacklisted_channels TEXT[] DEFAULT '{}',
    whitelisted_channels TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Implementar Server Action `toggleAutoMode()`
- [ ] Implementar Server Action `updateChannelLists(blacklist, whitelist)`
- [ ] Atualizar `distributeVideoToChannels()` para respeitar auto mode
- [ ] UI para gerenciar blacklist/whitelist

---

### Phase 6: Migração do N8N (Dia 11)
**Tempo estimado:** 2 horas

- [ ] Testar fluxo completo end-to-end
- [ ] Comparar resultados N8N vs Plataforma
- [ ] Desabilitar WF0 e WF1 no N8N (não deletar, manter backup)
- [ ] Monitorar produção por 1 semana
- [ ] Deletar workflows N8N após confirmação

---

### Phase 7: Documentação e Polimento (Dia 12)
**Tempo estimado:** 3 horas

- [ ] Atualizar CLAUDE.md com nova arquitetura
- [ ] Criar guia de troubleshooting
- [ ] Adicionar analytics/metrics (quantos vídeos distribuídos/dia)
- [ ] Criar dashboard de stats

---

## 📊 Resumo do Cronograma

| Phase | Descrição | Tempo | Dias |
|-------|-----------|-------|------|
| 0 | Preparação (migrations, schema) | 2h | Dia 1 |
| 1 | Server Actions | 4h | Dia 2-3 |
| 2 | UI Components | 8h | Dia 3-5 |
| 3 | Página de Distribuição | 4h | Dia 5-6 |
| 4 | Edge Function + Cron | 6h | Dia 7-8 |
| 5 | Modo Automático (futuro) | 6h | Dia 9-10 |
| 6 | Migração N8N | 2h | Dia 11 |
| 7 | Documentação | 3h | Dia 12 |
| **TOTAL** | | **35h** | **12 dias** |

**Ajustado com buffer:** 15 dias (~3 semanas)

---

## ✅ Checklist de Implementação

### Pre-requisitos
- [ ] Supabase project com pg_cron habilitado
- [ ] Next.js 15 instalado
- [ ] shadcn/ui configurado
- [ ] Supabase Auth configurado (para tracking de distribuição)

### Development
- [ ] Phase 0: Database setup
- [ ] Phase 1: Server Actions
- [ ] Phase 2: UI Components
- [ ] Phase 3: Distribution Page
- [ ] Phase 4: Queue Cron

### Testing
- [ ] Testar distribuição de 1 vídeo → 1 canal
- [ ] Testar distribuição de 1 vídeo → múltiplos canais
- [ ] Testar distribuição de múltiplos vídeos sequencialmente
- [ ] Testar edge cases (sem canais elegíveis, vídeo sem transcrição)
- [ ] Testar controle de fila (só 1 por vez)

### Production
- [ ] Deploy Edge Function
- [ ] Configurar pg_cron
- [ ] Monitorar logs por 1 semana
- [ ] Desabilitar N8N workflows
- [ ] Atualizar documentação

---

## 🔍 Troubleshooting

### Problema: Canais duplicados no form
**Causa:** Múltiplos vídeos em `pending_distribution` sendo processados juntos
**Solução:** A nova implementação processa 1 vídeo por vez na UI

### Problema: Fila não processa
**Causa:** Edge Function não está sendo trigada pelo cron
**Debug:**
```sql
-- Ver jobs do pg_cron
SELECT * FROM cron.job;

-- Ver histórico de execuções
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Problema: Vídeo fica preso em "is_processing = true"
**Causa:** Edge Function falhou no meio do processo
**Solução:**
```sql
-- Reset manual
UPDATE production_videos
SET is_processing = false
WHERE id = [VIDEO_ID];
```

---

## 📝 Notas Finais

### Vantagens da Nova Arquitetura
1. **Visibilidade:** Ver todos os vídeos pendentes em uma tela
2. **Controle:** Distribuir individualmente, sem confusão
3. **Rastreabilidade:** Saber quem distribuiu, quando, para quais canais
4. **Escalabilidade:** Preparado para modo automático futuro
5. **Manutenibilidade:** Código TypeScript, fácil de debugar
6. **Performance:** Queries otimizadas com índices

### Próximos Passos Após Implementação
1. Analytics de distribuição (quantos vídeos/semana, quais canais mais usados)
2. Recomendação de canais (ML para sugerir melhores matches)
3. Bulk distribution (distribuir múltiplos vídeos de uma vez)
4. Scheduled distribution (agendar distribuição para horário específico)
5. A/B testing de narrativas (testar mesma história em canais diferentes)

---

## 📌 Documentos Futuros a Criar

### 1. Production Stages
- [ ] `docs/next-steps/production-stages/create-title-stage.md`
- [ ] `docs/next-steps/production-stages/create-outline-stage.md`
- [ ] ... (um para cada stage do pipeline)

**Estrutura sugerida:**
```markdown
# Stage: Create Title

## Propósito
Gerar título adaptado para o canal de destino

## Input
- benchmark_title
- benchmark_video (context)
- brand_bible (canal de destino)

## Processamento
- AI prompt engineering
- Adaptação para universo do canal
- Otimização de SEO

## Output
- production_videos.title (atualizado)
- status → 'create_outline'

## Edge Function
- Nome: production-stage-create-title
- Trigger: Manual ou via workflow
```

---

**Documento atualizado em:** 2025-11-15
**Versão:** 2.0
**Status:** Ready for Implementation
**Correções aplicadas:**
- ✅ Nomenclatura: approval → distribution
- ✅ Status flow corrigido (available → add_to_production → pending_distribution → used)
- ✅ Pipeline completo (15 stages + publishing + special)
- ✅ Matching: AND (niche AND subniche)
- ✅ Removido Edge Function create_title (será documentado separadamente)
