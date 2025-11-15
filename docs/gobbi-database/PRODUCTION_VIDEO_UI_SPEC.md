# Especificação de UI: Tela de Visualização de Vídeo em Produção

**Data:** 2025-11-14
**Propósito:** Documento para Figma AI gerar o design da interface
**Projeto:** AutoMedia Platform - Sistema de Produção de Vídeos

---

## 1. Visão Geral da Tela

### Propósito
Visualizar todos os dados e acompanhar o progresso de um vídeo que está em produção, desde a seleção do vídeo fonte (benchmark) até a publicação final no YouTube.

### Usuário-Alvo
Produtor de conteúdo que precisa:
- Ver o status atual do vídeo
- Entender a narrativa do vídeo fonte
- Revisar o conteúdo gerado (script, outline, personagens)
- Acompanhar progresso de áudio e vídeo
- Verificar assets gerados
- Acessar links importantes (Drive, YouTube)

### Fluxo de Navegação
```
Lista de Vídeos (/production-videos)
    ↓
Detalhes do Vídeo (/production-videos/168)
    ↓
    ├─ Ver vídeo fonte no YouTube (link externo)
    ├─ Abrir pasta do Drive (link externo)
    ├─ Editar script (modal/página)
    └─ Ver vídeo publicado (link YouTube)
```

---

## 2. Layout Geral da Tela

