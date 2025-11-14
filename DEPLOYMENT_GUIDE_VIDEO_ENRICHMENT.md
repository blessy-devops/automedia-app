# Video Enrichment Feature - Deployment Guide

## Status
- ✅ **Edge Function**: Deployed successfully to Supabase
- ⏳ **Database Migration**: Needs manual execution via Supabase Dashboard
- ✅ **Frontend Code**: Completed and ready
- ✅ **Server Actions**: Completed and ready

---

## Step 1: Run Database Migration (Manual via Supabase Dashboard)

Since the CLI connection has issues, run the migration manually:

### 1.1 Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/sql/new
2. Open the SQL Editor

### 1.2 Execute Migration SQL
Copy and paste the entire contents of this file and run it:
```
supabase/migrations/20251113140000_add_video_enrichment.sql
```

### 1.3 Verify Migration
Run this query to verify the migration succeeded:
```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'benchmark_videos'
AND column_name IN ('keywords', 'related_video_ids', 'enrichment_data', 'last_enriched_at');

-- Check new table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'video_enrichment_queue'
);

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('is_video_queued', 'add_videos_to_enrichment_queue');
```

Expected results:
- 4 columns should be returned for benchmark_videos
- video_enrichment_queue table should exist (returns `true`)
- 2 functions should be listed

---

## Step 2: Verify Edge Function Deployment

### 2.1 Check Dashboard
Visit: https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/functions

You should see:
- ✅ `video-enrichment` function listed
- Status: Deployed
- Region: Configured

### 2.2 Test Edge Function
Run this test via SQL Editor or Edge Functions dashboard:

```sql
-- Test function invocation (requires migration to be complete first)
SELECT extensions.http_post(
  url := 'https://xlpkabexmwsugkmbngwm.supabase.co/functions/v1/video-enrichment',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'youtubeVideoId', 'arj7oStGLkU',
    'videoId', 1
  )
);
```

---

## Step 3: Verify RapidAPI Key Configuration

### 3.1 Check Vault Secret
Run this in SQL Editor:
```sql
SELECT name, description
FROM vault.secrets
WHERE name = 'rapidapi_key_1760651731629';
```

If the secret doesn't exist or needs updating:

### 3.2 Create/Update Secret
```sql
-- Insert or update RapidAPI key
INSERT INTO vault.secrets (secret, name, description)
VALUES (
  '4046fccc89msha34bda3365c56a1p12fd61jsn36fab7ad1dbb',
  'rapidapi_key_1760651731629',
  'RapidAPI key for YouTube v3 API'
)
ON CONFLICT (name)
DO UPDATE SET
  secret = EXCLUDED.secret,
  description = EXCLUDED.description;
```

### 3.3 Grant Access to get_secret Function
Ensure the Edge Function can read secrets:
```sql
-- This should already exist from previous enrichment setup
-- but verify it's working:
SELECT vault.read_secret('rapidapi_key_1760651731629');
```

---

## Step 4: Test the Feature in the UI

### 4.1 Navigate to a Video Details Page
1. Start your development server (if not already running):
   ```bash
   cd /Users/daviluis/Documents/automedia-platform/automedia
   npm run dev
   ```

2. Open: http://localhost:3000/videos/[id]
   - Replace `[id]` with any video ID from your database
   - Example: http://localhost:3000/videos/1

