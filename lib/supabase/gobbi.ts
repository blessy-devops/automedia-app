/**
 * Supabase client for Gobbi's production database
 * Used exclusively for API Queue feature
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client connected to Gobbi's production database
 * This client is used exclusively for the API Queue feature
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
