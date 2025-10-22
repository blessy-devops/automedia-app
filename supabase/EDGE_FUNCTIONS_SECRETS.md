# Edge Functions Secrets Configuration

This document explains how to configure API keys for the enrichment pipeline Edge Functions.

## ⚠️ Important Architecture Note

**Edge Functions use Environment Variables, NOT Supabase Vault.**

According to Supabase documentation:
> "Edge Functions should store credentials in Supabase project secrets and access them via environment variables. The Vault is primarily for storing secrets in the database that can be accessed by database functions, not directly by Edge Functions."

## Required Secrets

The enrichment pipeline requires the following secrets:

### 1. `RAPIDAPI_KEY`
- **Purpose**: Access YouTube channel data via RapidAPI
- **Used by**:
  - `enrichment-pipeline-starter` (fetch channel info)
  - `enrichment-step-3-recent-videos` (fetch recent videos)
  - `enrichment-step-4-trending-videos` (fetch trending videos)
- **How to get**: Sign up at [RapidAPI](https://rapidapi.com/) and subscribe to the YouTube API

### 2. `OPENROUTER_API_KEY`
- **Purpose**: AI-powered channel categorization using Claude
- **Used by**:
  - `video-categorization-manager` (categorize channels with LLM)
- **How to get**: Sign up at [OpenRouter](https://openrouter.ai/) and create an API key

## How to Add Secrets to Edge Functions

### Option 1: Via Supabase Dashboard (Recommended)

1. **Navigate to Edge Functions Settings**
   ```
   Supabase Dashboard → Edge Functions → Select your function → Settings → Secrets
   ```

2. **Add Each Secret**
   - Click "Add secret"
   - Enter the key name (e.g., `RAPIDAPI_KEY`)
   - Enter the secret value (your actual API key)
   - Click "Save"

3. **Repeat for All Functions**

   You need to add secrets to each function individually:
   - `enrichment-pipeline-starter`
   - `enrichment-step-3-recent-videos`
   - `enrichment-step-4-trending-videos`
   - `video-categorization-manager`

   **Note**: Secrets are function-specific in Supabase. If you want to share secrets across all functions, see Option 2.

### Option 2: Via Supabase CLI (Global Secrets)

To set secrets that apply to **all Edge Functions** in your project:

```bash
# Set RapidAPI key (for all functions)
supabase secrets set RAPIDAPI_KEY=your-actual-rapidapi-key-here

# Set OpenRouter API key (for all functions)
supabase secrets set OPENROUTER_API_KEY=your-actual-openrouter-key-here

# Verify secrets were set
supabase secrets list
```

**Advantages**:
- ✅ One command applies to all functions
- ✅ Easier to manage
- ✅ Consistent across deployments

**Prerequisites**:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref xlpkabexmwsugkmbngwm
```

## Verify Secrets Are Working

After adding secrets, test the pipeline:

1. Navigate to `/benchmark/channels` in your app
2. Enter a YouTube channel ID (e.g., `UCXrJc6KnSET4ZE3QqZGJSSA`)
3. Click "Start Benchmark"
4. Check Supabase Edge Function logs:
   - ✅ Should see: `Getting RapidAPI key from environment...`
   - ✅ Should see: `RapidAPI key retrieved successfully`
   - ❌ Should NOT see: `RAPIDAPI_KEY environment variable not found`

## Troubleshooting

### Error: `RAPIDAPI_KEY environment variable not found`

**Cause**: Secret not configured for this Edge Function

**Solution**:
```bash
# Option 1: Set globally via CLI
supabase secrets set RAPIDAPI_KEY=your-key

# Option 2: Add via Dashboard
# Dashboard → Edge Functions → [Function Name] → Settings → Secrets
```

### Error: `OPENROUTER_API_KEY environment variable not found`

**Cause**: Secret not configured for categorization function

**Solution**:
```bash
supabase secrets set OPENROUTER_API_KEY=your-key
```

### Secrets work locally but not in production

**Cause**: Local Supabase CLI uses different secrets than cloud deployment

**Solution**:
- Local development: Create `.env` file in `supabase/functions/`
- Production: Use Dashboard or `supabase secrets set` command

## Migration from Vault (Old Architecture)

**Before** (❌ Incorrect - used Vault RPC):
```typescript
const { data: vaultData, error: vaultError } = await supabase.rpc('read_secret', {
  secret_name: 'rapidapi_key_1760651731629',
})
const rapidApiKey = vaultData as string
```

**After** (✅ Correct - uses Environment Variables):
```typescript
const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')
if (!rapidApiKey) {
  throw new Error('RAPIDAPI_KEY environment variable not found')
}
```

## Security Best Practices

1. ✅ **DO** use Edge Function secrets for API keys
2. ✅ **DO** use short, descriptive secret names (e.g., `RAPIDAPI_KEY`)
3. ✅ **DO** rotate keys regularly
4. ❌ **DON'T** commit secrets to version control
5. ❌ **DON'T** use Vault for Edge Function secrets
6. ❌ **DON'T** hardcode keys in Edge Function code

## References

- [Supabase Edge Functions Secrets Documentation](https://supabase.com/docs/guides/functions/secrets)
- [Environment Variables in Edge Functions](https://supabase.com/docs/guides/functions/environment-variables)
- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault) (for database functions only)