### Estrutura Macro

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (fixo no topo)                                           │
│  ← Voltar | AutoMedia Production                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                    │
│  ┌──────────────┐  O DEUS SUPREMO Africano...                   │
│  │  THUMBNAIL   │  Status: Published                            │
│  │   [Imagem]   │  Criado: 15 Out 2025                          │
│  └──────────────┘  🔗 Ver no YouTube                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────────────────────┐
│  SIDEBAR (30%)       │  MAIN CONTENT (70%)                      │
│                      │                                          │
│  📊 Status & Stats   │  📖 Informações do Vídeo Fonte           │
│  📂 Links Rápidos    │  ┌────────────────────────────────────┐  │
│  🎯 Timeline         │  │ The Original Religion? ...         │  │
│                      │  │ The Seal of the Bible • 15.7k views│  │
│                      │  └────────────────────────────────────┘  │
│                      │                                          │
│                      │  🧠 Análise Narrativa                    │
│                      │  ┌────────────────────────────────────┐  │
│                      │  │ Estrutura: Hero's Journey (12 steps)│ │
│                      │  │ Tema: Apagamento de Olodumare     │  │
│                      │  └────────────────────────────────────┘  │
│                      │                                          │
│                      │  📝 Conteúdo Produzido                   │
│                      │  [Script, Outline, Personagens]          │
│                      │                                          │
│                      │  🎵 Segmentos de Áudio (12 segmentos)    │
│                      │  [Lista com duração e status]            │
│                      │                                          │
│                      │  🎬 Segmentos de Vídeo (5 segmentos)     │
│                      │  [Grid com thumbnails]                   │
│                      │                                          │
│                      │  🖼️ Assets de Edição                     │
│                      │  [Grid de imagens e textos]              │
└──────────────────────┴──────────────────────────────────────────┘
```

---

## 3. Seções de Dados Detalhadas

### 3.1 Hero Section (Cabeçalho do Vídeo)

**Localização:** Topo da página, logo após o header
**Layout:** Horizontal, thumbnail à esquerda, info à direita

**Dados a Exibir:**

| Campo | Fonte | Formato | Exemplo |
|-------|-------|---------|---------|
| **Thumbnail** | `production_videos.thumbnail_url` | Imagem 16:9, ~400x225px | ![thumbnail] |
| **Título** | `production_videos.title` | Texto grande (H1), bold | "O DEUS SUPREMO Africano que a História Tentou Apagar" |
| **Status Badge** | `production_videos.status` + `structure_allowed_status.description` | Badge colorido | 🟢 Published |
| **ID do Vídeo** | `production_videos.id` | Texto pequeno, cinza | #168 |
| **Data de Criação** | `production_videos.created_at` | Data formatada | Criado em 15 Out 2025 |
| **Última Atualização** | `production_videos.updated_at` | Data formatada, relativa | Atualizado há 2 dias |
| **Link YouTube** | `production_videos.final_link` | Botão primário, externo | 🔗 Ver no YouTube |
| **Linguagem** | `production_videos.language` | Badge pequeno | 🇧🇷 pt-BR |
| **Plataforma** | `production_videos.platform` | Badge pequeno | ▶️ YouTube |

**Cores de Status:**
- `published` → Verde (#22c55e)
- `create_*` → Azul (#3b82f6)
- `pending_approval` → Amarelo (#eab308)
- `failed` → Vermelho (#ef4444)
- `on_hold` → Cinza (#6b7280)

---

### 3.2 Sidebar: Status & Estatísticas

**Localização:** Lateral esquerda, fixa ao scroll
**Layout:** Cards empilhados verticalmente

#### Card 1: Resumo de Progresso

**Dados:**

| Campo | Cálculo | Formato | Exemplo |
|-------|---------|---------|---------|
| **Progresso Geral** | Baseado no status atual vs. total de stages (12) | Progress bar + % | 100% (12/12 stages) |
| **Tempo em Produção** | `updated_at - created_at` | Dias/horas | 35 dias |
| **Segmentos de Áudio** | `COUNT(production_audio_segments)` | Número | 12 segmentos |
| **Segmentos de Vídeo** | `COUNT(production_video_segments)` | Número | 5 segmentos |
| **Assets Gerados** | `COUNT(production_video_editing_assets)` | Número | 47 assets |

#### Card 2: Links Rápidos

**Dados:**

| Link | Fonte | Icon | Ação |
|------|-------|------|------|
| **Pasta Principal** | `production_videos.parent_folder` | 📂 | Abre Google Drive |
| **Áudios** | `production_videos.audio_folder_url` | 🎵 | Abre pasta de áudios |
| **Vídeos** | `production_videos.video_segments_folder` | 🎬 | Abre pasta de vídeos |
| **Thumbnails** | `production_videos.thumbnail_folder_url` | 🖼️ | Abre pasta de thumbs |
| **Imagens** | `production_videos.covering_images_folder` | 🌄 | Abre pasta de imagens |
| **Vídeo Final** | `production_videos.final_link` | ▶️ | Abre YouTube |

#### Card 3: Timeline de Workflow (Visual)

**Dados:** Array de 12 stages + status atual

**Formato:** Lista vertical com checkmarks

```
✅ 1. Create Title
✅ 2. Create Outline
✅ 3. Create Cast
✅ 4. Create Rich Outline
✅ 5. Create Script
✅ 6. Review Script
✅ 7. Create SEO Description
✅ 8. Create Thumbnail
✅ 9. Create Audio Segments
✅ 10. Create Video Segments
✅ 11. Concatenate Audios
✅ 12. Create Final Video
✅ Published
```

**Estados:**
- ✅ Completo (verde)
- 🔵 Atual (azul, pulsando)
- ⚪ Pendente (cinza)
- ❌ Falhou (vermelho)

---

### 3.3 Main Content: Informações do Vídeo Fonte

**Localização:** Primeira seção do conteúdo principal
**Layout:** Card horizontal

**Dados a Exibir:**

| Campo | Fonte | Formato | Exemplo |
|-------|-------|---------|---------|
| **Título Original** | `benchmark_videos.title` | Texto médio, bold | "The Original Religion? The African God Worshiped Above All!" |
| **Thumbnail** | `benchmark_videos.thumbnail_url` | Imagem 16:9, ~300x169px | ![thumb] |
| **Canal** | `benchmark_videos.channel_name` | Texto com ícone | 📺 The Seal of the Bible |
| **Views** | `benchmark_videos.views` | Número formatado | 15,772 views |
| **Data de Upload** | `benchmark_videos.upload_date` | Data formatada | Publicado em 21 Set 2025 |
| **Duração** | `benchmark_videos.video_length` | Tempo formatado | 48:32 |
| **Link YouTube** | `benchmark_videos.youtube_url` | Botão secundário | 🔗 Ver Original |
| **ID do Vídeo** | `benchmark_videos.youtube_video_id` | Código monospace | qbSYXAFtYZ0 |

**Seção Collapsible: Transcrição**

| Campo | Fonte | Formato |
|-------|-------|---------|
| **Transcrição Completa** | `benchmark_videos.video_transcript` | Texto longo, scrollable, max-height 400px |

**Estado inicial:** Colapsado
**Botão:** "▼ Ver Transcrição Completa"

---

### 3.4 Main Content: Análise Narrativa

**Localização:** Segunda seção do conteúdo principal
**Layout:** Card com sub-seções

**Dados a Exibir:**

#### Seção 3.4.1: Estrutura Narrativa

| Campo | Fonte | Formato | Exemplo |
|-------|-------|---------|---------|
| **Modelo de Estrutura** | `narrative_analyses.identified_structure_model` | Badge grande | Hero's Journey (12 Steps) |
| **Tema Central** | `narrative_analyses.central_theme` | Texto médio | "O apagamento histórico e redescoberta de Olodumare..." |
| **Núcleo Emocional** | `narrative_emotional_cores.name` (via FK) | Badge | 😠 Indignação / 🌟 Esperança |
| **Tipo de Conflito** | `narrative_conflict_types.name` (via FK) | Badge | Homem vs. Sistema |

#### Seção 3.4.2: Story Beats (Timeline Visual)

**Fonte:** `narrative_analyses.story_beats` (JSONB array)

**Formato:** Timeline horizontal com pontos clicáveis

**Estrutura dos Dados:**
```json
[
  {
    "name": "Ordinary World",
    "description": "Introdução ao protagonista...",
    "timestamp": "00:00-02:30",
    "emotional_state": "calm",
    "key_elements": ["character", "setting"]
  },
  {
    "name": "Call to Adventure",
    "description": "O incidente que perturba...",
    "timestamp": "02:30-05:00",
    "emotional_state": "curiosity"
  }
  // ... 10 more beats
]
```

**Visualização:**

```
━━●━━━●━━━●━━━●━━━●━━━●━━━●━━━●━━━●━━━●━━━●━━━●━━
  1   2   3   4   5   6   7   8   9  10  11  12

