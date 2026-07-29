import 'server-only'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Manifest,
  PublishedManifest,
  PublishedSlide,
  Screen,
  SlideWithMedia,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Screens — server-side data access + manifest resolution
//
// All reads use the admin (service-role) client. The display route is unauthed
// and keyed only on the token, so it MUST use the service role — the anon key
// has no RLS policy on these tables by design.
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch the single Reception screen. Returns null if the seed is missing. */
export async function getReceptionScreen(): Promise<Screen | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('screens').select('*').eq('slug', 'reception').maybeSingle()
  return (data as Screen | null) ?? null
}

/** Fetch a screen by its opaque token (used by the unauthed display endpoints). */
export async function getScreenByToken(token: string): Promise<Screen | null> {
  // Guard against obviously malformed tokens before hitting the DB.
  if (!token || !/^[a-f0-9]{16,64}$/i.test(token)) return null
  const admin = createAdminClient()
  const { data } = await admin.from('screens').select('*').eq('token', token).maybeSingle()
  return (data as Screen | null) ?? null
}

/** Fetch all slides for a screen, ordered by position, joined to their media. */
export async function getSlidesForScreen(screenId: string): Promise<SlideWithMedia[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('screen_slides')
    .select('*, media ( url, width, height, filename )')
    .eq('screen_id', screenId)
    .order('position', { ascending: true })
  return (data as SlideWithMedia[] | null) ?? []
}

// ─── Europe/London "today" ───────────────────────────────────────────────────
// Scheduling is date-based and the UK observes DST, so we resolve the current
// calendar date in Europe/London rather than UTC or the server's local zone.

/** Returns today's date in Europe/London as { ymd: 'YYYY-MM-DD', dow: 0..6 } where dow 0=Sunday (matching Postgres `dow` and the days_of_week schema). */
export function londonToday(now: Date = new Date()): { ymd: string; dow: number } {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now) // en-CA yields YYYY-MM-DD
  // Day-of-week from the London calendar date. Noon UTC avoids any TZ edge.
  const dow = new Date(`${ymd}T12:00:00Z`).getUTCDay()
  return { ymd, dow }
}

/**
 * Decide whether a published slide should play right now (Europe/London).
 * This is the ONLY place scheduling rules live — the display does no filtering.
 */
export function isSlideLiveNow(slide: PublishedSlide, today = londonToday()): boolean {
  if (!slide.is_live) return false
  if (slide.starts_on && today.ymd < slide.starts_on) return false
  if (slide.ends_on && today.ymd > slide.ends_on) return false
  const days = slide.days_of_week ?? [0, 1, 2, 3, 4, 5, 6]
  if (days.length > 0 && !days.includes(today.dow)) return false
  return true
}

/**
 * Resolve a stored published manifest into the dumb, display-ready manifest the
 * TV polls: filter for what's live now, strip scheduling fields, and stamp a
 * content hash as the version so the display can cheaply detect changes.
 */
export function resolveManifest(published: PublishedManifest, now: Date = new Date()): Manifest {
  const today = londonToday(now)
  const slides = (published.slides ?? [])
    .filter((s) => s.url && isSlideLiveNow(s, today))
    .map((s) => ({
      id: s.id,
      kind: s.kind,
      url: s.url,
      duration: s.duration,
      transition: s.transition,
    }))

  // Version = first 12 chars of sha256 over the canonical body. Deterministic
  // for identical content, so an unchanged poll is a cheap string compare.
  const body = JSON.stringify({ screen: published.screen, slides })
  const version = createHash('sha256').update(body).digest('hex').slice(0, 12)

  return { version, screen: published.screen, slides }
}

/** An empty manifest (used when a screen has never been published). */
export function emptyManifest(screenSlug: string): Manifest {
  const slides: never[] = []
  const version = createHash('sha256')
    .update(JSON.stringify({ screen: screenSlug, slides }))
    .digest('hex')
    .slice(0, 12)
  return { version, screen: screenSlug, slides }
}
