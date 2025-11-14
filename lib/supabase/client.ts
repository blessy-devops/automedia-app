import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

/**
 * Create Supabase Browser Client
 *
 * Use this client in:
 * - Client Components (marked with 'use client')
 * - Browser-side event handlers
 * - React hooks
 *
 * This client respects Row Level Security (RLS) and uses the authenticated user's context.
 * It automatically handles cookie management in the browser.
 *
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 * import { useEffect, useState } from 'react'
 *
 * export default function ChannelsList() {
 *   const [channels, setChannels] = useState([])
 *   const supabase = createClient()
 *
 *   useEffect(() => {
 *     async function loadChannels() {
 *       const { data } = await supabase.from('benchmark_channels').select()
 *       setChannels(data || [])
 *     }
 *     loadChannels()
 *   }, [])
 *
 *   return <div>{channels.length} channels</div>
 * }
 * ```
 *
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function LoginButton() {
 *   const supabase = createClient()
 *
 *   const handleLogin = async () => {
 *     await supabase.auth.signInWithOAuth({
 *       provider: 'google',
 *       options: {
 *         redirectTo: `${location.origin}/auth/callback`,
 *       },
 *     })
 *   }
 *
 *   return <button onClick={handleLogin}>Login</button>
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
