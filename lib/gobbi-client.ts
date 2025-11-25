// lib/gobbi-client.ts
// Cliente Supabase para acessar o banco do Gobbi

import { createClient } from '@supabase/supabase-js'

const GOBBI_URL = process.env.GOBBI_SUPABASE_URL
const GOBBI_KEY = process.env.GOBBI_SUPABASE_ANON_KEY

if (!GOBBI_URL || !GOBBI_KEY) {
  throw new Error('⚠️ GOBBI_SUPABASE_URL and GOBBI_SUPABASE_ANON_KEY must be set in environment variables')
}

/**
 * Cliente Supabase do Gobbi
 * Usado APENAS no servidor (Server Actions, Edge Functions)
 */
export const gobbiClient = createClient(GOBBI_URL, GOBBI_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 0, // Disable Realtime (not used in Gobbi client)
    },
  },
})

/**
 * Helper para validar que está rodando no servidor
 */
export function ensureServerSide() {
  if (typeof window !== 'undefined') {
    throw new Error('Gobbi client can only be used server-side!')
  }
}
