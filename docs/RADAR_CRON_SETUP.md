# Radar Cron Setup Guide

## Overview

This guide walks you through setting up the **daily automatic radar updates** that run at 6 AM UTC every day.

**What the cron does:**
- Fetches latest metrics for all channels in radar
- Updates YouTube stats (subscribers, views, video count)
- Discovers new videos
- Calculates performance ratios
- Detects viral videos (10x outliers)
- Logs everything to `channel_radar_cron_log`

---

## Quick Setup (5 minutes)

### Step 1: Get Your Service Role Key

1. Go to **Supabase Dashboard**
2. Navigate to **Settings → API**
3. Copy the **`service_role` secret** (NOT the anon key!)
4. Keep it handy for Step 2

### Step 2: Edit the Setup Script

1. Open `supabase/migrations/setup-radar-cron-fixed.sql`
2. Find line 60:
   ```sql
   SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
   ```
3. Replace `YOUR_SERVICE_ROLE_KEY` with your actual key
4. Save the file

### Step 3: Run the Setup Script

1. Go to **Supabase Dashboard → SQL Editor**
2. Click **"New Query"**
3. Copy the **entire contents** of `setup-radar-cron-fixed.sql`
4. Paste into SQL Editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)

You should see:
```
✅ RADAR CRON SETUP COMPLETE!
```

### Step 4: Verify It Worked

Run the diagnostic script to check everything:

1. SQL Editor → New Query
2. Copy contents of `scripts/diagnose-radar-cron.sql`
3. Run it
4. Look for: `✅ ALL SYSTEMS OPERATIONAL`

---

## Manual Testing

Want to test without waiting until 6 AM? Run this in SQL Editor:

```sql
SELECT trigger_radar_update_now();
```

Then check the logs:

```sql
SELECT * FROM channel_radar_cron_log
ORDER BY execution_started_at DESC
LIMIT 5;
```

---

## Troubleshooting

### Problem: Cron job doesn't exist

**Symptom:**
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-radar-update';
-- Returns empty
```

**Fix:** Run `setup-radar-cron-fixed.sql` again

---

### Problem: "Service role key not configured"

**Symptom:**
```
❌ Service role key not configured or is placeholder
```

**Fix:**
1. Edit `setup-radar-cron-fixed.sql`
2. Replace `YOUR_SERVICE_ROLE_KEY` with real key
3. Run the script again

---

### Problem: "net extension not available"

**Symptom:**
```
ERROR: extension "net" does not exist
```

**Solution:** The script automatically falls back to `http` extension. This is normal and works fine.

---

### Problem: Cron runs but no channels updated

**Possible causes:**

1. **No channels in radar**
   ```sql
   SELECT COUNT(*) FROM channel_radar WHERE is_active = true;
   -- Should return > 0
   ```
   **Fix:** Add channels via UI at `/radar`

2. **Edge Function not deployed**
   - Check Supabase Dashboard → Edge Functions
   - Verify `enrichment-radar-updater` is deployed
   - **Fix:** Deploy it:
     ```bash
     supabase functions deploy enrichment-radar-updater
     ```

3. **Edge Function failing**
   - Check Edge Function logs in Supabase Dashboard
   - Look for API quota errors, rate limits, etc.

---

## Monitoring

### Check if cron is running:

```sql
-- View cron job details
SELECT * FROM radar_cron_status;

-- View recent executions (from pg_cron)
SELECT *
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-radar-update')
ORDER BY start_time DESC
LIMIT 10;
```

### Check application logs:

```sql
-- View execution logs with details
SELECT
  id,
  execution_started_at,
  execution_completed_at,
  status,
  channels_processed,
  channels_failed,
  error_message
FROM channel_radar_cron_log
ORDER BY execution_started_at DESC
LIMIT 20;
```

### Via UI:

Go to **http://localhost:3008/radar/logs** to see a nice visual dashboard of all executions.

---

## Advanced Configuration

### Change cron schedule:

```sql
-- Remove old job
SELECT cron.unschedule('daily-radar-update');

-- Add new schedule (example: every 12 hours)
SELECT cron.schedule(
  'daily-radar-update',
  '0 */12 * * *',  -- Every 12 hours
  $$ SELECT net.http_post(...) $$  -- Same command as before
);
```

Common cron schedules:
- `0 6 * * *` - Daily at 6 AM
- `0 */6 * * *` - Every 6 hours
- `0 6,18 * * *` - Twice daily (6 AM and 6 PM)
- `0 6 * * 1` - Weekly on Mondays at 6 AM

### Disable cron temporarily:

```sql
-- Pause cron
SELECT cron.alter_job('daily-radar-update', is_enabled := false);

-- Resume cron
SELECT cron.alter_job('daily-radar-update', is_enabled := true);
```

### Remove cron completely:

```sql
SELECT cron.unschedule('daily-radar-update');
```

---

## Architecture

Here's how the cron system works:

```
┌─────────────┐
│  pg_cron    │  Runs at 6 AM UTC daily
│  (Postgres) │
└──────┬──────┘
       │ HTTP POST
       ▼
┌─────────────────────────────┐
│  Edge Function              │
│  enrichment-radar-updater   │
└──────┬──────────────────────┘
       │
       ├─► YouTube API (metrics)
       ├─► SocialBlade (baselines)
       ├─► Recent videos fetch
       └─► Outlier calculation
```

**Key Components:**

1. **pg_cron** - PostgreSQL extension that schedules jobs
2. **Database settings** - Store Supabase URL + service key
3. **Edge Function** - Does the actual work (enrichment-radar-updater)
4. **Log table** - Tracks every execution (channel_radar_cron_log)

---

## FAQ

### Q: What timezone does the cron use?

**A:** UTC. So 6 AM UTC = 3 AM EST / 12 AM PST.

To convert to your timezone:
- 6 AM UTC = 1 AM CST (US Central)
- 6 AM UTC = 2 AM BRT (Brazil)
- 6 AM UTC = 11 AM IST (India)

### Q: Can I change the timezone?

**A:** The cron always uses UTC, but you can adjust the hour. For example, to run at 6 AM EST:

```sql
-- 6 AM EST = 11 AM UTC
SELECT cron.schedule('daily-radar-update', '0 11 * * *', ...);
```

### Q: What if the cron misses a day?

**A:** If your database is down during the scheduled time, pg_cron will NOT retroactively run the missed job. It will just wait for the next scheduled time.

**Solution:** Use manual trigger if you need to catch up:
```sql
SELECT trigger_radar_update_now();
```

### Q: How long does the cron take to run?

**A:** Depends on number of channels:
- **1-5 channels:** ~2-5 minutes
- **10 channels:** ~8-12 minutes
- **20 channels:** ~15-20 minutes

Each channel takes ~60-90 seconds to process fully.

### Q: Does the cron respect rate limits?

**A:** Yes! The Edge Function has built-in error handling and will log any API quota issues. Check `channel_radar_cron_log.error_message` for details.

---

## Support

If you're still having issues:

1. **Run diagnostic:** `scripts/diagnose-radar-cron.sql`
2. **Check logs:** View `/radar/logs` in your app
3. **Check Edge Function logs:** Supabase Dashboard → Edge Functions → enrichment-radar-updater → Logs
4. **Manual test:** `SELECT trigger_radar_update_now();`

---

**Document Version:** 1.0
**Last Updated:** 2025-11-14
**Related Files:**
- `supabase/migrations/setup-radar-cron-fixed.sql`
- `scripts/diagnose-radar-cron.sql`
- `supabase/functions/enrichment-radar-updater/index.ts`
