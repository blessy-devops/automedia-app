// lib/gobbi-client.ts
// Cliente Supabase para acessar o banco do Gobbi

import { createClient } from '@supabase/supabase-js'

const GOBBI_URL = process.env.GOBBI_SUPABASE_URL || 'https://eafkhsmgrzywrhviisdl.supabase.co'
const GOBBI_KEY =
  process.env.GOBBI_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZmtoc21ncnp5d3Jodmlpc2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1MjIzMywiZXhwIjoyMDYzNTI4MjMzfQ.Tiaai7QQLOhuRnd-l2mg1RVC_NXM7XVgOKNxjQQY98E'

/**
 * Cliente Supabase do Gobbi
 * Usado APENAS no servidor (Server Actions, Edge Functions)
 */
export const gobbiClient = createClient(GOBBI_URL, GOBBI_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
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
