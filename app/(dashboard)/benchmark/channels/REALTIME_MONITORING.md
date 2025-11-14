# Real-time Progress Monitoring

This document explains the real-time progress monitoring system for the Channel Benchmark enrichment pipeline.

## Overview

The monitoring system provides live updates as the enrichment pipeline processes a YouTube channel through 5 sequential steps. It uses **Supabase Realtime** to subscribe to database changes and update the UI without page refreshes.

## Architecture

### Components

1. **BenchmarkProgressMonitor** (`components/benchmark-progress-monitor.tsx`)
   - Main monitoring component
   - Subscribes to Supabase Realtime for task updates
   - Displays all 5 pipeline steps with live status
   - Shows "Live Updates" indicator when subscribed

2. **StatusStep** (`components/status-step.tsx`)
   - Individual step display component
   - Shows step number, title, description
   - Visual status indicator (icon + badge)
   - Icons: Circle (pending), Spinner (processing), CheckCircle (completed), XCircle (failed)

3. **Badge** (`components/ui/badge.tsx`)
   - Reusable status badge component
   - Variants: success (green), warning (yellow), info (blue), destructive (red), outline (gray)

### Data Flow

```
User Submits Form
    ↓
Server Action creates Job + Task
    ↓
Server Action invokes Edge Function
    ↓
Form switches to Progress Monitor
    ↓
Monitor fetches initial task status
    ↓
Monitor subscribes to Realtime updates
    ↓
Edge Functions update task status
    ↓
Realtime broadcasts updates
    ↓
Monitor receives updates & re-renders UI
    ↓
All steps complete → onComplete callback
```

## Pipeline Steps

The enrichment pipeline consists of 5 sequential steps:

1. **Channel Categorization** (Claude AI)
   - Analyzes channel content
   - Assigns primary/secondary categories
   - Status field: `categorization_status`

2. **SocialBlade Metrics**
   - Scrapes SocialBlade data
   - Fetches rank, grade, earnings estimates
   - Status field: `socialblade_status`

3. **Video Fetching** (YouTube Data API)
   - Retrieves all channel videos
   - Fetches video metadata
   - Status field: `fetch_videos_status`

4. **Baseline Statistics**
   - Calculates performance baselines
   - Periods: 14d, 30d, 90d, historical
   - Status field: `baseline_stats_status`

5. **Outlier Analysis**
   - Identifies high-performing videos
   - Compares videos to baseline
   - Status field: `outlier_analysis_status`

## Status Values

Each step can have one of 4 statuses:

- `pending`: Step not started yet
- `processing`: Step currently executing
- `completed`: Step finished successfully
- `failed`: Step encountered an error

## Supabase Realtime Integration

### Subscription Setup

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
      // Handle update
      updateTaskStatus(payload.new)
    }
  )
  .subscribe()
```

### Cleanup

The subscription is properly cleaned up when the component unmounts:

```typescript
return () => {
  if (channel) {
    supabase.removeChannel(channel)
  }
}
```

## User Experience

### Initial State
- Form is visible
- User enters YouTube Channel ID
- Clicks "Start Channel Benchmark"

### Processing State
- Form hides
- Progress monitor appears
- Shows all 5 steps with current status
- "Live Updates" indicator shows connection status
- Steps update in real-time as Edge Functions progress

### Completion State
- All steps show green checkmarks
- Overall status badge shows "COMPLETED"
- "Start Another Benchmark" button appears
- Clicking button resets to initial state

## Testing the System

### 1. Access the Page
Navigate to: `http://localhost:3003/benchmark/channels`

### 2. Start a Benchmark
- Enter a valid YouTube Channel ID (e.g., `UCuAXFkgsw1L7xaCfnd5JJOw`)
- Click "Start Channel Benchmark"
- Form should hide and progress monitor should appear

### 3. Observe Updates
- Initially, all steps should show "Pending"
- As Edge Functions execute, statuses should update to "Processing" then "Completed"
- The UI should update automatically without page refresh

### 4. Check Browser Console
Look for log messages:
```
[Form] Submitting channel ID: ...
[Form] Benchmark started successfully: ...
[Monitor] Setting up Realtime subscription for task: ...
[Monitor] Initial task status: ...
[Monitor] Subscription status: SUBSCRIBED
[Monitor] Successfully subscribed to task updates
[Monitor] Realtime update received: ...
[Monitor] Updating task status: ...
[Monitor] All steps completed!
```

## Prerequisites for Full Testing

For the system to work end-to-end, you need:

1. **Edge Function Deployed**
   ```bash
   supabase functions deploy enrichment-pipeline-starter
   ```

2. **RapidAPI Key in Vault**
   ```bash
   supabase secrets set rapidapi_key_1760651731629=YOUR_KEY
   ```

3. **Supabase Realtime Enabled**
   - Realtime must be enabled for the `channel_enrichment_tasks` table
   - Check in Supabase Dashboard → Database → Replication

## Database Table

The monitoring system reads from `channel_enrichment_tasks` table:

```sql
SELECT
  id,
  channel_id,
  overall_status,
  categorization_status,
  socialblade_status,
  fetch_videos_status,
  baseline_stats_status,
  outlier_analysis_status
FROM channel_enrichment_tasks
WHERE id = :task_id
```

## Future Enhancements

Potential improvements to consider:

1. **Progress Percentage**: Add percentage complete (e.g., "3/5 steps completed")
2. **Elapsed Time**: Show time elapsed for each step
3. **Error Details**: Display error messages from failed steps
4. **Result Preview**: Show snippet of results for completed steps
5. **Cancel Button**: Allow user to cancel in-progress benchmark
6. **Multiple Tasks**: Monitor multiple benchmarks simultaneously
7. **Notifications**: Browser notifications when benchmark completes
8. **Retry Failed Steps**: Button to retry individual failed steps

## Troubleshooting

### Monitor Not Updating
- Check browser console for subscription errors
- Verify Realtime is enabled in Supabase Dashboard
- Check network tab for WebSocket connection
- Ensure correct task ID is being used

### "Live Updates" Not Showing
- Subscription may have failed
- Check Supabase credentials in `.env`
- Verify table permissions in Supabase RLS policies

### Steps Stuck on Pending
- Edge Function may not be deployed
- Check Edge Function logs in Supabase Dashboard
- Verify RapidAPI key is set in Vault
- Check Server Action console logs for invocation errors

## Related Files

- [channel-benchmark-form.tsx](./components/channel-benchmark-form.tsx) - Form component
- [benchmark-progress-monitor.tsx](./components/benchmark-progress-monitor.tsx) - Monitor component
- [status-step.tsx](./components/status-step.tsx) - Step component
- [actions.ts](./actions.ts) - Server Action
- [lib/drizzle.ts](../../../../lib/drizzle.ts) - Database schema
- [supabase/functions/enrichment-pipeline-starter](../../../../supabase/functions/enrichment-pipeline-starter/) - Edge Function

## Summary

The real-time monitoring system provides a production-ready solution for tracking the enrichment pipeline progress. It leverages Supabase Realtime for instant updates, React state management for UI reactivity, and proper subscription cleanup to prevent memory leaks. The modular component architecture makes it easy to reuse and extend.
