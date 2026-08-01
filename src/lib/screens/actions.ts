'use server'

import { randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { PublishedManifest, PublishedSlide, SlideTransition } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Screens — server actions
//
// Mirrors the Kids module: admin (service-role) client for all mutations (the
// caller is already gated by the /screens page's auth redirect), clean throws
// with real messages, and revalidatePath('/screens') after each change.
//
// The staging model: every mutation to a slide flips
// screens.has_unpublished_changes = true. Nothing reaches the TV until
// publishScreen() serialises the working copy into published_manifest.
// ─────────────────────────────────────────────────────────────────────────────

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|avi|mkv)(\?.*)?$/i.test(url)
}

/** Flag a screen as having edits not yet pushed to the TV. */
async function markUnpublished(admin: ReturnType<typeof createAdminClient>, screenId: string) {
  await admin.from('screens').update({ has_unpublished_changes: true }).eq('id', screenId)
}

/** Look up the screen a slide belongs to (needed to flag unpublished changes). */
async function screenIdForSlide(admin: ReturnType<typeof createAdminClient>, slideId: string): Promise<string> {
  const { data } = await admin.from('screen_slides').select('screen_id').eq('id', slideId).maybeSingle()
  if (!data) throw new Error('Slide not found.')
  return data.screen_id as string
}

// ─── createSlide ──────────────────────────────────────────────────────────────

interface CreateSlideInput {
  screenId: string
  /** A URL from the media library (the media picker returns this). Omit for an embed. */
  url?: string
  /** An external page URL to render in an iframe. Makes this an `embed` slide. */
  embedUrl?: string
  /** Optional display name; defaults to the media filename / embed host. */
  name?: string
}

export async function createSlide(input: CreateSlideInput): Promise<{ id: string }> {
  const admin = createAdminClient()
  if (!input.screenId) throw new Error('Screen is required.')

  const embed = input.embedUrl?.trim()
  const url = input.url?.trim()
  if (!embed && !url) throw new Error('Pick a file from the media library, or paste an embed URL.')

  // Resolve the shared position + unpublished flag once we know the screen.
  const { data: last } = await admin
    .from('screen_slides')
    .select('position')
    .eq('screen_id', input.screenId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const position = (last?.position ?? -1) + 1

  let insertRow: Record<string, unknown>

  if (embed) {
    let host: string
    try {
      const u = new URL(embed)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error()
      host = u.hostname.replace(/^www\./, '')
    } catch {
      throw new Error('Enter a valid http(s) embed URL.')
    }
    insertRow = {
      screen_id: input.screenId,
      position,
      name: (input.name?.trim() || host).slice(0, 120),
      kind: 'embed',
      embed_url: embed,
      // Embeds have no natural length, so they use the timed duration like images.
      duration_seconds: 15,
      transition: 'fade',
      is_live: true,
    }
  } else {
    // Resolve the media row so we can store the FK (enables cascade + dimensions).
    const { data: media } = await admin
      .from('media')
      .select('id, filename')
      .eq('url', url!)
      .maybeSingle()
    insertRow = {
      screen_id: input.screenId,
      position,
      name: (input.name?.trim() || media?.filename || 'Slide').slice(0, 120),
      kind: isVideoUrl(url!) ? 'video' : 'image',
      media_id: media?.id ?? null,
      duration_seconds: 10,
      transition: 'fade',
      is_live: true,
    }
  }

  const { data: row, error } = await admin
    .from('screen_slides')
    .insert(insertRow)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  await markUnpublished(admin, input.screenId)
  revalidatePath('/screens')
  return { id: row.id as string }
}

// ─── updateSlide ────────────────────────────────────────────────────────────────

interface UpdateSlideInput {
  id: string
  name?: string
  duration_seconds?: number
  transition?: SlideTransition
  transition_ms?: number
  is_live?: boolean
  starts_on?: string | null
  ends_on?: string | null
  start_time?: string | null
  end_time?: string | null
  days_of_week?: number[]
}

export async function updateSlide(input: UpdateSlideInput): Promise<void> {
  const admin = createAdminClient()
  if (!input.id) throw new Error('Slide id is required.')

  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name.trim().slice(0, 120) || 'Slide'
  if (input.duration_seconds !== undefined) {
    const d = Math.round(input.duration_seconds)
    if (!Number.isInteger(d) || d < 3 || d > 300) throw new Error('Duration must be between 3 and 300 seconds.')
    patch.duration_seconds = d
  }
  if (input.transition !== undefined) patch.transition = input.transition
  if (input.transition_ms !== undefined) {
    const ms = Math.round(input.transition_ms)
    if (!Number.isInteger(ms) || ms < 0 || ms > 5000) throw new Error('Transition speed must be between 0 and 5000ms.')
    patch.transition_ms = ms
  }
  if (input.is_live !== undefined) patch.is_live = input.is_live
  if (input.starts_on !== undefined) patch.starts_on = input.starts_on
  if (input.ends_on !== undefined) patch.ends_on = input.ends_on
  if (input.start_time !== undefined) patch.start_time = input.start_time || null
  if (input.end_time !== undefined) patch.end_time = input.end_time || null
  if (input.days_of_week !== undefined) patch.days_of_week = input.days_of_week

  if (Object.keys(patch).length === 0) return

  const { error } = await admin.from('screen_slides').update(patch).eq('id', input.id)
  if (error) throw new Error(error.message)

  await markUnpublished(admin, await screenIdForSlide(admin, input.id))
  revalidatePath('/screens')
}

// ─── deleteSlide ─────────────────────────────────────────────────────────────

export async function deleteSlide(id: string): Promise<void> {
  const admin = createAdminClient()
  if (!id) throw new Error('Slide id is required.')
  const screenId = await screenIdForSlide(admin, id)
  const { error } = await admin.from('screen_slides').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await markUnpublished(admin, screenId)
  revalidatePath('/screens')
}

// ─── reorderSlides ───────────────────────────────────────────────────────────

export async function reorderSlides(input: { screenId: string; orderedIds: string[] }): Promise<void> {
  const admin = createAdminClient()
  if (!input.screenId) throw new Error('Screen is required.')
  if (!Array.isArray(input.orderedIds) || input.orderedIds.length === 0) return

  // Write positions sequentially. A slide list is small (tens at most), so N
  // updates is fine and keeps this simple and obviously correct.
  for (let i = 0; i < input.orderedIds.length; i++) {
    const { error } = await admin
      .from('screen_slides')
      .update({ position: i })
      .eq('id', input.orderedIds[i])
      .eq('screen_id', input.screenId)
    if (error) throw new Error(error.message)
  }
  await markUnpublished(admin, input.screenId)
  revalidatePath('/screens')
}

// ─── publishScreen ───────────────────────────────────────────────────────────

/**
 * Serialise the current working copy into published_manifest, stamp published_at
 * and clear the unpublished flag. This is the ONLY thing the TV ever reads.
 * Scheduling fields are carried through so the manifest endpoint can filter by
 * is_live / date / day-of-week per request.
 */
export async function publishScreen(screenId: string): Promise<void> {
  const admin = createAdminClient()
  if (!screenId) throw new Error('Screen is required.')

  const { data: screen } = await admin.from('screens').select('slug').eq('id', screenId).maybeSingle()
  if (!screen) throw new Error('Screen not found.')

  const { data: slides, error } = await admin
    .from('screen_slides')
    .select('*, media ( url )')
    .eq('screen_id', screenId)
    .order('position', { ascending: true })
  if (error) throw new Error(error.message)

  const published: PublishedSlide[] = (slides ?? [])
    .map((s): PublishedSlide | null => {
      const url = s.kind === 'embed' ? (s.embed_url ?? '') : (s.media?.url ?? '')
      if (!url) return null // a slide whose media was deleted is dropped, not broken
      return {
        id: s.id,
        kind: s.kind,
        url,
        duration: s.duration_seconds,
        transition: s.transition,
        transition_ms: s.transition_ms ?? 700,
        is_live: s.is_live,
        starts_on: s.starts_on,
        ends_on: s.ends_on,
        start_time: s.start_time ?? null,
        end_time: s.end_time ?? null,
        days_of_week: s.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
      }
    })
    .filter((s): s is PublishedSlide => s !== null)

  const manifest: PublishedManifest = { screen: screen.slug as string, slides: published }

  const { error: pubError } = await admin
    .from('screens')
    .update({
      published_manifest: manifest,
      published_at: new Date().toISOString(),
      has_unpublished_changes: false,
    })
    .eq('id', screenId)
  if (pubError) throw new Error(pubError.message)

  revalidatePath('/screens')
}

// ─── Screens (multi-screen management) ───────────────────────────────────────

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'screen'
  )
}

