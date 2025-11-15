# 🎬 Video Production Workflow Documentation

**Complete analysis of Gobbi's video production database**  
**Analysis Date:** November 14, 2025  
**Databases Analyzed:** Gobbi's Supabase (48 tables) vs User's Supabase (59 tables)

---

## 📋 What's in This Analysis

This analysis provides a **complete blueprint** for implementing an AI-powered video production pipeline that transforms high-performing YouTube videos into brand-aligned content.

### 📁 Documentation Files

| File | Size | Purpose | Read Time |
|------|------|---------|-----------|
| **GOBBI_VIDEO_PRODUCTION_WORKFLOW_ANALYSIS.md** | 50 KB | Complete technical analysis | 30 min |
| **QUICK_START_PRODUCTION_GUIDE.md** | 12 KB | Get started in 30 minutes | 10 min |
| **SQL_QUERY_REFERENCE.md** | 17 KB | All SQL queries you'll need | 15 min |

---

## 🎯 Executive Summary

### What You'll Learn

1. **Complete Database Schema**
   - 42 common tables between systems
   - 6 critical missing tables identified
   - Full ERD with foreign key relationships

2. **12-Stage Production Pipeline**
   - From outlier detection → published video
   - AI agent architecture (3 specialized agents)
   - Status workflow definitions

3. **Real Production Example**
   - Video ID 168: "O DEUS SUPREMO Africano..."
   - Source: 15,772 views → Production: Published
   - 12 audio segments, 5 video segments, 48-minute final video

4. **Implementation Roadmap**
   - Phase 1: Database setup (Day 1)
   - Phase 2: Workflow config (Day 2)
   - Phase 3: Outlier detection (Day 3)
   - Phase 4: AI agents (Week 2-3)
   - Phase 5: Production pipeline (Week 4-6)

---

## 🚀 Quick Start (5 Minutes)

### The Complete Workflow in One Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                   VIDEO PRODUCTION PIPELINE                    │
└───────────────────────────────────────────────────────────────┘

1. OUTLIER DETECTION
   ├─ benchmark_videos (26,000 videos)
   ├─ Calculate performance vs channel average
   └─ → benchmark_outlier_videos (high performers only)

2. NARRATIVE ANALYSIS
   ├─ Fetch video transcript
   ├─ Claude AI analyzes story structure
   └─ → narrative_analyses (story beats, theme, structure)

3. PRODUCTION CREATION
   ├─ Select outlier for production
   ├─ Create production_videos record
   └─ Status: create_title

4. AI ADAPTATION (3 Agents)
   ├─ Agent 1: Adapt story to brand
   │   ├─ 1.A: Map characters
   │   ├─ 1.B: Create profiles
   │   └─ 1.C: Generate images
   ├─ Agent 2: Structure screenplay (10 chapters)
   └─ Agent 3: Write full script

5. AUDIO PRODUCTION
   ├─ Split script into segments
   ├─ TTS generation (ElevenLabs/Google)
   ├─ → production_audio_segments (12 segments)
   └─ → production_concatenated_audios (final track)

6. VIDEO PRODUCTION
   ├─ Generate covering images (AI)
   ├─ Create text overlays
   ├─ → production_video_editing_assets
   ├─ Assemble video segments
   └─ → production_video_segments (5 segments)

7. PUBLICATION
   ├─ Final video render
   ├─ Upload to YouTube
   └─ Status: published
```

---

## 📊 Key Findings

### Database Comparison

```
✅ GOOD NEWS: You already have most tables!

Common tables:        42 (88% overlap)
User only:            17 (extra features you built)
Gobbi only (MISSING): 6  (need to create these)

CRITICAL MISSING TABLES:
⚠️  benchmark_outlier_videos       - Find high performers
⚠️  structure_allowed_status        - 12-stage workflow definitions
⚠️  structure_production_workflow   - Workflow configuration
⚠️  benchmark_channels_selected_niches - Niche tracking
⚠️  benchmark_channels_dossier      - Extended metadata
⚠️  ddl_sync_queue                  - Schema change log
```

### Production Scale

```
Current Production Stats (Gobbi):
├─ 67 videos produced
├─ 50 narrative analyses completed
├─ 317 audio segments generated (~5 per video)
├─ 302 video segments created (~5 per video)
└─ 169 concatenated audio files

Average Production:
├─ Duration: 45-60 minutes per video
├─ Audio segments: 12 segments × ~4 minutes each
├─ Video segments: 5 segments (merged from 12 audio)
└─ Time to publish: ~35 days (with manual review)
```

### Workflow Efficiency

```
12-Stage Pipeline:
1.  create_title              - AI generates title
2.  create_outline            - Adapt story beats
3.  create_cast               - Map characters
4.  create_rich_outline       - Structure 10 chapters
5.  create_script             - Write full narrative
6.  review_script             - Polish & moderate
7.  create_seo_description    - YouTube description
8.  create_thumbnail          - Generate thumbnail
9.  create_audio_segments     - TTS generation
10. create_video_segments     - Assemble visuals
11. create_concatenated_audios - Merge audio
12. create_final_video        - Final render