Hover/Click → Mostra card com:
- Nome do beat
- Descrição
- Timestamp
- Estado emocional (emoji/cor)
- Elementos-chave (tags)
```

**Cores por Estado Emocional:**
- `calm` → Azul claro
- `curiosity` → Amarelo
- `tension` → Laranja
- `fear` → Vermelho
- `relief` → Verde
- `triumph` → Verde escuro

---

### 3.5 Main Content: Conteúdo Produzido

**Localização:** Terceira seção do conteúdo principal
**Layout:** Tabs ou Accordion com 4 sub-seções

#### Tab 1: Script Completo

| Campo | Fonte | Formato |
|-------|-------|---------|
| **Script** | `production_videos.script` | Texto longo, markdown rendering, scrollable |
| **SSML Script** | `production_videos.ssml_script` | Collapsible, código monospace |
| **Indicador** | `production_videos.has_script` | Badge (Sim/Não) |

**Botões:**
- 📋 Copiar Script
- 📥 Download (.txt)
- ✏️ Editar (abre modal/página)

#### Tab 2: Story Cast (Elenco)

**Fonte:** `production_videos.story_cast_payload` (JSONB)

**Estrutura dos Dados:**
```json
{
  "characters": [
    {
      "name": "Olodumare",
      "archetype": "Supreme Creator",
      "role": "protagonist",
      "description": "O deus supremo da mitologia Yoruba...",
      "image_url": "https://...",
      "traits": ["wise", "powerful", "forgotten"]
    },
    {
      "name": "Colonizadores",
      "archetype": "Antagonist",
      "role": "antagonist",
      "description": "Forças que tentaram apagar..."
    }
  ]
}
```

**Visualização:**

Grid de cards (2-3 colunas):

```
┌─────────────────────┐ ┌─────────────────────┐
│  [Imagem Gerada]    │ │  [Imagem Gerada]    │
│                     │ │                     │
│  Olodumare         │ │  Colonizadores      │
│  Supreme Creator    │ │  Antagonist         │
│  ────────────────  │ │  ────────────────  │
│  Protagonist       │ │  Antagonist        │
│  #wise #powerful   │ │  #oppressor        │
└─────────────────────┘ └─────────────────────┘
```

#### Tab 3: Rich Outline (Outline Detalhado)

**Fonte:** `production_videos.rich_outline_payload` (JSONB)

**Estrutura dos Dados:**
```json
{
  "chapters": [
    {
      "chapter_number": 1,
      "title": "O Nome Esquecido",
      "summary": "Apresentação do mistério...",
      "emotional_arc": "Curiosidade → Intriga",
      "key_scenes": ["Pergunta inicial", "Contexto histórico"],
      "duration_estimate": "4-5 minutos"
    }
    // ... 9 more chapters
  ]
}
```

**Visualização:**

Lista numerada com cards expansíveis:

```
1. O Nome Esquecido                          [4-5 min] ▼
   ┌────────────────────────────────────────────────┐
   │ Apresentação do mistério...                    │
   │ Arco emocional: Curiosidade → Intriga          │
   │ Cenas-chave: • Pergunta inicial                │
   │              • Contexto histórico              │
   └────────────────────────────────────────────────┘

2. O Apagamento Histórico                    [5-6 min] ▼
3. A Redescoberta                            [4-5 min] ▼
...
10. O Legado Eterno                          [3-4 min] ▼
```

#### Tab 4: Adapted Story Beats

**Fonte:** `production_videos.adapted_story_beats_payload` (JSONB)

Similar ao original, mas mostrando as adaptações para a marca.

**Layout:** Comparação lado a lado (opcional)

```
Original                    Adaptado
──────────                 ──────────
"Ancient African god"  →   "O Deus Supremo Africano"
"Forgotten by history" →   "Tentaram Apagar da História"
```

---

### 3.6 Main Content: Produção de Áudio

**Localização:** Quarta seção
**Layout:** Lista ou Table

**Fonte:** `production_audio_segments` (array de 12+ registros)

**Dados por Segmento:**

| Campo | Fonte | Formato | Exemplo |
|-------|-------|---------|---------|
| **Número** | `segment_number` | Inteiro | #1 |
| **Texto** | `segment_text` | Preview (100 chars) + "..." | "Por que tantas pessoas nunca..." |
| **Duração** | `duration_seconds` | MM:SS | 04:02 (242.81s) |
| **Status** | `status` | Badge | ✅ Concatenated |
| **Audio URL** | `audio_url` | Player de áudio mini | ▶️ [player] |
| **Job ID** | `job_id` | Código pequeno, monospace | job_abc123 |

**Visualização:**

```
╔═══════════════════════════════════════════════════════════════╗
║ Segmentos de Áudio (12 total • 48:27 min total)             ║
╠═══════════════════════════════════════════════════════════════╣
║ #1  ▶️  "Por que tantas pessoas nunca..."  04:02  ✅ Done    ║
║ #2  ▶️  "Isso não foi apenas um mal..."    04:27  ✅ Done    ║
║ #3  ▶️  "É precisamente aqui que..."       03:44  ✅ Done    ║
║ ... (9 more)                                                 ║
╚═══════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────┐
│ 🎵 Áudio Final Concatenado                                    │
│ ▶️ [═══════════════════════════] 48:27                       │
│ 🔗 Download                                                   │
└───────────────────────────────────────────────────────────────┘
```

**Fonte Áudio Final:** `production_concatenated_audios.concatenated_audio_url`

---

### 3.7 Main Content: Produção de Vídeo

**Localização:** Quinta seção
**Layout:** Grid de cards (2-3 colunas)

**Fonte:** `production_video_segments` (array de 5+ registros)

**Dados por Segmento:**

| Campo | Fonte | Formato | Exemplo |
|-------|-------|---------|---------|
| **Número** | `segment_id` | Inteiro | Segmento #1 |
| **Thumbnail** | Primeiro frame do vídeo OU `covering_images[0]` | Imagem 16:9 | ![thumb] |
| **Filename** | `filename` | Texto pequeno | 168_video_segment_1.mp4 |
| **Status** | `status` | Badge | ✅ Used |
| **Video URL** | `video_url` | Botão de play/download | 🔗 Assistir |
| **Covering Images** | `covering_images` (JSONB array length) | Número | 15 imagens |
| **Workflow** | `video_segment_workflow_used` | Badge pequeno | workflow_v2 |

**Visualização:**

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  [Thumbnail #1]  │  │  [Thumbnail #2]  │  │  [Thumbnail #3]  │
│                  │  │                  │  │                  │
│  Segmento #1     │  │  Segmento #2     │  │  Segmento #3     │
│  ──────────────  │  │  ──────────────  │  │  ──────────────  │
│  ✅ Used         │  │  ✅ Used         │  │  ✅ Used         │
│  15 imagens      │  │  18 imagens      │  │  12 imagens      │
│  🔗 Assistir     │  │  🔗 Assistir     │  │  🔗 Assistir     │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  [Thumbnail #4]  │  │  [Thumbnail #5]  │
│  Segmento #4     │  │  Segmento #5     │
│  ✅ Used         │  │  ✅ Used         │
└──────────────────┘  └──────────────────┘
```

