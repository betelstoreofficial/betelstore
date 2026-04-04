import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

/**
 * Rewrites a Supabase storage URL to go through the local proxy,
 * hiding the Supabase hostname from the browser.
 */
export function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (SUPABASE_URL && url.startsWith(SUPABASE_URL)) {
    return `/supabase${url.slice(SUPABASE_URL.length)}`
  }
  return url
}
