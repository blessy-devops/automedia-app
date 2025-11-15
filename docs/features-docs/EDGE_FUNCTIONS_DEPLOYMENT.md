# Edge Functions Deployment Guide

This guide explains how to deploy and test the enrichment pipeline Edge Functions.

## Prerequisites

1. **Supabase CLI Installed**
   ```bash
   # Install via npm
   npm install -g supabase

   # Or via Homebrew (macOS)
   brew install supabase/tap/supabase
   ```

2. **Supabase Project Linked**
   ```bash
   # Link to your Supabase project
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Environment Variables Set**
   Ensure your `.env` file contains:
   ```bash
   SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

## Edge Functions Overview

The enrichment pipeline consists of 6 Edge Functions:

1. **enrichment-pipeline-starter** - Fetches initial channel details from RapidAPI
2. **enrichment-orchestrator** - Coordinates the pipeline workflow (optional, currently unused)
3. **enrichment-step-1-categorization** - Categorizes channel using LLM
4. **enrichment-step-2-socialblade** - Fetches SocialBlade metrics (STUB)
5. **enrichment-step-3-fetch-videos** - Fetches channel videos (STUB)
6. **enrichment-step-4-baseline-stats** - Calculates performance baselines (STUB)
7. **enrichment-step-5-outlier-analysis** - Identifies outlier videos (STUB)

## Required Secrets

Before deploying, set the required secrets in Supabase Vault:

### 1. RapidAPI Key
Used by `enrichment-pipeline-starter` and `enrichment-step-1-categorization`:

```bash
supabase secrets set rapidapi_key_1760651731629=YOUR_RAPIDAPI_KEY
```

To get a RapidAPI key:
1. Sign up at https://rapidapi.com/
2. Subscribe to "YouTube API v3" by Glavier
3. Copy your API key from the dashboard

### 2. OpenRouter API Key
Used by `enrichment-step-1-categorization` for LLM categorization:

```bash
supabase secrets set openrouter_key_1760655833491=YOUR_OPENROUTER_KEY
```

To get an OpenRouter key:
1. Sign up at https://openrouter.ai/
2. Add credits to your account (starts at $5)
3. Generate an API key from settings

### Verify Secrets
```bash
supabase secrets list
```

## Deployment Commands

### Deploy All Functions at Once
```bash
# Deploy all Edge Functions in the supabase/functions directory
supabase functions deploy
```

### Deploy Individual Functions
```bash
# Deploy only the pipeline starter
supabase functions deploy enrichment-pipeline-starter

# Deploy only the categorization step
supabase functions deploy enrichment-step-1-categorization

# Deploy stub functions
supabase functions deploy enrichment-step-2-socialblade
supabase functions deploy enrichment-step-3-fetch-videos
supabase functions deploy enrichment-step-4-baseline-stats
supabase functions deploy enrichment-step-5-outlier-analysis
```

### Deploy with Verification
```bash
# Deploy and verify each function
supabase functions deploy enrichment-pipeline-starter --verify-jwt false
```

## Post-Deployment Verification

### 1. Check Function Status
Visit Supabase Dashboard:
- Navigate to **Edge Functions**
- Verify all functions are listed and active
- Check deployment timestamps

### 2. View Function Logs
```bash
# View logs for a specific function
supabase functions logs enrichment-pipeline-starter

# View logs with tail (real-time)
supabase functions logs enrichment-pipeline-starter --follow
```

### 3. Test Function Invocation
```bash
# Test via curl
curl -i --location --request POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/enrichment-pipeline-starter' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
    "taskId": 1
  }'
```

## Testing the Complete Pipeline

### Step 1: Create a Test Job and Task

Run this SQL in Supabase SQL Editor:

```sql
-- Create a test job
INSERT INTO channel_enrichment_jobs (channel_ids, total_channels, status)
VALUES (ARRAY['UCuAXFkgsw1L7xaCfnd5JJOw'], 1, 'pending')
RETURNING id;

-- Note the job ID, then create a task (replace <job_id> with the returned ID)
INSERT INTO channel_enrichment_tasks (enrichment_job_id, channel_id)
VALUES (<job_id>, 'UCuAXFkgsw1L7xaCfnd5JJOw')
RETURNING id;
```

### Step 2: Start the Pipeline via UI

1. Navigate to: `http://localhost:3003/benchmark/channels`
2. Enter the YouTube Channel ID: `UCuAXFkgsw1L7xaCfnd5JJOw`
3. Click "Start Channel Benchmark"
4. Observe the real-time progress monitor

### Step 3: Monitor Progress

#### Via UI
- Watch the progress monitor update in real-time
- Each step should transition: Pending → Processing → Completed

#### Via Database
```sql
-- Check task status
SELECT
  id,
  channel_id,
  overall_status,
  categorization_status,
  socialblade_status,
  fetch_videos_status,
  baseline_stats_status,
  outlier_analysis_status,
  created_at,
  completed_at
FROM channel_enrichment_tasks
ORDER BY created_at DESC
LIMIT 1;
```

#### Via Edge Function Logs
```bash
# Watch logs in real-time
supabase functions logs enrichment-pipeline-starter --follow
```

### Step 4: Verify Results

