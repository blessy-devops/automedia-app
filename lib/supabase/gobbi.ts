/**
 * Supabase client for Gobbi's production database
 * Used exclusively for API Queue feature
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client connected to Gobbi's production database
 * This client is used exclusively for the API Queue feature
 *
 * Uses ANON_KEY (subject to Row Level Security policies)
 * For read-only operations or public data access.
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
 * Creates a Supabase client with SERVICE_ROLE key for Gobbi's production database
 *
 * ⚠️ WARNING: This client BYPASSES Row Level Security (RLS)
 * Only use in secure Server Actions for write operations that require admin privileges.
 *
 * Use cases:
 * - Server Actions that need to write to production_videos table
 * - Operations that must bypass RLS policies
 *
 * Returns null if environment variables are not configured
 */
export function createGobbiServiceClient() {
  const GOBBI_SUPABASE_URL = process.env.GOBBI_SUPABASE_URL
  const GOBBI_SUPABASE_SERVICE_ROLE_KEY = process.env.GOBBI_SUPABASE_SERVICE_ROLE_KEY

  if (!GOBBI_SUPABASE_URL || !GOBBI_SUPABASE_SERVICE_ROLE_KEY) {
    console.error('⚠️ Gobbi Service Role credentials not configured')
    return null
  }

  return createSupabaseClient(GOBBI_SUPABASE_URL, GOBBI_SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