---

### 3.8 Main Content: Assets de Edição

**Localização:** Sexta seção
**Layout:** Grid de thumbnails (4-6 colunas) com filtros

**Fonte:** `production_video_editing_assets` (array de 40+ registros)

**Dados por Asset:**

| Campo | Fonte | Formato | Exemplo |
|-------|-------|---------|---------|
| **Thumbnail** | `file_url` (se imagem) OU ícone (se texto/audio) | Imagem/ícone | ![asset] |
| **Tipo** | `asset_type` | Badge | 🖼️ Image |
| **Nome/Descrição** | `asset_description` ou `text` | Texto pequeno | "Olodumare throne" |
| **Duração** | `duration` | Segundos | 5s |
| **Layer** | `layer` | Número | Layer 2 |
| **Status** | `status` | Badge | ✅ Rendered |

**Tipos de Assets:**
- `image` → 🖼️ Imagem
- `text` → 📝 Texto
- `audio` → 🎵 Áudio
- `effect` → ✨ Efeito

**Filtros:**
- 🔘 Todos
- 🖼️ Imagens (40)
- 📝 Textos (5)
- 🎵 Áudios (2)
- ✨ Efeitos (0)

**Visualização:**

```
Filtros: [Todos] [Imagens (40)] [Textos (5)] [Áudios (2)]

┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│img1│ │img2│ │img3│ │img4│ │img5│ │img6│
│ 5s │ │ 7s │ │ 3s │ │ 5s │ │ 8s │ │ 4s │
└────┘ └────┘ └────┘ └────┘ └────┘ └────┘

┌────┐ ┌────┐ ┌────┐ ┌────┐
│📝  │ │📝  │ │🎵  │ │✨  │
│"Ti"│ │"Op"│ │BGM │ │Fade│
└────┘ └────┘ └────┘ └────┘
```

**Click em asset → Modal com detalhes:**
- Preview grande
- Propriedades JSONB (posição, animação, etc.)
- Generation prompt (se gerado por AI)
- Timestamps (start_time, end_time)

---

## 4. Estrutura de Dados Completa

### 4.1 Tabela: `production_videos` (Principal)

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `id` | integer | ID do vídeo em produção | 168 |
| `benchmark_id` | integer | FK para vídeo fonte | 13093 |
| `unique_profile_id` | text | ID do canal/conta | UCMM4muXjZ4... |
| `title` | text | Título final do vídeo | "O DEUS SUPREMO..." |
| `status` | text | Status atual (FK) | "published" |
| `language` | text | Idioma | "pt-BR" |
| `platform` | text | Plataforma | "youtube" |
| `placeholder` | text | Identificador da marca | "avozdarevelacaobiblica" |
| `adapted_story_beats_payload` | jsonb | Story beats adaptados | {...} |
| `story_cast_payload` | jsonb | Elenco de personagens | {...} |
| `rich_outline_payload` | jsonb | Outline de 10 capítulos | {...} |
| `script` | text | Roteiro completo | "Por que tantas..." |
| `ssml_script` | text | Script otimizado para TTS | "<speak>..." |
| `description` | text | Descrição para YouTube | "Descubra a história..." |
| `thumbnail_url` | text | URL da thumbnail | https://... |
| `thumbnail_description` | text | Alt text da thumb | "Olodumare..." |
| `tags` | text | Tags SEO | "religião, história..." |
| `parent_folder` | text | Pasta principal (Drive) | https://drive.google.com/... |
| `audio_folder_url` | text | Pasta de áudios | https://... |
| `video_segments_folder` | text | Pasta de vídeos | https://... |
| `thumbnail_folder_url` | text | Pasta de thumbnails | https://... |
| `covering_images_folder` | text | Pasta de imagens | https://... |
| `text_folder_url` | text | Pasta de textos | https://... |
| `final_link` | text | Link do YouTube publicado | https://youtu.be/QR9... |
| `content_id_on_platform` | text | YouTube video ID | QR9GhtZZUVQ |
| `planned_upload_date` | timestamp | Data planejada | 2025-11-20 18:00 |
| `privacy` | text | Privacidade | "public" |
| `is_processing` | boolean | Em processamento | false |
| `created_at` | timestamp | Data de criação | 2025-10-15 14:23:11 |
| `updated_at` | timestamp | Última atualização | 2025-11-14 10:45:32 |
| `has_script` | boolean | Tem script? | true |
| `has_ssml_script` | boolean | Tem SSML? | true |
| `has_adapted_story_beats` | boolean | Tem story beats? | true |
| `has_rich_outline` | boolean | Tem outline? | true |
| `has_story_cast` | boolean | Tem elenco? | true |

### 4.2 Tabela: `benchmark_videos` (Vídeo Fonte)

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `id` | integer | ID do vídeo benchmark | 13093 |
| `title` | text | Título original | "The Original Religion?..." |
| `youtube_video_id` | text | ID do YouTube | qbSYXAFtYZ0 |
| `youtube_url` | text | URL completo | https://www.youtube.com/... |
| `thumbnail_url` | text | Thumbnail original | https://i.ytimg.com/... |
| `channel_name` | text | Nome do canal | "The Seal of the Bible" |
| `channel_id` | text | ID do canal | UCeqDoZL10bjiPvEcgrzF8FQ |
| `views` | integer | Visualizações | 15772 |
| `upload_date` | timestamp | Data de upload | 2025-09-21 |
| `video_length` | text | Duração | "48:32" |
| `video_age_days` | integer | Idade em dias | 54 |
| `video_transcript` | text | Transcrição completa | "Por que tantas pessoas..." |
| `categorization` | jsonb | Categoria/nicho | {"niche": "religion"...} |

