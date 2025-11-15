# Quick Start: Video Production Workflow

**TL;DR:** This guide shows you exactly how to implement Gobbi's video production pipeline in your system.

---

## 🎯 What You're Building

A system that takes **high-performing YouTube videos** and transforms them into **brand-aligned content** using AI.

### The Flow (5 minutes to understand)

```
1. FIND HIGH PERFORMERS
   ↓
   YouTube video with 50K views
   (in a niche channel with 5K avg views)
   
2. ANALYZE NARRATIVE
   ↓
   AI extracts: Story structure, emotional beats, characters
   
3. ADAPT TO YOUR BRAND
   ↓
   AI rewrites story for your universe/audience
   
4. PRODUCE VIDEO
   ↓
   TTS audio + AI images + editing = final video
   
5. PUBLISH
   ↓
   Upload to your YouTube channel
```

---

## 🚀 Quick Setup (30 minutes)

### Step 1: Create Missing Tables

Run this SQL in your Supabase dashboard:

```sql
-- 1. Status workflow table
CREATE TABLE structure_allowed_status (
  status_key TEXT PRIMARY KEY,
  label TEXT,
  description TEXT,
  table_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Outlier detection table
CREATE TABLE benchmark_outlier_videos (
  benchmark_video_id INTEGER PRIMARY KEY REFERENCES benchmark_videos(id),
  title TEXT,
  youtube_video_id TEXT,
  views INTEGER,
  median_performance_score NUMERIC,  -- How much better than average
  channel_name TEXT,
  channel_id TEXT,
  status TEXT
);

-- 3. Workflow config table
CREATE TABLE structure_production_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile TEXT NOT NULL,
  production_workflow JSONB,
  is_active BOOLEAN DEFAULT true
);
```

### Step 2: Populate Status Definitions

```sql
INSERT INTO structure_allowed_status (status_key, description) VALUES
('create_title', 'Generate video title'),
('create_script', 'Write narrative script'),
('create_audio_segments', 'Generate TTS audio'),
('create_video_segments', 'Assemble video'),
('published', 'Live on YouTube');
-- (Add other statuses as needed)
```

### Step 3: Find Your First Outlier

```sql
-- This finds videos performing 2x better than channel average
INSERT INTO benchmark_outlier_videos
SELECT 
  id as benchmark_video_id,
  title,
  youtube_video_id,
  views,
  2.0 as median_performance_score,
  channel_name,
  channel_id,
  'available' as status
FROM benchmark_videos
WHERE views > (
  SELECT AVG(views) * 2 
  FROM benchmark_videos bv2 
  WHERE bv2.channel_id = benchmark_videos.channel_id
)
LIMIT 1;
```

---

## 📊 The Data Model (Visual)

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR PRODUCTION PIPELINE                      │
└─────────────────────────────────────────────────────────────────┘

benchmark_videos                       production_videos
├─ id: 13093                          ├─ id: 168
├─ title: "African God..."            ├─ benchmark_id: 13093  ←──┐
├─ views: 15,772                      ├─ title: "O DEUS..."       │
├─ video_transcript: "..."            ├─ status: "published"      │
└─ channel_id: "UCeq..."              ├─ script: "..."            │
        │                             ├─ audio_folder_url         │
        │ (AI analyzes)               ├─ video_segments_folder    │
        ↓                             └─ final_link: "youtu.be/Q" │
                                                                   │
narrative_analyses                                                 │
├─ benchmark_video_id: 13093  ────────────────────────────────────┘
├─ story_beats: [12 beats]
├─ central_theme: "..."
└─ identified_structure: "Hero's Journey"

        │ (Used to generate)
        ↓

production_audio_segments              production_video_segments
├─ video_id: 168                      ├─ video_id: 168
├─ segment_1: "Audio 1" (242s)        ├─ segment_1: "video_1.mp4"
├─ segment_2: "Audio 2" (267s)        ├─ segment_2: "video_2.mp4"
├─ ...                                ├─ ...
└─ segment_12: "Audio 12" (241s)      └─ segment_5: "video_5.mp4"

        │                                     │
        │ (Merged into)                       │
        ↓                                     ↓