Post-Production:
├─ pending_approval → approved → scheduled → published
└─ Error handling: failed, canceled, on_hold
```

---

## 🎯 Implementation Checklist

### ✅ Phase 1: Database Setup (Day 1)

- [ ] Create `structure_allowed_status` table
- [ ] Insert 20 status definitions
- [ ] Create `benchmark_outlier_videos` table
- [ ] Create `structure_production_workflow` table
- [ ] Add foreign key constraints
- [ ] Verify existing production tables

**SQL:** See `SQL_QUERY_REFERENCE.md` Section "Database Setup"

### ✅ Phase 2: Outlier Detection (Day 2)

- [ ] Write SQL query to calculate performance metrics
- [ ] Identify videos with 2x+ median performance
- [ ] Populate `benchmark_outlier_videos` table
- [ ] Test on your data

**SQL:** See Query #2 in `SQL_QUERY_REFERENCE.md`

### ✅ Phase 3: Narrative Analysis (Day 3-7)

- [ ] Create Supabase Edge Function `analyze-narrative`
- [ ] Integrate Claude API for story analysis
- [ ] Parse response into structured format
- [ ] Store in `narrative_analyses` table
- [ ] Test on 3-5 outlier videos

**Guide:** See `QUICK_START_PRODUCTION_GUIDE.md` → Day 2

### ✅ Phase 4: AI Adaptation Agents (Week 2-3)

- [ ] **Agent 1:** Story adaptation Edge Function
  - [ ] Adapt story beats to brand
  - [ ] Store in `adapted_story_beats_payload`
- [ ] **Agent 2:** Screenplay architect Edge Function
  - [ ] Structure 10 chapters
  - [ ] Store in `rich_outline_payload`
- [ ] **Agent 3:** Scriptwriter Edge Function
  - [ ] Write full narrative
  - [ ] Store in `script` field

**Reference:** `GOBBI_VIDEO_PRODUCTION_WORKFLOW_ANALYSIS.md` → Section 2

### ✅ Phase 5: Production Pipeline (Week 4-6)

- [ ] Audio generation Edge Function (TTS)
- [ ] Audio concatenation Edge Function
- [ ] Visual asset generation (AI images)
- [ ] Video segment assembly Edge Function
- [ ] Final video rendering
- [ ] YouTube upload integration

**Guide:** `QUICK_START_PRODUCTION_GUIDE.md` → Days 4-5

---

## 📖 How to Use This Documentation

### If You Want To...

**Understand the complete system:**
→ Read `GOBBI_VIDEO_PRODUCTION_WORKFLOW_ANALYSIS.md`  
   (30 minutes, comprehensive technical deep-dive)

**Get started quickly:**
→ Read `QUICK_START_PRODUCTION_GUIDE.md`  
   (10 minutes, practical implementation steps)

**Need specific SQL queries:**
→ Reference `SQL_QUERY_REFERENCE.md`  
   (Copy-paste ready queries for all use cases)

**Just want the highlights:**
→ You're reading it! (This README)

---

## 🔑 Key Insights

### What Makes This System Work

1. **Outlier Detection is Critical**
   - Not all videos are worth producing
   - Focus on 2x-5x performance vs channel average
   - Must have transcript (for AI analysis)

2. **AI Agents Transform Content**
   - Agent 1: Adapts original story to your brand universe
   - Agent 2: Structures narrative into 10 chapters
   - Agent 3: Writes full screenplay
   - Each builds on previous agent's output

3. **Segmentation Enables Scale**
   - Audio: 12 segments × 4 min = 48-minute video
   - Video: 5 segments (easier rendering)
   - Assets: Separate images, text, effects
   - Why? Parallel processing, easier debugging, modular updates

4. **Status Workflow is State Machine**
   - Linear progression through 12 stages
   - Each status = gate for next step
   - Manual approval gates (quality control)
   - Error handling at every stage

5. **Google Drive for Asset Storage**
   - Gobbi uses Google Drive URLs (not Supabase Storage)
   - Organized by video: parent → audio → video → thumbnail
   - You might want to use Supabase Storage instead

---

## 📈 Production Metrics to Track

```sql
-- Copy from SQL_QUERY_REFERENCE.md → Section 7

Weekly Production Velocity:
├─ Videos started
├─ Videos published  
├─ Average days to publish
└─ Success rate (published/started)

Per-Video Metrics:
├─ Audio segment count
├─ Video segment count
├─ Total duration (minutes)
├─ Days in production
└─ Editing asset count