### 4.3 Tabela: `narrative_analyses` (Análise Narrativa)

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `id` | integer | ID da análise | 42 |
| `benchmark_video_id` | integer | FK para vídeo | 13093 |
| `identified_structure_model` | text | Modelo narrativo | "Hero's Journey (12 Steps)" |
| `central_theme` | text | Tema central | "O apagamento histórico..." |
| `story_beats` | jsonb | Array de beats | [{...}, {...}] |
| `story_setting` | jsonb | Cenário | {"time": "...", "place": "..."} |
| `structure_id` | integer | FK tipo de estrutura | 1 |
| `emotional_core_id` | integer | FK núcleo emocional | 5 |
| `conflict_type_id` | integer | FK tipo de conflito | 3 |

### 4.4 Array: `audio_segments`

**Fonte:** `production_audio_segments` agregado

```json
[
  {
    "segment_number": 1,
    "job_id": "job_abc123",
    "segment_text": "Por que tantas pessoas nunca ouviram falar...",
    "audio_url": "https://storage.googleapis.com/.../segment_1.mp3",
    "duration_seconds": 242.81,
    "status": "concatenated"
  },
  {
    "segment_number": 2,
    "segment_text": "Isso não foi apenas um mal-entendido...",
    "audio_url": "https://.../segment_2.mp3",
    "duration_seconds": 267.13,
    "status": "concatenated"
  }
  // ... 10 more segments
]
```

### 4.5 Array: `video_segments`

**Fonte:** `production_video_segments` agregado

```json
[
  {
    "segment_id": 1,
    "id": 501,
    "filename": "168_video_segment_1.mp4",
    "video_url": "https://storage.googleapis.com/.../segment_1.mp4",
    "status": "used",
    "covering_images_count": 15
  },
  {
    "segment_id": 2,
    "filename": "168_video_segment_2.mp4",
    "video_url": "https://.../segment_2.mp4",
    "status": "used",
    "covering_images_count": 18
  }
  // ... 3 more segments
]
```

### 4.6 Array: `editing_assets`

**Fonte:** `production_video_editing_assets` agregado

```json
[
  {
    "asset_type": "image",
    "asset_description": "Olodumare on throne",
    "file_url": "https://storage.googleapis.com/.../image_001.jpg",
    "start_time": 0,
    "duration": 5,
    "layer": 1,
    "status": "rendered",
    "generation_prompt": "African supreme deity Olodumare seated on golden throne..."
  },
  {
    "asset_type": "text",
    "text": "OLODUMARE",
    "properties": {
      "fontSize": 72,
      "color": "#FFFFFF",
      "animation": "fade_in"
    },
    "start_time": 2,
    "duration": 3,
    "layer": 3
  }
  // ... 45 more assets
]
```

---

## 5. Exemplo Completo com Dados Reais

### Vídeo #168: "O DEUS SUPREMO Africano que a História Tentou Apagar"

#### Hero Section
```
┌────────────────────────┐
│   [THUMBNAIL IMAGE]    │   🎬 O DEUS SUPREMO Africano que a História Tentou Apagar
│   Olodumare on throne  │
│                        │   #168 • 🟢 Published • Criado em 15 Out 2025 • Atualizado há 2 dias
│   16:9 thumbnail       │   🇧🇷 pt-BR • ▶️ YouTube
└────────────────────────┘
                              🔗 Ver no YouTube
```

#### Sidebar: Status & Stats
```
╔════════════════════════╗
║ 📊 Progresso           ║
║ ████████████ 100%      ║
║ 12/12 stages completos ║
║                        ║
║ ⏱️ Tempo: 35 dias      ║
║ 🎵 Áudio: 12 segmentos ║
║ 🎬 Vídeo: 5 segmentos  ║
║ 🖼️ Assets: 47 itens    ║
╚════════════════════════╝

╔════════════════════════╗
║ 📂 Links Rápidos       ║
║ 📂 Pasta Principal     ║
║ 🎵 Áudios              ║
║ 🎬 Vídeos              ║
║ 🖼️ Thumbnails          ║
║ 🌄 Imagens             ║
║ ▶️ YouTube Final       ║
╚════════════════════════╝

╔════════════════════════╗
║ 🎯 Workflow            ║
║ ✅ Create Title        ║
║ ✅ Create Outline      ║
║ ✅ Create Cast         ║
║ ✅ Rich Outline        ║
║ ✅ Create Script       ║
║ ✅ Review Script       ║
║ ✅ SEO Description     ║
║ ✅ Thumbnail           ║
║ ✅ Audio Segments      ║
║ ✅ Video Segments      ║
║ ✅ Concatenate Audio   ║
║ ✅ Final Video         ║
║ ✅ Published           ║
╚════════════════════════╝
```

#### Main: Vídeo Fonte
```
╔══════════════════════════════════════════════════════════════╗
║ 📖 Informações do Vídeo Fonte                                ║
╠══════════════════════════════════════════════════════════════╣
║ ┌──────────┐                                                 ║
║ │ [THUMB]  │  The Original Religion? The African God        ║
║ │          │  Worshiped Above All!                          ║
║ └──────────┘                                                 ║
║              📺 The Seal of the Bible                        ║
║              👁️ 15,772 views • 📅 21 Set 2025 • ⏱️ 48:32    ║
║              🔗 Ver Original no YouTube                      ║
║              📝 ID: qbSYXAFtYZ0                              ║
║                                                              ║
║              ▼ Ver Transcrição Completa (4.2k caracteres)   ║
╚══════════════════════════════════════════════════════════════╝
```

