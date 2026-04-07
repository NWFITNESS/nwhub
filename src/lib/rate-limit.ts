/**
 * Distributed rate limiter — uses Upstash Redis if configured, falls back to in-memory.
 *
 * In-memory mode is fine for dev / single-instance, but Vercel serverless functions
 * scale horizontally and the in-memory map resets between invocations, so production
 * should set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 *
 * Usage:
 *   const allowed = await rateLimit(`chat:${ip}`, 20, 60_000) // 20 req/min
 *   if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// ── Upstash client (lazy, cached per window/limit combo) ────────────────────
const upstashCache = new Map<string, Ratelimit>()

function getUpstash(limit: number, windowSeconds: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const cacheKey = `${limit}:${windowSeconds}`
  const cached = upstashCache.get(cacheKey)
  if (cached) return cached

  try {
    const redis = new Redis({ url, token })
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: false,
      prefix: 'nwhub-rl',
    })
    upstashCache.set(cacheKey, limiter)
    return limiter
  } catch {
    return null
  }
}

// ── In-memory fallback ──────────────────────────────────────────────────────
interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

function memoryRateLimit(key: string, limit: number, windowMs: number): boolean {
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

// ── Public API ──────────────────────────────────────────────────────────────
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const upstash = getUpstash(limit, Math.ceil(windowMs / 1000))
  if (upstash) {
    const result = await upstash.limit(key)
    return result.success
  }
  return memoryRateLimit(key, limit, windowMs)
}

/** Extract a best-effort IP from request headers (works behind Vercel / reverse proxies) */
export function getClientIp(req: Request): string {
  return (
    (req.headers as Headers).get('x-forwarded-for')?.split(',')[0].trim() ??
    (req.headers as Headers).get('x-real-ip') ??
    'unknown'
  )
}
