/**
 * Simple in-memory rate limiter.
 * Note: This works per-server-instance. On Vercel serverless,
 * each function invocation may have its own memory, so this provides
 * basic protection but not guaranteed enforcement across all instances.
 * For production-grade rate limiting, use Upstash Redis or Vercel WAF.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // seconds until reset
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const entry = store.get(key)

  // No existing entry or window expired — start fresh
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowSeconds }
  }

  // Within window — check count
  if (entry.count >= config.maxRequests) {
    const resetIn = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, resetIn }
  }

  // Increment count
  entry.count++
  const resetIn = Math.ceil((entry.resetAt - now) / 1000)
  return { allowed: true, remaining: config.maxRequests - entry.count, resetIn }
}
