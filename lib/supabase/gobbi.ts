/**
 * Supabase client for Gobbi's production database
 * Used for API Queue feature and Production Webhooks management
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client connected to Gobbi's production database
 * Uses anon key - respects RLS policies
 * Used for read-only operations or when RLS is properly configured
 *
 * Returns null if environment variables are not configured (e.g., in Vercel build)
 */
export function createGobbiClient() {
  const GOBBI_SUPABASE_URL = process.env.GOBBI_SUPABASE_URL
  const GOBBI_SUPABASE_ANON_KEY = process.env.GOBBI_SUPABASE_ANON_KEY

  if (!GOBBI_SUPABASE_URL || !GOBBI_SUPABASE_ANON_KEY) {
    console.warn('Gobbi Supabase credentials not configured - API Queue will use mock data')
    return null
  }

  return createSupabaseClient(GOBBI_SUPABASE_URL, GOBBI_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // No session needed for API Queue
    },
  })
}

/**
 * Creates an Admin Supabase client for Gobbi's database
 * Uses service role key - BYPASSES Row Level Security (RLS)
 * ONLY use in server-side code (Server Actions, API routes)
 *
 * Used for:
 * - Production Webhooks management (CRUD operations)
 * - Other admin operations requiring full access
 *
 * Returns null if environment variables are not configured
 */
export function createGobbiAdminClient() {
  const GOBBI_SUPABASE_URL = process.env.GOBBI_SUPABASE_URL
  const GOBBI_SUPABASE_SERVICE_ROLE_KEY = process.env.GOBBI_SUPABASE_SERVICE_ROLE_KEY

  if (!GOBBI_SUPABASE_URL || !GOBBI_SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Gobbi Admin credentials not configured')
    return null
  }

  return createSupabaseClient(GOBBI_SUPABASE_URL, GOBBI_SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
    },
  })
}
