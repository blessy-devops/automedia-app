# AutoMedia Platform - Sumário Executivo (Revisão 2.0)

**Data:** 2025-11-18
**Status:** Pós-feedback Gobbi - Aguardando Aprovação

---

## 🎯 RESUMO DAS MUDANÇAS

### ✅ O QUE MUDOU

#### 📊 Cobertura de Dados
- **Antes:** 15 tabelas com UI (27%)
- **Depois:** 56 tabelas com UI (100%)
- **Gap fechado:** +41 tabelas

#### 🗂️ Estrutura da Sidebar
- **Antes:** 5 seções, 18 páginas
- **Depois:** 8 seções, 35+ páginas
- **Novas seções:** Visual Lab, AI & Automation, Analytics

---

## 📦 NOVAS FUNCIONALIDADES (Por Seção)

### 1. 🔍 Benchmark (Simplificado)

**Channel Detail:**
- ✅ Overview único estilo Social Blade
- ✅ Botões: Refresh, Generate Stats, Fetch Thumbnail, Add to Radar
- ❌ Removido tabs desnecessários

**Video Detail:**
- ✅ Performance integrado em Overview
- ✅ Transcript como drawer/modal (não tab)

---

### 2. 🎬 Production (Expandido)

**Novas Páginas:**

#### API Queue (⭐ TELA SEPARADA)
```
/production/api-queue

Centraliza TODA a fila de produção da máquina:
• Image Generation (Runware, Gemini, GPT)
• Audio Generation (ElevenLabs)
• Video Processing (FFMPEG)

Por quê separado?
→ Não é do vídeo específico, é da máquina inteira
```

#### Calendar View (⭐ NOVA)
```
/production/calendar

Visualiza postagens agendadas de MÚLTIPLOS canais
• Calendar com slots coloridos por canal
• Drag & drop para reagendar
• Identifica conflitos
• "Fila de saída" da máquina
```

#### Workflows (⭐ NOVA)
```
/production/workflows

Configura diferentes fluxos de produção:
• Simplificado (sem teaser, thumb auto)
• Robusto (12 stages, teaser, thumb custom)
• Custom (personalizável)

Thumbnail Workflows:
• AI-Generated (Runware/DALL-E)
• Template-based (Canva API)
• Manual upload
```

**Video Detail:**
- ✅ Overview unificado (tudo em sanfonas/accordions)
- ✅ Conteúdo: Título, Script, Categorização, Descrição, Teaser, Audio, Video, Images

**Queue:**
- ✅ Vídeos como **cards** (não tabela)
- ✅ Kanban com drag & drop

---

### 3. 📺 Channels (Simplificado + Enriquecido)

**Estrutura:**
- ❌ Removido "Brand Bibles" separado
- ❌ Removido "Published Videos" separado
- ✅ Tudo integrado em Channel Detail (tabs)

**Channel Detail - Tab: Brand Bible (⭐ LABORATÓRIO)**
```
Novo design VISUAL:
┌─────────────────────────────────┐
│ 🎨 Visual Style                 │
│ Color Palette: Warm tones       │
│                                 │
│ 💡 Used in:                     │
│ • 🖼️ Covering images            │
│ • 📸 Thumbnails                 │
│ • 🎨 Visual FX                  │
│                                 │
│ [Edit] [Preview]                │
└─────────────────────────────────┘

Cada campo mostra:
• Onde é usado (roteiros, imagens, voz, etc.)
• Preview de como afeta o resultado
• Test mode (simula mudanças)
```

**Channel Detail - Tab: Credentials (⭐ NOVA)**
```
Google OAuth Tokens:
• Access Token (expira em 45min)
• Refresh Token (válido)

Keep-Alive CRON:
• Status: 🟢 Running
• Frequency: Every 30 minutes
• Pinga YouTube API para manter token ativo
• Alerts se falhar

Actions:
• Re-authenticate
• Test connection
• View logs
```

---

### 4. 🎨 Visual Lab (⭐ RENOMEADO - era "Assets Library")

**Novo nome mais inspirador!**

