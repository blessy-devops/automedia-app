# AutoMedia Platform - Screen Specifications

**Document Version:** 1.0
**Created:** 2025-11-15
**Author:** Claude Code + Davi Luis
**Purpose:** Detailed specifications for UI/UX designers and developers

---

## Table of Contents

1. [Dashboard](#1-dashboard)
2. [Benchmark Module](#2-benchmark-module)
3. [Production Module](#3-production-module)
4. [Channels Module](#4-channels-module)
5. [Settings Module](#5-settings-module)
6. [Shared Components](#6-shared-components)

---

## Design Principles

### Visual Language
- **Style:** Professional, data-driven, modern SaaS
- **Color Scheme:** Existing slate theme (shadcn/ui "new-york" preset)
- **Typography:** Inter/System UI fonts
- **Spacing:** Consistent 4px/8px/16px/24px grid
- **Cards:** border-2, hover:border-primary/50, hover:shadow-xl

### Component Library
- **Framework:** Next.js 15 + React 19
- **UI Components:** shadcn/ui (new-york style)
- **Icons:** Lucide React
- **Tables:** TanStack Table
- **Charts:** Recharts or Tremor
- **Data Display:** Professional SaaS aesthetic (like Vercel, Linear, Stripe dashboards)

### Data Visualization Priorities
1. **Clarity:** Numbers speak louder than charts
2. **Context:** Always show comparisons (vs average, vs previous period)
3. **Actionability:** Every metric should suggest an action
4. **Performance:** Server-side filtering, client-side search

---

## 1. Dashboard

### 1.1 Overview Page
**Route:** `/dashboard`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard                                          [Refresh Icon]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ Benchmark  │ │ Production │ │ Published  │ │ Channels   │  │
│  │ Channels   │ │ Videos     │ │ Videos     │ │ Active     │  │
│  │            │ │            │ │            │ │            │  │
│  │   1,247    │ │     23     │ │    156     │ │     8      │  │
│  │   +23 ↑    │ │   5 stuck  │ │  +12 30d   │ │            │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                  │
│  ┌──────────────────────────────┐ ┌─────────────────────────┐  │
│  │ Recent Activity              │ │ Top Outliers Today      │  │
│  │                              │ │                         │  │
│  │ • New outlier detected       │ │ 1. "African God..." 10x │  │
│  │   "African God..." (23m ago) │ │ 2. "Hidden Truth..." 8x │  │
│  │                              │ │ 3. "Mystery..." 5.2x    │  │
│  │ • Video published            │ │                         │  │
│  │   "O DEUS SUPREMO..." (1h)   │ │ [View All Outliers →]   │  │
│  │                              │ │                         │  │
│  │ • Radar update completed     │ │                         │  │
│  │   15 channels (3h ago)       │ │                         │  │
│  │                              │ │                         │  │
│  └──────────────────────────────┘ └─────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Production Pipeline Health                               │   │
│  │                                                          │   │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │   │
│  │ │Script│ │Audio │ │Images│ │Video │ │Review│ │Ready │  │   │
│  │ │  3   │ │  5   │ │  8   │ │  4   │ │  2   │ │  1   │  │   │
│  │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │   │
│  │                                                          │   │
│  │ ⚠️ Bottleneck: 8 videos stuck in image generation       │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────┐ ┌─────────────────────────┐  │
│  │ Quick Actions                │ │ Upcoming Posts (7 days) │  │
│  │                              │ │                         │  │
│  │ [+ New Benchmark Search]     │ │ Mon 18: Canal A (7:00)  │  │
│  │ [+ Create Production Video]  │ │ Mon 18: Canal B (12:30) │  │
│  │ [📊 View Radar Updates]      │ │ Tue 19: Canal A (7:00)  │  │
│  │                              │ │ Tue 19: Canal C (19:00) │  │
│  │                              │ │                         │  │
│  └──────────────────────────────┘ └─────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. Stat Cards (4x)**
- Component: `StatCard`
- Props: `{ title, value, change, changeType: 'positive' | 'negative' | 'neutral', icon }`
- Design: border, rounded, p-6, hover:shadow
- Change indicator: Arrow up/down with color (green=positive, red=negative)

**2. Activity Feed**
- Component: `ActivityFeed`
- Data source: Mixed (recent outliers, published videos, radar logs)
- Design: List with timestamps, icons, clickable items
- Max items: 10 most recent
- Real-time updates: Optional (Supabase Realtime)

**3. Outliers Widget**
- Component: `TopOutliersWidget`
- Data source: `benchmark_videos` WHERE `is_outlier = true` ORDER BY `performance_vs_median_historical` DESC LIMIT 5
- Design: Numbered list with performance score badges
- Click: Navigate to video detail page

**4. Pipeline Health Visualization**
- Component: `PipelineHealthChart`
- Data source: `production_videos` grouped by `status`
- Design: Horizontal bar chart or Kanban-style mini cards
- Bottleneck detection: Highlight status with most videos AND longest avg time
- Click: Navigate to Production Queue with filter

**5. Quick Actions**
- Component: `QuickActionButton`
- Design: Large buttons with icons
- Actions: Navigate to key pages

**6. Upcoming Posts Calendar**
- Component: `UpcomingPostsWidget`
- Data source: `distribution_posting_queue` WHERE `scheduled_datetime` BETWEEN NOW() AND NOW() + INTERVAL '7 days'
- Design: Simple list with date, channel, time
- Max items: 10

---

## 2. Benchmark Module

### 2.1 Benchmark Channels Page
**Route:** `/benchmark/channels`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Benchmark Channels                         [+ Add Channel] [⚙️] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filters: [Niche ▼] [Country ▼] [Subscribers ▼] [Verified ☐]   │
│  Sort by: [Subscribers ▼]                       🔍 Search...     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Channel Name      Subs    Views   Videos  Niche    Actions │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ 📺 Fireship      3.2M     180M     450    Tech     [...] │ │
│  │ 📺 Veritasium    14.5M    2.1B     310    Science  [...] │ │
│  │ 📺 MKBHD         18.1M    3.5B     1.8K   Tech     [...] │ │
│  │ ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Showing 1-50 of 1,247 channels    [Previous] [1] [2] [3] [Next]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. Data Table Toolbar**
- Component: `BenchmarkChannelsToolbar`
- Filters (Popovers):
  - Niche (multi-select from `structure_categorization_niches`)
  - Country (dropdown)
  - Subscribers (range slider: min/max)
  - Verified (checkbox)
- Sort (Dropdown):
  - Subscribers (default)
  - Total views
  - Video count
  - Recently added
- Search: Client-side filter by channel name
- Actions: Clear filters, Add to Radar (bulk)

**2. Data Table**
- Component: `BenchmarkChannelsTable` (TanStack Table)
- Columns:
  - Checkbox (select)
  - Avatar + Channel Name (clickable → detail page)
  - Subscribers (formatted: 3.2M)
  - Total Views (formatted: 180M)
  - Video Count (formatted: 450)
  - Niche Badge (categorization.niche)
  - Verification Badge (is_verified)
  - Actions Menu (Dropdown):
    - View Details
    - Add to Radar
    - Run Enrichment
    - Send to Production (webhook)
- Row actions: Click row → Channel detail page
- Pagination: Server-side (100 per page)
- Loading state: Skeleton rows

**3. Bulk Actions Bar** (appears when rows selected)
- Component: `BulkActionsBar`
- Position: Sticky bottom
- Actions:
  - Add X channels to Radar
  - Run enrichment on X channels
  - Export selected (CSV)
- Design: slide-up animation, bg-primary, text-primary-foreground

---

### 2.2 Channel Detail Page
**Route:** `/benchmark/channels/[id]`

#### Layout Structure (Tabs)
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Channels                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📺 Fireship                                    [⭐ Add to Radar]│
│  @fireship • 3.2M subscribers • ✓ Verified                      │
│                                                                  │
│  [Overview] [Videos] [Analytics] [Baseline Stats]               │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  OVERVIEW TAB:                                                   │
│                                                                  │
│  ┌─────────────────────┐ ┌─────────────────────┐               │
│  │ Channel Info        │ │ Categorization      │               │
│  │                     │ │                     │               │
│  │ Country: US         │ │ Niche: Technology   │               │
│  │ Joined: 2015-02-10  │ │ Subniche: Web Dev   │               │
│  │ Custom URL: Yes     │ │ Category: Tutorial  │               │
│  │                     │ │ Format: Screen Rec  │               │
│  └─────────────────────┘ └─────────────────────┘               │
│                                                                  │
│  Description:                                                    │
│  High-intensity ⚡ code tutorials and tech explainers...         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Quick Stats                                               │  │
│  │                                                           │  │
│  │ Total Views: 180,234,567    Videos: 450    Avg Views: 401K│  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Actions:                                                        │
│  [Run Full Enrichment] [Send to Production] [View on YouTube]   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tabs Detail

**Tab 1: Overview**
- Channel metadata (info cards)
- Categorization (badge pills)
- Description (expandable)
- Quick stats
- Action buttons

**Tab 2: Videos**
- Data table of videos from this channel
- Same as Benchmark Videos page, but filtered by `channel_id`
- Show outlier count badge

**Tab 3: Analytics**
- (Future) If metrics sync is implemented
- Subscriber growth chart
- Views over time
- Top performing videos

**Tab 4: Baseline Stats**
- Data from `benchmark_channels_baseline_stats`
- Show 14d, 30d, 90d, historical averages
- Comparison table:
  ```
  Period      Avg Views    Median Views    Std Dev
  14 days     450K         380K            120K
  30 days     420K         360K            130K
  90 days     401K         340K            140K
  Historical  385K         320K            150K
  ```
- Growth rate indicator (taxa_crescimento)

---

### 2.3 Benchmark Videos Page
**Route:** `/benchmark/videos`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Benchmark Videos                      [📁 Folders] [View: ▼] [⚙️]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filters: [Outliers Only ☐] [Performance ▼] [Date ▼] [Niche ▼] │
│  Sort by: [Views ▼]                            🔍 Search...      │
│                                                                  │
│  View Mode: [Table] [Gallery] ← Toggle                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TABLE VIEW:                                                │ │
│  │                                                            │ │
│  │ ☐ Thumbnail  Title           Channel   Views  Perf  Actn │ │
│  │ ───────────────────────────────────────────────────────── │ │
│  │ ☐ [img]      African God...  Seal     15K    10x   [...] │ │
│  │ ☐ [img]      Hidden Truth... Bible    23K    8.2x  [...] │ │
│  │ ☐ [img]      Mystery of...   History  8.5K   5.1x  [...] │ │
│  │ ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  OR                                                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ GALLERY VIEW:                                              │ │
│  │                                                            │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│  │  │ [thumb] │ │ [thumb] │ │ [thumb] │ │ [thumb] │         │ │
│  │  │ Title   │ │ Title   │ │ Title   │ │ Title   │         │ │
│  │  │ Channel │ │ Channel │ │ Channel │ │ Channel │         │ │
│  │  │ 15K • 10x│ │ 23K • 8x│ │ 8.5K • 5x│ │ 12K • 3x│         │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│  │  ...                                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Showing 1-50 of 26,483 videos    [Previous] [1] [2] [3] [Next] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. View Toggle**
- Component: `ViewToggle` (Table/Gallery)
- State: URL param `?view=table` or `?view=gallery`
- Icons: Table icon, Grid icon

**2. Folder Sidebar** (optional collapsible)
- Component: `VideoFolderTree`
- Data source: `video_folders` (hierarchical)
- Features:
  - Drag-and-drop videos into folders
  - Nested folders
  - Right-click context menu (rename, delete, new subfolder)
  - Badge showing video count per folder

**3. Table View**
- Component: `BenchmarkVideosTable`
- Columns:
  - Checkbox
  - Thumbnail (hover: show preview if available)
  - Title (truncated, tooltip on hover)
  - Channel Name (clickable → channel detail)
  - Views (formatted)
  - Performance Score (badge: 10x = gold, 5x = silver, 2x = bronze)
  - Outlier Badge (if is_outlier = true)
  - Upload Date (relative: "2 days ago")
  - Actions Menu:
    - View Details
    - Add to Folder
    - Send to Production
    - Copy YouTube URL
- Filters: Server-side via URL params
- Sort: Server-side

**4. Gallery View**
- Component: `BenchmarkVideosGallery`
- Grid: 4 columns (responsive: 1 col mobile, 2 tablet, 4 desktop)
- Card design:
  - Thumbnail (16:9 aspect ratio)
  - Title (2 lines max, ellipsis)
  - Channel name + avatar (small)
  - Views + Performance badge
  - Hover: Show actions overlay
    - Eye icon (View details)
    - Folder icon (Add to folder)
    - Send icon (Send to production)
- Click card: Navigate to video detail

**5. Bulk Actions Bar**
- Same as Benchmark Channels
- Actions:
  - Add X videos to folder
  - Send X videos to production
  - Export selected

---

### 2.4 Video Detail Page
**Route:** `/benchmark/videos/[id]`

#### Layout Structure (Tabs)
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Videos                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  The Original Religion? The African God Worshiped Above All!    │
│  by The Seal of the Bible • 15,772 views • 2 months ago         │
│                                                                  │
│  [Overview] [Performance] [Transcript] [Narrative Analysis]     │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  OVERVIEW TAB:                                                   │
│                                                                  │
│  ┌───────────────────────┐  ┌─────────────────────────────────┐│
│  │ YouTube Player        │  │ Video Info                      ││
│  │ (embedded)            │  │                                 ││
│  │                       │  │ Duration: 68 minutes            ││
│  │                       │  │ Upload Date: 2025-09-15         ││
│  │                       │  │ Video ID: QR9GhtZZUVQ           ││
│  │                       │  │                                 ││
│  │                       │  │ ⭐ Outlier: 10.2x performance   ││
│  │                       │  │                                 ││
│  │                       │  │ [Watch on YouTube →]            ││
│  └───────────────────────┘  └─────────────────────────────────┘│
│                                                                  │
│  Description:                                                    │
│  Discover the supreme African deity that history tried to       │
│  erase...                                                        │
│  [Show more]                                                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Metrics                                                   │  │
│  │                                                           │  │
│  │ Views: 15,772    Likes: 1,234    Comments: 89           │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Categorization                                            │  │
│  │                                                           │  │
│  │ [Technology] [Web Development] [Tutorial] [Screen Rec]   │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Actions:                                                        │
│  [📁 Add to Folder] [🚀 Send to Production] [🔗 Copy Link]      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tabs Detail

**Tab 1: Overview**
- Embedded YouTube player (iframe)
- Video metadata (duration, upload date, video ID)
- Outlier badge (if applicable)
- Description (expandable)
- Metrics (views, likes, comments)
- Categorization badges
- Action buttons

**Tab 2: Performance**
- Performance metrics visualization
- Data from `benchmark_videos`:
  - `performance_vs_avg_historical`
  - `performance_vs_median_historical`
  - `performance_vs_recent_14d`
  - `performance_vs_recent_30d`
  - `performance_vs_recent_90d`
  - `momentum_vs_14d`
- Visual: Comparison bars or radial charts
- Explanation: "This video performed 10.2x better than the channel's median video"

**Tab 3: Transcript**
- Data from `video_transcript` field
- Display: Scrollable text area with timestamps (if available)
- Features:
  - Search within transcript
  - Copy transcript
  - Download transcript (TXT)
- If no transcript: "Transcript not available"

**Tab 4: Narrative Analysis**
- Data from `narrative_analyses` table (if exists)
- Show:
  - Central Theme
  - Story Beats (timeline visualization)
  - Identified Structure (e.g., "Hero's Journey")
  - Conflict Type
  - Emotional Core
  - Characters (from `narrative_characters`)
- Visual: Story arc diagram
- If no analysis: "Narrative analysis not yet performed" + [Analyze Now] button

---

### 2.5 New Benchmark Page
**Route:** `/benchmark/new`

#### Layout Structure (Multi-Step Wizard)
```
┌─────────────────────────────────────────────────────────────────┐
│ New Benchmark Search                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1 of 3: Search Configuration                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  Search Method:                                                  │
│  ○ Keyword Search   ● Channel ID   ○ Batch Import               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Channel ID or Handle:                                      │ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │ UCuAXFkgsw1L7xaCfnd5JJOw                               │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │ Or enter @handle: @fireship                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Options:                                                        │
│  ☑ Auto-categorize with AI                                      │
│  ☑ Calculate baseline statistics                                │
│  ☑ Fetch recent videos (last 30 days)                           │
│  ☑ Fetch trending videos (sorted by views)                      │
│  ☐ Analyze narratives (requires transcripts)                    │
│                                                                  │
│                                    [Cancel] [Next: Configure →] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Steps

**Step 1: Search Configuration**
- Search method tabs:
  - Keyword Search (text input + keyword expansion options)
  - Channel ID (single channel input)
  - Batch Import (CSV upload or textarea with channel IDs)
- Options checkboxes:
  - Auto-categorize
  - Calculate baselines
  - Fetch recent videos
  - Fetch trending videos
  - Analyze narratives

**Step 2: Configuration**
- Pages to process (if keyword search): Slider 1-10
- Videos per channel: Slider 10-100
- Performance threshold (outlier detection): Slider 2x-10x
- Review configuration summary

**Step 3: Monitoring**
- Real-time progress monitoring
- Component: `EnrichmentProgressMonitor`
- Show:
  - Job ID
  - Status (pending/processing/completed/failed)
  - Channels processed / total
  - Current step (1/5 pipeline steps)
  - Estimated time remaining
  - Errors (expandable)
- WebSocket: Supabase Realtime on `channel_enrichment_tasks`
- Completion: Show summary + [View Results] button

---

### 2.6 Radar Page
**Route:** `/benchmark/radar`

#### Layout Structure (Tabs)
```
┌─────────────────────────────────────────────────────────────────┐
│ Channel Radar                        [+ Add Channel] [⚙️ Config]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Channels] [Cron Logs]                                         │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  CHANNELS TAB:                                                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Channel          Added    Last Update  Next    10x  Actions │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Fireship        3d ago    2h ago       22h     -    [...] │ │
│  │ Veritasium      1w ago    4h ago       20h     ⭐   [...] │ │
│  │ MKBHD           2w ago    1h ago       23h     ⭐   [...] │ │
│  │ ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Actions: [▶️ Update All Now] [⏸️ Pause All] [📊 View Outliers] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. Radar Channels Table**
- Component: `RadarChannelsTable`
- Data source: `channel_radar` JOIN `benchmark_channels`
- Columns:
  - Channel Name + Avatar (clickable → channel detail)
  - Added Date (relative)
  - Last Update (relative + status indicator: success/failed)
  - Next Update (relative countdown)
  - Has 10x Outlier Badge (⭐ if has_10x_outlier = true)
  - Update Frequency (daily/weekly)
  - Status (active/paused toggle)
  - Actions Menu:
    - View Channel
    - Update Now (manual trigger)
    - Pause/Resume
    - Remove from Radar
- Bulk actions:
  - Update all now
  - Pause/Resume selected
  - Remove selected

**2. Cron Logs Tab**
- Component: `RadarCronLogsTable`
- Data source: `channel_radar_cron_log`
- Columns:
  - Execution Start Time
  - Status (badge: running/completed/failed)
  - Channels Processed
  - Channels Failed
  - Duration
  - Error Message (expandable if failed)
  - Actions: View Details (expandable row with execution_details JSON)
- Sort: Newest first
- Pagination: Server-side

---

## 3. Production Module

### 3.1 Production Videos Page
**Route:** `/production/videos`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Production Videos                    [+ New Production] [⚙️]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status Filter (Tabs):                                          │
│  [All] [In Progress] [Pending Review] [Scheduled] [Published]   │
│                                                                  │
│  Filters: [Channel ▼] [Language ▼] [Date Range ▼]              │
│  Sort by: [Created Date ▼]                      🔍 Search...     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Thumb  Title         Status      Channel   Created  Actions │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ [img]  O DEUS...     Published   Canal A   2d ago   [...] │ │
│  │ [img]  Mystery...    create_audio Canal B   1w ago   [...] │ │
│  │ [img]  Hidden...     create_script Canal A  2w ago   [...] │ │
│  │ ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Showing 1-50 of 67 videos          [Previous] [1] [2] [Next]   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. Status Tabs**
- Component: `ProductionStatusTabs`
- Tabs with counts:
  - All (67)
  - In Progress (23)
  - Pending Review (5)
  - Scheduled (8)
  - Published (31)
- Active tab: Filter data table

**2. Production Videos Table**
- Component: `ProductionVideosTable`
- Columns:
  - Thumbnail (if generated, else placeholder)
  - Title (truncated, clickable → detail page)
  - Status Badge (color-coded by stage):
    - create_* stages: blue
    - review: yellow
    - approved/scheduled: green
    - published: green (filled)
    - failed: red
  - Target Channel (from `structure_accounts.placeholder`)
  - Source Benchmark Video (link icon, tooltip with title)
  - Progress Indicator (e.g., "Step 8/12")
  - Created Date (relative)
  - Planned Upload Date (if scheduled)
  - Actions Menu:
    - View Details
    - Edit
    - Resume/Pause
    - Delete
    - Download (if final video exists)
- Filters: Server-side
- Sort: Server-side

---

### 3.2 Production Video Detail Page
**Route:** `/production/videos/[id]`

#### Layout Structure (Tabs)
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Production Videos                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  O DEUS SUPREMO Africano que a História Tentou Apagar           │
│  Target Channel: Canal A • Status: Published • Created: 35d ago │
│                                                                  │
│  [Overview] [Script] [Audio] [Video] [Assets] [Publishing]      │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  OVERVIEW TAB:                                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Production Timeline (12 Stages)                           │  │
│  │                                                           │  │
│  │ ✅ create_title      ✅ create_audio    ✅ published      │  │
│  │ ✅ create_script     ✅ create_video                      │  │
│  │ ✅ create_cast       ✅ create_thumbnail                  │  │
│  │ ✅ create_outline    ✅ review_script                     │  │
│  │                                                           │  │
│  │ Total time: 35 days                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────┐  ┌─────────────────────────────────┐│
│  │ Source Benchmark      │  │ Production Details              ││
│  │                       │  │                                 ││
│  │ Title: African God... │  │ Language: Portuguese (BR)       ││
│  │ Channel: Seal Bible   │  │ Duration: 48 minutes            ││
│  │ Views: 15,772         │  │ Audio Segments: 12              ││
│  │ Perf: 10.2x           │  │ Video Segments: 5               ││
│  │                       │  │ Covering Images: 10             ││
│  │ [View Source →]       │  │                                 ││
│  └───────────────────────┘  └─────────────────────────────────┘│
│                                                                  │
│  Actions:                                                        │
│  [▶️ Resume Production] [📥 Download Video] [🗑️ Delete]         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tabs Detail

**Tab 1: Overview**
- Production timeline (visual progress indicator)
  - Component: `ProductionTimeline`
  - Show all 12 stages with checkmarks/timestamps
  - Highlight current stage if in progress
- Source benchmark video reference (card with link)
- Production details (metadata)
- Action buttons

**Tab 2: Script**
- Script viewer/editor
- Component: `ScriptEditor` (textarea or rich text editor)
- Show:
  - Full script (`production_videos.script`)
  - SSML script (if exists, toggle view)
  - Character count, estimated duration
- Actions:
  - Edit script (save to database)
  - Regenerate script (trigger AI)
  - Copy script
  - Download (TXT/PDF)

**Tab 3: Audio**
- Audio segments table
- Data source: `production_audio_segments`
- Columns:
  - Segment Number
  - Segment Text (truncated, expandable)
  - Duration (formatted)
  - Status (badge)
  - Audio Player (inline HTML5 audio)
  - Actions: Download, Regenerate
- Also show concatenated audios (from `production_concatenated_audios`)

**Tab 4: Video**
- Video segments table
- Data source: `production_video_segments`
- Columns:
  - Segment ID
  - Video Player (inline HTML5 video)
  - Status (badge)
  - Covering Images Used (count)
  - Duration
  - Actions: Download, Preview
- Final video (if exists):
  - Large video player
  - Download link
  - YouTube URL (if published)

**Tab 5: Assets**
- Covering images gallery
- Data source: `production_covering_images`
- Grid view with lightbox
- Show: image, generation prompt, AI model
- Video inserts (if used)
- Text overlays (if used)

**Tab 6: Publishing**
- Publishing configuration
- Show:
  - Title, description (editable)
  - Tags (editable chip input)
  - Thumbnail (preview + upload/regenerate)
  - Planned upload date (date picker)
  - Target channel
  - Platform (YouTube/TikTok/Instagram)
  - Privacy (public/unlisted/private)
- Actions:
  - Save changes
  - Schedule for posting
  - Publish now (manual)
  - Copy to clipboard (title/description)

---

### 3.3 Production Queue Page
**Route:** `/production/queue`

#### Layout Structure (Kanban Board)
```
┌─────────────────────────────────────────────────────────────────┐
│ Production Queue                              [Filters ▼] [⚙️]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ Script   │ │ Audio    │ │ Images   │ │ Video    │ │ Review ││
│  │ (3)      │ │ (5)      │ │ (8)      │ │ (4)      │ │ (2)    ││
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├────────┤│
│  │ [Card]   │ │ [Card]   │ │ [Card]   │ │ [Card]   │ │ [Card] ││
│  │ Video A  │ │ Video B  │ │ Video C  │ │ Video D  │ │ Video E││
│  │ 2h ago   │ │ 1d ago   │ │ 3d ago ⚠ │ │ 6h ago   │ │ 2d ago ││
│  │          │ │          │ │          │ │          │ │        ││
│  │ [Card]   │ │ [Card]   │ │ [Card]   │ │ ...      │ │ ...    ││
│  │ ...      │ │ ...      │ │ ...      │ │          │ │        ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                                  │
│  ⚠️ Bottleneck Alert: 8 videos stuck in "Images" for >24h       │
│  💡 Recommendation: Check API quota for image generation         │
│                                                                  │
│  [Tabs: Pipeline | API Queue | Failed Jobs]                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. Kanban Board**
- Component: `ProductionKanbanBoard`
- Columns: Group by `status`
  - create_script
  - create_audio_segments
  - create_covering_images
  - create_video_segments
  - review_script
  - (and others as needed)
- Cards:
  - Video title (truncated)
  - Target channel
  - Time in current status (relative)
  - Warning icon if stuck (>24h in same status)
  - Click: Navigate to video detail
- Drag-and-drop: Change status (with confirmation)
- Count per column (badge in column header)

**2. Bottleneck Detection**
- Component: `BottleneckAlert`
- Logic: Identify status with:
  - Highest count of videos
  - Longest average time in status
- Show alert with recommendation

**3. API Queue Tab**
- Component: `APIQueueTable`
- Data source: `structure_api_queue`
- Columns:
  - Workflow Name
  - API Provider (OpenRouter, Runware, etc.)
  - Asset (image, audio, etc.)
  - Status (pending/processing/completed/failed)
  - Created Date
  - Error Message (if failed)
  - Actions: Retry, Cancel
- Filters: Provider, Status
- Real-time updates: Optional

**4. Failed Jobs Tab**
- Component: `FailedJobsTable`
- Data source: `production_videos` WHERE `status = 'failed'`
- Columns:
  - Video Title
  - Failed Stage (status)
  - Error Message (from status tracking)
  - Failed Date
  - Retry Count
  - Actions: Retry, View Details, Delete
- Bulk action: Retry all selected

---

## 4. Channels Module

### 4.1 Our Channels Page
**Route:** `/channels`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Our Channels                              [+ Create Channel]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filters: [Platform ▼] [Status ▼] [Niche ▼]                    │
│  Sort by: [Subscribers ▼]                       🔍 Search...     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ 📺 Canal A                          ✓ Active          │ │ │
│  │  │ @canal_a_youtube • YouTube • 12.5K subscribers       │ │ │
│  │  │                                                       │ │ │
│  │  │ Niche: Biblical Stories • Brand: Bible Stories BR    │ │ │
│  │  │ Last Published: 2 days ago (O DEUS SUPREMO...)       │ │ │
│  │  │ Total Videos: 23                                      │ │ │
│  │  │                                                       │ │ │
│  │  │ [View Details] [Edit Brand] [View Videos] [Settings] │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ 📺 Canal B                          ✓ Active          │ │ │
│  │  │ ...                                                   │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ...                                                       │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Showing 8 active channels                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. Channel Cards** (List View)
- Component: `OwnedChannelCard`
- Data source: `structure_accounts` JOIN `structure_brand_bible`
- Card contents:
  - Channel name + avatar
  - Platform badge (YouTube/TikTok/Instagram)
  - Status indicator (active/inactive)
  - Subscribers (if synced)
  - Niche/subniche
  - Brand Bible name (link)
  - Last published video (title + date)
  - Total videos published
  - Actions: View Details, Edit Brand, View Videos, Settings
- Hover: Slight elevation
- Click card: Navigate to channel detail page

**2. Create Channel Wizard**
- Component: `CreateChannelWizard` (modal or new page)
- Steps:
  1. Platform selection (YouTube/TikTok/Instagram)
  2. Channel credentials (OAuth or manual)
  3. Basic info (name, placeholder ID, niche)
  4. Brand Bible (select existing or create new)
  5. Production workflow profile
  6. Posting schedule configuration
- Completion: Navigate to new channel detail page

---

### 4.2 Channel Detail Page
**Route:** `/channels/[id]`

#### Layout Structure (Tabs)
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Channels                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📺 Canal A                                    [Edit] [Settings] │
│  @canal_a_youtube • YouTube • ✓ Active • 12.5K subscribers      │
│                                                                  │
│  [Overview] [Brand Bible] [Videos] [Schedule] [Analytics]       │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  OVERVIEW TAB:                                                   │
│                                                                  │
│  ┌─────────────────────┐ ┌─────────────────────┐               │
│  │ Channel Info        │ │ Brand Bible         │               │
│  │                     │ │                     │               │
│  │ Platform: YouTube   │ │ Name: Bible BR      │               │
│  │ Niche: Biblical     │ │ [View Brand Bible →]│               │
│  │ Language: PT-BR     │ │                     │               │
│  │ Timezone: America/SP│ │ Voice: Masculine    │               │
│  │ Status: Active      │ │ Style: Dramatic     │               │
│  │                     │ │                     │               │
│  └─────────────────────┘ └─────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Quick Stats (synced 2 hours ago)        [🔄 Sync Now]    │  │
│  │                                                           │  │
│  │ Subscribers: 12,543 (+23 last 7d)                        │  │
│  │ Total Views: 1,234,567 (+5,432 last 7d)                  │  │
│  │ Videos Published: 23                                      │  │
│  │ Avg Views per Video: 53,677                              │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Recent Published Videos                                   │  │
│  │                                                           │  │
│  │ • O DEUS SUPREMO... (2 days ago, 1,234 views)            │  │
│  │ • Mystery of Africa... (5 days ago, 867 views)           │  │
│  │ • Hidden Truth... (1 week ago, 2,345 views)              │  │
│  │                                                           │  │
│  │ [View All Videos →]                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tabs Detail

**Tab 1: Overview**
- Channel info card
- Brand Bible summary card (with link)
- Quick stats (from YouTube API sync if implemented)
- Recent published videos list
- Actions: Edit, Sync Metrics

**Tab 2: Brand Bible**
- Embedded view of `structure_brand_bible` data
- Sections:
  - Audience Description
  - Brand Context
  - Visual Profile
  - Voice Profile
  - Writing Style Guide
  - Host Profile (if applicable)
- Each section: Expandable/collapsible
- Actions: Edit (navigate to Brand Bible edit page)

**Tab 3: Videos**
- Same as Production Videos page, filtered by this channel's placeholder
- Show only published videos (or include scheduled)
- Metrics columns (if synced from YouTube)

**Tab 4: Schedule**
- Posting slots configuration
- Data source: `structure_posting_slots` filtered by this channel
- Display: Calendar-style grid
  - Days of week (rows)
  - Time slots (columns: every 5 minutes from 6:00 to 22:00)
  - Filled cells: Show this channel's slot
  - Empty cells: Available slots
- Actions:
  - Assign new slot
  - Remove slot
  - View scheduled videos (from `distribution_posting_queue`)

**Tab 5: Analytics** (Future/Optional)
- If YouTube Analytics API is integrated
- Show:
  - Subscriber growth chart (line chart)
  - Views over time (line chart)
  - Top performing videos (bar chart)
  - Audience demographics
  - Traffic sources
- Time range selector: Last 7d / 30d / 90d / All time

---

### 4.3 Brand Bibles Page
**Route:** `/channels/brand-bibles`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Brand Bibles                              [+ Create New]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filters: [Status ▼] [Has Channels ▼]                          │
│  Sort by: [Recently Updated ▼]                 🔍 Search...      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ 📖 Bible Stories BR                   ✅ Complete     │ │ │
│  │  │ Placeholder: bible_br_001                            │ │ │
│  │  │                                                       │ │ │
│  │  │ Channels: 2 (Canal A, Canal B)                       │ │ │
│  │  │ Voice: Masculine, Dramatic                           │ │ │
│  │  │ Language: Portuguese (BR)                            │ │ │
│  │  │ Last Updated: 3 days ago                             │ │ │
│  │  │                                                       │ │ │
│  │  │ [View] [Edit] [Clone] [Delete]                       │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ...                                                       │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Showing 5 brand bibles                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. Brand Bible Cards**
- Component: `BrandBibleCard`
- Card contents:
  - Brand name
  - Placeholder ID
  - Status badge (complete/draft)
  - Channels using this brand (count + names)
  - Key attributes (voice, language, niche)
  - Last updated date
  - Actions: View, Edit, Clone, Delete
- Click card: Navigate to brand bible detail/edit page

**2. Create Brand Bible Wizard**
- Component: `CreateBrandBibleWizard` (multi-step form)
- Steps: (See Information Architecture doc for full breakdown)
  1. Basic Info
  2. Audience
  3. Brand Context
  4. Visual Profile
  5. Voice Profile
  6. Writing Style
  7. Host Profile (optional)
  8. Production Settings
- Each step: Form with JSONB field editors
- Completion: Navigate to new brand bible edit page

---

### 4.4 Brand Bible Detail/Edit Page
**Route:** `/channels/brand-bibles/[id]`

#### Layout Structure (Form Sections)
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Brand Bibles                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Editing: Bible Stories BR                      [Save] [Cancel] │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Basic Information                                         │  │
│  │                                                           │  │
│  │ Brand Name: [Bible Stories BR_________________]          │  │
│  │ Placeholder: [bible_br_001____________________]          │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Audience Description (JSONB)                              │  │
│  │                                                           │  │
│  │ Target Audience: [________________________________]       │  │
│  │ Age Range: [________________________________]             │  │
│  │ Interests: [________________________________]             │  │
│  │ ...                                                       │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Brand Context (JSONB)                                     │  │
│  │                                                           │  │
│  │ [Rich text editor or JSON editor]                        │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ... (More sections for each JSONB field)                       │
│                                                                  │
│  [Save Changes] [Cancel] [Delete Brand Bible]                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. JSONB Field Editors**
- Component: `JSONBFieldEditor`
- Options:
  - Form-based editor (recommended for structured JSONB)
    - Define schema for each JSONB field
    - Render form inputs based on schema
    - Validate before save
  - Raw JSON editor (Monaco Editor or similar)
    - For advanced users
    - Syntax highlighting
    - Validation
- Examples:
  - `audience_description`: Form with text inputs
  - `voice_profile`: Form with selects (gender, tone, speed)
  - `writing_style_guide`: Rich text editor or markdown

**2. Preview Mode** (Optional Enhancement)
- Component: `BrandBiblePreview`
- Show read-only formatted view of all brand bible data
- Toggle: Edit mode ↔ Preview mode

---

### 4.5 Published Videos Page
**Route:** `/channels/published-videos`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Published Videos                                 [Sync Metrics] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filters: [Channel ▼] [Date Range ▼] [Performance ▼]           │
│  Sort by: [Publish Date ▼]                      🔍 Search...     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Thumb  Title      Channel  Published  Views  Perf  Actions │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ [img]  O DEUS...  Canal A  2d ago     1.2K   2.3x  [...] │ │
│  │ [img]  Mystery... Canal B  5d ago     867    1.8x  [...] │ │
│  │ [img]  Hidden...  Canal A  1w ago     2.3K   4.1x  [...] │ │
│  │ ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Showing 1-50 of 156 videos         [Previous] [1] [2] [Next]   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. Published Videos Table**
- Component: `PublishedVideosTable`
- Data source: `production_videos` WHERE `status = 'published'`
- Columns:
  - Thumbnail
  - Title (clickable → video detail page)
  - Channel (from `structure_accounts`)
  - Publish Date (relative)
  - Platform Link (YouTube icon → opens in new tab)
  - Views (if synced from YouTube API)
  - Likes (if synced)
  - Performance vs Channel Avg (calculated if metrics synced)
  - Actions Menu:
    - View Details
    - View on YouTube
    - Sync Metrics (individual)
    - Delete

**2. Metrics Sync**
- Component: `MetricsSyncButton`
- Bulk sync: Trigger API call to YouTube Data API to update metrics for all published videos
- Individual sync: Per-video sync
- Last sync timestamp display
- Auto-sync configuration: Daily cron job (optional)

---

## 5. Settings Module

### 5.1 Platform Settings Page
**Route:** `/settings`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Platform Settings                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ User Profile                                              │  │
│  │                                                           │  │
│  │ Name: [Davi Luis____________________]                    │  │
│  │ Email: [davi@example.com___________]                     │  │
│  │ Avatar: [Upload____________] [Remove]                    │  │
│  │                                                           │  │
│  │ [Save Changes]                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Platform Preferences                                      │  │
│  │                                                           │  │
│  │ Timezone: [America/Sao_Paulo ▼]                          │  │
│  │ Language: [Portuguese (BR) ▼]                            │  │
│  │ Date Format: [DD/MM/YYYY ▼]                              │  │
│  │                                                           │  │
│  │ [Save Changes]                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ System Health                                             │  │
│  │                                                           │  │
│  │ Database Size: 1.2 GB                                     │  │
│  │ API Quota Usage: 45% (OpenRouter)                        │  │
│  │ Last Backup: 2 hours ago                                  │  │
│  │ Supabase Connection: ✅ Healthy                           │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5.2 API Keys Page
**Route:** `/settings/api-keys`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ API Keys & Credentials                          [+ Add API Key] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Service      Account    Key Preview   Status    Actions    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ OpenRouter   Main       sk-or-...     Active    [...] │ │
│  │ ElevenLabs   Primary    el_...        Active    [...] │ │
│  │ Runware      Free       rw_...        Active    [...] │ │
│  │ YouTube API  Prod        AIza...      Active    [...] │ │
│  │ ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Platform Credentials (OAuth)                              │  │
│  │                                                           │  │
│  │ YouTube API: ✅ Connected (expires in 45 days)            │  │
│  │ [Re-authenticate] [Disconnect]                            │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. API Keys Table**
- Component: `APIKeysTable`
- Data source: `structure_api_keys_pool` OR `api_keys_metadata`
- Columns:
  - Service Provider (OpenRouter, ElevenLabs, etc.)
  - Account/Label
  - Key Preview (masked: `sk-or-...`)
  - Status (active/inactive toggle)
  - Usage (if available via provider API)
  - Actions Menu:
    - Test Connection
    - Edit
    - Delete
- Actions: Add New API Key (modal form)

**2. Add API Key Modal**
- Component: `AddAPIKeyModal`
- Form fields:
  - Provider (dropdown: OpenRouter, ElevenLabs, Runware, Google Cloud, etc.)
  - Account Label (text input)
  - API Key (password input)
  - Test Connection (button)
- Validation: Test API key before saving
- Save: Store in `structure_api_keys_pool` or Supabase Vault

**3. Platform Credentials Section**
- Component: `PlatformCredentials`
- Show OAuth connection status for:
  - YouTube API (for uploading videos)
  - Other platforms (TikTok, Instagram) if supported
- Actions:
  - Authenticate (OAuth flow)
  - Re-authenticate (refresh token)
  - Disconnect

---

### 5.3 Workflows Page
**Route:** `/settings/workflows`

#### Layout Structure (Tabs)
```
┌─────────────────────────────────────────────────────────────────┐
│ Workflows & Templates                    [+ New Workflow]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Production Workflows] [Prompt Templates] [External Workflows] │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  PRODUCTION WORKFLOWS TAB:                                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Profile      Active   Description              Actions     │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ biblical     ✅        Biblical content flow    [...]     │ │
│  │ history      ✅        History videos           [...]     │ │
│  │ health       ❌        Health/wellness          [...]     │ │
│  │ ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tabs Detail

**Tab 1: Production Workflows**
- Component: `ProductionWorkflowsTable`
- Data source: `structure_production_workflow`
- Columns:
  - Profile name
  - Is active toggle
  - Description
  - Workflow configuration (JSONB, preview)
  - Actions: Edit, Clone, Delete
- Edit: Modal or dedicated page with JSONB editor

**Tab 2: Prompt Templates**
- Component: `PromptTemplatesTable`
- Data source: `structure_prompt_templates`
- Columns:
  - Template name
  - Prompt type (scriptwriter, analyzer, etc.)
  - Description
  - Actions: Edit, Test, Delete
- Edit: Modal with form
  - System Prompt (textarea)
  - User Input Template (textarea)
  - Output Schema (JSON editor)
  - Test button (sends to OpenRouter API with sample data)

**Tab 3: External Workflows**
- Component: `ExternalWorkflowsTable`
- Data source: `structure_workflow_pool`
- Columns:
  - Workflow ID
  - Workflow name
  - Workflow type (N8N, Zapier, etc.)
  - Webhook URL
  - Is active toggle
  - Actions: Edit, Test, Delete
- Use case: N8N workflow integrations

---

### 5.4 Assets Library Page
**Route:** `/settings/assets`

#### Layout Structure (Tabs)
```
┌─────────────────────────────────────────────────────────────────┐
│ Assets Library                                   [+ Upload]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Audio] [Visual FX] [Video Inserts]                            │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  AUDIO TAB:                                                      │
│                                                                  │
│  Filters: [Genre ▼] [Mood ▼] [Active Only ☐]                   │
│  Sort by: [Name ▼]                               🔍 Search...    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ 🎵 Epic Cinematic Trailer                            │ │ │
│  │  │ Duration: 2:34 • Genre: Cinematic • Mood: Epic       │ │ │
│  │  │ BPM: 128 • Active: ✅                                 │ │ │
│  │  │                                                       │ │ │
│  │  │ [🔊 Play] [⬇ Download] [Edit] [Delete]               │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ...                                                       │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tabs Detail

**Tab 1: Audio**
- Component: `AudioAssetsGrid`
- Data source: `structure_audio_assets`
- Grid/List view toggle
- Card contents:
  - Soundtrack name
  - Audio player (HTML5 audio)
  - Duration, genre, mood, BPM
  - Is active toggle
  - File URL
  - Actions: Play, Download, Edit, Delete
- Upload: Modal with file upload + metadata form

**Tab 2: Visual FX**
- Component: `VisualFXGrid`
- Data source: `structure_visual_fx`
- Grid view (thumbnails)
- Card contents:
  - Effect preview (image or video)
  - Effect name, type, category
  - Duration, resolution
  - Has alpha channel indicator
  - Tags (chip pills)
  - Actions: Preview (lightbox), Download, Edit, Delete
- Upload: Modal with file upload + metadata form

**Tab 3: Video Inserts**
- Component: `VideoInsertsGrid`
- Data source: `structure_video_inserts`
- Grid view
- Card contents:
  - Video preview (thumbnail + play on hover)
  - Insert name
  - Duration
  - Insert category (intro/outro/CTA/ad)
  - Target channel (if specific)
  - Is active toggle
  - Actions: Preview, Edit, Delete
- Upload: Modal with file upload + metadata form

---

### 5.5 Categorization Page
**Route:** `/settings/categorization`

#### Layout Structure (Tabs)
```
┌─────────────────────────────────────────────────────────────────┐
│ Categorization Reference Data               [+ Add New]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Niches] [Subniches] [Categories] [Formats]                    │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  NICHES TAB:                                                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Name         Description           Selected  Actions       │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Technology   Tech tutorials        ✅         [...]        │ │
│  │ Health       Health & wellness     ✅         [...]        │ │
│  │ Finance      Money & investing     ❌         [...]        │ │
│  │ ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  💡 Tip: "Selected" niches are monitored in benchmark searches  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tabs Detail

**Tab 1: Niches**
- Component: `NichesTable`
- Data source: `structure_categorization_niches`
- Columns:
  - Name
  - Description
  - Is Selected (checkbox toggle)
  - Actions: Edit, Delete
- Add New: Inline form or modal

**Tab 2: Subniches**
- Component: `SubnichesTable`
- Data source: `structure_categorization_subniches`
- Columns:
  - Name
  - Description
  - Parent Niche (dropdown)
  - Actions: Edit, Delete

**Tab 3: Categories**
- Component: `CategoriesTable`
- Data source: `structure_categorization_categories`
- Same structure as Niches (no parent relationship)

**Tab 4: Formats**
- Component: `FormatsTable`
- Data source: `structure_categorization_formats`
- Same structure as Categories

---

### 5.6 Posting Schedule Page
**Route:** `/settings/posting-schedule`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Posting Schedule Configuration                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Platform Configuration                                    │  │
│  │                                                           │  │
│  │ Platform: [YouTube ▼]                                    │  │
│  │ Start Time: [06:00____]  End Time: [22:00____]           │  │
│  │ Interval (minutes): [5_____]                             │  │
│  │ Total Slots: 192 (calculated)                            │  │
│  │                                                           │  │
│  │ [Save Configuration]                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Slot Assignment Grid                                      │  │
│  │                                                           │  │
│  │ Time →  06:00  06:05  06:10  06:15  ... 21:55  22:00     │  │
│  │ ───────────────────────────────────────────────────────  │  │
│  │ Mon     [A]    [B]    [ ]    [ ]    ...  [A]    [ ]      │  │
│  │ Tue     [A]    [B]    [ ]    [C]    ...  [A]    [ ]      │  │
│  │ Wed     [A]    [B]    [ ]    [ ]    ...  [ ]    [ ]      │  │
│  │ ...                                                       │  │
│  │                                                           │  │
│  │ Legend: [A]=Canal A, [B]=Canal B, [C]=Canal C            │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Assign Slot                                               │  │
│  │                                                           │  │
│  │ Channel: [Canal A ▼]                                     │  │
│  │ Day: [Monday ▼]                                           │  │
│  │ Time: [07:00 ▼]                                           │  │
│  │                                                           │  │
│  │ [Assign Slot] [Clear All Slots for Channel]              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. Platform Config Form**
- Component: `PostingScheduleConfigForm`
- Data source: `structure_platform_posting_config`
- Form fields:
  - Platform (dropdown: YouTube, TikTok, Instagram)
  - Start time (time picker)
  - End time (time picker)
  - Interval minutes (number input)
  - Total slots (calculated, read-only)
- Save: Update database, recalculate slots

**2. Slot Assignment Grid**
- Component: `SlotAssignmentGrid`
- Data source: `structure_posting_slots`
- Visual: Table/grid
  - Columns: Time slots (06:00, 06:05, 06:10, ...)
  - Rows: Days of week (Mon, Tue, Wed, ...)
  - Cells: Show channel placeholder letter (e.g., "A", "B", "C")
    - Tooltip on hover: Full channel name + scheduled video (if exists)
    - Click cell: Open assign/unassign modal
- Color code: Different color per channel

**3. Assign Slot Form**
- Component: `AssignSlotForm`
- Form fields:
  - Channel (dropdown: list of active channels)
  - Day (dropdown: Mon-Sun or "All Days")
  - Time (dropdown: available time slots)
  - Frequency (optional: weekly, daily)
- Actions:
  - Assign Slot: Insert into `structure_posting_slots`
  - Clear All: Delete all slots for selected channel

---

### 5.7 Webhooks Page
**Route:** `/settings/webhooks`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Webhooks                                         [+ Add Webhook]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Name              URL                Active  Last Used  [...] │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ receive-videos    https://gobbi... ✅      2h ago     [...] │
│  │ send-to-n8n       https://n8n...   ✅      Never      [...] │
│  │ ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Webhook Logs (Last 50)                                    │  │
│  │                                                           │  │
│  │ Timestamp          Webhook      Videos  Status  Actions  │  │
│  │ ──────────────────────────────────────────────────────── │  │
│  │ 2h ago             receive-vids  12     ✅       [View]  │  │
│  │ 1d ago             receive-vids  5      ✅       [View]  │  │
│  │ 3d ago             send-to-n8n   8      ❌       [Retry] │  │
│  │ ...                                                       │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Components Needed

**1. Webhooks Table**
- Component: `WebhooksTable`
- Data source: `production_webhooks`
- Columns:
  - Name
  - Webhook URL (truncated, tooltip shows full)
  - Description
  - Is Active (toggle)
  - API Key Status (if exists: "Set", else "None")
  - Last Used (from `webhook_logs`)
  - Actions Menu:
    - Edit
    - Test Webhook (send sample payload)
    - View Logs
    - Delete

**2. Add/Edit Webhook Modal**
- Component: `WebhookFormModal`
- Form fields:
  - Name (text input)
  - Webhook URL (text input, validated)
  - Description (textarea)
  - API Key (password input, optional)
  - Is Active (checkbox)
  - Test Connection (button)
- Save: Insert/update `production_webhooks`

**3. Webhook Logs Table**
- Component: `WebhookLogsTable`
- Data source: `webhook_logs`
- Columns:
  - Sent At (timestamp)
  - Webhook Name (from `production_webhooks`)
  - Video Count
  - Status (success/failed/partial)
  - Response Code
  - Error Message (if failed, expandable)
  - Actions: View Details (modal with full request/response), Retry
- Filters: Webhook, Status, Date Range
- Pagination: Server-side

---

## 6. Shared Components

### 6.1 Common Components

**1. StatCard**
```tsx
interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: string | number
    type: 'positive' | 'negative' | 'neutral'
  }
  icon?: React.ComponentType
  variant?: 'default' | 'success' | 'warning' | 'danger'
}
```

**2. DataTable** (TanStack Table wrapper)
```tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  pagination?: {
    pageIndex: number
    pageSize: number
    pageCount: number
    onPageChange: (page: number) => void
  }
  sorting?: {
    sortBy: string
    sortOrder: 'asc' | 'desc'
    onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  }
  filters?: React.ReactNode // Toolbar component
  loading?: boolean
  onRowClick?: (row: T) => void
}
```

**3. PerformanceBadge**
```tsx
interface PerformanceBadgeProps {
  score: number // e.g., 10.2 for "10.2x"
  threshold?: 'high' | 'medium' | 'low' // determines color
}

// Visual:
// 10x+ = gold background
// 5x-10x = silver background
// 2x-5x = bronze background
// <2x = gray background
```

**4. StatusBadge**
```tsx
interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

// Maps production statuses to colors:
// create_* = blue (in progress)
// review_* = yellow (needs attention)
// approved/scheduled = green (ready)
// published = green filled (done)
// failed = red
```

**5. ActivityFeed**
```tsx
interface Activity {
  id: string
  type: 'outlier_detected' | 'video_published' | 'radar_update' | 'production_started'
  title: string
  description?: string
  timestamp: Date
  link?: string
  icon?: React.ComponentType
}

interface ActivityFeedProps {
  activities: Activity[]
  maxItems?: number
  onItemClick?: (activity: Activity) => void
}
```

---

## Design Tokens

### Colors (shadcn/ui slate theme)

```css
/* Primary colors */
--primary: 222.2 47.4% 11.2%       /* Slate 950 */
--primary-foreground: 210 40% 98%  /* Slate 50 */

/* Performance badge colors */
--perf-gold: 45 93% 47%            /* Amber 500 */
--perf-silver: 240 5% 64.9%        /* Slate 400 */
--perf-bronze: 25 75% 47%          /* Orange 600 */

/* Status colors */
--status-success: 142 76% 36%      /* Green 600 */
--status-warning: 38 92% 50%       /* Amber 500 */
--status-danger: 0 84% 60%         /* Red 500 */
--status-info: 221 83% 53%         /* Blue 500 */
--status-in-progress: 217 91% 60%  /* Blue 400 */
```

### Typography

```css
/* Font families */
--font-sans: 'Inter', system-ui, sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', monospace

/* Font sizes */
--text-xs: 0.75rem     /* 12px */
--text-sm: 0.875rem    /* 14px */
--text-base: 1rem      /* 16px */
--text-lg: 1.125rem    /* 18px */
--text-xl: 1.25rem     /* 20px */
--text-2xl: 1.5rem     /* 24px */
--text-3xl: 1.875rem   /* 30px */
```

### Spacing

```css
/* Spacing scale (4px base) */
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-12: 3rem     /* 48px */
```

---

## Responsive Breakpoints

```css
/* Mobile first */
--breakpoint-sm: 640px   /* Tablet */
--breakpoint-md: 768px   /* Small desktop */
--breakpoint-lg: 1024px  /* Desktop */
--breakpoint-xl: 1280px  /* Large desktop */
--breakpoint-2xl: 1536px /* Extra large */
```

### Responsive Behavior

- **Mobile (<640px):**
  - Sidebar: Hamburger menu (full-screen overlay)
  - Tables: Horizontal scroll
  - Gallery: 1 column
  - Stats: Stack vertically

- **Tablet (640px-1024px):**
  - Sidebar: Collapsible (icon-only mode)
  - Tables: Horizontal scroll (some columns hidden)
  - Gallery: 2 columns
  - Stats: 2 columns

- **Desktop (>1024px):**
  - Sidebar: Always visible, collapsible sections
  - Tables: Full width, all columns visible
  - Gallery: 4 columns
  - Stats: 4 columns horizontal

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**1. Color Contrast**
- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

**2. Keyboard Navigation**
- All interactive elements focusable via Tab
- Modal trapping (Esc to close)
- Skip links for main content

**3. Screen Readers**
- ARIA labels for icons without text
- ARIA live regions for real-time updates (e.g., progress monitors)
- Semantic HTML (headings, landmarks)

**4. Focus Indicators**
- Visible focus ring on all interactive elements
- High contrast focus indicator (not just outline)

---

## Summary

This document provides comprehensive specifications for all screens in the AutoMedia platform. Key takeaways:

1. **56 database tables** mapped to **~30 unique pages/screens**
2. **4 main modules:** Benchmark, Production, Channels, Settings
3. **Hierarchical sidebar** with collapsible sections for scalability
4. **Data-driven UI:** Server-side filtering, client-side search, real-time updates
5. **Professional SaaS aesthetic:** shadcn/ui components, consistent spacing, clear typography
6. **Accessibility first:** WCAG 2.1 AA compliance, keyboard navigation, screen reader support

---

**Next Steps:**
1. Review and approve specifications
2. Create wireframes/mockups for priority pages (Dashboard, Benchmark Videos, Production Videos)
3. Implement shared components library
4. Build pages incrementally by priority (see Implementation Roadmap)

---

**Document End**
