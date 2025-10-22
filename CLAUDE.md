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

# Database (Drizzle ORM)
pnpm db:generate            # Generate migrations from schema
pnpm db:push                # Push schema to database (development)
pnpm db:migrate             # Run cleanup and migration scripts
pnpm db:studio              # Open Drizzle Studio for database inspection

# Supabase Edge Functions
supabase functions deploy --project-ref YOUR_PROJECT_REF
supabase functions logs enrichment-step-1-categorization --follow
supabase secrets set rapidapi_key_1760651731629=YOUR_KEY --project-ref YOUR_PROJECT_REF
```

## Architecture Overview

### Database Layer (Drizzle ORM)

**Two Connection Types:**
- `sqlPooled` (via `DATABASE_URL`) - Shared pooler for fast queries (default)
- `sqlDirect` (via `DATABASE_URL_DIRECT`) - Direct connection for complex workflows with AI/APIs

**Key Tables:**
- `benchmark_channels` - YouTube channel metadata with AI categorization
- `benchmark_videos` - Video metrics with performance scores
- `benchmark_channels_baseline_stats` - Calculated performance baselines (14d, 30d, 90d, historical)
- `channel_enrichment_jobs` - Enrichment pipeline job tracking
- `channel_enrichment_tasks` - Individual channel enrichment tasks
- `enrichment_sub_workflows` - Step-by-step pipeline progress

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

// Performance metrics use LEFT JOIN pattern
db.select()
  .from(benchmarkChannelsTable)
  .leftJoin(
    benchmarkChannelsBaselineStatsTable,
    eq(benchmarkChannelsTable.channelId, benchmarkChannelsBaselineStatsTable.channelId)
  )
```

### Next.js 15 Patterns

**Server Components (Default):**
- All pages are Server Components by default
- Use `searchParams` as async Promise: `searchParams: Promise<{ [key: string]: string | string[] | undefined }>`
- Always `await searchParams` before use
- Build dynamic Drizzle queries based on URL params for server-side filtering/sorting

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
1. `enrichment-pipeline-starter` - Fetches channel details from RapidAPI
2. `enrichment-step-1-categorization` - AI categorization with GPT-4o-mini (✅ COMPLETE)
3. `enrichment-step-2-socialblade` - SocialBlade metrics (🚧 STUB)
4. `enrichment-step-3-fetch-videos` - Video fetching (🚧 STUB)
5. `enrichment-step-4-baseline-stats` - Performance baselines (🚧 STUB)
6. `enrichment-step-5-outlier-analysis` - Outlier detection (🚧 STUB)

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
- Supabase Realtime subscriptions on `enrichment_sub_workflows` table
- Component: `BenchmarkProgressMonitor` handles WebSocket connection
- Updates UI in real-time as pipeline progresses through steps

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

// Build conditional query
const whereConditions = []
if (minViews) whereConditions.push(gte(table.views, minViews))
if (whereConditions.length > 0) {
  query = query.where(and(...whereConditions))
}

// Apply sorting
const orderByClause = sortBy === 'views'
  ? desc(table.views)
  : desc(table.uploadDate)
const data = await query.orderBy(orderByClause).limit(100)
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
- `lib/drizzle.ts` - Schema definitions and database connections
- `scripts/cleanup-and-migrate.ts` - Migration utilities

### Server Actions
- `app/(dashboard)/benchmark/channels/actions.ts` - Channel benchmark workflow

### Edge Functions
- `supabase/functions/` - Deno-based Edge Functions for pipeline steps

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

### Drizzle ORM Conventions
- Use `sqlDirect` (dbDirect) for Edge Functions that call external APIs
- Use `sqlPooled` (db) for fast Next.js queries
- Always use conditional query building for filters/sorts
- LEFT JOIN pattern for optional relationships (channels → baseline stats)

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