**Thumbnail Creator (⭐ NOVA):**
```
Canvas-based editor:
• Text overlay
• Image upload
• Filters
• Templates
• AI generation (DALL-E, Runware)

Save to:
• Library
• Direct to video
• Export (PNG/JPG/WebP)
```

**Demais seções:**
- Image Assets
- Audio Assets
- Visual FX
- Video Inserts

Melhorias:
- Preview mode
- Quick edit
- Usage tracking
- Tags & collections

---

### 5. 🤖 AI & Automation (⭐ NOVA SEÇÃO)

#### AI Agents (⭐ NOVA)
```
/ai-automation/agents

Categorizado por tipo:
• Writing Agents (Scriptwriter, Title Generator)
• Image Agents (Covering Images, Thumbnails)
• Analysis Agents (Narrative Analyzer)

Per Agent:
• Model, provider, parameters
• System prompt
• Usage stats (last 30d)
• Cost tracking
• Test mode

Actions:
• Create/clone agent
• A/B test agents
• View logs
```

#### Narrative Library (⭐ NOVA)
```
/ai-automation/narrative

Acesso a TODAS as tabelas de narrative:
• Analyses (narrative_analyses)
• Structures (narrative_structures)
• Archetypes (narrative_archetypes)
• Characters (narrative_characters)
• Emotional Cores (narrative_emotional_cores)

Features:
• Browse analyses
• Filter by structure/archetype
• "Use in Production" button
• Edit/delete
```

#### AI Cost Tracking (⭐ NOVA)
```
/ai-automation/costs

Dashboard completo:
• Total cost (last 30d)
• By provider (OpenRouter, Runware, OpenAI)
• By model (Claude, SD, GPT-4, DALL-E)
• By agent (Scriptwriter, Image Gen, etc.)

Charts:
• Cost over time
• Usage trends
• Budget alerts

Export:
• CSV reports
• Cost attribution (by video/channel)
```

---

### 6. 📊 Analytics (⭐ NOVA SEÇÃO)

#### Channel Performance (⭐ NOVA)
```
/analytics/channel-performance

Import data:
• Google Sheets URL
• CSV upload
• Auto-import scheduling

Analysis:
• Video-by-video performance
• Top 10% / Worst performing
• CTR vs Retention scatter plot
• Compare with benchmarks

Recommendations:
• Improve thumbnails (CTR +2%)
• Optimize first 30s (Retention +10%)
• Test different titles
```

---

### 7. ⚙️ Settings (Modificações)

#### API Keys Pool (⭐ MODIFICADO)
```
/settings/api-keys

Antes: Uma chave por provider
Depois: Múltiplas chaves + rotação

Features:
• Pool de chaves (Key #1, #2, #3...)
• Rotation strategies:
  - Round-robin
  - Least-used first
  - Random
  - Manual

• Auto-fallback (se uma falhar, usa próxima)
• Rate limit tracking
• Usage stats per key
```

#### FFMPEG Config (⭐ NOVA)
```
/settings/ffmpeg

Rendering profiles:
• YouTube 1080p (default)
• TikTok/Shorts (9:16)
• Fast Preview (720p low quality)
• Custom profiles

Per profile:
• Resolution, codec, bitrate, FPS
• Visual editor OU FFMPEG command
• Test rendering
• Assign to channels
```

---

## 📋 SIDEBAR ATUALIZADA

```
🏠 Dashboard

🔍 Benchmark ▼
   • Channels
   • Videos
   • New Benchmark
   • Radar

🎬 Production ▼
   • Videos
   • Queue (Kanban)
   • API Queue          ⭐ NOVA
   • Calendar           ⭐ NOVA
   • Workflows          ⭐ NOVA

📺 Channels ▼
   • Our Channels
     (Brand Bible + Credentials integrados)

🎨 Visual Lab ▼         ⭐ RENOMEADO
   • Thumbnail Creator  ⭐ NOVA
   • Image Assets
   • Audio Assets
   • Visual FX
   • Video Inserts

🤖 AI & Automation ▼    ⭐ NOVA SEÇÃO
   • AI Agents          ⭐ NOVA
   • Narrative Library  ⭐ NOVA
   • AI Cost Tracking   ⭐ NOVA

📊 Analytics ▼          ⭐ NOVA SEÇÃO
   • Channel Performance ⭐ NOVA

⚙️ Settings ▼
   • Platform
   • API Keys Pool      ⭐ MODIFICADO
   • FFMPEG Config      ⭐ NOVA
   • Categorization
   • Webhooks
```

