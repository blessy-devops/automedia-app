# Enrichment Orchestrator Edge Function

## Overview

The **Enrichment Orchestrator** is the entry point for the channel enrichment pipeline after initial channel details have been fetched. It coordinates the sequential execution of 5 enrichment workflows.

## Purpose

This function acts as a simple orchestrator that kicks off the enrichment pipeline. For the initial implementation, it directly invokes the first step (categorization). Future iterations may include more sophisticated orchestration logic such as retry mechanisms, parallel execution, or conditional workflow branching.

## Pipeline Workflow

The enrichment pipeline consists of 5 sequential steps:

1. **Channel Categorization** (`enrichment-step-1-categorization`)
   - Uses LLM to categorize channel based on metadata and popular videos
   - Updates `benchmark_channels.categorization` field

2. **SocialBlade Metrics** (`enrichment-step-2-socialblade`)
   - Scrapes SocialBlade for additional metrics
   - Updates task with rank, grade, earnings estimates

3. **Video Fetching** (`enrichment-step-3-fetch-videos`)
   - Fetches all channel videos via YouTube Data API
   - Stores videos in `benchmark_videos` table

4. **Baseline Statistics** (`enrichment-step-4-baseline-stats`)
   - Calculates performance baselines (14d, 30d, 90d, historical)
   - Stores stats in `benchmark_channels_baseline_stats` table

5. **Outlier Analysis** (`enrichment-step-5-outlier-analysis`)
   - Identifies high-performing outlier videos
   - Updates `benchmark_videos.is_outlier` and performance scores

## Request Format

```json
{
  "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
  "taskId": 123
}
```

### Parameters

- `channelId` (string, required): YouTube Channel ID
- `taskId` (number, required): Task ID from `channel_enrichment_tasks` table

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "Enrichment pipeline started",
  "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
  "taskId": 123
}
```

### Error Response (500)

```json
{
  "success": false,
  "error": "Error message"
}
```

## Implementation Details

### Current Behavior

The orchestrator currently:
1. Validates input parameters
2. Invokes `enrichment-step-1-categorization` with the channelId and taskId
3. Returns success response

Each step in the pipeline is responsible for invoking the next step upon successful completion.

### Future Enhancements

Potential improvements for the orchestrator:

1. **Retry Logic**: Automatically retry failed steps with exponential backoff
2. **Parallel Execution**: Run independent steps in parallel (e.g., SocialBlade + Video Fetching)
3. **Conditional Workflows**: Skip steps based on channel characteristics or previous results
4. **Progress Tracking**: Centralized progress updates instead of delegating to each step
5. **Error Aggregation**: Collect and report errors from all steps in one place
6. **Workflow Resumption**: Resume pipeline from the last successful step on failure
7. **Priority Queuing**: Process high-priority channels first
8. **Rate Limiting**: Coordinate API rate limits across all steps

## Database Updates

This function does not directly update the database. It relies on individual step functions to:
- Update `channel_enrichment_tasks` status fields
- Save results to respective tables
- Track errors and timestamps

## Environment Variables

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations

## Deployment

Deploy this function to Supabase:

```bash
supabase functions deploy enrichment-orchestrator
```

## Invocation

This function is typically invoked by `enrichment-pipeline-starter` after fetching initial channel details:

```typescript
await supabase.functions.invoke('enrichment-orchestrator', {
  body: { channelId, taskId }
})
```

## Error Handling

- Invalid parameters return 500 error with descriptive message
- Errors during step invocation are logged but don't fail the orchestrator
- Individual steps handle their own error tracking in the database

## Monitoring

Monitor this function in Supabase Dashboard:
- Check function logs for invocation success/failure
- Review `channel_enrichment_tasks` table for pipeline progress
- Track overall completion rates via `channel_enrichment_jobs` table

## Related Functions

- **enrichment-pipeline-starter**: Fetches initial channel details and invokes this orchestrator
- **enrichment-step-1-categorization**: First step in the pipeline (channel categorization)
- **enrichment-step-2-socialblade**: Second step (SocialBlade metrics)
- **enrichment-step-3-fetch-videos**: Third step (video fetching)
- **enrichment-step-4-baseline-stats**: Fourth step (baseline statistics)
- **enrichment-step-5-outlier-analysis**: Fifth step (outlier analysis)

## Testing

Test the orchestrator with curl:

```bash
curl -i --location --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/enrichment-orchestrator' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
    "taskId": 123
  }'
```

Or test via Supabase client:

```typescript
const { data, error } = await supabase.functions.invoke('enrichment-orchestrator', {
  body: {
    channelId: 'UCuAXFkgsw1L7xaCfnd5JJOw',
    taskId: 123
  }
})
```

## Architecture Diagram

```
enrichment-pipeline-starter
    ↓
enrichment-orchestrator (THIS FUNCTION)
    ↓
enrichment-step-1-categorization
    ↓
enrichment-step-2-socialblade
    ↓
enrichment-step-3-fetch-videos
    ↓
enrichment-step-4-baseline-stats
    ↓
enrichment-step-5-outlier-analysis
    ↓
Pipeline Complete
```
