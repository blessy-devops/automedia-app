# AutoMedia Platform - Information Architecture

**Document Version:** 1.0
**Created:** 2025-11-15
**Author:** Claude Code + Davi Luis
**Status:** Planning Document

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Model & User Journey](#business-model--user-journey)
3. [Platform Modules](#platform-modules)
4. [Information Hierarchy](#information-hierarchy)
5. [Navigation Strategy](#navigation-strategy)
6. [Data Relationships](#data-relationships)

---

## Executive Summary

AutoMedia is a **comprehensive YouTube content production platform** that combines market research (benchmarking), AI-powered content creation, and multi-channel distribution. The platform enables users to:

1. **Research** high-performing content on YouTube (Benchmark)
2. **Produce** AI-generated videos based on successful patterns (Production)
3. **Distribute** content across multiple owned channels (Distribution)
4. **Manage** brand identities and content strategies (Structure)

### Core Insight

The platform has **4 distinct operational domains** that need clear separation in the UI:

| Domain | Purpose | Key Tables | User Mental Model |
|--------|---------|------------|-------------------|
| **Benchmark** | Find what works | `benchmark_*` tables | "What should I make?" |
| **Production** | Create content | `production_*` tables | "What am I making?" |
| **Channels (Owned)** | Manage properties | `structure_accounts`, `structure_brand_bible` | "Where will I publish?" |
| **Settings & Config** | Platform setup | `structure_*` reference tables | "How does it work?" |

---

## Business Model & User Journey

### The Complete Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTOMEDIA BUSINESS WORKFLOW                       │
└─────────────────────────────────────────────────────────────────────┘

PHASE 1: MARKET RESEARCH (Benchmark Module)
├─ 1. Discover high-performing YouTube channels in target niches
├─ 2. Analyze videos to identify outliers (2x-10x performance)
├─ 3. Understand narrative patterns and content strategies
└─ 4. Select videos to model/clone

        ↓

PHASE 2: CONTENT STRATEGY (Channels Module)
├─ 1. Create brand identities (Brand Bibles)
├─ 2. Set up YouTube channels with brand guidelines
├─ 3. Define content strategy per channel (niche, style, voice)
└─ 4. Configure production workflows

        ↓

PHASE 3: PRODUCTION (Production Module)
├─ 1. AI analyzes source video narrative
├─ 2. AI adapts story to brand universe
├─ 3. AI generates script aligned with brand voice
├─ 4. TTS creates narration audio
├─ 5. AI generates covering images
├─ 6. Video editing assembles final product
└─ 7. Generate thumbnails and SEO metadata

        ↓

PHASE 4: DISTRIBUTION (Publishing)
├─ 1. Schedule video for posting slot
├─ 2. Upload to YouTube channel
├─ 3. Monitor performance metrics
└─ 4. Feed data back to benchmark (learning loop)
```

### User Personas & Needs

#### 1. Content Strategist
- **Needs:** Find trending topics, analyze competition, identify opportunities
- **Primary Modules:** Benchmark (Channels, Videos, Radar)
- **Key Actions:** Search channels, analyze outliers, add to radar

#### 2. Production Manager
- **Needs:** Oversee video creation pipeline, monitor production status
- **Primary Modules:** Production (Videos, Queue)
- **Key Actions:** Track progress, review scripts, approve final videos

#### 3. Channel Owner
- **Needs:** Manage channel identities, publishing schedules, brand consistency
- **Primary Modules:** Channels (Our Channels, Brand Bibles)
- **Key Actions:** Update brand guidelines, review channel performance, manage posting slots

#### 4. Platform Administrator
- **Needs:** Configure platform, manage API keys, set up workflows
- **Primary Modules:** Settings (API Keys, Workflows, Assets)
- **Key Actions:** Add credentials, configure integrations, manage templates

---

## Platform Modules

### Module 1: Dashboard

**Purpose:** High-level overview and quick access to key metrics

**What to Show:**
- Platform-wide KPIs
  - Total benchmark channels/videos tracked
  - Videos in production (by status)
  - Published videos (last 30 days)
  - Top performing owned channels
- Recent activity feed
  - New outliers detected
  - Videos published
  - Production milestones
- Quick actions
  - Start new benchmark search
  - Create new production video
  - View radar updates
- Health indicators
  - API quota usage
  - Production pipeline health
  - Scheduled posts (next 7 days)

**Navigation:** Top-level menu item (always visible)

---

### Module 2: Benchmark (Research & Discovery)

**Purpose:** Find and analyze high-performing YouTube content to model

#### Sub-section 2.1: Channels
**Route:** `/benchmark/channels`

**Purpose:** Discover and track YouTube channels by niche

**Data Source:** `benchmark_channels`, `benchmark_channels_baseline_stats`

**Key Features:**
- Search/filter by:
  - Niche/subniche/category
  - Subscriber count range
  - Verification status
  - Country/language
- Data table showing:
  - Channel name (with avatar)
  - Subscribers, total views, video count
  - Categorization (niche/subniche)
  - Baseline performance metrics
  - Actions: View details, Add to radar, Run enrichment
- Drill-down: Click channel → Channel detail page
  - Full channel analytics
  - Baseline statistics (14d/30d/90d/historical)
  - Videos from this channel (table)
  - Outlier videos highlighted
  - Add to radar button
  - Send to production (webhook integration)

#### Sub-section 2.2: Videos
**Route:** `/benchmark/videos`

**Purpose:** Browse and analyze individual high-performing videos

**Data Source:** `benchmark_videos`

**Key Features:**
- View toggle: Table | Gallery (thumbnails)
- Filter/sort by:
  - Views, likes, performance scores
  - Upload date range
  - Is outlier (yes/no)
  - Channel
  - Categorization
  - Has transcript (yes/no)
- Data table showing:
  - Thumbnail preview
  - Title, channel name
  - Views, likes, comments
  - Performance metrics (vs avg/median/14d/30d/90d)
  - Outlier badge
  - Upload date, video length
  - Actions: View details, Add to folder, Send to production
- Folder organization:
  - Sidebar with folder tree
  - Drag-and-drop to organize
  - Multi-select for batch operations
- Drill-down: Click video → Video detail page
  - Full video metadata
  - Embedded YouTube player
  - Performance metrics visualization
  - Related videos
  - Transcript (if available)
  - Narrative analysis (if exists)
  - Add to production button

#### Sub-section 2.3: New Benchmark
**Route:** `/benchmark/new`

**Purpose:** Start new benchmark search operations

**Data Source:** `keyword_searches`, `channel_enrichment_jobs`

**Key Features:**
- Search interface:
  - Keyword search with expansion
  - Channel ID direct input
  - Batch channel import (CSV/text)
- Search configuration:
  - Pages to process
  - Include related videos (yes/no)
  - Auto-categorize (yes/no)
  - Calculate baselines (yes/no)
- Progress monitoring:
  - Real-time job status
  - Channels processed/failed
  - Videos found/saved
  - Outliers detected
- Results:
  - Summary statistics
  - View discovered channels
  - View discovered videos
  - Add all to radar option

#### Sub-section 2.4: Radar
**Route:** `/benchmark/radar`

**Purpose:** Monitor tracked channels with automated daily updates

**Data Source:** `channel_radar`, `channel_radar_cron_log`

**Key Features:**
- Radar channels table:
  - Channel name, subscribers
  - Last update timestamp
  - Next update timestamp
  - Has 10x outlier (badge)
  - Update frequency (daily/weekly)
  - Status (active/paused)
  - Actions: View channel, Pause, Remove
- Radar controls:
  - Add channel to radar (search)
  - Bulk add from benchmark channels
  - Trigger manual update (all or selected)
  - Configure update schedule
- Cron job monitoring:
  - Last execution status
  - Channels processed/failed in last run
  - Execution logs (expandable)
  - Next scheduled run

---

### Module 3: Production (Content Creation)

**Purpose:** Manage AI-powered video production pipeline

#### Sub-section 3.1: Production Videos
**Route:** `/production/videos`

**Purpose:** Track all videos being produced or already published

**Data Source:** `production_videos`

**Key Features:**
- Status-based views (tabs):
  - All
  - In Progress (create_* statuses)
  - Pending Review
  - Scheduled
  - Published
  - Failed/On Hold
- Filter/sort by:
  - Status (12-stage workflow)
  - Channel (placeholder)
  - Planned upload date
  - Created date
  - Language
- Data table showing:
  - Thumbnail (if generated)
  - Title
  - Status (badge with color)
  - Target channel
  - Source benchmark video (link)
  - Progress indicator (which stage)
  - Created date, planned upload date
  - Actions: View details, Edit, Resume/Pause, Delete
- Drill-down: Click video → Production Video Detail Page
  - Complete video metadata
  - Production timeline (12 stages with timestamps)
  - Source benchmark video reference
  - Script viewer/editor
  - Audio segments (table with playback)
  - Video segments (table with preview)
  - Covering images gallery
  - SEO metadata (title, description, tags)
  - Thumbnail preview
  - Publishing configuration
  - Actions: Approve, Reject, Request changes, Publish now

#### Sub-section 3.2: Production Queue
**Route:** `/production/queue`

**Purpose:** Manage production workflow and monitor bottlenecks

**Data Source:** `production_videos`, `structure_api_queue`, `video_enrichment_queue`

**Key Features:**
- Pipeline visualization:
  - Kanban board by status
  - Drag to change status (if allowed)
  - Count per status
  - Bottleneck indicators
- Queue health:
  - API queue status (image generation, TTS, etc.)
  - Average processing time per stage
  - Failed jobs (with retry option)
  - Rate limit warnings
- Batch operations:
  - Bulk status change
  - Bulk retry failed
  - Bulk delete
- Filters:
  - By channel
  - By age (stuck for X days)
  - By priority

---

### Module 4: Channels (Owned Properties)

**Purpose:** Manage your YouTube channels, brand identities, and publishing

#### Sub-section 4.1: Our Channels
**Route:** `/channels`

**Purpose:** View and manage all owned YouTube channels

**Data Source:** `structure_accounts`, `structure_brand_bible`, `production_videos`

**Key Features:**
- Channels grid/table:
  - Channel name, avatar
  - Platform (YouTube/TikTok/Instagram)
  - Brand Bible (linked)
  - Niche/subniche
  - Status (active/inactive)
  - Posting frequency
  - Last published video date
  - Total videos published
  - Channel metrics (if synced):
    - Subscribers
    - Total views
    - Video count
    - Last updated timestamp
  - Actions: View details, Edit brand, View videos, Settings
- Quick filters:
  - Platform
  - Status (active/inactive)
  - Niche
- Drill-down: Click channel → Channel Detail Page
  - Full channel overview
  - Brand Bible summary (expandable)
  - Published videos (table filtered by this channel)
  - Scheduled videos (from posting queue)
  - Posting slots configuration
  - Channel credentials status
  - Channel analytics (if integrated):
    - Subscriber growth chart
    - Views over time
    - Top performing videos
  - Actions: Edit brand bible, Configure posting, Sync metrics

#### Sub-section 4.2: Brand Bibles
**Route:** `/channels/brand-bibles`

**Purpose:** Create and manage brand identities (strategy, voice, style)

**Data Source:** `structure_brand_bible`

**Key Features:**
- Brand Bibles table:
  - Brand name
  - Placeholder ID
  - Channels using this brand (count)
  - Last updated
  - Status (complete/draft)
  - Actions: View, Edit, Clone, Delete
- Create new Brand Bible wizard (multi-step form):
  - Step 1: Basic Info
    - Brand name, placeholder
  - Step 2: Audience
    - Target audience description (JSONB)
  - Step 3: Brand Context
    - Brand universe, world-building (JSONB)
  - Step 4: Visual Profile
    - Image style, color palette, typography (JSONB)
  - Step 5: Voice Profile
    - TTS voice settings, narration style (JSONB)
  - Step 6: Writing Style
    - Writing guidelines, tone, language patterns (JSONB)
  - Step 7: Host Profile (optional)
    - Host character definition (JSONB)
  - Step 8: Production Settings
    - Editing style, workflow profile
- Drill-down: Click brand → Brand Bible Detail/Edit Page
  - Form with all JSONB fields
  - Preview of how brand guidelines apply
  - List of channels using this brand
  - Save/Update actions

#### Sub-section 4.3: Published Videos
**Route:** `/channels/published-videos`

**Purpose:** Track performance of published videos across all channels

**Data Source:** `production_videos` (status=published), `distribution_posting_queue`

**Key Features:**
- Published videos table:
  - Thumbnail
  - Title
  - Channel
  - Publish date
  - Platform link (YouTube URL)
  - Views, likes, comments (if synced)
  - Performance vs channel average
  - Actions: View details, View on YouTube, Sync metrics
- Filter/sort by:
  - Channel
  - Date range
  - Platform
  - Performance (high/medium/low)
- Metrics sync:
  - Bulk sync metrics button
  - Last sync timestamp
  - Auto-sync configuration (daily)
- Drill-down: Click video → Same as Production Video Detail
  - Additional: Post-publish analytics section

---

### Module 5: Settings & Configuration

**Purpose:** Platform configuration, credentials, and reference data management

#### Sub-section 5.1: Platform Settings
**Route:** `/settings`

**Purpose:** General platform configuration

**Key Features:**
- Platform info
  - User profile
  - Timezone settings
  - Language preferences
- Integration status
  - Connected APIs (status indicators)
  - Webhooks configured
  - Supabase connection health
- System health
  - Database size
  - API quota usage
  - Last backup timestamp

#### Sub-section 5.2: API Keys & Credentials
**Route:** `/settings/api-keys`

**Purpose:** Manage API keys for external services

**Data Source:** `structure_api_keys_pool`, `structure_credentials`, `api_keys_metadata`

**Key Features:**
- API keys table:
  - Service provider (OpenRouter, ElevenLabs, Runware, etc.)
  - Account/label
  - Key preview (masked)
  - Status (active/inactive)
  - Usage tracking (if available)
  - Actions: Edit, Test, Delete
- Add new API key:
  - Provider selection (dropdown)
  - Account label
  - API key input (password field)
  - Test connection button
- Platform credentials (separate section):
  - YouTube credentials per channel
  - OAuth status
  - Refresh token health
  - Re-authenticate button

#### Sub-section 5.3: Workflows & Templates
**Route:** `/settings/workflows`

**Purpose:** Configure production workflows and AI prompts

**Data Source:** `structure_production_workflow`, `structure_prompt_templates`, `structure_workflow_pool`

**Key Features:**
- Production workflow profiles:
  - Profile name (biblical, history, health, etc.)
  - Workflow configuration (JSONB)
  - Is active toggle
  - Actions: View, Edit, Clone, Delete
- Prompt templates:
  - Template name
  - Prompt type (scriptwriter, analyzer, etc.)
  - System prompt (textarea)
  - User input template (textarea)
  - Output schema (JSON editor)
  - Actions: Edit, Test, Delete
- External workflows (N8N):
  - Workflow ID, name, type
  - Webhook URL
  - Status (active/inactive)

#### Sub-section 5.4: Assets Library
**Route:** `/settings/assets`

**Purpose:** Manage audio, visual, and video assets

**Data Source:** `structure_audio_assets`, `structure_visual_fx`, `structure_video_inserts`

**Key Features:**
- Tabs for asset types:
  - Audio (background music)
  - Visual FX (masks, effects)
  - Video Inserts (intro/outro clips)
- Asset grid/table:
  - Preview (audio player / image / video)
  - Asset name
  - Duration
  - Category/tags
  - File size
  - Status (active/inactive)
  - Actions: Preview, Edit, Download, Delete
- Upload new asset:
  - File upload (with preview)
  - Metadata form
  - Category/tags
  - Status toggle

#### Sub-section 5.5: Categorization & Reference Data
**Route:** `/settings/categorization`

**Purpose:** Manage reference data for content categorization

**Data Source:** `structure_categorization_niches/subniches/categories/formats`

**Key Features:**
- Tabs for each reference type:
  - Niches
  - Subniches
  - Categories
  - Formats
- Reference data table:
  - Name
  - Description
  - Is selected (for niches)
  - Status (active/inactive)
  - Actions: Edit, Delete
- Add new reference item:
  - Name, description
  - Parent (for subniches)
  - Is selected toggle

#### Sub-section 5.6: Posting Schedule
**Route:** `/settings/posting-schedule`

**Purpose:** Configure posting slots and channel assignments

**Data Source:** `structure_posting_slots`, `structure_platform_posting_config`

**Key Features:**
- Platform configuration:
  - Start/end time
  - Interval (minutes)
  - Total slots available
  - Save/Update
- Slot assignment grid:
  - Time (column headers: 6:00, 6:05, 6:10...)
  - Days of week (rows)
  - Cell shows: Channel placeholder (if assigned)
  - Click cell to assign/unassign channel
- Slot details:
  - Channel using this slot
  - Posting frequency
  - Last post timestamp
  - Next scheduled post
- Bulk operations:
  - Assign channel to multiple slots
  - Clear all slots for channel
  - Auto-assign (algorithm)

#### Sub-section 5.7: Webhooks
**Route:** `/settings/webhooks`

**Purpose:** Manage outbound webhooks for sending data to external systems

**Data Source:** `production_webhooks`, `webhook_logs`

**Key Features:**
- Webhooks table:
  - Name
  - Webhook URL
  - Description
  - Is active toggle
  - Last used timestamp
  - Actions: Test, Edit, View logs, Delete
- Add new webhook:
  - Name, description
  - Webhook URL
  - API key (optional)
  - Test connection
- Webhook logs:
  - Execution timestamp
  - Video count sent
  - Status (success/failed)
  - Response code
  - Error message (if failed)
  - Sent by (user)
  - Actions: View details, Retry

---

## Information Hierarchy

### Hierarchy Map

```
AutoMedia Platform
│
├── 🏠 Dashboard
│   └── (Overview page only - no sub-pages)
│
├── 🔍 Benchmark (Research & Discovery)
│   ├── Channels
│   │   └── Channel Detail [dynamic]
│   │       ├── Overview tab
│   │       ├── Videos tab
│   │       ├── Analytics tab
│   │       └── Baseline Stats tab
│   ├── Videos
│   │   └── Video Detail [dynamic]
│   │       ├── Overview tab
│   │       ├── Performance tab
│   │       ├── Transcript tab
│   │       └── Narrative Analysis tab (if exists)
│   ├── New Benchmark
│   │   └── (Single page with multi-step wizard)
│   └── Radar
│       ├── Channels tab
│       └── Cron Logs tab
│
├── 🎬 Production (Content Creation)
│   ├── Videos
│   │   └── Video Detail [dynamic]
│   │       ├── Overview tab
│   │       ├── Script tab
│   │       ├── Audio Segments tab
│   │       ├── Video Segments tab
│   │       ├── Assets tab
│   │       └── Publishing tab
│   └── Queue
│       ├── Pipeline View (Kanban)
│       ├── API Queue tab
│       └── Failed Jobs tab
│
├── 📺 Channels (Owned Properties)
│   ├── Our Channels
│   │   └── Channel Detail [dynamic]
│   │       ├── Overview tab
│   │       ├── Brand Bible tab
│   │       ├── Videos tab (published)
│   │       ├── Schedule tab (posting slots)
│   │       └── Analytics tab (if synced)
│   ├── Brand Bibles
│   │   ├── List view
│   │   └── Brand Bible Detail/Edit [dynamic]
│   │       └── (Multi-section form)
│   └── Published Videos
│       └── Video Detail [dynamic]
│           └── (Same as Production Video Detail + Analytics)
│
└── ⚙️ Settings & Configuration
    ├── Platform Settings
    ├── API Keys & Credentials
    ├── Workflows & Templates
    ├── Assets Library
    │   ├── Audio tab
    │   ├── Visual FX tab
    │   └── Video Inserts tab
    ├── Categorization
    │   ├── Niches tab
    │   ├── Subniches tab
    │   ├── Categories tab
    │   └── Formats tab
    ├── Posting Schedule
    └── Webhooks
```

---

## Navigation Strategy

### Recommended Approach: Hierarchical Sidebar with Collapsible Sections

**Why This Works:**
1. Clear separation of 4 main domains (Benchmark, Production, Channels, Settings)
2. Reduces cognitive load (users see only relevant sections)
3. Scales well (can add more sub-items without cluttering)
4. Matches user mental models (research → create → distribute → configure)

### Sidebar Structure (Proposed)

```
┌─────────────────────────────────────┐
│  🔴 Automídia                       │
├─────────────────────────────────────┤
│                                     │
│  🏠 Dashboard                       │
│                                     │
│  🔍 Benchmark              ▼        │  ← Collapsible section
│     • Channels                      │
│     • Videos                        │
│     • New Benchmark                 │
│     • Radar                         │
│                                     │
│  🎬 Production             ▼        │  ← Collapsible section
│     • Videos                        │
│     • Queue                         │
│                                     │
│  📺 Channels               ▼        │  ← Collapsible section
│     • Our Channels                  │
│     • Brand Bibles                  │
│     • Published Videos              │
│                                     │
│  ⚙️  Settings              ▼        │  ← Collapsible section
│     • Platform                      │
│     • API Keys                      │
│     • Workflows                     │
│     • Assets                        │
│     • Categorization                │
│     • Posting Schedule              │
│     • Webhooks                      │
│                                     │
├─────────────────────────────────────┤
│  🌙 Dark Mode                       │
└─────────────────────────────────────┘
```

### Alternative: Top Tabs + Sidebar (Hybrid)

For screens with multiple views (e.g., Assets Library, Categorization), use **top tabs** instead of separate sidebar items.

**Example: `/settings/assets` page**
```
Top bar:
  [Audio] [Visual FX] [Video Inserts]

Content:
  Asset grid/table for selected tab
```

This reduces sidebar clutter while maintaining clear navigation.

---

## Data Relationships

### Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CORE DATA RELATIONSHIPS                           │
└─────────────────────────────────────────────────────────────────────┘

BENCHMARK DOMAIN
benchmark_channels ──< benchmark_videos
       │                      │
       │                      ├──< narrative_analyses
       │                      │        │
       │                      │        └──< narrative_characters
       │                      │
       │                      └──< video_folder_items >── video_folders
       │
       └──< benchmark_channels_baseline_stats
       └──< channel_radar
       └──< channel_enrichment_tasks >── channel_enrichment_jobs


PRODUCTION DOMAIN
production_videos ──< production_audio_segments
       │          ──< production_concatenated_audios
       │          ──< production_covering_images
       │          ──< production_video_segments
       │          ──< production_video_editing_assets
       │
       ├── references ──> benchmark_videos (source)
       └── references ──> structure_accounts (target channel)


CHANNELS DOMAIN
structure_accounts ──< production_videos (published)
       │           ──< distribution_posting_queue
       │           ──< structure_credentials
       │           ──< structure_posting_slots
       │
       └──> structure_brand_bible (brand identity)


CONFIGURATION DOMAIN
structure_brand_bible ──< structure_accounts
structure_categorization_niches ──< structure_categorization_subniches
structure_api_keys_pool (used by API queue)
structure_workflow_pool (used by workflows)
```

### Key Foreign Key Relationships

| Parent Table | Child Table | Relationship Type | Business Logic |
|-------------|-------------|-------------------|----------------|
| `benchmark_videos` | `production_videos` | One-to-Many | One benchmark video can inspire multiple production videos |
| `benchmark_videos` | `narrative_analyses` | One-to-One | Each analyzed video has one narrative analysis |
| `benchmark_channels` | `benchmark_videos` | One-to-Many | Channel has many videos |
| `structure_brand_bible` | `structure_accounts` | One-to-Many | One brand can have multiple channels (YouTube, TikTok, etc.) |
| `structure_accounts` | `production_videos` | One-to-Many | Channel publishes many videos |
| `production_videos` | `production_audio_segments` | One-to-Many | Video has multiple audio segments |
| `production_videos` | `production_video_segments` | One-to-Many | Video has multiple video segments |
| `video_folders` | `video_folder_items` | One-to-Many | Folder contains many videos |
| `benchmark_videos` | `video_folder_items` | One-to-Many | Video can be in multiple folders |

---

## Conclusion

This information architecture provides:

1. **Clear domain separation** (Benchmark vs Production vs Channels vs Settings)
2. **Scalable navigation** (collapsible sections prevent clutter)
3. **Logical user journeys** (research → create → publish)
4. **Comprehensive coverage** (all 56 database tables mapped to UI)
5. **Future-proof structure** (can add new features without major refactoring)

**Next Steps:**
1. Review and approve this architecture
2. Create detailed screen specifications (wireframes/mockups)
3. Implement sidebar navigation structure
4. Build pages incrementally by priority

---

**Document End**
