/**
 * Supabase Clients Export
 *
 * Centralized export of all Supabase client utilities.
 * Import from this file for better code organization.
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createServerClient } from '@/lib/supabase'
 *
 * // Client Component
 * import { createBrowserClient } from '@/lib/supabase'
 *
 * // Admin (secure server only)
 * import { createAdminClient, getVaultSecret } from '@/lib/supabase'
 * ```
 */

// Server Client (for Server Components, Server Actions, Route Handlers)
export { createClient as createServerClient } from './server'

// Browser Client (for Client Components)
export { createClient as createBrowserClient } from './client'

// Admin Client (for Edge Functions, secure server operations)
export { createAdminClient, getVaultSecret } from './admin'

// Types
export type { Database } from '@/types/supabase'
