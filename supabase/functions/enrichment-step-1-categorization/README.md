# Enrichment Step 1: Channel Categorization

## Overview

This Edge Function is the first step in the enrichment pipeline. It uses an LLM (GPT-4o-mini via OpenRouter) to analyze a YouTube channel's metadata and popular videos to categorize it using a **structured taxonomy system**.

**⚠️ IMPORTANT**: This implementation follows the **exact logic from the n8n workflow** for consistency with the existing system.

## Taxonomy Structure

The categorization system uses 5 hierarchical fields:

1. **Niche**: Broadest classification (e.g., `religion`, `technology`, `entertainment`)
2. **Subniche**: Specific section within niche (e.g., `biblical_stories`, `web_development`)
3. **Microniche**: Unique positioning tag (e.g., `fast_paced_tutorials`, `keto_diet`)
4. **Category**: Content structure (e.g., `narrative`, `tutorial`, `top_list`)
5. **Format**: Production technique (e.g., `animation`, `screen_recording`, `live_action`)

## Key Features

✅ **Pre-flight Check**: Skips if already categorized (saves cost)\
✅ **Filters Shorts**: Removes videos < 240s for accurate categorization\
✅ **Sorts by Popularity**: Uses top 10 popular long-form videos\
✅ **Dynamic Options**: Loads valid options from 4 database tables\
✅ **Robust Parsing**: Handles multiple LLM response formats\
✅ **n8n Aligned**: Exact same logic as legacy workflow

## Process Flow

1. Check if categorization exists → Skip if yes
2. Update task status to 'processing'
3. Fetch channel details from `benchmark_channels`
4. Fetch 30 popular videos from RapidAPI
5. Filter Shorts (< 240s), sort by views, take top 10
6. Fetch valid options from 4 structure tables (parallel)
7. Build LLM prompt with taxonomy & validation rules
8. Call OpenRouter API (GPT-4o-mini, temp 0.3)
9. Parse & validate response (robust parsing)
10. Update `benchmark_channels.categorization`
11. Update task status to 'completed'
12. Invoke `enrichment-step-2-socialblade`

## Response Example

```json
{
  "success": true,
  "categorization": {
    "niche": "technology",
    "subniche": "web_development",
    "microniche": "fast_paced_tutorials",
    "category": "tutorial",
    "format": "screen_recording"
  }
}
```

## Performance

- **Time (new channel)**: 2-5 seconds
- **Time (already categorized)**: ~100ms (skipped)
- **Cost per NEW channel**: ~$0.0013
- **Cost if skipped**: $0

## Required Secrets

```bash
supabase secrets set rapidapi_key_1760651731629=YOUR_KEY
supabase secrets set openrouter_key_1760655833491=YOUR_KEY
```

## Deployment

```bash
supabase functions deploy enrichment-step-1-categorization
```

## Monitoring

```bash
# View logs
supabase functions logs enrichment-step-1-categorization --follow

# Check categorization in database
SELECT categorization FROM benchmark_channels
WHERE channel_id = 'UCuAXFkgsw1L7xaCfnd5JJOw';
```

See full documentation for detailed taxonomy definitions, error handling, and troubleshooting.