production_concatenated_audios         FINAL VIDEO
├─ video_id: 168                       ├─ All segments merged
├─ total_duration: 2880s (48 min)      ├─ Audio + visuals synced
└─ audio_url: "full_audio.mp3"         └─ Uploaded to YouTube
```

---

## 💡 Understanding the Workflow

### What Gobbi Does (The Full Pipeline)

1. **Outlier Detection**: Finds videos with 2x-5x their channel's average views
2. **Narrative Analysis**: AI analyzes the story structure
3. **Story Adaptation**: AI rewrites for their brand (biblical content)
4. **Script Generation**: AI writes full narrative script (10 chapters)
5. **Audio Production**: TTS generates 12 audio segments (~4 min each)
6. **Visual Production**: AI generates covering images
7. **Video Assembly**: Merges audio + images into 5 video segments
8. **Final Render**: Concatenates all segments
9. **Publication**: Uploads to YouTube

### What You Need to Build (Minimum Viable Product)

**Phase 1: Manual Process (Week 1)**
```
1. Manually pick a high-performing video
2. Use Claude API to analyze narrative
3. Use Claude API to write adapted script
4. Use ElevenLabs to generate audio
5. Use Shotstack or similar to create video
6. Manually upload to YouTube
```

**Phase 2: Semi-Automated (Week 2-3)**
```
1. Auto-detect outliers (SQL query)
2. Auto-analyze narrative (Edge Function)
3. Auto-generate script (Edge Function)
4. Auto-generate audio (Edge Function)
5. Manual video editing
6. Manual upload
```

**Phase 3: Fully Automated (Week 4-6)**
```
1. Auto-detect outliers
2. Auto-analyze narrative
3. Auto-generate script
4. Auto-generate audio
5. Auto-generate video (Edge Function)
6. Auto-upload to YouTube (Edge Function)
```

---

## 🔧 Essential Queries

### Find Outlier Videos

```sql
SELECT 
  bv.id,
  bv.title,
  bv.views,
  bv.channel_name,
  bv.youtube_url,
  -- Calculate performance vs channel average
  ROUND(
    bv.views::NUMERIC / NULLIF(
      (SELECT AVG(views) FROM benchmark_videos 
       WHERE channel_id = bv.channel_id), 
      0
    ), 
    2
  ) as performance_multiplier
FROM benchmark_videos bv
WHERE bv.video_transcript IS NOT NULL  -- Must have transcript
HAVING performance_multiplier > 2  -- 2x channel average
ORDER BY performance_multiplier DESC
LIMIT 10;
```

### Create Production Video

```sql
INSERT INTO production_videos (
  benchmark_id,
  title,
  status,
  language,
  platform,
  unique_profile_id
)
VALUES (
  13093,  -- Your outlier video ID
  'O DEUS SUPREMO Africano...',
  'create_title',
  'pt-BR',
  'youtube',
  'YOUR_CHANNEL_ID'
)
RETURNING id;
```

### Track Progress

```sql
SELECT 
  pv.id,
  pv.title,
  pv.status,
  pv.created_at,
  COUNT(pas.job_id) as audio_segments_done,
  COUNT(pvs.id) as video_segments_done
