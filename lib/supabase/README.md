# Supabase Clients

Esta pasta contém os clientes Supabase configurados para diferentes contextos de uso no Next.js.

## Quick Start

### Server Component

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('benchmark_channels').select()
  return <div>{data?.length} channels</div>
}
```

### Client Component

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function Component() {
  const supabase = createClient()
  // Use in effects, handlers, etc
}
```

### Admin Operations (secure server only)

```tsx
import { createAdminClient, getVaultSecret } from '@/lib/supabase/admin'

export async function POST() {
  const apiKey = await getVaultSecret('youtube_api_key')
  const supabase = createAdminClient()
  // Admin operations that bypass RLS
}
```

## Files

- **[server.ts](server.ts)** - Server Components, Server Actions, Route Handlers
- **[client.ts](client.ts)** - Client Components, Browser interactions
- **[admin.ts](admin.ts)** - Edge Functions, Admin operations (⚠️ bypasses RLS)
- **[index.ts](index.ts)** - Centralized exports

## Documentation

See [SUPABASE_SETUP.md](../../SUPABASE_SETUP.md) for complete documentation.

## Security Notes

- ✅ `server.ts` and `client.ts` respect Row Level Security (RLS)
- ⚠️ `admin.ts` bypasses RLS - use only in secure environments
- ❌ Never use `admin.ts` in Client Components
- ❌ Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
