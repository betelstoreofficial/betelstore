import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// Use proxy path to avoid ISP blocks on *.supabase.co
const supabaseUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/supabase`
  : process.env.NEXT_PUBLIC_SUPABASE_URL!

export function createClient() {
  if (client) return client
  client = createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return client
}