### 4.2 Test Enrichment
1. You should see an **"Enrich Video"** button next to the video title
2. Click the button
3. Wait 2-5 seconds (you'll see a loading spinner)
4. On success:
   - Toast notification appears: "Video Enriched Successfully"
   - **Keywords** section appears below the video player
   - **Related Videos** section appears at the bottom of the page
5. Verify data:
   - Keywords are displayed as badges
   - Related videos show thumbnails, titles, views, and durations

### 4.3 Test Queue Functionality
1. In the Related Videos section, click **"Add to Queue"** on any video
2. Toast notification should appear: "Added to Queue"
3. Button should change to a "Queued" badge
4. Test batch action: Click **"Add All to Queue"**
5. All unqueued videos should be added

### 4.4 Verify Database Updates
Check in SQL Editor:
```sql
-- Check enriched video
SELECT
  id,
  title,
  keywords,
  array_length(keywords, 1) as keyword_count,
  array_length(related_video_ids, 1) as related_count,
  last_enriched_at
FROM benchmark_videos
WHERE keywords IS NOT NULL
ORDER BY last_enriched_at DESC
LIMIT 5;

-- Check enrichment queue
SELECT
  id,
  youtube_video_id,
  source,
  status,
  created_at
FROM video_enrichment_queue
ORDER BY created_at DESC
LIMIT 10;
```

---

## Step 5: Monitor and Troubleshoot

### 5.1 Check Edge Function Logs
Visit: https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/functions/video-enrichment/logs

Look for:
- ✅ Successful enrichment logs
- ❌ Any error messages from RapidAPI
- ⚠️ Rate limit warnings

### 5.2 Common Issues

#### Issue: "Failed to retrieve API credentials"
**Solution**: RapidAPI key not in Vault - see Step 3

#### Issue: "RapidAPI request failed: 429"
**Solution**: Rate limit exceeded - wait before retrying

#### Issue: "Video not found in database"
**Solution**: Invalid video ID - check database for valid IDs

#### Issue: Keywords/Related Videos not showing
**Solution**:
1. Check browser console for errors
2. Verify migration ran successfully (Step 1.3)
3. Check if `enrichment_data` column has JSON data

### 5.3 View Enrichment Queue Status
Create a simple monitoring page or query:
```sql
-- Queue statistics
SELECT
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM video_enrichment_queue
GROUP BY status;

-- Recent queue items
SELECT * FROM video_enrichment_queue_status
LIMIT 20;
```

---

## Step 6: Production Checklist

Before deploying to production:

- [ ] Database migration executed successfully
- [ ] Edge Function deployed and accessible
- [ ] RapidAPI key configured in Vault
- [ ] Test enrichment works for at least 3 different videos
- [ ] Test queue functionality (add single and batch)
- [ ] Verify error handling (test with invalid video ID)
- [ ] Check RapidAPI quota/usage limits
- [ ] Set up monitoring/alerting for Edge Function errors
- [ ] Document any API rate limits for the team
- [ ] Consider implementing queue processing worker (future enhancement)

---

## API Quotas & Costs

### RapidAPI YouTube v3
- **Endpoint**: `GET /video/info`
- **Cost per call**: 1 credit
- **Response size**: ~100KB (includes 13 keywords + 25 related videos)
- **Rate limit**: Check your RapidAPI dashboard

### Recommendations
1. **Cache enrichment data** - Already implemented via `last_enriched_at`
2. **Batch operations** - Use "Add All" instead of individual additions
3. **Monitor usage** - Track enrichment calls per day
4. **Set quotas** - Consider limiting enrichments per user/day if needed

---

## Future Enhancements

Potential improvements to consider:

1. **Auto-process queue** - Create worker to categorize queued videos
2. **Pagination** - Show all 25 related videos (currently limited to 10)
3. **Keyword search** - Search videos by keywords using GIN index
4. **Re-enrichment schedule** - Auto-refresh old enrichment data
5. **Bulk enrichment** - Enrich multiple videos at once
6. **Analytics dashboard** - Track enrichment success rates
7. **Related video graph** - Visualize connections between videos

---

## Support

If you encounter issues:
1. Check Edge Function logs (Step 5.1)
2. Verify migration status (Step 1.3)
3. Test RapidAPI key directly via curl:
   ```bash
   curl -X GET "https://yt-api.p.rapidapi.com/video/info?id=arj7oStGLkU" \
     -H "X-RapidAPI-Key: YOUR_KEY" \
     -H "X-RapidAPI-Host: yt-api.p.rapidapi.com"
   ```

---

## Files Modified/Created

### New Files (8)
1. `supabase/migrations/20251113140000_add_video_enrichment.sql`
2. `supabase/functions/video-enrichment/index.ts`
3. `app/(dashboard)/videos/[id]/actions.ts`
4. `app/(dashboard)/videos/[id]/components/keywords-card.tsx`
5. `app/(dashboard)/videos/[id]/components/related-videos-card.tsx`
6. `components/ui/toast.tsx`
7. `components/ui/toaster.tsx`
8. `hooks/use-toast.ts`

### Modified Files (2)
1. `app/(dashboard)/videos/[id]/page.tsx`
2. `app/(dashboard)/videos/[id]/components/video-detail-header.tsx`

---

**Deployment Date**: 2025-11-13
**Feature Version**: 1.0
**Status**: ✅ Ready for Production (pending migration)
