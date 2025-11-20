# Backup - Edge Functions (Before Social Blade Bypass)

**Date:** November 20, 2025
**Purpose:** Backup of edge functions before implementing Social Blade bypass feature

## What's Backed Up

This backup contains the **ORIGINAL** versions of:

1. `enrichment-step-2-socialblade/` - Original Social Blade step (blocking on failure)
2. `enrichment-step-5-outlier-calc/` - Original outlier calculation step

## Changes Made After This Backup

After this backup was created, the following changes were implemented:

### Step 2 (Social Blade)
- Made non-blocking on failure
- Creates empty baseline_stats record when scraping fails
- Marks status as 'skipped' instead of 'failed'
- Continues pipeline even when Social Blade unavailable
- Returns HTTP 200 instead of 500 on error

### Step 5 (Outlier Calc)
- Added informative logs when Social Blade data unavailable
- Already handled NULL values correctly (no logic changes)

## How to Restore

If you need to rollback the edge functions:

1. **Stop current functions:**
   ```bash
   # No need to stop, just redeploy
   ```

2. **Restore from backup:**
   ```bash
   # Copy backup files back
   cp -r enrichment-step-2-socialblade/* ../enrichment-step-2-socialblade/
   cp -r enrichment-step-5-outlier-calc/* ../enrichment-step-5-outlier-calc/
   ```

3. **Redeploy to Supabase:**
   ```bash
   npx supabase functions deploy enrichment-step-2-socialblade --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy enrichment-step-5-outlier-calc --project-ref YOUR_PROJECT_REF
   ```

4. **Revert database migration (if already applied):**
   ```bash
   # You'll need to create a rollback migration to remove:
   # - channel_enrichment_tasks.socialblade_available
   # - benchmark_channels_baseline_stats.is_available
   ```

## Notes

- Frontend changes are in a separate git branch and can be reverted via git
- Migration file: `supabase/migrations/20251120_add_socialblade_availability_flags.sql`
- This backup does NOT include the migration file (use git to revert that)
