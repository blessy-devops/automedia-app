# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AutoMedia Platform** is a Next.js 15 application for YouTube channel benchmarking and enrichment with AI-powered categorization. It features a 5-step enrichment pipeline that fetches channel data, categorizes content using AI, calculates performance baselines, and detects statistical outliers.

## Development Commands

### Core Commands
```bash
# Development
pnpm dev                    # Start Next.js dev server on port 3003

# Build & Deploy
pnpm build                  # Build production bundle
pnpm start                  # Run production server
pnpm lint                   # Run ESLint

# Database (Supabase)
npx supabase migration new migration_name    # Create new migration
npx supabase db push                         # Push migrations to remote
npx supabase db reset                        # Reset local database

# Supabase Edge Functions
npx supabase functions deploy function-name --project-ref YOUR_PROJECT_REF
npx supabase functions logs function-name --follow
npx supabase secrets set SECRET_NAME=value --project-ref YOUR_PROJECT_REF
```

## Architecture Overview

### Database Layer (Supabase Client)

**⚠️ Important: We use Supabase Client directly, NOT Drizzle ORM**

**Database Access:**
- Next.js Pages/Components: `@/lib/supabase/server` - Server-side Supabase client
- Edge Functions: `@supabase/supabase-js` - Direct Supabase client with service role
- No pooled/direct connection distinction - Supabase handles connection pooling

**Key Tables:**
- `benchmark_channels` - YouTube channel metadata with AI categorization
- `benchmark_videos` - Video metrics with performance scores
- `benchmark_channels_baseline_stats` - Calculated performance baselines (14d, 30d, 90d, historical)
- `channel_enrichment_jobs` - Enrichment pipeline job tracking
- `channel_enrichment_tasks` - Individual channel enrichment tasks (status tracking)

**Important Schema Patterns:**
```typescript
// Categorization JSONB structure
categorization: {
  niche: string         // e.g., "technology"
  subniche: string      // e.g., "web_development"
  microniche: string    // e.g., "fast_paced_tutorials"
  category: string      // e.g., "tutorial"
  format: string        // e.g., "screen_recording"
}

// Supabase query pattern with JOIN
const { data } = await supabase
  .from('benchmark_channels')
  .select('*, benchmark_channels_baseline_stats(*)')
  .eq('channel_id', channelId)
  .single()
```

### Next.js 15 Patterns

**Server Components (Default):**
- All pages are Server Components by default
- Use `searchParams` as async Promise: `searchParams: Promise<{ [key: string]: string | string[] | undefined }>`
- Always `await searchParams` before use
- Build dynamic Supabase queries based on URL params for server-side filtering/sorting

**Client Components:**
- Mark with `"use client"` directive
- Used for: data tables (TanStack Table), forms, real-time monitoring, interactive UI
- URL-based state: Use `useRouter` and `useSearchParams` to update URL params instead of local filters

**Server Actions Pattern:**
```typescript
'use server'

export async function startChannelBenchmark(channelId: string) {
  // 1. Validate input
  // 2. Create database records
  // 3. Invoke Supabase Edge Function
  // 4. Return immediately (non-blocking)
}
```

### Enrichment Pipeline Architecture

**5-Step Pipeline Flow:**
1. `enrichment-pipeline-starter` - Fetches channel details from RapidAPI YouTube v3 API
2. `enrichment-step-1-categorization` - AI categorization with Claude 3.5 Sonnet via OpenRouter (✅ COMPLETE)
3. `enrichment-step-2-socialblade` - Scrapes SocialBlade metrics + calculates baseline stats (14d, 30d, 90d) (✅ COMPLETE)
4. `enrichment-step-3-recent-videos` - Fetches recent videos from YouTube API (sorted by upload date) (✅ COMPLETE)
5. `enrichment-step-4-trending-videos` - Fetches trending videos from YouTube API (sorted by views) (✅ COMPLETE)
6. `enrichment-step-5-outlier-calc` - Calculates performance metrics and identifies outlier videos (✅ COMPLETE)

**Important Notes:**
- **Baseline statistics** are calculated in Step 2 (SocialBlade) and stored in `benchmark_channels_baseline_stats` table
- Step 5 (outlier-calc) reads from `benchmark_channels_baseline_stats` to calculate performance ratios
- Each step updates its corresponding status field in `channel_enrichment_tasks`:
  - `categorization_status`
  - `socialblade_status`
  - `recent_videos_status`
  - `trending_videos_status`
  - `outlier_analysis_status`

**Pipeline Invocation:**
```typescript
// From Server Action
const { data, error } = await adminClient.functions.invoke(
  'enrichment-pipeline-starter',
  {
    body: { channelId: sanitizedChannelId, taskId: task.id }
  }
)
```

**Real-time Progress Monitoring:**
- Supabase Realtime subscriptions on `channel_enrichment_tasks` table
- Component: `BenchmarkProgressMonitor` handles WebSocket connection and displays 5 pipeline steps
- Updates UI in real-time as each step completes

### UI Components (shadcn/ui)

