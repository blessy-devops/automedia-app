# Supabase Edge Functions - Enrichment Pipeline

This directory contains the Deno-based Edge Functions that power the AutoMedia enrichment pipeline.

## Pipeline Overview

The enrichment pipeline consists of **5 sequential steps** that enrich YouTube channel data with AI categorization, baseline statistics, video data, and performance analysis.

### Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENRICHMENT PIPELINE (5 Steps)                │
└─────────────────────────────────────────────────────────────────┘

1. enrichment-pipeline-starter
   ├─ Fetches channel details from RapidAPI YouTube v3 API
   ├─ Writes to: benchmark_channels
   ├─ Updates: Creates channel_enrichment_tasks record
   └─ Invokes: enrichment-step-1-categorization

2. enrichment-step-1-categorization
   ├─ AI categorization with Claude 3.5 Sonnet (via OpenRouter)
   ├─ Writes categorization JSONB to benchmark_channels
   ├─ Updates: categorization_status = 'completed'
   └─ Invokes: enrichment-step-2-socialblade

3. enrichment-step-2-socialblade
   ├─ Scrapes SocialBlade for 14d/30d/90d metrics
   ├─ Calculates baseline statistics (avg views, growth rate, etc.)
   ├─ Writes to: benchmark_channels_baseline_stats
   ├─ Updates: socialblade_status = 'completed'
   └─ Invokes: enrichment-step-3-recent-videos

4. enrichment-step-3-recent-videos
   ├─ Fetches recent videos from YouTube API (sorted by upload date)
   ├─ Applies Unicode sanitization to titles/descriptions/tags
   ├─ Writes to: benchmark_videos
   ├─ Updates: recent_videos_status = 'completed'
   └─ Invokes: enrichment-step-4-trending-videos

5. enrichment-step-4-trending-videos
   ├─ Fetches popular videos from YouTube API (sorted by views)
   ├─ Applies Unicode sanitization to titles/descriptions/tags
   ├─ Writes to: benchmark_videos
   ├─ Updates: trending_videos_status = 'completed'
   └─ Invokes: enrichment-step-5-outlier-calc

6. enrichment-step-5-outlier-calc
   ├─ Reads baseline stats from benchmark_channels_baseline_stats
   ├─ Calculates performance metrics for all videos:
   │  - video_age_days
   │  - views_per_day
   │  - performance_vs_avg_historical
   │  - performance_vs_median_historical
   │  - performance_vs_recent_14d
   ├─ Identifies outlier videos (5x+ better than median)
   ├─ Updates: outlier_analysis_status = 'completed'
   └─ Marks: overall_status = 'completed'
