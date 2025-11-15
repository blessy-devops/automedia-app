# Gobbi's Video Production Workflow - Complete Analysis

**Analysis Date:** 2025-11-14  
**Analyst:** Claude Code  
**Purpose:** Map complete video production workflow from Gobbi's database to implement in user's system

---

## Executive Summary

Gobbi's database implements a sophisticated **AI-powered video production pipeline** that transforms high-performing benchmark YouTube videos into new content for their brand. The system uses a multi-agent AI workflow with 12+ distinct production stages, from narrative analysis through final publication.

**Key Findings:**
- **67 production videos** have been created using this system
- **50 narrative analyses** performed on source videos
- **317 audio segments** and **302 video segments** generated
- **12-stage production workflow** with detailed status tracking
- **3 AI agents** transform source content into brand-aligned narratives

---

## Table of Contents

1. [Database Comparison](#1-database-comparison)
2. [Production Workflow Architecture](#2-production-workflow-architecture)
3. [Data Flow & Relationships](#3-data-flow--relationships)
4. [Complete Schema Documentation](#4-complete-schema-documentation)
5. [Real Production Example](#5-real-production-example)
6. [Implementation Checklist](#6-implementation-checklist)
7. [Query Examples](#7-query-examples)

---

## 1. Database Comparison

### Tables Comparison

| Category | User Has | Gobbi Has | Status |
|----------|----------|-----------|--------|
| **Common Tables** | ✅ | ✅ | 42 shared tables |
| **User Only** | 17 tables | - | Extra features (enrichment jobs, channel radar, etc.) |
| **Gobbi Only (MISSING)** | ❌ | 6 tables | **CRITICAL for production** |

### Critical Missing Tables in User's Database

```
⚠️  benchmark_outlier_videos          - Identifies high-performing videos for production
⚠️  benchmark_channels_selected_niches - Niche-specific channel tracking
⚠️  benchmark_channels_dossier         - Extended channel metadata
⚠️  structure_allowed_status           - Status workflow definitions (12 stages)
⚠️  structure_production_workflow      - Workflow configuration per profile
⚠️  ddl_sync_queue                     - Schema change tracking
```

### Tables Already Present (Good News!)

The user **already has** these critical production tables:
```
✅  production_videos                  - Main production video metadata
✅  production_audio_segments          - TTS-generated audio pieces
✅  production_video_segments          - Assembled video segments
✅  production_video_editing_assets    - Visual assets (images, text overlays, etc.)
✅  production_concatenated_audios     - Merged audio tracks
✅  production_covering_images         - Background/covering images
✅  narrative_analyses                 - Story structure analysis
✅  narrative_structures               - Narrative frameworks (Hero's Journey, etc.)
✅  narrative_emotional_cores          - Emotional triggers catalog
✅  narrative_conflict_types           - Conflict type definitions
✅  narrative_characters               - Character archetypes
✅  narrative_archetypes               - Character archetype catalog
```

---

## 2. Production Workflow Architecture

### The Complete 12-Stage Pipeline

Gobbi's system follows a **linear production pipeline** with 12 distinct stages:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VIDEO PRODUCTION PIPELINE                             │
└─────────────────────────────────────────────────────────────────────────┘

STAGE 1: create_title
├─ Generate video title based on story concept
└─ Status tracking: production_videos.status

STAGE 2: create_outline  
├─ Adapt reference story beats to brand universe
└─ Output: production_videos.adapted_story_beats_payload (JSONB)

STAGE 3: create_cast
├─ Map character archetypes and create profiles
└─ Output: production_videos.story_cast_payload (JSONB)

STAGE 4: create_rich_outline
├─ Structure screenplay into 10 chapters with dramaturgical directives
└─ Output: production_videos.rich_outline_payload (JSONB)

STAGE 5: create_script
├─ Write all 10 chapters following structural blueprint
└─ Output: production_videos.script (text or Google Drive URL)

STAGE 6: review_script
├─ Review, polish and moderate complete manuscript
└─ Output: Updated script

STAGE 7: create_seo_description
├─ Generate optimized description for YouTube
└─ Output: production_videos.description

STAGE 8: create_thumbnail
├─ Generate video thumbnail image
└─ Output: production_videos.thumbnail_url

STAGE 9: create_audio_segments
├─ Convert script to narrated audio using TTS
└─ Output: production_audio_segments table (multiple rows)

STAGE 10: create_video_segments
├─ Assemble video segments with images and effects
└─ Output: production_video_segments table (multiple rows)

STAGE 11: create_concatenated_audios
├─ Merge all audio segments into single track
└─ Output: production_concatenated_audios table

STAGE 12: create_final_video
├─ Render complete video with audio and visuals
└─ Output: Final video file

POST-PRODUCTION STAGES:
├─ pending_approval    - Video ready, awaiting manual approval
├─ approved           - Video approved for publication
├─ scheduled          - Video scheduled for upload
├─ published          - Video published on YouTube
├─ in_analysis        - Analyzing post-publication metrics
└─ (ERROR STATES: failed, canceled, on_hold)
```

### AI Agent Architecture

Gobbi uses **3 specialized AI agents** to transform source content:

#### **Agent 1: Reality Adapter** (Módulo de Elenco)
- **Input:** Original narrative analysis from benchmark video
- **Modules:**
  - **1.A:** Character Mapper - Maps original characters to brand archetypes
  - **1.B:** Character Profiler - Creates detailed character sheets
  - **1.C:** Visual Generator - Generates character images
- **Output:** `adapted_story_beats_payload` + `story_cast_payload` (JSONB)

#### **Agent 2: Screenplay Architect** (Arquiteto de Roteiro)
- **Input:** Adapted story beats from Agent 1
- **Process:** Structures narrative into 10 chapters with:
  - Emotional progression curve
  - Dramaturgical directives
  - Chapter-level hooks and conflicts
- **Output:** `rich_outline_payload` (JSONB)

#### **Agent 3: Scriptwriter** (Roteirista)
- **Input:** Rich outline from Agent 2
- **Process:** Writes full narrative script following blueprint
- **Output:** `script` field (Google Drive URL or text)

---

## 3. Data Flow & Relationships

### The Complete Production Journey

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                                   │
└──────────────────────────────────────────────────────────────────────────────┘

1. SOURCE IDENTIFICATION
   ┌─────────────────────────────────┐
   │  benchmark_videos               │  ← All analyzed YouTube videos
   │  ├─ id (PK)                     │
   │  ├─ youtube_video_id            │
   │  ├─ title                       │
   │  ├─ video_transcript            │ ← CRITICAL: Source transcript
   │  ├─ views, channel_id, etc.     │
   │  └─ status                      │
   └─────────────────────────────────┘
                  │
                  │ (Filter by performance)
                  ↓
   ┌─────────────────────────────────┐
   │  benchmark_outlier_videos       │  ← High performers only
   │  ├─ benchmark_video_id (PK/FK)  │
   │  ├─ average_performance_score   │
   │  ├─ median_performance_score    │
   │  ├─ views_per_subscriber        │
   │  └─ status = 'available'        │
   └─────────────────────────────────┘
                  │
                  │ (Manual selection for production)
                  ↓

2. NARRATIVE ANALYSIS
   ┌─────────────────────────────────┐
   │  narrative_analyses             │  ← AI analyzes story structure
   │  ├─ id (PK)                     │
   │  ├─ benchmark_video_id (FK)     │  → Links to source video
   │  ├─ structure_id (FK)           │  → Links to narrative_structures
   │  ├─ conflict_type_id (FK)       │  → Links to narrative_conflict_types
   │  ├─ emotional_core_id (FK)      │  → Links to narrative_emotional_cores
   │  ├─ identified_structure_model  │  e.g., "Hero's Journey (12 Steps)"
   │  ├─ central_theme               │
   │  ├─ story_beats (JSONB)         │  ← Story progression beats
   │  └─ story_setting (JSONB)       │
   └─────────────────────────────────┘
                  │
                  │ (Story identified, now adapt to brand)
                  ↓

3. PRODUCTION CREATION (THE HEART OF THE SYSTEM)
   ┌─────────────────────────────────┐
   │  production_videos              │  ← MAIN PRODUCTION TABLE
   │  ├─ id (PK)                     │
   │  ├─ benchmark_id (FK)           │  → Links to benchmark_videos
   │  ├─ unique_profile_id           │  → Which brand account
   │  ├─ title                       │  ← Final production title
   │  ├─ status                      │  ← Current pipeline stage (FK)
   │  ├─ language                    │  e.g., "pt-BR"
   │  ├─ platform                    │  e.g., "youtube"
   │  │
   │  ├─── AI AGENT OUTPUTS ────┐
   │  ├─ adapted_story_beats_payload (JSONB)  │ Agent 1 output
   │  ├─ story_cast_payload (JSONB)           │ Agent 1.A/B/C output
   │  ├─ rich_outline_payload (JSONB)         │ Agent 2 output
   │  │
   │  ├─── SCRIPT & CONTENT ────┐
   │  ├─ script                  │  Full narrative script
   │  ├─ ssml_script             │  TTS-optimized script
   │  ├─ description             │  YouTube description
   │  ├─ thumbnail_url           │
   │  ├─ thumbnail_description   │
   │  ├─ tags                    │
   │  │
   │  ├─── GOOGLE DRIVE FOLDERS ────┐
   │  ├─ parent_folder            │  Main video folder
   │  ├─ audio_folder_url         │  Audio segments storage
   │  ├─ video_segments_folder    │  Video segments storage
   │  ├─ thumbnail_folder_url     │  Thumbnail assets
   │  ├─ covering_images_folder   │  Covering images
   │  ├─ text_folder_url          │  Text overlays
   │  │
   │  ├─── PUBLICATION DATA ────┐
   │  ├─ final_link               │  Published YouTube URL
   │  ├─ content_id_on_platform   │  YouTube video ID
   │  ├─ planned_upload_date      │
   │  ├─ privacy                  │  public/private/unlisted
   │  │
   │  └─ is_processing (boolean)  │
   └─────────────────────────────┘
                  │
                  ├────────────────────────────────────────┐
                  │                                        │
                  ↓                                        ↓
   
4. AUDIO PRODUCTION
   ┌─────────────────────────────────┐    ┌─────────────────────────────────┐
   │  production_audio_segments      │    │  production_concatenated_audios │
   │  ├─ job_id (PK)                 │    │  ├─ id (PK)                     │
   │  ├─ video_id (FK)               │    │  ├─ video_id (FK)               │
   │  ├─ segment_number              │    │  ├─ segment_ids                 │
   │  ├─ segment_text                │    │  ├─ total_duration_seconds      │
   │  ├─ audio_url                   │    │  ├─ concatenated_audio_url      │
   │  ├─ duration_seconds            │    │  ├─ status                      │
   │  ├─ status                      │    │  └─ workflow_used               │
   │  ├─ concatenated_audio_id (FK)  │    └─────────────────────────────────┘
   │  ├─ segmentation_workflow_used  │
   │  └─ api_key_used                │
   └─────────────────────────────────┘

5. VIDEO PRODUCTION
   ┌─────────────────────────────────┐    ┌─────────────────────────────────┐
   │  production_video_segments      │    │  production_video_editing_assets│
   │  ├─ id (PK)                     │    │  ├─ id (PK)                     │
   │  ├─ video_id (FK)               │    │  ├─ video_id (FK)               │
   │  ├─ segment_id                  │    │  ├─ segment_id (FK)             │
   │  ├─ concatenated_audio_id (FK)  │    │  ├─ asset_type                  │
   │  ├─ filename                    │    │  │   (image, text, audio, etc.)  │
   │  ├─ video_url                   │    │  ├─ asset_key                   │
   │  ├─ status                      │    │  ├─ file_url                    │
   │  ├─ covering_images (JSONB)     │    │  ├─ start_time                  │
   │  ├─ covering_assets (JSONB)     │    │  ├─ duration                    │
   │  ├─ metadata_video (JSONB)      │    │  ├─ layer                       │
   │  └─ video_segment_workflow_used │    │  ├─ properties (JSONB)          │
   └─────────────────────────────────┘    │  ├─ generation_prompt           │
                                           │  └─ status                      │
                                           └─────────────────────────────────┘

6. PUBLICATION
   ┌─────────────────────────────────┐
   │  distribution_posting_queue     │  ← Scheduled publications
   │  ├─ id (PK)                     │
   │  ├─ content_id                  │
   │  ├─ platform                    │
   │  ├─ scheduled_time              │
   │  └─ status                      │
   └─────────────────────────────────┘
```

### Foreign Key Relationships Summary

```sql
-- CORE RELATIONSHIPS

production_videos.benchmark_id 
  → benchmark_videos.id

production_videos.status 
  → structure_allowed_status.status_key

production_videos.placeholder 
  → structure_accounts.placeholder

narrative_analyses.benchmark_video_id 
  → benchmark_videos.id

narrative_analyses.structure_id 
  → narrative_structures.id

narrative_analyses.conflict_type_id 
  → narrative_conflict_types.id

narrative_analyses.emotional_core_id 
  → narrative_emotional_cores.id

production_audio_segments.video_id 
  → production_videos.id

production_video_segments.video_id 
  → production_videos.id

production_video_editing_assets.video_id 
  → production_videos.id

production_concatenated_audios.video_id 
  → production_videos.id

benchmark_outlier_videos.benchmark_video_id 
  → benchmark_videos.id
```

---

## 4. Complete Schema Documentation

### 4.1 `benchmark_outlier_videos` ⚠️ MISSING

**Purpose:** Identifies high-performing videos that are candidates for production.

```sql
CREATE TABLE benchmark_outlier_videos (
  benchmark_video_id INTEGER PRIMARY KEY,  -- FK to benchmark_videos.id
  title TEXT,
  youtube_video_id TEXT,
  youtube_url TEXT,
  thumbnail_url TEXT,
  categorization JSONB,  -- {niche, subniche, microniche, category, format}
  views INTEGER,
  video_length TEXT,
  upload_date TIMESTAMP,
  video_age_days INTEGER,
  
  -- Performance metrics
  average_performance_score NUMERIC,
  median_performance_score NUMERIC,
  views_per_subscriber NUMERIC,
  
  -- Channel context
  channel_name TEXT,
  channel_id TEXT,
  channel_url TEXT,
  subscriber_count INTEGER,
  video_upload_count INTEGER,
  creation_date TIMESTAMP,
  
  status TEXT  -- FK to structure_allowed_status.status_key
);
```

**Key Fields:**
- `average_performance_score` - Performance vs channel's 14-day average
- `median_performance_score` - Performance vs channel's historical median
- `views_per_subscriber` - Engagement ratio

### 4.2 `structure_allowed_status` ⚠️ MISSING

**Purpose:** Defines all allowed status values and their workflow meanings.

```sql
CREATE TABLE structure_allowed_status (
  status_key TEXT PRIMARY KEY,  -- e.g., "create_title", "published"
  label TEXT,
  description TEXT,
  table_name TEXT,  -- Which table this status applies to
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**All 20 Status Values:**
```
1. create_title           - Generate video title based on story concept
2. create_outline         - Adapt reference story beats to brand universe
3. create_cast            - Map character archetypes and create profiles
4. create_rich_outline    - Structure screenplay into 10 chapters
5. create_script          - Write all 10 chapters following blueprint
6. review_script          - Review, polish and moderate manuscript
7. create_seo_description - Generate optimized YouTube description
8. create_thumbnail       - Generate video thumbnail image
9. create_audio_segments  - Convert script to TTS audio
10. create_video_segments - Assemble video with images/effects
11. create_concatenated_audios - Merge audio segments
12. create_final_video    - Render complete video
13. pending_approval      - Ready, awaiting manual approval
14. approved              - Approved for publication
15. scheduled             - Scheduled for upload
16. published             - Published on YouTube
17. in_analysis           - Analyzing post-publication metrics
18. failed                - Pipeline failed
19. canceled              - Production canceled manually
20. on_hold               - Production paused temporarily
```

### 4.3 `structure_production_workflow` ⚠️ MISSING

**Purpose:** Stores workflow configuration per brand profile.

```sql
CREATE TABLE structure_production_workflow (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  profile TEXT,  -- e.g., "biblical", "relatos"
  production_workflow JSONB,  -- Workflow configuration
  is_active BOOLEAN
);
```

**Example Workflow Configuration:**
```json
{
  "script_workflow": "chapters",
  "covering_workflow": "random",
  "default_image_api": "runware"
}
```

### 4.4 `production_videos` ✅ ALREADY EXISTS

**Purpose:** Main production video metadata (CRITICAL TABLE).

**Key Columns:**
```
id                             - Production video ID (PK)
benchmark_id                   - Source benchmark video (FK)
unique_profile_id              - Brand account identifier
title                          - Final production title
status                         - Current pipeline stage (FK)
language                       - e.g., "pt-BR"
platform                       - e.g., "youtube"

-- AI AGENT OUTPUTS (JSONB)
adapted_story_beats_payload    - Agent 1: Adapted story structure
story_cast_payload             - Agent 1.A/B/C: Character profiles & images
rich_outline_payload           - Agent 2: 10-chapter screenplay blueprint

-- SCRIPT & CONTENT
script                         - Full narrative script (URL or text)
ssml_script                    - TTS-optimized script
description                    - YouTube description
thumbnail_url                  - Thumbnail image URL
thumbnail_description          - Thumbnail alt text
tags                           - Video tags

-- GOOGLE DRIVE ORGANIZATION
parent_folder                  - Main video folder
audio_folder_url               - Audio segments
video_segments_folder          - Video segments
thumbnail_folder_url           - Thumbnail assets
covering_images_folder         - Covering images
text_folder_url                - Text overlays

-- PUBLICATION
final_link                     - Published YouTube URL
content_id_on_platform         - YouTube video ID
planned_upload_date            - Scheduled publish date
privacy                        - public/private/unlisted

-- METADATA
created_at                     - Creation timestamp
updated_at                     - Last update timestamp
is_processing                  - Boolean flag
```

### 4.5 `narrative_analyses` ✅ ALREADY EXISTS

**Purpose:** AI-powered narrative structure analysis of source videos.

```
id                             - Analysis ID (PK)
benchmark_video_id             - Source video (FK)
channel_id                     - Channel identifier
structure_id                   - Narrative structure type (FK)
conflict_type_id               - Type of conflict (FK)
emotional_core_id              - Primary emotional trigger (FK)
identified_structure_model     - e.g., "Hero's Journey (12 Steps)"
central_theme                  - Main theme/message
story_beats                    - JSONB array of story beats
story_setting                  - JSONB setting information
analysis_metadata              - JSONB additional metadata
created_at                     - Analysis timestamp
updated_at                     - Last update
```

**Story Beats Structure (JSONB):**
```json
[
  {
    "name": "Ordinary World",
    "description": "Introduction to the protagonist's normal life",
    "timestamp": "00:00-02:30",
    "emotional_state": "calm",
    "key_elements": ["character", "setting", "status_quo"]
  },
  {
    "name": "Call to Adventure",
    "description": "The inciting incident that disrupts the normal",
    "timestamp": "02:30-05:00",
    "emotional_state": "curiosity",
    "key_elements": ["challenge", "opportunity", "disruption"]
  }
  // ... 10 more beats for 12-step Hero's Journey
]
```

### 4.6 `production_audio_segments` ✅ ALREADY EXISTS

**Purpose:** Individual TTS-generated audio segments.

```
job_id                         - Unique job ID (PK)
video_id                       - Parent production video (FK)
segment_number                 - Sequence order
segment_text                   - Text to be narrated
audio_url                      - Generated audio file URL
duration_seconds               - Audio duration
status                         - Processing status
concatenated_audio_id          - Link to merged audio (FK)
segmentation_workflow_used     - Workflow ID used
concatenation_workflow_used    - Concatenation workflow
api_key_used                   - TTS API key identifier
created_at                     - Creation timestamp
```

**Typical Flow:**
```
1. Script broken into 10-15 segments (chapters/scenes)
2. Each segment sent to TTS API (ElevenLabs, Google TTS, etc.)
3. Audio URL stored per segment
4. Segments later concatenated into full audio track
```

### 4.7 `production_video_segments` ✅ ALREADY EXISTS

**Purpose:** Assembled video segments with visuals + audio.

```
id                             - Segment ID (PK)
video_id                       - Parent production video (FK)
segment_id                     - Sequence number
concatenated_audio_id          - Audio track to use (FK)
filename                       - Output filename
video_url                      - Generated video URL
status                         - Processing status
covering_images                - JSONB array of image metadata
covering_assets                - JSONB array of asset references
metadata_video                 - JSONB metadata
video_segment_workflow_used    - Workflow used
created_at                     - Creation timestamp
updated_at                     - Last update
```

**Covering Images Structure (JSONB):**
```json
[
  {
    "url": "https://storage.googleapis.com/.../image_001.jpg",
    "start_time": 0,
    "duration": 5,
    "transition": "fade",
    "zoom": "ken_burns"
  },
  {
    "url": "https://storage.googleapis.com/.../image_002.jpg",
    "start_time": 5,
    "duration": 7,
    "transition": "dissolve"
  }
]
```

### 4.8 `production_video_editing_assets` ✅ ALREADY EXISTS

**Purpose:** Individual visual/audio assets used in video editing.

```
id                             - Asset ID (PK)
video_id                       - Parent production video (FK)
segment_id                     - Which segment uses this (FK)
asset_type                     - Type: image, text, audio, effect
asset_key                      - Unique identifier
file_url                       - Asset file URL
filename                       - Original filename
start_time                     - When to display (seconds)
duration                       - How long to display (seconds)
end_time                       - End timestamp
layer                          - Z-index layer
width                          - Asset width (pixels)
height                         - Asset height (pixels)
properties                     - JSONB rendering properties
metadata                       - JSONB additional metadata
generation_prompt              - If AI-generated, the prompt used
text                           - If text overlay, the text content
asset_description              - Human-readable description
status                         - Processing status
created_at                     - Creation timestamp
updated_at                     - Last update
```

**Asset Types:**
- `image` - Background images, illustrations
- `text` - Text overlays, captions, titles
- `audio` - Sound effects, music
- `effect` - Visual effects, transitions

**Properties Structure (JSONB):**
```json
{
  "position": {"x": 100, "y": 50},
  "animation": "fade_in",
  "font": "Roboto",
  "fontSize": 48,
  "color": "#FFFFFF",
  "stroke": {"color": "#000000", "width": 2},
  "opacity": 0.9,
  "rotation": 0
}
```

### 4.9 `production_concatenated_audios` ✅ ALREADY EXISTS

**Purpose:** Final merged audio track for the video.

```
id                             - Concatenated audio ID (PK)
video_id                       - Parent production video (FK)
segment_ids                    - Array of audio segment IDs
total_duration_seconds         - Total audio length
concatenated_audio_url         - Final audio file URL
status                         - Processing status
workflow_used                  - Workflow ID used
created_at                     - Creation timestamp
updated_at                     - Last update
```

---

## 5. Real Production Example

### Production Video ID 168

**Title:** "O DEUS SUPREMO Africano que a História Tentou Apagar"  
**Source:** YouTube video by "The Seal of the Bible" (15,772 views)  
**Status:** published  
**Final URL:** https://youtu.be/QR9GhtZZUVQ

#### 5.1 Source Benchmark Video

```json
{
  "id": 13093,
  "title": "The Original Religion? The African God Worshiped Above All!",
  "channel_name": "The Seal of the Bible",
  "channel_id": "UCeqDoZL10bjiPvEcgrzF8FQ",
  "views": 15772,
  "upload_date": "2025-09-21T00:00:00",
  "youtube_url": "https://www.youtube.com/watch?v=qbSYXAFtYZ0",
  "youtube_video_id": "qbSYXAFtYZ0",
  "video_transcript": "Por que tantas pessoas nunca ouviram falar de Olodumare?..."
}
```

#### 5.2 Production Video Record

```json
{
  "id": 168,
  "benchmark_id": 13093,
  "unique_profile_id": "UCMM4muXjZ4XtA7xrbYO8gdQ",
  "title": "O DEUS SUPREMO Africano que a História Tentou Apagar",
  "status": "published",
  "platform": "youtube",
  "language": "pt-BR",
  "placeholder": "avozdarevelacaobiblica",
  
  "has_script": true,
  "has_ssml_script": true,
  "has_adapted_story_beats": false,
  "has_rich_outline": false,
  "has_story_cast": false,
  
  "parent_folder": "https://drive.google.com/drive/folders/1IyITBtDM8xdn7lBPb-cDXkOZqROo9xlr",
  "audio_folder_url": "https://drive.google.com/drive/folders/1Xr2-L23PnjNAO-bsYzryJakJ09Zw2ZV3",
  "video_segments_folder": "https://drive.google.com/drive/folders/1MZwTNqd6KX5g3ttFPxpNEDubhh3AoUbp",
  "thumbnail_folder_url": "https://drive.google.com/drive/folders/1OXGx87aro6f80sRjO2ohldIdguG2CDcm",
  "covering_images_folder": "https://drive.google.com/drive/folders/1QZ7sO6rs-q9Ct2-5rZX8qLCGjKd8Jskc",
  
  "final_link": "https://youtu.be/QR9GhtZZUVQ",
  "content_id_on_platform": "QR9GhtZZUVQ"
}
```

#### 5.3 Audio Production (12 segments)

```
Segment #1: 242.81s  - "Por que tantas pessoas nunca ouviram falar de Olodumare?..."
Segment #2: 267.13s  - "Isso não foi apenas um mal-entendido. Foi um apagamento..."
Segment #3: 224.01s  - "É precisamente aqui que a pergunta se torna inevitável..."
Segment #4: 248.57s  - "..."
Segment #5: 256.32s  - "..."
Segment #6: 243.19s  - "..."
Segment #7: 239.84s  - "..."
Segment #8: 251.03s  - "..."
Segment #9: 244.76s  - "..."
Segment #10: 237.45s - "..."
Segment #11: 229.91s - "..."
Segment #12: 241.63s - "..."

Total: ~48 minutes of audio
```

**Status:** All segments marked as "concatenated"  
**Workflow:** Different workflow IDs per segment (tXaVNQ8GcefxQNuq, OzbGDe8wzU8Eum0c, etc.)

#### 5.4 Video Production (5 segments)

```
Video Segment 1: 168_video_segment_1.mp4
Video Segment 2: 168_video_segment_2.mp4
Video Segment 3: 168_video_segment_3.mp4
Video Segment 4: 168_video_segment_4.mp4
Video Segment 5: 168_video_segment_5.mp4

Status: All marked as "used"
```

---

## 6. Implementation Checklist

### Phase 1: Database Setup ⚠️ URGENT

#### Step 1.1: Create Missing Tables

```sql
-- 1. structure_allowed_status
CREATE TABLE structure_allowed_status (
  status_key TEXT PRIMARY KEY,
  label TEXT,
  description TEXT,
  table_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert all 20 status definitions (see section 4.2)

-- 2. benchmark_outlier_videos  
CREATE TABLE benchmark_outlier_videos (
  benchmark_video_id INTEGER PRIMARY KEY REFERENCES benchmark_videos(id),
  title TEXT,
  youtube_video_id TEXT,
  youtube_url TEXT,
  thumbnail_url TEXT,
  categorization JSONB,
  views INTEGER,
  video_length TEXT,
  upload_date TIMESTAMP,
  video_age_days INTEGER,
  average_performance_score NUMERIC,
  median_performance_score NUMERIC,
  views_per_subscriber NUMERIC,
  channel_name TEXT,
  channel_id TEXT,
  channel_url TEXT,
  subscriber_count INTEGER,
  video_upload_count INTEGER,
  creation_date TIMESTAMP,
  status TEXT REFERENCES structure_allowed_status(status_key)
);

-- 3. structure_production_workflow
CREATE TABLE structure_production_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  profile TEXT NOT NULL,
  production_workflow JSONB,
  is_active BOOLEAN DEFAULT true
);

-- 4. benchmark_channels_selected_niches (optional but recommended)
CREATE TABLE benchmark_channels_selected_niches (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  channel_id TEXT NOT NULL,
  metric_date DATE,
  subscriber_count INTEGER,
  total_views BIGINT,
  video_upload_count INTEGER,
  channel_name TEXT,
  niche TEXT,
  subniche TEXT
);

-- 5. benchmark_channels_dossier (optional but recommended)
CREATE TABLE benchmark_channels_dossier (
  channel_id TEXT PRIMARY KEY,
  channel_name TEXT,
  dossier_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Step 1.2: Add Foreign Keys

```sql
-- Add FK constraint to production_videos.status
ALTER TABLE production_videos
ADD CONSTRAINT fk_production_videos_status
FOREIGN KEY (status) REFERENCES structure_allowed_status(status_key);

-- Add FK constraint to benchmark_videos.status (if not exists)
ALTER TABLE benchmark_videos
ADD CONSTRAINT fk_benchmark_videos_status
FOREIGN KEY (status) REFERENCES structure_allowed_status(status_key);
```

#### Step 1.3: Verify Existing Tables

```sql
-- Check that these critical tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'production_videos',
  'production_audio_segments',
  'production_video_segments',
  'production_video_editing_assets',
  'production_concatenated_audios',
  'narrative_analyses',
  'narrative_structures',
  'narrative_emotional_cores',
  'narrative_conflict_types'
);
```

### Phase 2: Workflow Implementation

#### Step 2.1: Create Workflow Configurations

```sql
-- Insert default workflow for biblical content
INSERT INTO structure_production_workflow (profile, production_workflow, is_active)
VALUES (
  'biblical',
  '{"script_workflow": "chapters", "covering_workflow": "random", "default_image_api": "runware"}',
  true
);

-- Insert workflow for other content types as needed
INSERT INTO structure_production_workflow (profile, production_workflow, is_active)
VALUES (
  'relatos',
  '{"script_workflow": "chapters", "covering_workflow": "random", "default_image_api": "pollinations"}',
  true
);
```

#### Step 2.2: Populate Status Definitions

```sql
INSERT INTO structure_allowed_status (status_key, description) VALUES
('create_title', 'Generate video title based on story concept'),
('create_outline', 'Adapt reference story beats to brand universe'),
('create_cast', 'Map character archetypes and create profiles'),
('create_rich_outline', 'Structure screenplay into 10 chapters with dramaturgical directives'),
('create_script', 'Write all 10 chapters following structural blueprint'),
('review_script', 'Review, polish and moderate complete manuscript'),
('create_seo_description', 'Generate optimized description for YouTube'),
('create_thumbnail', 'Generate video thumbnail image'),
('create_audio_segments', 'Convert script to narrated audio using TTS'),
('create_video_segments', 'Assemble video segments with images and effects'),
('create_concatenated_audios', 'Merge all audio segments into single track'),
('create_final_video', 'Render complete video with audio and visuals'),
('pending_approval', 'Video ready, awaiting manual approval'),
('approved', 'Video approved for publication'),
('scheduled', 'Video scheduled for upload'),
('published', 'Video published on YouTube'),
('in_analysis', 'Analyzing post-publication metrics'),
('failed', 'Pipeline failed at some stage'),
('canceled', 'Video production canceled manually'),
('on_hold', 'Video production paused temporarily');
```

### Phase 3: Outlier Detection

#### Step 3.1: Identify High Performers

```sql
-- Create a function to detect outlier videos
-- (This would need to be customized based on your performance metrics)

-- Example: Videos with >2x median performance
INSERT INTO benchmark_outlier_videos (
  benchmark_video_id,
  title,
  youtube_video_id,
  youtube_url,
  thumbnail_url,
  categorization,
  views,
  video_length,
  upload_date,
  video_age_days,
  average_performance_score,
  median_performance_score,
  views_per_subscriber,
  channel_name,
  channel_id,
  channel_url,
  subscriber_count,
  video_upload_count,
  status
)
SELECT 
  bv.id,
  bv.title,
  bv.youtube_video_id,
  bv.youtube_url,
  bv.thumbnail_url,
  bv.categorization,
  bv.views,
  bv.video_length,
  bv.upload_date,
  bv.video_age_days,
  -- Calculate performance scores here
  0 as average_performance_score,  -- Placeholder
  0 as median_performance_score,   -- Placeholder
  bv.views::float / NULLIF(bc.subscriber_count, 0) as views_per_subscriber,
  bc.channel_name,
  bc.channel_id,
  bc.channel_url,
  bc.subscriber_count,
  bc.total_videos,
  'available'
FROM benchmark_videos bv
JOIN benchmark_channels bc ON bv.channel_id = bc.channel_id
WHERE bv.views > (
  SELECT AVG(views) * 2 
  FROM benchmark_videos bv2 
  WHERE bv2.channel_id = bv.channel_id
);
```

### Phase 4: AI Agent Integration

#### Step 4.1: Narrative Analysis Agent

Create a Supabase Edge Function or API endpoint to:
1. Take a `benchmark_video_id`
2. Fetch the video transcript
3. Send to Claude API with narrative analysis prompt
4. Parse response into structured story beats
5. Insert into `narrative_analyses` table

**Example Prompt Structure:**
```
Analyze this video transcript and identify its narrative structure.

Transcript: [VIDEO_TRANSCRIPT]

Return a JSON object with:
{
  "identified_structure_model": "Hero's Journey (12 Steps)" | "Three-Act Structure" | etc.,
  "central_theme": "Main theme/message",
  "story_beats": [
    {
      "name": "Beat name",
      "description": "What happens",
      "timestamp": "00:00-02:30",
      "emotional_state": "curiosity" | "tension" | "relief" | etc.,
      "key_elements": ["element1", "element2"]
    }
  ],
  "story_setting": {
    "time": "When",
    "place": "Where",
    "context": "Context"
  },
  "conflict_type": "man vs man" | "man vs nature" | etc.,
  "emotional_core": "fear" | "hope" | "anger" | etc.
}
```

#### Step 4.2: Story Adaptation Agent (Agent 1)

Create an Edge Function to:
1. Take `narrative_analysis_id` + `brand_profile`
2. Adapt story beats to brand universe
3. Map characters to brand archetypes
4. Store in `production_videos.adapted_story_beats_payload`

#### Step 4.3: Screenplay Architect Agent (Agent 2)

Create an Edge Function to:
1. Take `adapted_story_beats_payload`
2. Structure into 10 chapters
3. Add dramaturgical directives
4. Store in `production_videos.rich_outline_payload`

#### Step 4.4: Scriptwriter Agent (Agent 3)

Create an Edge Function to:
1. Take `rich_outline_payload`
2. Write full narrative script
3. Store in `production_videos.script`

### Phase 5: Production Pipeline

#### Step 5.1: Audio Generation

Create Supabase Edge Function:
1. Split script into segments
2. Send each segment to TTS API (ElevenLabs, Google TTS, etc.)
3. Store each segment in `production_audio_segments`
4. Update status to `create_audio_segments`

#### Step 5.2: Audio Concatenation

Create Edge Function:
1. Fetch all audio segments for a video
2. Concatenate into single file
3. Store in `production_concatenated_audios`
4. Update segment references

#### Step 5.3: Visual Asset Generation

Create Edge Function:
1. Generate covering images (Runware, Pollinations, etc.)
2. Create text overlays
3. Store in `production_video_editing_assets`

#### Step 5.4: Video Segment Assembly

Create Edge Function:
1. For each segment:
   - Combine audio + covering images
   - Add text overlays
   - Apply transitions
2. Store in `production_video_segments`

#### Step 5.5: Final Video Rendering

Create Edge Function:
1. Concatenate all video segments
2. Add intro/outro
3. Apply final effects
4. Upload to storage
5. Update `production_videos.final_link`

### Phase 6: Publication & Distribution

#### Step 6.1: YouTube Upload

Create Edge Function:
1. Take `production_video_id`
2. Upload to YouTube API
3. Set metadata (title, description, tags, thumbnail)
4. Store `content_id_on_platform`
5. Update status to `published`

#### Step 6.2: Scheduling

Use `distribution_posting_queue` for scheduled uploads:
```sql
INSERT INTO distribution_posting_queue (
  content_id,
  platform,
  scheduled_time,
  status
) VALUES (
  168,  -- production_video_id
  'youtube',
  '2025-11-20 18:00:00',
  'scheduled'
);
```

---

## 7. Query Examples

### 7.1 Find Outlier Videos for Production

```sql
-- Get all available outlier videos with high performance
SELECT 
  ov.*,
  bv.video_transcript
FROM benchmark_outlier_videos ov
JOIN benchmark_videos bv ON ov.benchmark_video_id = bv.id
WHERE ov.status = 'available'
  AND ov.median_performance_score > 0.5  -- 50% above median
ORDER BY ov.median_performance_score DESC
LIMIT 10;
```

### 7.2 Get Complete Production Data

```sql
-- Fetch everything needed to understand a production video
SELECT 
  pv.*,
  bv.title as source_title,
  bv.youtube_url as source_url,
  bv.video_transcript,
  na.story_beats,
  na.central_theme,
  na.identified_structure_model,
  (
    SELECT json_agg(pas ORDER BY pas.segment_number)
    FROM production_audio_segments pas
    WHERE pas.video_id = pv.id
  ) as audio_segments,
  (
    SELECT json_agg(pvs ORDER BY pvs.segment_id)
    FROM production_video_segments pvs
    WHERE pvs.video_id = pv.id
  ) as video_segments
FROM production_videos pv
LEFT JOIN benchmark_videos bv ON pv.benchmark_id = bv.id
LEFT JOIN narrative_analyses na ON na.benchmark_video_id = bv.id
WHERE pv.id = 168;
```

### 7.3 Track Production Progress

```sql
-- Monitor all productions and their current status
SELECT 
  pv.id,
  pv.title,
  pv.status,
  sas.description as status_description,
  pv.created_at,
  pv.updated_at,
  (
    SELECT COUNT(*)
    FROM production_audio_segments
    WHERE video_id = pv.id
  ) as audio_segments_count,
  (
    SELECT COUNT(*)
    FROM production_video_segments
    WHERE video_id = pv.id
  ) as video_segments_count,
  pv.final_link
FROM production_videos pv
LEFT JOIN structure_allowed_status sas ON pv.status = sas.status_key
ORDER BY pv.updated_at DESC;
```

### 7.4 Get Videos Ready for Production

```sql
-- Find benchmark videos that have narrative analysis but no production yet
SELECT 
  bv.id,
  bv.title,
  bv.channel_name,
  bv.views,
  na.identified_structure_model,
  na.central_theme
FROM benchmark_videos bv
JOIN narrative_analyses na ON na.benchmark_video_id = bv.id
LEFT JOIN production_videos pv ON pv.benchmark_id = bv.id
WHERE pv.id IS NULL  -- No production created yet
  AND bv.video_transcript IS NOT NULL  -- Has transcript
ORDER BY bv.views DESC;
```

### 7.5 Calculate Production Metrics

```sql
-- Get production statistics
SELECT 
  COUNT(*) as total_productions,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status IN ('create_audio_segments', 'create_video_segments')) as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  AVG(
    EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600
  ) as avg_production_hours
FROM production_videos;
```

### 7.6 Get Audio/Video Assets for Rendering

```sql
-- Fetch all assets needed to render a video segment
SELECT 
  pvs.segment_id,
  pvs.filename,
  pca.concatenated_audio_url,
  pvs.covering_images,
  json_agg(
    json_build_object(
      'type', pvea.asset_type,
      'file_url', pvea.file_url,
      'start_time', pvea.start_time,
      'duration', pvea.duration,
      'layer', pvea.layer,
      'properties', pvea.properties
    ) ORDER BY pvea.layer, pvea.start_time
  ) as editing_assets
FROM production_video_segments pvs
LEFT JOIN production_concatenated_audios pca ON pvs.concatenated_audio_id = pca.id
LEFT JOIN production_video_editing_assets pvea ON pvea.segment_id = pvs.id
WHERE pvs.video_id = 168
GROUP BY pvs.segment_id, pvs.filename, pca.concatenated_audio_url, pvs.covering_images
ORDER BY pvs.segment_id;
```

### 7.7 Bulk Create Production from Outliers

```sql
-- Create production_videos records for top outliers
INSERT INTO production_videos (
  benchmark_id,
  unique_profile_id,
  title,
  status,
  language,
  platform,
  placeholder
)
SELECT 
  ov.benchmark_video_id,
  'UCMM4muXjZ4XtA7xrbYO8gdQ',  -- Your channel ID
  ov.title,  -- Can be modified later
  'create_title',
  'pt-BR',
  'youtube',
  'avozdarevelacaobiblica'
FROM benchmark_outlier_videos ov
WHERE ov.status = 'available'
  AND ov.median_performance_score > 0.5
  AND NOT EXISTS (
    SELECT 1 FROM production_videos pv
    WHERE pv.benchmark_id = ov.benchmark_video_id
  )
LIMIT 10;
```

---

## Appendix A: Workflow States Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION STATUS FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

   [Start]
      │
      ↓
┌──────────────┐
│create_title  │ → Generate title from story concept
└──────────────┘
      │
      ↓
┌──────────────┐
│create_outline│ → Adapt story beats to brand (Agent 1)
└──────────────┘
      │
      ↓
┌──────────────┐
│create_cast   │ → Map characters & generate images (Agent 1.A/B/C)
└──────────────┘
      │
      ↓
┌──────────────┐
│create_rich_  │ → Structure 10 chapters (Agent 2)
│  outline     │
└──────────────┘
      │
      ↓
┌──────────────┐
│create_script │ → Write full screenplay (Agent 3)
└──────────────┘
      │
      ↓
┌──────────────┐
│review_script │ → Polish & moderate
└──────────────┘
      │
      ↓
┌──────────────┐
│create_seo_   │ → Generate YouTube description
│ description  │
└──────────────┘
      │
      ↓
┌──────────────┐
│create_       │ → Generate thumbnail image
│ thumbnail    │
└──────────────┘
      │
      ↓
┌──────────────┐
│create_audio_ │ → TTS generation (12+ segments)
│  segments    │
└──────────────┘
      │
      ↓
┌──────────────┐
│create_video_ │ → Assemble visuals + audio
│  segments    │
└──────────────┘
      │
      ↓
┌──────────────┐
│create_       │ → Merge all audio tracks
│concatenated_ │
│  audios      │
└──────────────┘
      │
      ↓
┌──────────────┐
│create_final_ │ → Final render
│  video       │
└──────────────┘
      │
      ↓
┌──────────────┐
│pending_      │ ──┐
│ approval     │   │
└──────────────┘   │
      │            │ (Approval flow)
      ↓            │
┌──────────────┐   │
│approved      │ ←─┘
└──────────────┘
      │
      ↓
┌──────────────┐
│scheduled     │ → Queue for upload
└──────────────┘
      │
      ↓
┌──────────────┐
│published     │ → Live on YouTube
└──────────────┘
      │
      ↓
┌──────────────┐
│in_analysis   │ → Track performance
└──────────────┘
      │
      ↓
   [End]

(Error states can branch from any step)
      ↓
┌──────────────┐
│failed        │ → Something broke
│canceled      │ → Manual cancel
│on_hold       │ → Paused temporarily
└──────────────┘
```

---

## Appendix B: Data Size Reference

**From Gobbi's Database (as of 2025-11-14):**

| Table | Row Count | Notes |
|-------|-----------|-------|
| benchmark_videos | ~26,000 | All analyzed videos |
| benchmark_outlier_videos | ~3 | High performers only |
| production_videos | 67 | Videos in production |
| narrative_analyses | 50 | AI-analyzed narratives |
| production_audio_segments | 317 | ~5 per production video |
| production_video_segments | 302 | ~5 per production video |
| production_concatenated_audios | 169 | ~2-3 per production |
| production_video_editing_assets | Variable | Depends on visual complexity |

**Storage Requirements:**
- Audio segments: ~50-100 MB per production video
- Video segments: ~500 MB - 2 GB per production video
- Final video: ~1-3 GB for 45-60 minute videos

---

## Appendix C: Technology Stack

Based on analysis of Gobbi's database:

**Core Infrastructure:**
- Database: Supabase (PostgreSQL)
- File Storage: Google Drive (for audio/video files)
- Video hosting: YouTube

**AI Services:**
- Narrative analysis: Claude API (Anthropic)
- TTS: Multiple providers (ElevenLabs, Google TTS)
- Image generation: Runware, Pollinations

**Video Editing:**
- Likely using FFmpeg or similar for video assembly
- Custom rendering pipeline (not stored in database)

**Workflow Management:**
- Status-based state machine
- Asynchronous processing (Edge Functions or similar)
- Manual approval gates

---

## Conclusion

Gobbi's video production system is a **sophisticated multi-stage pipeline** that transforms benchmark YouTube videos into brand-aligned content through AI-powered narrative adaptation. The system is:

1. **Data-driven**: Every stage tracked in database
2. **Modular**: Clear separation of audio, video, and asset production
3. **AI-powered**: 3 specialized agents for content transformation
4. **Scalable**: 67 videos produced with consistent pipeline
5. **Professional**: 12-stage workflow with approval gates

**Next Steps for Implementation:**
1. ✅ Create missing tables (Phase 1)
2. ✅ Populate workflow configurations (Phase 2)
3. ⚠️ Implement outlier detection (Phase 3)
4. ⚠️ Build AI agent pipeline (Phase 4)
5. ⚠️ Create production pipeline (Phase 5)
6. ⚠️ Integrate publication system (Phase 6)

**Estimated Implementation Time:** 4-6 weeks for full pipeline

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-14  
**Contact:** Generated by Claude Code for automedia-platform