#### Check Channel Categorization
```sql
SELECT
  channel_id,
  channel_name,
  categorization
FROM benchmark_channels
WHERE channel_id = 'UCuAXFkgsw1L7xaCfnd5JJOw';
```

Expected result:
```json
{
  "primary_category": "Technology",
  "secondary_category": "Education",
  "content_type": "Tutorials",
  "target_audience": "Developers",
  "reasoning": "..."
}
```

#### Check Task Completion
```sql
SELECT
  categorization_status,
  categorization_started_at,
  categorization_completed_at,
  categorization_result
FROM channel_enrichment_tasks
WHERE channel_id = 'UCuAXFkgsw1L7xaCfnd5JJOw'
ORDER BY created_at DESC
LIMIT 1;
```

## Troubleshooting

### Common Issues

#### Issue: "Secret not found in Vault"
**Solution**:
```bash
# Set the secret
supabase secrets set rapidapi_key_1760651731629=YOUR_KEY

# Verify it's set
supabase secrets list
```

#### Issue: "Function deployment failed"
**Solution**:
```bash
# Check Supabase CLI version
supabase --version

# Update if needed
npm update -g supabase

# Retry deployment
supabase functions deploy FUNCTION_NAME --debug
```

#### Issue: "RapidAPI request failed: 429 Too Many Requests"
**Solution**:
- You've exceeded your RapidAPI rate limit
- Wait for the rate limit to reset (usually monthly)
- Upgrade your RapidAPI subscription plan
- Use a different API key if available

#### Issue: "OpenRouter API failed: 401 Unauthorized"
**Solution**:
- Verify your OpenRouter API key is correct
- Check that you have sufficient credits in your OpenRouter account
- Ensure the secret is set correctly: `supabase secrets list`

#### Issue: "Task stuck in 'processing' status"
**Solution**:
1. Check Edge Function logs for errors:
   ```bash
   supabase functions logs enrichment-step-1-categorization
   ```
2. Manually reset the task:
   ```sql
   UPDATE channel_enrichment_tasks
   SET categorization_status = 'pending'
   WHERE id = <task_id>;
   ```
3. Retry the benchmark from the UI

#### Issue: "Real-time updates not working"
**Solution**:
1. Verify Realtime is enabled in Supabase Dashboard
2. Check the browser console for WebSocket errors
3. Ensure RLS policies allow reading `channel_enrichment_tasks`

### Debug Mode

Enable detailed logging for debugging:

```bash
# Deploy with debug output
supabase functions deploy enrichment-pipeline-starter --debug

# View verbose logs
supabase functions logs enrichment-pipeline-starter --limit 100
```

## Performance Monitoring

### Latency Benchmarks

Expected processing times per step:

| Step | Operation | Expected Time |
|------|-----------|---------------|
| 0    | Pipeline Starter (RapidAPI) | 1-2s |
| 1    | Categorization (LLM) | 2-5s |
| 2    | SocialBlade (stub) | 1s |
| 3    | Video Fetching (stub) | 1s |
| 4    | Baseline Stats (stub) | 1s |
| 5    | Outlier Analysis (stub) | 1s |
| **Total** | **Complete Pipeline** | **7-11s** |

### Cost Estimates

Approximate costs per channel:

| Service | Cost per Request | Monthly (1000 channels) |
|---------|------------------|-------------------------|
| RapidAPI (YouTube API) | $0.001 | $1.00 |
| OpenRouter (GPT-4o-mini) | $0.0003 | $0.30 |
| Supabase Edge Functions | Free tier | $0.00 |
| **Total** | **$0.0013** | **$1.30** |

## Rollback Procedure

If a deployment causes issues, rollback to a previous version:

```bash
# List previous versions
supabase functions list --show-history enrichment-pipeline-starter

# Rollback to a specific version
supabase functions deploy enrichment-pipeline-starter --version <version_id>
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        run: |
          npm install -g supabase

      - name: Link Supabase Project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy Functions
        run: supabase functions deploy
```

## Next Steps

1. **Implement Remaining Steps**: Replace stub functions with actual implementations
   - Step 2: SocialBlade scraping
   - Step 3: YouTube Data API video fetching
   - Step 4: Baseline statistics calculation
   - Step 5: Outlier detection algorithm

2. **Add Error Handling**: Implement retry logic and better error recovery

3. **Optimize Performance**: Add caching, batch processing, parallel execution

4. **Monitor Production**: Set up alerts for failed tasks and high latency

## Useful Commands Reference

```bash
# Deploy all functions
supabase functions deploy

# Deploy single function
supabase functions deploy FUNCTION_NAME

# View logs (real-time)
supabase functions logs FUNCTION_NAME --follow

# View logs (last 100 lines)
supabase functions logs FUNCTION_NAME --limit 100

# List all functions
supabase functions list

# Delete a function
supabase functions delete FUNCTION_NAME

# Set secret
supabase secrets set KEY=VALUE

# List secrets
supabase secrets list

# Unset secret
supabase secrets unset KEY
```

## Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [RapidAPI YouTube API Docs](https://rapidapi.com/Glavier/api/youtube-api-v3)
- [Project Edge Functions README](./supabase/functions/README.md)
