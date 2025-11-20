# Queue Architecture - Video Distribution Flow

**Last Updated:** 2025-11-19
**Status:** ✅ Active Architecture

---

## 🎯 Current Architecture (Direct-to-Distribution)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Video Sent to Gobbi                                          │
│    (send-to-gobbi Edge Function)                                │
│                                                                  │
│    status: "pending_distribution"  ← Directly set               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Video Appears in Distribution UI                             │
│    (/production/distribution)                                   │
│                                                                  │
│    ✅ INSTANT - No delay                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. User Selects Channels                                        │
│    (Manual selection in UI)                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Queue Control ("Catraca") Applied                            │
│    - Only when distributing to production_videos                │
│    - Ensures controlled flow                                    │
│                                                                  │
│    status: "used"                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Old Architecture (CRON-Controlled) - DEPRECATED

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Video Sent to Gobbi                                          │
│    (send-to-gobbi Edge Function)                                │
│                                                                  │
│    status: "add_to_production"                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CRON Job Runs Every 2 Minutes                                │
│    (production-queue-control Edge Function)                     │
│                                                                  │
│    ❌ DELAY: Up to 2 minutes                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Status Changed to "pending_distribution"                     │
│    (by CRON job)                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Video Appears in Distribution UI                             │
│    (/production/distribution)                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. User Selects Channels                                        │
│    (Manual selection in UI)                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Why We Changed

| Aspect | Old Architecture | New Architecture |
|--------|-----------------|------------------|
| **Delay** | Up to 2 minutes | Instant |
| **Complexity** | CRON + Edge Function + Status logic | Direct status set |
| **Components** | 3 (send, CRON, UI) | 2 (send, UI) |
| **Queue Control** | At wrong moment (before distribution) | At right moment (during distribution) |
| **Debugging** | Multiple points of failure | Simpler flow |
| **User Experience** | Delayed visibility | Immediate visibility |

---

## 📊 Video Status Flow

### Current Statuses

```
pending_distribution → used
```

**pending_distribution:**
- Video is ready for distribution
- Appears in `/production/distribution` UI
- Waiting for user to select channels

**used:**
- Video has been distributed to production_videos
- No longer appears in distribution queue

### Old Statuses (Deprecated)

```
add_to_production → pending_distribution → used
```

The `add_to_production` status is **no longer used** in the new architecture.

---

## 🔧 Key Files

### Current Architecture

1. **`supabase/functions/send-to-gobbi/index.ts`** (line 228)
   - Sets `status: 'pending_distribution'` directly
   - See detailed comments explaining architectural decision

2. **`app/(dashboard)/production/distribution/actions.ts`**
   - Fetches videos with `status = 'pending_distribution'`
   - Handles channel selection and distribution

3. **`docs/gobbi-database/WEBHOOK_ARCHITECTURE.md`**
   - Full webhook architecture documentation
   - Includes section "MUDANÇA DE ARQUITETURA DA FILA"

### Old Architecture (Reference Only)

1. **`supabase/functions/production-queue-control/index.ts`**
   - CRON-triggered queue control
   - ⚠️ No longer necessary
   - Kept for reference only

2. **`supabase/functions/production-queue-control/README.md`**
   - Documentation of old CRON-based approach
   - Marked as deprecated with warning

3. **`docs/next-steps/distribution-flow/PHASE-4-QUEUE-CONTROL.md`**
   - Implementation guide for old architecture
   - Marked as deprecated with warning

---

## 🧪 Testing the Current Flow

### 1. Send Video to Gobbi

```bash
# Via test script
node scripts/test-send-video.mjs

# Or via Edge Function
curl -X POST 'https://YOUR-PROJECT.supabase.co/functions/v1/send-to-gobbi' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"video_ids": [123]}'
```

### 2. Verify Video Appears Instantly

```sql
-- Check video status in Gobbi's database
SELECT id, youtube_video_id, title, status, created_at
FROM benchmark_videos
WHERE youtube_video_id = 'YOUR_VIDEO_ID';

-- Expected: status = 'pending_distribution'
```

### 3. Check Distribution UI

Navigate to `/production/distribution` - video should appear immediately.

### 4. Verify Distribution RPC

```javascript
// Via test script
node scripts/verify-distribution-queue.mjs
```

Expected output:
```
✅ Vídeo no banco do Gobbi
🔍 Chamando RPC get_videos_awaiting_distribution...
   Total de vídeos na fila: 1+
🎉 SUCESSO! Vídeo APARECE na fila de distribuição!
```

---

## 🚨 Common Issues

### Video Not Appearing in Distribution UI

**Symptom:** Video sent successfully but doesn't show in `/production/distribution`

**Causes:**
1. ❌ Status is wrong (check if `status = 'pending_distribution'`)
2. ❌ RPC function `get_videos_awaiting_distribution` has issues
3. ❌ Video categorization doesn't match any production channels

**Debug:**
```sql
-- Check video status
SELECT id, youtube_video_id, title, status, categorization
FROM benchmark_videos
WHERE youtube_video_id = 'YOUR_VIDEO_ID';

-- Test RPC directly
SELECT * FROM get_videos_awaiting_distribution();
```

### Video Has Wrong Status

**Symptom:** Status is `add_to_production` instead of `pending_distribution`

**Cause:** Using old version of `send-to-gobbi` Edge Function

**Fix:**
```bash
# Redeploy latest version
cd /Users/daviluis/Documents/automedia-platform/automedia
npx supabase functions deploy send-to-gobbi --project-ref YOUR_PROJECT_REF
```

---

## 📚 Related Documentation

- [WEBHOOK_ARCHITECTURE.md](./WEBHOOK_ARCHITECTURE.md) - Complete webhook flow documentation
- [FIELD_MAPPING.md](./FIELD_MAPPING.md) - Field mappings between databases
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing procedures
- [MONITORING_AND_TROUBLESHOOTING.md](./MONITORING_AND_TROUBLESHOOTING.md) - Debugging guide

---

**Author:** Claude Code + Davi Luis
**Version:** 2.0 (Direct-to-Distribution)
**Previous Version:** 1.0 (CRON-Controlled) - Deprecated
