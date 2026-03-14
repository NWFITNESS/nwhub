/**
 * Simple in-memory rate limiter.
 * Suitable for single-instance / development deployments.
 * For multi-instance production, replace with @upstash/ratelimit + Redis.
 *
 * Usage:
 *   const allowed = rateLimit(`chat:${ip}`, 20, 60_000) // 20 req/min
 *   if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Purge stale entries every 5 minutes to prevent memory bloat
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

/** Extract a best-effort IP from request headers (works behind Vercel / reverse proxies) */
export function getClientIp(req: Request): string {
  return (
    (req.headers as Headers).get('x-forwarded-for')?.split(',')[0].trim() ??
    (req.headers as Headers).get('x-real-ip') ??
    'unknown'
  )
}
