import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Create Supabase Admin Client
 *
 * ⚠️ SECURITY WARNING ⚠️
 * This client has FULL ADMINISTRATIVE PRIVILEGES and BYPASSES Row Level Security (RLS).
 *
 * Use this client ONLY when:
 * - Running in Edge Functions (secure server environment)
 * - Accessing Supabase Vault for secrets
 * - Performing system-level operations that require admin access
 * - Bulk operations that need to bypass RLS
 *
 * NEVER use this client:
 * - In Client Components
 * - In API routes accessible to end users
 * - For regular CRUD operations (use server.ts or client.ts instead)
 *
 * NEVER expose the SUPABASE_SERVICE_ROLE_KEY to the client side.
 *
 * @example
 * ```tsx
 * // ✅ CORRECT: In an Edge Function
 * import { createAdminClient } from '@/lib/supabase/admin'
 *
 * export async function POST(req: Request) {
 *   const supabase = createAdminClient()
 *
 *   // Access Vault to get API keys
 *   const { data: secrets } = await supabase.rpc('get_secret', {
 *     secret_name: 'youtube_api_key'
 *   })
 *
 *   // Perform bulk operation bypassing RLS
 *   await supabase.from('benchmark_channels').insert(bulkData)
 *
 *   return Response.json({ success: true })
 * }
 * ```
 *
 * @example
 * ```tsx
 * // ❌ WRONG: Never use in Client Component
 * 'use client'
 * import { createAdminClient } from '@/lib/supabase/admin' // NEVER DO THIS
 * ```
 */
export function createAdminClient() {
  // Validate that we're in a secure server environment
  if (typeof window !== 'undefined') {
    throw new Error(
      '🚨 SECURITY ERROR: Admin client cannot be used in browser environment! ' +
        'This would expose the service role key. Use createClient from ' +
        '@/lib/supabase/client instead.'
    )
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ' +
        'Make sure these are set in your .env file.'
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Helper function to access Supabase Vault secrets
 *
 * @example
 * ```ts
 * const youtubeApiKey = await getVaultSecret('youtube_api_key')
 * const openaiApiKey = await getVaultSecret('openai_api_key')
 * ```
 */
export async function getVaultSecret(secretName: string): Promise<string | null> {
  const supabase = createAdminClient()

  try {
    const { data, error } = await (supabase as any).rpc('get_secret', {
      secret_name: secretName,
    })

    if (error) {
      console.error(`Failed to get secret "${secretName}" from Vault:`, error)
      return null
    }

    return data as string
  } catch (error) {
    console.error(`Error accessing Vault secret "${secretName}":`, error)
    return null
  }
}