/** Turn a name into a slug that is unique across the screens table. */
async function uniqueSlug(admin: ReturnType<typeof createAdminClient>, name: string): Promise<string> {
  const base = slugify(name)
  const { data } = await admin.from('screens').select('slug').like('slug', `${base}%`)
  const taken = new Set((data ?? []).map((r) => r.slug as string))
  if (!taken.has(base)) return base
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`
    if (!taken.has(candidate)) return candidate
  }
  // Astronomically unlikely; fall back to a random suffix.
  return `${base}-${randomBytes(3).toString('hex')}`
}

/** Create a new screen (display). Generates a stable slug + opaque token. */
export async function createScreen(input: { name: string }): Promise<{ id: string }> {
  const admin = createAdminClient()
  const name = input.name?.trim()
  if (!name) throw new Error('Give the screen a name.')

  const slug = await uniqueSlug(admin, name)
  const token = randomBytes(16).toString('hex')

  const { data: row, error } = await admin
    .from('screens')
    .insert({ name: name.slice(0, 80), slug, token })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/screens')
  return { id: row.id as string }
}

/** Rename a screen (display name only; the slug/token stay stable). */
export async function renameScreen(input: { id: string; name: string }): Promise<void> {
  const admin = createAdminClient()
  const name = input.name?.trim()
  if (!input.id) throw new Error('Screen is required.')
  if (!name) throw new Error('Give the screen a name.')

  const { error } = await admin.from('screens').update({ name: name.slice(0, 80) }).eq('id', input.id)
  if (error) throw new Error(error.message)
  revalidatePath('/screens')
}

/** Delete a screen and all its slides (cascade). Refuses the last remaining screen. */
export async function deleteScreen(id: string): Promise<void> {
  const admin = createAdminClient()
  if (!id) throw new Error('Screen is required.')

  const { count } = await admin.from('screens').select('id', { count: 'exact', head: true })
  if ((count ?? 0) <= 1) throw new Error('You must keep at least one screen.')

  const { error } = await admin.from('screens').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/screens')
}