**Installation:**
```bash
npx shadcn@latest add [component-name]
```

**Component Configuration:**
- Style: "new-york"
- Base color: "slate"
- CSS variables: enabled
- Path aliases: `@/components`, `@/lib/utils`, `@/components/ui`

**Professional Design Patterns:**
- **Toolbars**: Filters in Popover, horizontal layout with Separators, consistent h-9 heights
- **Data Tables**: Server-side filtering/sorting via URL params, client-side search with icon
- **Gallery Cards**: border-2, hover:border-primary/50, hover:shadow-xl, proper Separator usage
- **Icons**: Lucide React with consistent sizing (h-4 w-4 standard)
- **Spacing**: space-y-4 for sections, gap-4 for grids, p-4 for card content

**Reusable Components:**
- `StatCard` - Metrics display with icon, label, value, and variant (default|success|primary)
- `PerformanceBadge` - Color-coded performance score indicator
- `DataTableToolbar` - Filter popover with badge count, sort select, view toggle

### Data Table Pattern

**Server-Side (Page Component):**
```typescript
// Extract URL params
const params = await searchParams
const sortBy = (params.sortBy as string) || 'upload_date'
const minViews = params.minViews ? Number(params.minViews) : undefined

// Build conditional Supabase query
let query = supabase.from('benchmark_videos').select('*')

// Apply filters
if (minViews !== undefined && !isNaN(minViews)) {
  query = query.gte('views', minViews)
}

// Apply sorting
if (sortBy === 'views') {
  query = query.order('views', { ascending: false })
} else {
  query = query.order('upload_date', { ascending: false })
}

// Limit results
const { data, error } = await query.limit(100)
```

**Client-Side (Data Table Component):**
```typescript
// URL param updates
const updateSearchParams = (key: string, value: string) => {
  const params = new URLSearchParams(searchParams.toString())
  if (value) params.set(key, value)
  else params.delete(key)
  router.push(`${pathname}?${params.toString()}`)
}

// View toggle (local state)
const [view, setView] = useState<ViewMode>("table")

// Conditional rendering
{view === "gallery" ? <GalleryView /> : <DataTable />}
```

## Key Files & Locations

### Database
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/client.ts` - Client-side Supabase client
- `supabase/migrations/` - Database migration files

### Server Actions
- `app/(dashboard)/benchmark/channels/actions.ts` - Channel benchmark workflow
- `app/(dashboard)/videos/actions.ts` - Video folder management

### Edge Functions
- `supabase/functions/enrichment-pipeline-starter/` - Pipeline starter
- `supabase/functions/enrichment-step-1-categorization/` - AI categorization
- `supabase/functions/enrichment-step-2-socialblade/` - SocialBlade + baseline stats
- `supabase/functions/enrichment-step-3-recent-videos/` - Recent videos fetch
- `supabase/functions/enrichment-step-4-trending-videos/` - Trending videos fetch
- `supabase/functions/enrichment-step-5-outlier-calc/` - Performance analysis

### Middleware
- `middleware.ts` - Supabase session management (no route protection currently)

### Layouts
- `app/layout.tsx` - Root layout with theme provider
- `app/(dashboard)/layout.tsx` - Dashboard with expandable sidebar navigation

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=              # Pooled connection
DATABASE_URL_DIRECT=       # Direct connection for Edge Functions

# APIs (stored in Supabase Vault, not .env)
rapidapi_key_1760651731629=
openrouter_key_1760655833491=
```

## Testing Workflow

1. Navigate to http://localhost:3003/benchmark/channels
2. Enter a YouTube Channel ID (e.g., `UCuAXFkgsw1L7xaCfnd5JJOw` for Fireship)
3. Monitor real-time progress in UI
4. Check Edge Function logs: `supabase functions logs enrichment-step-1-categorization --follow`
5. Verify data in database using `pnpm db:studio`

## Important Notes

### Supabase Client Conventions
- Use `@/lib/supabase/server` in Server Components and Server Actions
- Use `@/lib/supabase/client` in Client Components
- Edge Functions use `@supabase/supabase-js` with service role key
- Always use conditional query building for filters/sorts
- Use `.select('*, related_table(*)')` pattern for joins

### Next.js 15 Breaking Changes
- `searchParams` is now async - always await it
- Middleware must return `supabaseResponse` object unchanged for session management
- Server Actions require `'use server'` directive

### shadcn/ui Best Practices
- Install components via CLI, never copy-paste
- Use Separator between logical sections
- Popover for advanced filters (keep UI clean)
- Consistent icon sizing: h-4 w-4 (default), h-3.5 w-3.5 (small)
- Badge counts on filter buttons when active

### Real-time Features
- Supabase Realtime for pipeline progress
- Toast notifications via Sonner (position: top-right, richColors)
- Optimistic UI updates where appropriate

## Performance Optimizations

- Pre-flight checks skip already-categorized channels (50% cost savings)
- Server-side filtering reduces data transfer
- LEFT JOIN only when baseline stats needed
- Limit queries to 100 results by default
- Pagination handled client-side via TanStack Table