FROM production_videos pv
LEFT JOIN production_audio_segments pas ON pas.video_id = pv.id
LEFT JOIN production_video_segments pvs ON pvs.video_id = pv.id
WHERE pv.id = 168
GROUP BY pv.id, pv.title, pv.status, pv.created_at;
```

---

## 🎨 Example: Real Production Data

Here's an actual production from Gobbi's database:

```javascript
{
  "production_video_id": 168,
  "title": "O DEUS SUPREMO Africano que a História Tentou Apagar",
  "source": {
    "youtube_video_id": "qbSYXAFtYZ0",
    "title": "The Original Religion? The African God Worshiped Above All!",
    "views": 15772,
    "channel": "The Seal of the Bible"
  },
  "production": {
    "audio_segments": 12,
    "total_duration": "48 minutes",
    "video_segments": 5,
    "status": "published",
    "final_url": "https://youtu.be/QR9GhtZZUVQ"
  },
  "workflow": {
    "started": "2025-09-15",
    "published": "2025-10-20",
    "total_days": 35
  }
}
```

**Breakdown:**
- 1 source video → 12 audio segments → 5 video segments → 1 final video
- ~35 days from start to publish (includes manual review/editing)
- 48-minute final video from 68-minute source

---

## 📝 Step-by-Step: Your First Video

### Day 1: Setup

1. ✅ Run SQL migrations (Step 1 above)
2. ✅ Insert status definitions (Step 2 above)
3. ✅ Create your first outlier entry (Step 3 above)

### Day 2: Narrative Analysis

Create Supabase Edge Function `analyze-narrative`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { benchmarkVideoId } = await req.json()
  
  // 1. Fetch video transcript
  const { data: video } = await supabase
    .from('benchmark_videos')
    .select('video_transcript')
    .eq('id', benchmarkVideoId)
    .single()
  
  // 2. Send to Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Analyze this video transcript and extract narrative structure:
        
        ${video.video_transcript}
        
        Return JSON with story_beats, central_theme, emotional_core, etc.`
      }]
    })
  })
  
  const analysis = await response.json()
  
  // 3. Store in narrative_analyses
  await supabase.from('narrative_analyses').insert({
    benchmark_video_id: benchmarkVideoId,
    story_beats: analysis.story_beats,
    central_theme: analysis.central_theme,
    // ...
  })
  
  return new Response(JSON.stringify({ success: true }))
})
```

### Day 3: Script Generation

Create Edge Function `generate-script`:

```typescript
// 1. Fetch narrative analysis
// 2. Send to Claude with your brand guidelines
// 3. Store generated script in production_videos.script
```

### Day 4: Audio Generation

Create Edge Function `generate-audio`:

```typescript
// 1. Split script into segments
// 2. Send each to ElevenLabs TTS
// 3. Store in production_audio_segments
```

### Day 5: Video Assembly (Manual)

- Download audio segments
- Create video in your editor (Premiere, DaVinci, etc.)
- Upload to YouTube

---

## 🎯 Success Metrics

Track these to know if your system works:

```sql
-- Production velocity
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as videos_started,
  COUNT(*) FILTER (WHERE status = 'published') as videos_published
FROM production_videos
GROUP BY week
ORDER BY week DESC;

-- Average production time
SELECT 
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_days
FROM production_videos
WHERE status = 'published';

-- Success rate
SELECT 
  ROUND(
    COUNT(*) FILTER (WHERE status = 'published')::NUMERIC / 
    COUNT(*) * 100, 
    1
  ) as success_rate
FROM production_videos;
```

---

## 🚨 Common Pitfalls

1. **Missing transcripts**: Not all benchmark_videos have transcripts
   - Solution: Add transcript fetching to your enrichment pipeline

2. **Large audio files**: 48-minute videos = huge audio files
   - Solution: Use segmentation (12 segments of ~4 min each)

3. **Video rendering timeouts**: Edge Functions have 10-minute limits
   - Solution: Use async rendering with status updates

4. **Google Drive URLs**: Gobbi stores files in Google Drive
   - You might want to use Supabase Storage instead

---

## 📚 Next Steps

1. Read the full analysis: `GOBBI_VIDEO_PRODUCTION_WORKFLOW_ANALYSIS.md`
2. Create your first outlier: Run the SQL from Step 3
3. Build narrative analysis Edge Function
4. Generate your first production video
5. Iterate and automate

**Good luck! 🚀**

---

**Quick Links:**
- [Full Analysis Document](./GOBBI_VIDEO_PRODUCTION_WORKFLOW_ANALYSIS.md)
- [Supabase Dashboard](https://app.supabase.com)
- [Claude API Docs](https://docs.anthropic.com)
- [ElevenLabs API](https://elevenlabs.io/docs)