#### Main: Análise Narrativa
```
╔══════════════════════════════════════════════════════════════╗
║ 🧠 Análise Narrativa                                         ║
╠══════════════════════════════════════════════════════════════╣
║ 📖 Estrutura: Hero's Journey (12 Steps)                      ║
║ 🎯 Tema: O apagamento histórico e redescoberta de Olodumare ║
║ 😠 Núcleo Emocional: Indignação / Esperança                 ║
║ ⚔️ Conflito: Homem vs. Sistema                               ║
║                                                              ║
║ Story Beats Timeline:                                        ║
║ ━━●━━━●━━━●━━━●━━━●━━━●━━━●━━━●━━━●━━━●━━━●━━━●━━          ║
║   1   2   3   4   5   6   7   8   9  10  11  12             ║
║                                                              ║
║ 1. Ordinary World (00:00-02:30) - Calm                      ║
║    "Introdução ao mistério de Olodumare..."                 ║
║                                                              ║
║ 2. Call to Adventure (02:30-05:00) - Curiosity              ║
║    "Por que ninguém conhece esse deus?"                     ║
║                                                              ║
║ ... (10 more beats)                                          ║
╚══════════════════════════════════════════════════════════════╝
```

#### Main: Conteúdo Produzido (Tabs)
```
╔══════════════════════════════════════════════════════════════╗
║ 📝 Conteúdo Produzido                                        ║
║ [Script] [Story Cast] [Rich Outline] [Adapted Beats]        ║
╠══════════════════════════════════════════════════════════════╣
║ Tab: Script                                                  ║
║ ┌──────────────────────────────────────────────────────────┐ ║
║ │ Por que tantas pessoas nunca ouviram falar de           │ ║
║ │ Olodumare? Como pode o nome de um deus tão importante  │ ║
║ │ ter sido quase apagado da memória coletiva?             │ ║
║ │                                                          │ ║
║ │ Isso não foi apenas um mal-entendido. Foi um apagamento│ ║
║ │ deliberado, uma tentativa sistemática de...             │ ║
║ │                                                          │ ║
║ │ (Script completo - 15.000+ palavras)                    │ ║
║ └──────────────────────────────────────────────────────────┘ ║
║ 📋 Copiar  📥 Download  ✏️ Editar                            ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║ Tab: Story Cast                                              ║
║ ┌────────────────────┐ ┌────────────────────┐               ║
║ │  [Olodumare Image] │ │ [Colonizer Image]  │               ║
║ │                    │ │                    │               ║
║ │  Olodumare        │ │  Colonizadores     │               ║
║ │  Supreme Creator  │ │  Antagonist        │               ║
║ │  ────────────────  │ │  ────────────────  │               ║
║ │  Protagonist      │ │  Antagonist        │               ║
║ │  #wise #powerful  │ │  #oppressor        │               ║
║ └────────────────────┘ └────────────────────┘               ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║ Tab: Rich Outline (10 Capítulos)                            ║
║                                                              ║
║ 1. O Nome Esquecido                          [4-5 min] ▼    ║
║    Arco: Curiosidade → Intriga                              ║
║    • Pergunta inicial sobre Olodumare                       ║
║    • Contexto do apagamento                                 ║
║                                                              ║
║ 2. O Apagamento Histórico                    [5-6 min] ▼    ║
║ 3. A Verdadeira Origem                       [4-5 min] ▼    ║
║ ... (7 more)                                                 ║
╚══════════════════════════════════════════════════════════════╝
```

#### Main: Segmentos de Áudio
```
╔══════════════════════════════════════════════════════════════╗
║ 🎵 Segmentos de Áudio (12 total • 48:27 total)              ║
╠══════════════════════════════════════════════════════════════╣
║ #1  ▶️ "Por que tantas pessoas nunca..."  04:02  ✅         ║
║ #2  ▶️ "Isso não foi apenas um mal..."    04:27  ✅         ║
║ #3  ▶️ "É precisamente aqui que..."       03:44  ✅         ║
║ #4  ▶️ "A resposta está nas raízes..."    04:08  ✅         ║
║ #5  ▶️ "Olodumare não é apenas..."        04:16  ✅         ║
║ #6  ▶️ "Mas como esse conhecimento..."    04:03  ✅         ║
║ #7  ▶️ "A colonização trouxe..."          03:59  ✅         ║
║ #8  ▶️ "No entanto, algo notável..."      04:11  ✅         ║
║ #9  ▶️ "Hoje, estudiosos e..."            04:04  ✅         ║
║ #10 ▶️ "A história de Olodumare..."       03:57  ✅         ║
║ #11 ▶️ "Cada vez que alguém..."           03:49  ✅         ║
║ #12 ▶️ "Porque no final..."               04:01  ✅         ║
╠══════════════════════════════════════════════════════════════╣
║ 🎵 Áudio Final Concatenado                                   ║
║ ▶️ [════════════════════════════] 48:27                     ║
║ 🔗 Download • 📊 45.2 MB                                     ║
╚══════════════════════════════════════════════════════════════╝
```

