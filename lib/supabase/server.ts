import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

/**
 * Create Supabase Server Client
 *
 * Use this client in:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 *
 * This client respects Row Level Security (RLS) and uses the authenticated user's context.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('benchmark_channels').select()
 *   return <div>{data?.length} channels</div>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In a Server Action
 * 'use server'
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function createChannel(formData: FormData) {
 *   const supabase = await createClient()
 *   const { error } = await supabase
 *     .from('benchmark_channels')
 *     .insert({ channel_id: formData.get('channelId') })
 *
 *   if (error) throw error
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