```

## Function Descriptions

### enrichment-pipeline-starter
**Purpose:** Initializes the enrichment pipeline by fetching basic channel data from YouTube.

**External APIs:**
- RapidAPI YouTube v3 API (channel details endpoint)

**Database Operations:**
- UPSERT to `benchmark_channels`
- Creates record in `channel_enrichment_tasks`

**Status Field:** N/A (starter function)

---

### enrichment-step-1-categorization
**Purpose:** AI-powered categorization of channel content into niche, subniche, microniche, category, and format.

**External APIs:**
- OpenRouter API (Claude 3.5 Sonnet)

**Database Operations:**
- UPDATE `benchmark_channels.categorization` (JSONB field)
- UPDATE `channel_enrichment_tasks.categorization_status`

**Status Field:** `categorization_status`

**Categorization Schema:**
```json
{
  "niche": "technology",
  "subniche": "web_development",
  "microniche": "fast_paced_tutorials",
  "category": "tutorial",
  "format": "screen_recording"
}
```

---

### enrichment-step-2-socialblade
**Purpose:** Scrapes SocialBlade metrics and calculates baseline performance statistics.

**External APIs:**
- SocialBlade website (web scraping via Cheerio)

**Database Operations:**
- UPSERT to `benchmark_channels_baseline_stats`
- UPDATE `channel_enrichment_tasks.socialblade_status`

**Status Field:** `socialblade_status`

**Metrics Calculated:**
- `total_views_14d` - Total views in last 14 days
- `videos_count_14d` - Videos published in 14 days
- `avg_views_per_video_14d` - Average views per video (14d)
- `media_diaria_views_14d` - Daily average views
- `taxa_crescimento` - Growth rate (comparing first 7d vs last 7d)

**Important:** This step calculates baseline statistics that are later used by Step 5 (outlier-calc).

---

### enrichment-step-3-recent-videos
**Purpose:** Fetches recent videos from YouTube API sorted by upload date.

**External APIs:**
- RapidAPI YouTube v3 API (videos by channel endpoint, sort=newest)

**Database Operations:**
- UPSERT to `benchmark_videos` (batch operation)
- UPDATE `channel_enrichment_tasks.recent_videos_status`

**Status Field:** `recent_videos_status`

**Data Sanitization:**
- Unicode surrogate removal from titles
- Unicode surrogate removal from descriptions
- JSONB-safe tags array cleaning

**Fields Populated:**
- `youtube_video_id`, `channel_id`, `title`, `description`
- `views`, `upload_date`, `video_length`, `thumbnail_url`, `tags`

---

### enrichment-step-4-trending-videos
**Purpose:** Fetches popular videos from YouTube API sorted by view count.

**External APIs:**
- RapidAPI YouTube v3 API (videos by channel endpoint, sort=popular)

**Database Operations:**
- UPSERT to `benchmark_videos` (batch operation)
- UPDATE `channel_enrichment_tasks.trending_videos_status`

**Status Field:** `trending_videos_status`

**Data Sanitization:** Same as step-3-recent-videos

**Note:** This step fetches different videos than step 3, ensuring comprehensive coverage of both recent and popular content.

---

### enrichment-step-5-outlier-calc
**Purpose:** Calculates performance metrics for all videos and identifies statistical outliers.

**External APIs:** None (pure database operations)

**Database Operations:**
- READ from `benchmark_channels_baseline_stats`
- READ from `benchmark_channels`
- READ from `benchmark_videos`
- UPDATE `benchmark_videos` with calculated metrics (batch)
- UPDATE `channel_enrichment_tasks.outlier_analysis_status`
- UPDATE `channel_enrichment_tasks.overall_status = 'completed'`

**Status Field:** `outlier_analysis_status`

**Metrics Calculated Per Video:**
1. `video_age_days` - Days since upload
2. `views_per_day` - Average daily views (views / video_age_days)
3. `performance_vs_avg_historical` - Video views / channel's historical average
4. `performance_vs_median_historical` - Video views / channel's median views
5. `performance_vs_recent_14d` - Video's views_per_day / channel's 14d daily average

**Outlier Detection:**
- Video is marked as outlier if `performance_vs_median_historical >= 5.0`
- This means the video performs 5x or better than the channel's median

**Dependencies:**
- Requires `benchmark_channels_baseline_stats` to be populated (by step 2)
- Requires videos to exist in `benchmark_videos` (from steps 3-4)

---

## Status Tracking

Each enrichment task tracks its progress in the `channel_enrichment_tasks` table with the following status fields:

- `categorization_status` - Step 1 status
- `socialblade_status` - Step 2 status
- `recent_videos_status` - Step 3 status
- `trending_videos_status` - Step 4 status
- `outlier_analysis_status` - Step 5 status
- `overall_status` - Overall pipeline status

**Possible Status Values:**
- `pending` - Not yet started
- `processing` - Currently running
- `completed` - Successfully finished
- `failed` - Error occurred

## Real-time Monitoring

The frontend uses Supabase Realtime to monitor progress:

```typescript
const channel = supabase
  .channel(`task-${taskId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'channel_enrichment_tasks',
      filter: `id=eq.${taskId}`,
    },
    (payload) => {
      // Update UI with new status
    }
  )
  .subscribe()
```

## Deployment

Deploy individual functions:
```bash
npx supabase functions deploy enrichment-step-1-categorization --project-ref YOUR_PROJECT_REF
```

Deploy all functions:
```bash
cd supabase/functions
for dir in enrichment-*/; do
  npx supabase functions deploy "${dir%/}" --project-ref YOUR_PROJECT_REF
done
```

## Secrets Management

Required secrets (stored in Supabase Vault):
```bash
npx supabase secrets set rapidapi_key_1760651731629=YOUR_KEY --project-ref YOUR_PROJECT_REF
npx supabase secrets set openrouter_key_1760655833491=YOUR_KEY --project-ref YOUR_PROJECT_REF
```

## Debugging

View logs for a specific function:
```bash
npx supabase functions logs enrichment-step-1-categorization --follow
```

Common issues:
- **Unicode errors**: Fixed with `sanitizeUnicode()` helper in steps 3-4
- **JSONB validation**: Fixed with `safeTags()` helper for tags array
- **Date parsing**: Fixed with `safeDate()` helper with fallback validation

## Architecture Notes

- **Chaining**: Each step invokes the next step directly (no orchestrator)
- **Error handling**: Each step marks its status as 'failed' and logs error details
- **Idempotency**: UPSERT operations allow re-running failed steps
- **Non-blocking**: Edge Functions return immediately after invoking next step
- **Database**: Uses Supabase Client with service role key for full access