#### Main: Segmentos de Vídeo
```
╔══════════════════════════════════════════════════════════════╗
║ 🎬 Segmentos de Vídeo (5 total)                             ║
╠══════════════════════════════════════════════════════════════╣
║ ┌────────────┐ ┌────────────┐ ┌────────────┐               ║
║ │  [Thumb]   │ │  [Thumb]   │ │  [Thumb]   │               ║
║ │            │ │            │ │            │               ║
║ │ Segment #1 │ │ Segment #2 │ │ Segment #3 │               ║
║ │ ────────── │ │ ────────── │ │ ────────── │               ║
║ │ ✅ Used    │ │ ✅ Used    │ │ ✅ Used    │               ║
║ │ 15 images  │ │ 18 images  │ │ 12 images  │               ║
║ │ 🔗 Assistir│ │ 🔗 Assistir│ │ 🔗 Assistir│               ║
║ └────────────┘ └────────────┘ └────────────┘               ║
║                                                              ║
║ ┌────────────┐ ┌────────────┐                               ║
║ │  [Thumb]   │ │  [Thumb]   │                               ║
║ │ Segment #4 │ │ Segment #5 │                               ║
║ │ ✅ Used    │ │ ✅ Used    │                               ║
║ └────────────┘ └────────────┘                               ║
╚══════════════════════════════════════════════════════════════╝
```

#### Main: Assets de Edição
```
╔══════════════════════════════════════════════════════════════╗
║ 🖼️ Assets de Edição (47 total)                              ║
║ Filtros: [●Todos] [○Imagens (40)] [○Textos (5)] [○Áudios]  ║
╠══════════════════════════════════════════════════════════════╣
║ ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐                  ║
║ │img││img││img││img││img││img││img││img│                  ║
║ │ 1 ││ 2 ││ 3 ││ 4 ││ 5 ││ 6 ││ 7 ││ 8 │                  ║
║ │5s ││7s ││3s ││5s ││8s ││4s ││6s ││5s │                  ║
║ └───┘└───┘└───┘└───┘└───┘└───┘└───┘└───┘                  ║
║                                                              ║
║ ┌───┐┌───┐┌───┐┌───┐┌───┐                                  ║
║ │📝 ││📝 ││📝 ││🎵 ││✨ │                                  ║
║ │"T"││"Op││"Le││BGM││Fad│                                  ║
║ │3s ││4s ││2s ││48s││1s │                                  ║
║ └───┘└───┘└───┘└───┘└───┘                                  ║
║                                                              ║
║ ... (32 more assets)                                         ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 6. Componentes de UI Necessários

### 6.1 Componentes de Exibição

| Componente | Descrição | Props |
|------------|-----------|-------|
| `StatusBadge` | Badge colorido para status | `status: string, color: string` |
| `ProgressBar` | Barra de progresso | `current: number, total: number, label: string` |
| `VideoThumbnail` | Thumbnail clicável | `url: string, aspectRatio: "16:9"` |
| `AudioPlayer` | Mini player de áudio | `url: string, duration: number` |
| `TimelineVisual` | Timeline de story beats | `beats: Beat[], currentBeat?: number` |
| `WorkflowChecklist` | Lista de stages com checks | `stages: Stage[], currentStage: string` |
| `AssetGrid` | Grid de assets filtráveis | `assets: Asset[], filterType?: string` |
| `CollapsibleSection` | Seção expansível | `title: string, children: ReactNode, defaultOpen?: boolean` |
| `TabGroup` | Grupo de tabs | `tabs: Tab[]` |
| `DataCard` | Card genérico de dados | `title: string, icon: ReactNode, children: ReactNode` |

### 6.2 Componentes Compostos

| Componente | Descrição | Sub-componentes |
|------------|-----------|-----------------|
| `ProductionVideoHeader` | Header do vídeo | `VideoThumbnail`, `StatusBadge`, `MetadataList` |
| `SourceVideoInfo` | Info do vídeo fonte | `VideoThumbnail`, `ChannelInfo`, `StatsRow`, `CollapsibleSection` |
| `NarrativeAnalysisSection` | Análise narrativa | `TimelineVisual`, `ThemeCard`, `EmotionalCoreTag` |
| `AudioSegmentsList` | Lista de segmentos | `AudioPlayer`, `DurationBadge`, `StatusBadge` |
| `VideoSegmentsGrid` | Grid de vídeos | `VideoThumbnail`, `MetadataOverlay` |
| `ProductionSidebar` | Sidebar com stats | `ProgressBar`, `LinkList`, `WorkflowChecklist` |

### 6.3 Componentes de Layout

| Componente | Descrição |
|------------|-----------|
| `PageLayout` | Layout geral: Header + Sidebar + Main |
| `Section` | Seção de conteúdo com título e padding |
| `TwoColumnGrid` | Grid de 2 colunas responsivo |
| `ThreeColumnGrid` | Grid de 3 colunas responsivo |
| `StickyHeader` | Header fixo no topo |
| `ScrollableContent` | Área com scroll customizado |

---

## 7. Design System & Cores

### 7.1 Paleta de Cores

**Status Colors:**
```css
--status-published: #22c55e;      /* Verde */
--status-in-progress: #3b82f6;    /* Azul */
--status-pending: #eab308;        /* Amarelo */
--status-failed: #ef4444;         /* Vermelho */
--status-on-hold: #6b7280;        /* Cinza */
```

**Emotional States:**
```css
--emotion-calm: #93c5fd;          /* Azul claro */
--emotion-curiosity: #fde047;     /* Amarelo */
--emotion-tension: #fb923c;       /* Laranja */
--emotion-fear: #f87171;          /* Vermelho claro */
--emotion-relief: #86efac;        /* Verde claro */
--emotion-triumph: #10b981;       /* Verde escuro */
```

**UI Base:**
```css
--bg-primary: #ffffff;
--bg-secondary: #f9fafb;
--bg-tertiary: #f3f4f6;
--text-primary: #111827;
--text-secondary: #6b7280;
--border: #e5e7eb;
--accent: #6366f1;                /* Indigo */
```

### 7.2 Tipografia

```css
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'Fira Code', monospace;

