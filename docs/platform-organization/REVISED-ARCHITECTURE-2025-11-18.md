# AutoMedia Platform - Arquitetura Revisada (Pós-Feedback Gobbi)

**Data:** 2025-11-18
**Versão:** 2.0
**Status:** Revisão completa incorporando feedbacks do Gobbi
**Autores:** Claude Code + Davi Luis + Gobbi

---

## 📋 ÍNDICE

1. [Mudanças Principais](#mudanças-principais)
2. [Estrutura Revisada](#estrutura-revisada)
3. [Detalhamento por Módulo](#detalhamento-por-módulo)
4. [Funcionalidades Faltantes Adicionadas](#funcionalidades-faltantes-adicionadas)
5. [Navegação Sidebar Atualizada](#navegação-sidebar-atualizada)
6. [Próximos Passos](#próximos-passos)

---

## 🔄 MUDANÇAS PRINCIPAIS

### Resumo das Alterações

#### ✅ Adicionado
- **Visual Lab** (substituindo Assets Library) - ambiente de experimentação visual
- **API Queue** como tela separada (fila de produção de toda máquina)
- **Calendar View** para postagens agendadas (múltiplos canais)
- **Narrative Analysis** - tabelas de narrative agora têm UI
- **AI Agents** - configuração de agentes categorizados
- **FFMPEG Config** - configurações de renderização
- **AI Cost Tracking** - monitoramento de custos com IA
- **Channel Analytics** - análise vídeo a vídeo (importar planilha)
- **Production Workflows** - fluxos diferentes (simplificado/robusto/com teaser/etc.)
- **Google Credentials** - por canal com CRON keep-alive
- **Thumbnail Workflows** - diferentes fluxos de criação de thumbnails

#### 🔧 Modificado
- **Benchmark Channel Detail** - Simplificado para Overview como Social Blade
- **Benchmark Video Detail** - Performance integrado em Overview, Transcript não é tab
- **Production Video Detail** - Overview unificado com tudo (título, script, categorização, descrição, teaser)
- **Production Queue** - Kanban com vídeos como cards
- **Channels Brand Bible** - Agora mostra onde cada campo é usado (laboratório de experimentação)
- **API Keys** - Agora suporta pool de chaves com rotação

#### ❌ Removido
- **Brand Bibles** como seção separada → Integrado em Channels
- **Published Videos** como seção separada → Integrado em Channels
- **Posting Schedule** de Settings → Agora é Calendar View em Production

---

## 🏗️ ESTRUTURA REVISADA

### Visão Geral da Plataforma

```
AutoMedia Platform
│
├── 🏠 Dashboard
│   └── Overview (KPIs, Recent Activity, Quick Actions)
│
├── 🔍 Benchmark (Research & Discovery)
│   ├── Channels
│   │   └── Channel Detail [dynamic]
│   │       └── Overview (estilo Social Blade - tudo numa tela)
│   ├── Videos
│   │   └── Video Detail [dynamic]
│   │       ├── Overview (performance + metadata tudo junto)
│   │       └── Transcript (não é tab, é drawer/modal)
│   ├── New Benchmark
│   │   └── Multi-step wizard
│   └── Radar
│       ├── Channels tab
│       └── Cron Logs tab
│
├── 🎬 Production (Content Creation)
│   ├── Videos
│   │   └── Video Detail [dynamic]
│   │       └── Overview (título, script, categorization, descrição, teaser - TUDO em sanfonas)
│   ├── Queue (Kanban)
│   │   └── Pipeline View (vídeos como cards)
│   ├── API Queue ⭐ NOVA TELA SEPARADA
│   │   ├── Image Generation Queue
│   │   ├── Audio Generation Queue
│   │   ├── Video Processing Queue
│   │   └── Failed Jobs
│   ├── Calendar ⭐ NOVA
│   │   └── Posting schedule view (múltiplos canais sobrepostos)
│   └── Workflows ⭐ NOVA
│       ├── Production Flow Configs (simplificado, robusto, com/sem teaser)
│       └── Thumbnail Workflows
│
├── 📺 Channels (Owned Properties)
│   └── Channels List
│       └── Channel Detail [dynamic]
│           ├── Overview tab
│           ├── Brand Bible tab ⭐ MODIFICADO
│           │   └── (Mostra onde cada campo é usado: roteiros, imagens, voz, etc.)
│           ├── Videos tab (published)
│           ├── Credentials tab ⭐ NOVA
│           │   └── Google OAuth tokens + keep-alive status
│           └── Analytics tab (if synced)
│
├── 🎨 Visual Lab ⭐ RENOMEADO (era Assets Library)
│   ├── Thumbnail Creator ⭐ NOVA
│   ├── Image Assets
│   ├── Audio Assets
│   ├── Visual FX
│   └── Video Inserts
│
├── 🤖 AI & Automation
│   ├── AI Agents ⭐ NOVA
│   │   ├── Writing Agents
│   │   ├── Image Agents
│   │   └── Analysis Agents
│   ├── Narrative Library ⭐ NOVA
│   │   ├── Analyses
│   │   ├── Structures
│   │   ├── Archetypes
│   │   ├── Characters
│   │   └── Emotional Cores
│   └── AI Cost Tracking ⭐ NOVA
│       └── Usage by provider, model, agent
│
├── 📊 Analytics ⭐ NOVA SEÇÃO
│   └── Channel Performance ⭐ NOVA
│       └── Import Google Sheets → Análise vídeo a vídeo
│
└── ⚙️ Settings & Configuration
    ├── Platform Settings
    ├── API Keys Pool ⭐ MODIFICADO
    │   └── Multiple keys + rotation strategy
    ├── FFMPEG Config ⭐ NOVA
    │   └── Rendering profiles, encoding settings
    ├── Categorization
    │   ├── Niches
    │   ├── Subniches
    │   ├── Categories
    │   └── Formats
    └── Webhooks
```

---

## 📦 DETALHAMENTO POR MÓDULO

### 1. 🔍 Benchmark

#### Mudanças Implementadas

**Channels → Channel Detail:**
- ❌ Removido tabs desnecessários (Analytics, Baseline Stats)
- ✅ **Overview único** estilo Social Blade com:
  - Header: Avatar, nome, subscribers, total views
  - Cards de baseline stats (14d, 30d, 90d, historical) numa grid
  - Indicadores do canal (categoria, niche, subniche)
  - Tabela de vídeos do canal (inline, expandível)
  - **Botões de ação:**
    - 🔄 Refresh data
    - 📊 Generate baseline stats
    - 📝 Generate transcript (se não tiver)
    - 🖼️ Fetch thumbnails
    - ⭐ Add to Radar
    - 🚀 Send to production

**Videos → Video Detail:**
- ❌ Removido Performance como tab separado
- ❌ Transcript não é tab (é drawer/modal com botão)
- ✅ **Overview unificado** com:
  - Hero section: Thumbnail grande + YouTube embed
  - Performance metrics grid (vs avg, vs median, outlier badges)
  - Metadata cards (upload date, duration, views, likes, comments)
  - **Botões de ação:**
    - 📝 Generate/View Transcript (abre drawer lateral)
    - 📖 Narrative Analysis (se existir)
    - 🖼️ Download Thumbnail
    - 📁 Add to Folder
    - 🚀 Send to Production

#### Feedback do Gobbi Implementado
> "Aqui em Benchmark, a gente precisa ter botão pra tudo: se precisar, gera uma transcrição do vídeo... se precisar puxa Thumbnail, etc."

✅ Implementado via toolbar com múltiplas ações por vídeo.

---

### 2. 🎬 Production

#### Mudanças Implementadas

**Videos → Video Detail:**
- ❌ Removido tabs (Script, Audio Segments, Video Segments, Assets, Publishing)
- ✅ **Overview unificado** com tudo em **sanfonas** (accordions):
  ```
  ┌─────────────────────────────────────┐
  │ Video Overview                      │
  ├─────────────────────────────────────┤
  │ ▼ Basic Info                        │
  │   - Title, Channel, Language        │
  │                                     │
  │ ▼ Script                            │
  │   - Full script (expandable)        │
  │                                     │
  │ ▼ Categorization                    │
  │   - Niche, Subniche, Category       │
  │                                     │
  │ ▼ SEO Metadata                      │
  │   - Description, Tags, Thumbnail    │
  │                                     │
  │ ▼ Teaser (if exists)                │
  │   - Teaser script/config            │
  │                                     │
  │ ▼ Audio Segments                    │
  │   - Table with playback             │
  │                                     │
  │ ▼ Video Segments                    │
  │   - Table with preview              │
  │                                     │
  │ ▼ Covering Images                   │
  │   - Gallery                         │
  │                                     │
  │ ▼ Publishing Status                 │
  │   - Schedule, upload status         │
  └─────────────────────────────────────┘
  ```

**Queue (Kanban):**
- ✅ Vídeos mostrados como **cards** (não linhas de tabela)
- ✅ Card mostra:
  - Thumbnail (se existir)
  - Título
  - Canal
  - Status badge
  - Progress indicator
  - Quick actions (View, Edit, Pause, Delete)
- ✅ Drag & drop entre colunas (status change)

**API Queue (⭐ NOVA TELA SEPARADA):**

> Feedback Gobbi: "Essa TAB MERECE uma tela separada, fora daqui. Por quê? Essa é a fila de produção de imagens da MÁQUINA INTEIRA, e não do vídeo específico."

```
Route: /production/api-queue

Purpose: Centralized queue for ALL asset generation (images, audio, video)

Layout:
┌─────────────────────────────────────────────┐
│ API Queue                        [Refresh] │
├─────────────────────────────────────────────┤
│ Tabs:                                       │
│ • Image Generation                          │
│ • Audio Generation                          │
│ • Video Processing                          │
│ • Failed Jobs                               │
├─────────────────────────────────────────────┤
│                                             │
│ Image Generation Queue:                     │
│                                             │
│ ┌───────────────────────────────────────┐   │
│ │ Provider    Model      Status   ETA   │   │
│ ├───────────────────────────────────────┤   │
│ │ Runware     SD 1.5     Processing 2m  │   │
│ │ Gemini      Imagen 3   Queued     5m  │   │
│ │ GPT         DALL-E 3   Completed  -   │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Config per Provider:                        │
│ - Runware: Uses N8N workflow A              │
│ - Gemini: Uses N8N workflow B               │
│ - GPT: Uses N8N workflow C                  │
│                                             │
│ Actions:                                    │
│ • Retry failed                              │
│ • Cancel queued                             │
│ • View logs                                 │
│ • Reprocess                                 │
└─────────────────────────────────────────────┘

Data Source:
- structure_api_queue
- api_queue_logs (nova tabela?)

Features:
- Real-time updates (Supabase Realtime)
- Filter by provider (Runware, Gemini, GPT, ElevenLabs)
- Filter by status (queued, processing, completed, failed)
- Retry with parameter override
- View detailed logs
- Switch provider (requeue with different provider)
```

**Calendar View (⭐ NOVA):**

> Feedback Gobbi: "Para ilustrar a parte de POSTAGEM, eu sugiro outra vista... sugiro uma vista de calendar para ver tudo unificado. Imagina vários canais já agendados sobrepostos num calendar. Tipo a 'Fila de Saída' da máquina."

```
Route: /production/calendar

Purpose: Visualizar agendamentos de postagem de MÚLTIPLOS canais num calendar

Layout:
┌─────────────────────────────────────────────────┐
│ Posting Calendar           [Week] [Month] [Day] │
├─────────────────────────────────────────────────┤
│                                                 │
│        Mon      Tue      Wed      Thu      Fri  │
│ 6:00  [Ch A]   [Ch B]    -        -        -    │
│       Video1   Video2                           │
│                                                 │
│ 6:05   -       [Ch A]   [Ch C]    -        -    │
│                Video3   Video4                  │
│                                                 │
│ 6:10  [Ch B]    -        -       [Ch A]    -    │
│       Video5                     Video6         │
│                                                 │
│ ... (scrollable)                                │
│                                                 │
│ Legend:                                         │
│ 🟢 Ch A - Canal Bíblico (verde)                 │
│ 🔵 Ch B - Canal Saúde (azul)                    │
│ 🟣 Ch C - Canal Tech (roxo)                     │
│                                                 │
│ Actions:                                        │
│ • Drag to reschedule                            │
│ • Click to edit video                           │
│ • Filter by channel                             │
│ • Export schedule (CSV)                         │
└─────────────────────────────────────────────────┘

Data Source:
- distribution_posting_queue
- structure_accounts (for channel colors)
- production_videos (for video details)

Features:
- Color-coded by channel
- Drag & drop to reschedule
- Click event to view video detail
- Filter by channel
- View conflicts (multiple videos same slot)
- Export schedule
```

**Production Workflows (⭐ NOVA):**

> Feedback Gobbi: "Na produção, é muito mais jogo se a gente tiver duas opções: Seguir por default configurações que serão usadas sempre caso a gente decida não interferir, ou Poder modificar essas configurações, tipo: fluxo de produção simplificado, robusto, etc. Com teaser, sem teaser. Faltou fluxo diferentes de thumbnails."

```
Route: /production/workflows

Purpose: Configurar diferentes fluxos de produção (templates)

Layout:
┌─────────────────────────────────────────────────┐
│ Production Workflows              [+ New Flow]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Workflow Templates:                             │
│                                                 │
│ ┌─────────────────────────────────────────┐     │
│ │ 🎯 Simplified Flow         [Edit] [Del] │     │
│ │ • Stages: Title → Script → SEO → Video  │     │
│ │ • Teaser: No                            │     │
│ │ • Thumbnail: Auto-generated             │     │
│ │ • Est. time: 2-3 days                   │     │
│ │ • Used by: 5 channels                   │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ ┌─────────────────────────────────────────┐     │
│ │ 🚀 Robust Flow             [Edit] [Del] │     │
│ │ • Stages: Full 12-stage pipeline        │     │
│ │ • Teaser: Yes (Instagram/TikTok)        │     │
│ │ • Thumbnail: Custom design              │     │
│ │ • Est. time: 5-7 days                   │     │
│ │ • Used by: 2 channels                   │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ ┌─────────────────────────────────────────┐     │
│ │ 📸 Thumbnail Workflows                  │     │
│ │ ├─ AI-Generated (Runware)               │     │
│ │ ├─ AI-Generated (DALL-E)                │     │
│ │ ├─ Template-based (Canva API)           │     │
│ │ └─ Manual upload                        │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ Create New Workflow:                            │
│ • Clone existing                                │
│ • Start from scratch                            │
│ • Import from template                          │
└─────────────────────────────────────────────────┘

Data Source:
- structure_production_workflow
- structure_workflow_pool

Fields per Workflow:
- Name
- Description
- Enabled stages (checkboxes)
- Teaser config (yes/no + platform)
- Thumbnail strategy (auto/custom/template)
- Default AI models (per agent)
- Timing expectations
- Assigned channels
```

---

### 3. 📺 Channels

#### Mudanças Implementadas

**Estrutura Simplificada:**
- ❌ Removido "Brand Bibles" como item separado
- ❌ Removido "Published Videos" como item separado
- ✅ Tudo agora está em **Channel Detail** (tabs)

**Channel Detail:**

```
Route: /channels/[id]

Tabs:
1. Overview
2. Brand Bible ⭐ MODIFICADO
3. Videos (published)
4. Credentials ⭐ NOVA
5. Analytics

---

Tab 2: Brand Bible (⭐ LABORATÓRIO DE EXPERIMENTAÇÃO)
```

> Feedback Gobbi: "Nessa aba, seria crucial a gente ter uma explicação sobre onde CADA CAMPO da Brand Bible é utilizada e quais são seus efeitos em: roteiros, imagens, voz, fluxo de produção, personagens, etc. Isso poderia ser bem visual... Entretanto, o desafio é que HOJE é mt JSONB ali."

**Nova interface visual:**

```
┌─────────────────────────────────────────────────────┐
│ Brand Bible - Canal Bíblico                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 🎨 Visual Style                             │     │
│ │                                             │     │
│ │ Color Palette: [Warm, earthy tones]        │     │
│ │                                             │     │
│ │ 💡 Used in:                                 │     │
│ │ • 🖼️  Covering images (color grading)       │     │
│ │ • 📸 Thumbnail generation (palette)         │     │
│ │ • 🎨 Visual FX (overlay colors)             │     │
│ │                                             │     │
│ │ [Edit Visual Style]                         │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 🎭 Host Profile                             │     │
│ │                                             │     │
│ │ Name: "Father Abraham"                      │     │
│ │ Voice: Deep, authoritative                  │     │
│ │                                             │     │
│ │ 💡 Used in:                                 │     │
│ │ • 📝 Script writing (character voice)       │     │
│ │ • 🎙️  TTS generation (voice selection)      │     │
│ │ • 🎬 Video segments (character consistency) │     │
│ │                                             │     │
│ │ [Edit Host Profile]                         │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ ✍️  Writing Style                           │     │
│ │                                             │     │
│ │ Tone: Inspirational, reverent              │     │
│ │ Vocabulary: Biblical, traditional           │     │
│ │                                             │     │
│ │ 💡 Used in:                                 │     │
│ │ • 📖 Title generation                       │     │
│ │ • 📝 Scriptwriter agent                     │     │
│ │ • 💬 SEO description                        │     │
│ │                                             │     │
│ │ [Edit Writing Style]                        │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ [... more sections for each JSONB field ...]       │
│                                                     │
│ Actions:                                            │
│ • 🔬 Test Changes (preview mode)                    │
│ • 💾 Save Brand Bible                               │
│ • 📋 Clone to New Channel                           │
└─────────────────────────────────────────────────────┘
```

**Estrutura dos Campos:**
Cada campo JSONB da Brand Bible agora tem:
1. **Input area** (form fields)
2. **"Used in" section** com ícones mostrando onde afeta:
   - 📝 Roteiros (scriptwriter)
   - 🖼️ Imagens (image generation)
   - 🎙️ Voz (TTS)
   - 🎬 Fluxo de produção (workflow)
   - 🎭 Personagens (character consistency)
   - 📖 SEO (title, description)
3. **Preview/Test button** (simula aplicação das mudanças)

---

**Tab 4: Credentials (⭐ NOVA):**

> Feedback Gobbi: "AQUI em channels faltou as credenciais de Token do Google POR CANAL. E ainda, precisa criar um CRON para usar a credencial para dar um GET qualquer no youtube só para mantê-la ativa."

```
┌─────────────────────────────────────────────────────┐
│ Google OAuth Credentials                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ Status: ✅ Active                           │     │
│ │                                             │     │
│ │ Access Token:  **************** (expires in │     │
│ │                45 min)                      │     │
│ │                                             │     │
│ │ Refresh Token: **************** (valid)     │     │
│ │                                             │     │
│ │ Last Used:     2025-11-18 14:30 (3m ago)    │     │
│ │                                             │     │
│ │ Keep-Alive CRON:                            │     │
│ │ • Status: 🟢 Running                        │     │
│ │ • Frequency: Every 30 minutes               │     │
│ │ • Last ping: 2025-11-18 14:00               │     │
│ │ • Next ping: 2025-11-18 14:30               │     │
│ │                                             │     │
│ │ Actions:                                    │     │
│ │ [Re-authenticate] [Test Connection]         │     │
│ │ [View Logs]       [Pause Keep-Alive]        │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ CRON Implementation:                                │
│ • Supabase Edge Function (cron job)                 │
│ • Executes: GET youtube.com/api/v3/channels?mine   │
│ • Purpose: Keep refresh token alive                 │
│ • Alerts: Email if token expires/fails              │
└─────────────────────────────────────────────────────┘

Data Source:
- structure_credentials (add keep_alive_status column)
- New table: credential_keep_alive_logs

New CRON Job:
- supabase/functions/credential-keep-alive/
- Runs every 30 minutes
- Pings YouTube API for each active channel
- Logs results
- Sends alerts on failure
```

---

### 4. 🎨 Visual Lab (⭐ RENOMEADO)

> Feedback Gobbi: "Assets Library deveria ser tipo um VISUAL LAB, como vc havia sugerido."

```
Route: /visual-lab

Purpose: Ambiente de experimentação e criação visual

Seções:
1. Thumbnail Creator ⭐ NOVA
2. Image Assets
3. Audio Assets
4. Visual FX
5. Video Inserts

---

1. Thumbnail Creator:
┌─────────────────────────────────────────────────────┐
│ Thumbnail Creator                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────┐  ┌─────────────────────────┐   │
│ │                 │  │ Tools:                  │   │
│ │   Canvas        │  │ • Text overlay          │   │
│ │   1280x720      │  │ • Image upload          │   │
│ │                 │  │ • Color picker          │   │
│ │                 │  │ • Filters               │   │
│ │                 │  │ • Templates             │   │
│ └─────────────────┘  └─────────────────────────┘   │
│                                                     │
│ Templates:                                          │
│ [Template 1] [Template 2] [Template 3] ...         │
│                                                     │
│ AI Generate:                                        │
│ Prompt: [Biblical scene with dramatic lighting...] │
│ [Generate with DALL-E] [Generate with Runware]     │
│                                                     │
│ Actions:                                            │
│ [Save to Library] [Export PNG] [Use in Video]      │
└─────────────────────────────────────────────────────┘

Features:
- Canvas-based editor (fabric.js or similar)
- Template library
- AI generation integration
- Asset library integration
- Export formats (PNG, JPG, WebP)
- Save to video's thumbnail
```

2-5. Image/Audio/Visual FX/Video Inserts:
- Similar to current design but with:
  - **Preview mode** (view before using)
  - **Quick edit** (basic adjustments)
  - **Usage tracking** (where used)
  - **Tags & collections** (organize)

---

### 5. 🤖 AI & Automation (⭐ NOVA SEÇÃO)

#### 5.1 AI Agents (⭐ NOVA)

> Feedback Gobbi: "Faltou uma aba de AGENTES categorizados por diferentes tipos: escrita, imagens, análise, etc."

```
Route: /ai-automation/agents

Purpose: Configurar e monitorar AI agents

Layout:
┌─────────────────────────────────────────────────────┐
│ AI Agents                               [+ New]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Tabs:                                               │
│ • Writing Agents                                    │
│ • Image Agents                                      │
│ • Analysis Agents                                   │
│                                                     │
│ ─── Writing Agents ───                              │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 📝 Scriptwriter Agent       [Edit] [Test]  │     │
│ │                                             │     │
│ │ Model: Claude 3.5 Sonnet                    │     │
│ │ Provider: OpenRouter                        │     │
│ │ Temperature: 0.7                            │     │
│ │ Max tokens: 8000                            │     │
│ │                                             │     │
│ │ System Prompt:                              │     │
│ │ "You are an expert scriptwriter..."        │     │
│ │                                             │     │
│ │ Usage (last 30d): 245 requests              │     │
│ │ Cost: $12.34                                │     │
│ │ Avg latency: 3.2s                           │     │
│ │                                             │     │
│ │ Status: 🟢 Active                           │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 📖 Title Generator          [Edit] [Test]  │     │
│ │ Model: GPT-4 Turbo                          │     │
│ │ Provider: OpenAI                            │     │
│ │ Usage: 512 requests                         │     │
│ │ Cost: $3.21                                 │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ─── Image Agents ───                                │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 🖼️ Covering Image Generator [Edit] [Test]  │     │
│ │ Model: Stable Diffusion 1.5                 │     │
│ │ Provider: Runware                           │     │
│ │ Usage: 1,234 images                         │     │
│ │ Cost: $45.67                                │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ─── Analysis Agents ───                             │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 🔍 Narrative Analyzer       [Edit] [Test]  │     │
│ │ Model: Claude 3 Opus                        │     │
│ │ Provider: Anthropic                         │     │
│ │ Usage: 89 analyses                          │     │
│ │ Cost: $8.90                                 │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ Actions:                                            │
│ • Create new agent                                  │
│ • Clone agent config                                │
│ • Test agent (with sample input)                    │
│ • View usage logs                                   │
│ • Compare agents (A/B testing)                      │
└─────────────────────────────────────────────────────┘

Data Source:
- New table: ai_agents
- structure_prompt_templates (merged/linked)
- ai_usage_logs (for tracking)

Fields per Agent:
- Name, description
- Type (writing/image/analysis)
- Model, provider
- System prompt
- User input template
- Output schema
- Parameters (temperature, max_tokens, etc.)
- Status (active/inactive)
- Usage stats
- Cost tracking
```

#### 5.2 Narrative Library (⭐ NOVA)

> Feedback Gobbi: "Faltou TODA a parte das tabelas de narrative"

```
Route: /ai-automation/narrative

Purpose: Browse and manage narrative analyses

Tabs:
1. Analyses (narrative_analyses)
2. Structures (narrative_structures)
3. Archetypes (narrative_archetypes)
4. Characters (narrative_characters)
5. Emotional Cores (narrative_emotional_cores)

---

Tab 1: Analyses
┌─────────────────────────────────────────────────────┐
│ Narrative Analyses                   [Filter ▼]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Table:                                              │
│ ┌───────────────────────────────────────────────┐   │
│ │ Video        Structure   Archetype   Created  │   │
│ ├───────────────────────────────────────────────┤   │
│ │ "David vs.   Hero's      The Hero   Nov 15   │   │
│ │  Goliath"    Journey                          │   │
│ │                                               │   │
│ │ "Exodus"     Three Act   The Guide  Nov 14   │   │
│ │                                               │   │
│ │ ...                                           │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ Detail View (click row):                            │
│ ┌─────────────────────────────────────────────┐     │
│ │ Analysis: David vs. Goliath                 │     │
│ │                                             │     │
│ │ Structure: Hero's Journey                   │     │
│ │ Archetype: The Hero                         │     │
│ │ Conflict: Man vs. Man                       │     │
│ │ Emotional Core: Courage                     │     │
│ │                                             │     │
│ │ Key Beats:                                  │     │
│ │ 1. Ordinary World: David as shepherd       │     │
│ │ 2. Call to Adventure: Goliath's challenge  │     │
│ │ 3. Refusal: Brothers mock David            │     │
│ │ 4. Meeting Mentor: King Saul               │     │
│ │ 5. ...                                      │     │
│ │                                             │     │
│ │ Characters:                                 │     │
│ │ • David (protagonist)                       │     │
│ │ • Goliath (antagonist)                      │     │
│ │ • King Saul (mentor)                        │     │
│ │                                             │     │
│ │ [Use in Production] [Edit] [Delete]        │     │
│ └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘

Features:
- Browse all analyses
- Filter by structure/archetype/conflict
- Search by video title
- View full narrative breakdown
- "Use in Production" button (creates new video with this narrative)
- Edit analysis (re-run AI or manual edit)
```

Tabs 2-5: Similar structure for Structures, Archetypes, Characters, Emotional Cores.

#### 5.3 AI Cost Tracking (⭐ NOVA)

> Feedback Gobbi: "Faltou parte de CUSTO com IA"

```
Route: /ai-automation/costs

Purpose: Monitor AI usage and costs

Layout:
┌─────────────────────────────────────────────────────┐
│ AI Cost Tracking                     [Last 30d ▼]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Overview:                                           │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Total Cost   │ │ Requests     │ │ Avg Cost/Req │ │
│ │ $234.56      │ │ 12,345       │ │ $0.019       │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                     │
│ By Provider:                                        │
│ ┌─────────────────────────────────────────────┐     │
│ │ Provider       Requests    Cost      %      │     │
│ ├─────────────────────────────────────────────┤     │
│ │ OpenRouter     5,234       $123.45   52.6%  │     │
│ │ Runware        4,567       $67.89    28.9%  │     │
│ │ OpenAI         1,890       $32.10    13.7%  │     │
│ │ ElevenLabs       654       $11.12    4.8%   │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ By Model:                                           │
│ ┌─────────────────────────────────────────────┐     │
│ │ Model                Requests    Cost       │     │
│ ├─────────────────────────────────────────────┤     │
│ │ Claude 3.5 Sonnet    2,345       $89.23     │     │
│ │ SD 1.5               4,567       $67.89     │     │
│ │ GPT-4 Turbo            890       $45.67     │     │
│ │ DALL-E 3               234       $23.45     │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ By Agent:                                           │
│ ┌─────────────────────────────────────────────┐     │
│ │ Agent                Requests    Cost       │     │
│ ├─────────────────────────────────────────────┤     │
│ │ Scriptwriter         1,234       $78.90     │     │
│ │ Image Generator      4,567       $67.89     │     │
│ │ Title Generator        890       $12.34     │     │
│ │ Narrative Analyzer     123       $8.90      │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ Chart: Cost over time (line chart)                  │
│ [Graph showing daily costs]                         │
│                                                     │
│ Actions:                                            │
│ • Export CSV                                        │
│ • Set budget alerts                                 │
│ • View detailed logs                                │
└─────────────────────────────────────────────────────┘

Data Source:
- New table: ai_usage_logs
  - Columns: timestamp, agent_id, model, provider,
             tokens_used, cost, request_type, video_id

Features:
- Real-time cost tracking
- Budget alerts (email when threshold reached)
- Cost attribution (by video, by channel, by agent)
- Trend analysis
- Export reports
```

---

### 6. 📊 Analytics (⭐ NOVA SEÇÃO)

#### Channel Performance Analysis (⭐ NOVA)

> Feedback Gobbi: "Faltou parte de ANÁLISE de video a video... uma tela onde vc exporta a planilha (google Sheets) do seu canal (até então manualmente) e ele te mostra todos os vídeos do seu canal e os indicadores principais."

```
Route: /analytics/channel-performance

Purpose: Importar dados do Google Sheets e analisar performance vídeo a vídeo

Layout:
┌─────────────────────────────────────────────────────┐
│ Channel Performance Analysis                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Step 1: Import Data                                 │
│ ┌─────────────────────────────────────────────┐     │
│ │ Import from Google Sheets                   │     │
│ │                                             │     │
│ │ Sheet URL: [________________________]       │     │
│ │                                             │     │
│ │ OR Upload CSV:  [Browse...]                 │     │
│ │                                             │     │
│ │ Channel: [Select channel ▼]                │     │
│ │                                             │     │
│ │ [Import Data]                               │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ Step 2: View Analysis                               │
│ ┌─────────────────────────────────────────────┐     │
│ │ Videos Overview                             │     │
│ │                                             │     │
│ │ ┌─────────────────────────────────────────┐ │     │
│ │ │ Video         Views   Likes   CTR   Ret │ │     │
│ │ ├─────────────────────────────────────────┤ │     │
│ │ │ "David..."    15.2K   1.2K    8.5%  45% │ │     │
│ │ │ "Exodus..."   23.4K   2.1K    9.2%  52% │ │     │
│ │ │ "Moses..."    8.9K    890     7.1%  38% │ │     │
│ │ │ ...                                     │ │     │
│ │ └─────────────────────────────────────────┘ │     │
│ │                                             │     │
│ │ Insights:                                   │     │
│ │ • Top 10% videos by views                   │     │
│ │ • Worst performing videos                   │     │
│ │ • Average CTR: 8.3%                         │     │
│ │ • Average retention: 45%                    │     │
│ │                                             │     │
│ │ Charts:                                     │     │
│ │ [Views distribution]                        │     │
│ │ [CTR vs Retention scatter plot]             │     │
│ │ [Performance over time]                     │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ Step 3: Compare with Benchmarks                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ Your videos vs Benchmark videos             │     │
│ │                                             │     │
│ │ Your avg views:      15.2K                  │     │
│ │ Benchmark avg views: 23.4K                  │     │
│ │ Gap:                 -35%                   │     │
│ │                                             │     │
│ │ Recommendations:                            │     │
│ │ • Improve thumbnails (CTR +2%)              │     │
│ │ • Optimize first 30s (Retention +10%)       │     │
│ │ • Test different titles                     │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ Actions:                                            │
│ • Export analysis (PDF/CSV)                         │
│ • Schedule auto-import (weekly)                     │
│ • Set performance alerts                            │
└─────────────────────────────────────────────────────┘

Data Source:
- New table: imported_channel_analytics
  - Columns: video_id, title, views, likes, comments,
             ctr, retention, upload_date, channel_id

Features:
- Import from Google Sheets API
- Manual CSV upload
- Auto-import scheduling
- Video-by-video analysis
- Performance benchmarking
- Trend identification
- Actionable recommendations
```

---

### 7. ⚙️ Settings (MODIFICAÇÕES)

#### 7.1 API Keys Pool (⭐ MODIFICADO)

> Feedback Gobbi: "API Keys precisa poder cadastrar várias e ROTACIONAR a utilização (api key pool)"

```
Route: /settings/api-keys

Purpose: Gerenciar pool de API keys com rotação

Layout:
┌─────────────────────────────────────────────────────┐
│ API Keys Pool                        [+ Add Key]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Provider: OpenRouter                                │
│ ┌─────────────────────────────────────────────┐     │
│ │ ✅ Key #1 (primary)    Used: 234/1000 RPM   │     │
│ │    *****abcd1234       Status: Active       │     │
│ │    [Edit] [Test] [Deactivate]              │     │
│ │                                             │     │
│ │ ✅ Key #2 (backup)     Used: 45/1000 RPM    │     │
│ │    *****efgh5678       Status: Active       │     │
│ │    [Edit] [Test] [Deactivate]              │     │
│ │                                             │     │
│ │ ⚠️  Key #3 (inactive)   Used: 0/1000 RPM    │     │
│ │    *****ijkl9012       Status: Rate limited │     │
│ │    [Edit] [Test] [Activate]                │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ Rotation Strategy:                                  │
│ • Round-robin                                       │
│ • Least-used first                                  │
│ • Random                                            │
│ • Manual (no rotation)                              │
│                                                     │
│ Current Strategy: [Least-used first ▼]             │
│                                                     │
│ Provider: Runware                                   │
│ ┌─────────────────────────────────────────────┐     │
│ │ ✅ Key #1 (only)       Used: 1234/∞         │     │
│ │    *****wxyz3456       Status: Active       │     │
│ │    [Edit] [Test] [Deactivate]              │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ Actions:                                            │
│ • Add new key                                       │
│ • Test all keys                                     │
│ • View usage logs                                   │
│ • Configure rotation                                │
└─────────────────────────────────────────────────────┘

Data Source:
- structure_api_keys_pool (existing, add rotation_strategy)
- New table: api_key_usage_logs

Features:
- Multiple keys per provider
- Rotation strategies (round-robin, least-used, random)
- Auto-fallback (if key fails, use next)
- Rate limit tracking
- Usage statistics
- Health checks
```

#### 7.2 FFMPEG Config (⭐ NOVA)

> Feedback Gobbi: "Faltou parte de configurações do FFMPEG"

```
Route: /settings/ffmpeg

Purpose: Configurar perfis de renderização de vídeo

Layout:
┌─────────────────────────────────────────────────────┐
│ FFMPEG Configuration                  [+ New Profile]│
├─────────────────────────────────────────────────────┤
│                                                     │
│ Rendering Profiles:                                 │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 🎬 YouTube 1080p (Default)  [Edit] [Delete] │     │
│ │                                             │     │
│ │ Resolution: 1920x1080                       │     │
│ │ Codec: H.264                                │     │
│ │ Bitrate: 8 Mbps                             │     │
│ │ FPS: 30                                     │     │
│ │ Audio: AAC 192kbps                          │     │
│ │                                             │     │
│ │ FFMPEG Command:                             │     │
│ │ ffmpeg -i input.mp4 \                       │     │
│ │   -c:v libx264 -preset medium \             │     │
│ │   -b:v 8M -maxrate 10M -bufsize 16M \       │     │
│ │   -vf scale=1920:1080 \                     │     │
│ │   -c:a aac -b:a 192k \                      │     │
│ │   -r 30 output.mp4                          │     │
│ │                                             │     │
│ │ Used by: 5 channels                         │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 📱 TikTok/Shorts      [Edit] [Delete]       │     │
│ │                                             │     │
│ │ Resolution: 1080x1920 (9:16)                │     │
│ │ Codec: H.265                                │     │
│ │ Bitrate: 5 Mbps                             │     │
│ │ FPS: 60                                     │     │
│ │ Audio: AAC 128kbps                          │     │
│ │                                             │     │
│ │ Used by: 2 channels                         │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ ⚡ Fast Preview       [Edit] [Delete]       │     │
│ │                                             │     │
│ │ Resolution: 1280x720                        │     │
│ │ Codec: H.264                                │     │
│ │ Bitrate: 2 Mbps (low quality, fast)         │     │
│ │ FPS: 24                                     │     │
│ │                                             │     │
│ │ Used by: Preview mode                       │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ Actions:                                            │
│ • Create custom profile                             │
│ • Test profile (with sample video)                  │
│ • Import from template                              │
│ • Export profile config                             │
└─────────────────────────────────────────────────────┘

Data Source:
- structure_video_rendering_profiles (existing)
- May need to add ffmpeg_command column

Features:
- Pre-defined profiles (YouTube, TikTok, Shorts, Preview)
- Custom profiles
- Visual editor (no need to write FFMPEG commands)
- Command preview (for advanced users)
- Test rendering
- Profile assignment per channel
```

---

## 🗺️ NAVEGAÇÃO SIDEBAR ATUALIZADA

### Estrutura Final

```
┌─────────────────────────────────────┐
│  🔴 Automídia                       │
├─────────────────────────────────────┤
│                                     │
│  🏠 Dashboard                       │
│                                     │
│  🔍 Benchmark              ▼        │
│     • Channels                      │
│     • Videos                        │
│     • New Benchmark                 │
│     • Radar                         │
│                                     │
│  🎬 Production             ▼        │
│     • Videos                        │
│     • Queue (Kanban)                │
│     • API Queue            ⭐ NOVA  │
│     • Calendar             ⭐ NOVA  │
│     • Workflows            ⭐ NOVA  │
│                                     │
│  📺 Channels               ▼        │
│     • Our Channels                  │
│       (Brand Bible + Credentials    │
│        + Videos integrados aqui)    │
│                                     │
│  🎨 Visual Lab             ▼        │
│     • Thumbnail Creator    ⭐ NOVA  │
│     • Image Assets                  │
│     • Audio Assets                  │
│     • Visual FX                     │
│     • Video Inserts                 │
│                                     │
│  🤖 AI & Automation        ▼        │
│     • AI Agents            ⭐ NOVA  │
│     • Narrative Library    ⭐ NOVA  │
│     • AI Cost Tracking     ⭐ NOVA  │
│                                     │
│  📊 Analytics              ▼        │
│     • Channel Performance  ⭐ NOVA  │
│                                     │
│  ⚙️  Settings              ▼        │
│     • Platform                      │
│     • API Keys Pool        ⭐ MOD   │
│     • FFMPEG Config        ⭐ NOVA  │
│     • Categorization                │
│     • Webhooks                      │
│                                     │
├─────────────────────────────────────┤
│  🌙 Dark Mode                       │
└─────────────────────────────────────┘
```

### Contagem de Itens

**Antes:**
- 5 seções
- 18 páginas

**Depois:**
- 8 seções (+3)
- 35+ páginas (+17)

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### Cobertura de Tabelas

| Categoria | Tabelas | Antes (UI) | Depois (UI) | Gap Fechado |
|-----------|---------|------------|-------------|-------------|
| Benchmark | 9 | 4 | 9 | ✅ 100% |
| Production | 6 | 2 | 6 | ✅ 100% |
| Narrative | 6 | 0 | 6 | ✅ 100% |
| Channels | 5 | 2 | 5 | ✅ 100% |
| Settings | 20 | 2 | 20 | ✅ 100% |
| Other | 10 | 5 | 10 | ✅ 100% |
| **TOTAL** | **56** | **15 (27%)** | **56 (100%)** | **✅ +41** |

### Funcionalidades Adicionadas

| Funcionalidade | Antes | Depois |
|----------------|-------|--------|
| Production Lab / Visual Lab | ❌ | ✅ Thumbnail Creator |
| API Queue separado | ❌ | ✅ Tela dedicada |
| Calendar View (postagens) | ❌ | ✅ Multi-canal |
| Narrative UI | ❌ | ✅ Completo |
| AI Agents Config | ❌ | ✅ Categorizado |
| FFMPEG Config | ❌ | ✅ Perfis |
| AI Cost Tracking | ❌ | ✅ Detalhado |
| Channel Analytics Import | ❌ | ✅ Google Sheets |
| Production Workflows | ❌ | ✅ Templates |
| Google Credentials + CRON | ❌ | ✅ Keep-alive |
| API Key Pool + Rotation | ❌ | ✅ Rotação |

---

## 🚀 PRÓXIMOS PASSOS

### Imediato (Aprovação)

1. **Revisar este documento** com Gobbi e Davi
2. **Aprovar ou ajustar** as mudanças propostas
3. **Priorizar** quais funcionalidades implementar primeiro

### Fase 0: Atualizar Documentação (1 dia)

- [ ] Atualizar `01-INFORMATION-ARCHITECTURE.md`
- [ ] Atualizar `02-SIDEBAR-NAVIGATION-STRUCTURE.md`
- [ ] Atualizar `03-SCREEN-SPECIFICATIONS.md`
- [ ] Atualizar `04-IMPLEMENTATION-ROADMAP.md`
- [ ] Atualizar `CLAUDE.md`

### Fase 1: Core Navigation (1 semana)

- [ ] Implementar sidebar com 8 seções
- [ ] Criar páginas placeholder para novas rotas
- [ ] Implementar redirects

### Fase 2-6: Implementação Incremental

Ver roadmap atualizado (a ser criado após aprovação).

---

## 📝 NOTAS FINAIS

### Principais Melhorias

1. **Simplicidade Visual** - Menos tabs, mais overview unificados
2. **Funcionalidade Completa** - 100% das tabelas agora têm UI
3. **Experimentação** - Visual Lab e Brand Bible como laboratórios
4. **Transparência** - API Queue, AI Costs, Analytics visíveis
5. **Automação** - Google Credentials keep-alive, API key rotation

### Decisões Chave

1. **Brand Bible** integrado em Channel Detail (não seção separada)
2. **API Queue** como tela separada (não tab em Production)
3. **Calendar** para visualizar postagens de múltiplos canais
4. **Visual Lab** ao invés de "Assets Library" (nome mais inspirador)
5. **AI & Automation** como seção dedicada (não espalhado)

### Feedback Pendente

Aguardando confirmação sobre:
- [ ] Nomes das seções OK?
- [ ] Estrutura de tabs OK?
- [ ] Funcionalidades faltantes identificadas?
- [ ] Priorização das novas features?

---

**Versão:** 2.0
**Status:** Aguardando aprovação
**Próximo:** Atualizar documentos e iniciar implementação