---

## ✅ CHECKLIST DE FEEDBACKS DO GOBBI

### Benchmark
- [x] Botões para tudo (transcrição, thumbnail, etc.)
- [x] Channel Detail como Social Blade (overview único)
- [x] Video Detail simplificado (performance em overview)
- [x] Transcript como drawer (não tab)

### Production
- [x] Video Detail com overview unificado (sanfonas)
- [x] Kanban com vídeos como cards
- [x] API Queue como tela separada
- [x] Calendar view para postagens multi-canal
- [x] Workflows diferentes (simplificado/robusto/com teaser)
- [x] Fluxos de thumbnail

### Channels
- [x] Brand Bible mostra onde cada campo é usado
- [x] Credentials tab com Google OAuth + CRON keep-alive
- [x] Brand Bibles integrado (não separado)
- [x] Published Videos integrado (não separado)

### Settings
- [x] API Keys com pool + rotação
- [x] Visual Lab (renomeado)
- [x] Posting Schedule removido de settings (agora é Calendar)

### Faltantes
- [x] Tabelas de narrative (Narrative Library)
- [x] Agentes categorizados (AI Agents)
- [x] FFMPEG Config
- [x] Custo com IA (AI Cost Tracking)
- [x] Análise vídeo a vídeo (Channel Performance)

---

## 🚦 STATUS POR FUNCIONALIDADE

### 🔴 CRÍTICO (Implementar primeiro)
- Sidebar com 8 seções
- API Queue separado
- Brand Bible visual (laboratório)
- Google Credentials + CRON

### 🟡 IMPORTANTE (Implementar em seguida)
- Calendar View
- Production Workflows
- Thumbnail Creator
- AI Agents config
- AI Cost Tracking

### 🟢 DESEJÁVEL (Implementar depois)
- Narrative Library UI completa
- Channel Performance Import
- FFMPEG Config UI
- API Key rotation

---

## 📊 IMPACTO

### Cobertura de Funcionalidades
```
Antes:  ████████░░░░░░░░░░░░  27% (15/56 tabelas)
Depois: ████████████████████ 100% (56/56 tabelas)
```

### Páginas
```
Antes:  18 páginas
Depois: 35+ páginas (+94%)
```

### User Experience
```
Ambiguidade:     RESOLVIDO (contexto sempre claro)
Workflow:        RESOLVIDO (sidebar reflete fluxo)
Funcionalidades: RESOLVIDO (100% acessível via UI)
```

---

## 🎯 PRÓXIMO PASSO

**Aguardando aprovação de:**
1. Estrutura geral (8 seções OK?)
2. Priorização (o que implementar primeiro?)
3. Nomes (Visual Lab, AI & Automation OK?)
4. Funcionalidades faltantes identificadas?

**Após aprovação:**
- Atualizar documentos detalhados
- Criar roadmap de implementação atualizado
- Iniciar Phase 0 (Foundation)

---

## 📝 PERGUNTAS PARA DISCUSSÃO

1. **Visual Lab** é um bom nome? Alternativas?
2. **AI & Automation** como seção separada faz sentido?
3. **Calendar View** deve ser em Production ou em Channels?
4. **Priorizar** API Queue ou Calendar View primeiro?
5. **Narrative Library** é crítico ou pode ficar pra depois?
6. Faltou algo nos feedbacks do Gobbi?

---

**Versão:** 2.0
**Data:** 2025-11-18
**Status:** 🟡 Aguardando Aprovação
**Autores:** Claude Code + Davi Luis + Gobbi