Quality Metrics:
├─ Narrative analysis completeness
├─ Script review iterations
├─ Manual approval time
└─ Post-publication performance
```

---

## 🎬 Real Example: Production Video #168

**Source Video:**
- Title: "The Original Religion? The African God Worshiped Above All!"
- Channel: The Seal of the Bible
- Views: 15,772
- Duration: 68 minutes

**Production Output:**
- Title: "O DEUS SUPREMO Africano que a História Tentou Apagar"
- Platform: YouTube (Brazilian Portuguese)
- Duration: 48 minutes (12 audio segments → 5 video segments)
- Status: Published
- URL: https://youtu.be/QR9GhtZZUVQ

**Production Timeline:**
- Started: September 15, 2025
- Published: October 20, 2025
- **Total: 35 days** (includes manual review/editing)

**Data Breakdown:**
```json
{
  "audio_segments": 12,
  "video_segments": 5,
  "editing_assets": "variable",
  "covering_images": 10,
  "has_script": true,
  "has_ssml": true,
  "workflow_profile": "biblical"
}
```

**SQL to fetch complete data:**
```sql
-- See SQL_QUERY_REFERENCE.md → Query #1
-- Returns everything in one query
```

---

## 🚨 Common Questions

### Q: Do I need ALL the missing tables?

**A:** Only 2 are critical:
- `benchmark_outlier_videos` - To find high performers
- `structure_allowed_status` - For workflow tracking

The others are nice-to-have for organization.

### Q: Can I simplify the 12-stage workflow?

**A:** Yes! Start with 5 stages:
1. create_script
2. create_audio_segments
3. create_video_segments  
4. create_final_video
5. published

Add others as you mature the system.

### Q: Do I need all 3 AI agents?

**A:** Start with just Agent 3 (Scriptwriter):
- Input: Original transcript
- Output: Adapted script
- Skip the complex story adaptation for MVP

### Q: How much does this cost?

**Rough Estimate per Video:**
- Claude API: $2-5 (narrative + script)
- ElevenLabs TTS: $10-15 (48 min audio)
- Runware Images: $5-10 (10-15 images)
- **Total: ~$20-30 per video**

(Plus your time for review/editing)

### Q: Can I automate 100%?

**A:** Gobbi uses manual approval gates:
- After script generation (quality check)
- Before publication (final review)

Recommended to keep these, at least initially.

---

## 🎓 Learning Path

### Week 1: Understanding
- [ ] Read this README (you're here!)
- [ ] Skim the full analysis document
- [ ] Run SQL queries on your database
- [ ] Identify 5 outlier videos

### Week 2: Foundation
- [ ] Create missing tables
- [ ] Set up workflow statuses
- [ ] Build narrative analysis Edge Function
- [ ] Test on 1 video

### Week 3: AI Integration
- [ ] Integrate Claude API
- [ ] Test story adaptation
- [ ] Generate first AI script
- [ ] Manual review process

### Week 4: Audio Production
- [ ] Integrate TTS API
- [ ] Build segmentation logic
- [ ] Test audio concatenation
- [ ] Quality check audio output

### Week 5: Video Production
- [ ] AI image generation
- [ ] Video segment assembly
- [ ] Test rendering pipeline
- [ ] First complete video!

### Week 6: Automation
- [ ] End-to-end workflow
- [ ] Error handling
- [ ] Status updates
- [ ] Dashboard for monitoring

---

## 📚 Additional Resources

### External Documentation
- [Claude API Docs](https://docs.anthropic.com)
- [ElevenLabs TTS API](https://elevenlabs.io/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Runware Image API](https://runware.ai/docs)

### Internal Code References
- User's CLAUDE.md: `/automedia/CLAUDE.md`
- User's .env: `/automedia/.env`
- Supabase migrations: `/automedia/supabase/migrations/`

---

## 🎯 Success Criteria

You'll know you're successful when:

1. ✅ Database has all necessary tables
2. ✅ Can identify outlier videos automatically
3. ✅ AI analyzes narrative structure
4. ✅ AI generates adapted script
5. ✅ TTS produces quality audio
6. ✅ Video assembly works end-to-end
7. ✅ First video published on YouTube
8. ✅ Production time < 7 days (automated)

**Goal:** 1 video per week, fully automated  
**Stretch Goal:** 3-5 videos per week

---

## 📞 Next Steps

1. **Today:** Read `QUICK_START_PRODUCTION_GUIDE.md`
2. **Tomorrow:** Run database setup SQL
3. **This Week:** Test outlier detection
4. **Next Week:** Build first AI agent
5. **Month 1:** Publish first automated video

---

## 📝 Document Updates

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-14 | Initial comprehensive analysis |

---

**Happy building! 🚀**

Questions? Review the detailed docs:
- Technical deep-dive: `GOBBI_VIDEO_PRODUCTION_WORKFLOW_ANALYSIS.md`
- Quick implementation: `QUICK_START_PRODUCTION_GUIDE.md`
- SQL reference: `SQL_QUERY_REFERENCE.md`
