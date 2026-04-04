import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

export function createClient() {
  if (client) return client
  client = createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          // Proxy Supabase requests through our domain to avoid ISP blocks
          if (typeof window !== 'undefined' && typeof input === 'string' && input.startsWith(supabaseUrl)) {
            const path = input.slice(supabaseUrl.length)
            return fetch(`${window.location.origin}/supabase${path}`, init)
          }
          return fetch(input, init)
        },
      },
    },
  )
  return client
}