--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### 7.3 Espaçamento

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
```

### 7.4 Border Radius

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
```

---

## 8. Responsividade

### 8.1 Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

### 8.2 Comportamento por Tamanho

**Mobile (< 768px):**
- Sidebar se torna collapsible/drawer
- Grids de 2-3 colunas viram 1 coluna
- Tabs viram accordion
- Timeline horizontal vira vertical

**Tablet (768px - 1024px):**
- Sidebar fixo, largura reduzida (25%)
- Grids de 2 colunas
- Tabs mantém

**Desktop (> 1024px):**
- Layout completo como especificado
- Sidebar 30%
- Grids de 3-4 colunas

---

## 9. Interações & Estados

### 9.1 Hover States

- Cards: `box-shadow` aumenta
- Botões: background levemente mais escuro
- Thumbnails: overlay com "Ver" aparece
- Links: underline animado

### 9.2 Loading States

- Skeleton loaders para todas as seções
- Spinners para ações (download, play)
- Progress bar para uploads

### 9.3 Empty States

- Mensagem amigável: "Nenhum asset gerado ainda"
- Ilustração/ícone
- CTA relevante (ex: "Gerar Assets")

---

## 10. Acessibilidade

### 10.1 Requisitos

- ✅ Contraste mínimo WCAG AA (4.5:1)
- ✅ Navegação por teclado (tab order lógico)
- ✅ ARIA labels em elementos interativos
- ✅ Alt text em todas as imagens
- ✅ Focus visible em todos os elementos
- ✅ Textos redimensionáveis até 200%

### 10.2 Screen Readers

- Landmarks semânticos (`<header>`, `<main>`, `<aside>`)
- Headings hierárquicos (H1 → H2 → H3)
- `aria-label` em botões de ícone
- `aria-live` para updates dinâmicos (status changes)

---

## 11. Performance

### 11.1 Otimizações

- Lazy loading de imagens (thumbnails, assets)
- Virtualização de listas longas (audio segments, assets)
- Code splitting por rota
- Image optimization (Next.js Image)
- Debounce em filtros

### 11.2 Metas

- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Score > 90

---

## 12. Referências de Design

### 12.1 Inspirações

**Dashboard de Projetos:**
- Notion (cards, sidebar)
- Linear (timeline, status)
- Figma (grids de assets)

**Media Production:**
- YouTube Studio (metadata, thumbnails)
- Descript (audio segments timeline)
- CapCut (video editing assets grid)

**Data Visualization:**
- Stripe Dashboard (progress bars, stats)
- Vercel Analytics (clean cards)

### 12.2 Patterns Recomendados

- **Master-Detail:** Lista de vídeos → Detalhes do vídeo
- **Progressive Disclosure:** Collapsibles para dados secundários
- **Skeleton Loading:** Placeholders enquanto carrega
- **Toast Notifications:** Feedback de ações
- **Modal Dialogs:** Edição de script, preview de assets

---

## 13. Prompt Sugerido para Figma AI

```
Crie um design moderno e clean para uma tela de visualização de vídeo em produção.

LAYOUT GERAL:
- Header fixo no topo com título e navegação
- Hero section com thumbnail grande (16:9) e metadados principais
- Layout de 2 colunas: Sidebar esquerda (30%) + Main content (70%)
- Sidebar fixa com: status/progresso, links rápidos, timeline de workflow
- Main content scrollável com 6 seções

SEÇÕES DO MAIN CONTENT:
1. Informações do Vídeo Fonte (card com thumbnail pequeno + dados)
2. Análise Narrativa (timeline visual de story beats + tema)
3. Conteúdo Produzido (tabs: Script, Elenco, Outline)
4. Segmentos de Áudio (lista com mini players, 12 itens)
5. Segmentos de Vídeo (grid 3 colunas, 5 cards)
6. Assets de Edição (grid 6 colunas com filtros)

ESTILO:
- Design system moderno, inspirado em Notion/Linear
- Cores: Branco #fff, Cinza claro #f9fafb, Azul accent #6366f1
- Status badges coloridos (verde=published, azul=in-progress)
- Cards com sombra sutil, border-radius 8px
- Typography: Inter font
- Ícones: usar emojis ou Lucide icons

DADOS DE EXEMPLO:
- Título: "O DEUS SUPREMO Africano que a História Tentou Apagar"
- Status: Published (verde)
- 12 segmentos de áudio, 5 segmentos de vídeo, 47 assets
- Progresso: 100% (12/12 stages)
- Tempo em produção: 35 dias

COMPONENTES CHAVE:
- Badges coloridos para status
- Progress bars
- Timeline visual (horizontal)
- Cards de thumbnail clicáveis
- Mini audio players
- Filtros de tipo de asset
- Tabs para conteúdo produzido
- Collapsible sections

RESPONSIVIDADE:
- Desktop-first
- Sidebar se torna drawer em mobile
```

---

## 14. Próximos Passos

1. **Design no Figma:**
   - Usar este documento como referência
   - Gerar design com Figma AI
   - Refinar manualmente se necessário

2. **Desenvolvimento:**
   - Criar types TypeScript
   - Implementar Server Action com query SQL
   - Criar componentes React
   - Integrar com Supabase

3. **Testes:**
   - Testar com vídeo #168 (dados reais)
   - Testar com vídeos em diferentes stages
   - Testar responsividade
   - Testar acessibilidade

4. **Iteração:**
   - Coletar feedback
   - Ajustar UI/UX
   - Otimizar performance

---

**Documento criado para:** AutoMedia Platform
**Data:** 2025-11-14
**Versão:** 1.0
**Autor:** Claude Code

