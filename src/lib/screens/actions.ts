'use server'

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
  /** A URL from the media library (the media picker returns this). */
  url: string
  /** Optional display name; defaults to the media filename. */
  name?: string
}

export async function createSlide(input: CreateSlideInput): Promise<{ id: string }> {
  const admin = createAdminClient()
  if (!input.screenId) throw new Error('Screen is required.')
  if (!input.url?.trim()) throw new Error('Pick a file from the media library first.')

  // Resolve the media row so we can store the FK (enables cascade + dimensions).
  const { data: media } = await admin
    .from('media')
    .select('id, filename')
    .eq('url', input.url)
    .maybeSingle()

  const kind = isVideoUrl(input.url) ? 'video' : 'image'
  const name = (input.name?.trim() || media?.filename || 'Slide').slice(0, 120)

  // Append to the end of the running order.
  const { data: last } = await admin
    .from('screen_slides')
    .select('position')
    .eq('screen_id', input.screenId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const position = (last?.position ?? -1) + 1

  const { data: row, error } = await admin
    .from('screen_slides')
    .insert({
      screen_id: input.screenId,
      position,
      name,
      kind,
      media_id: media?.id ?? null,
      duration_seconds: 10,
      transition: 'fade',
      is_live: true,
    })
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
  is_live?: boolean
  starts_on?: string | null
  ends_on?: string | null
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
  if (input.is_live !== undefined) patch.is_live = input.is_live
  if (input.starts_on !== undefined) patch.starts_on = input.starts_on
  if (input.ends_on !== undefined) patch.ends_on = input.ends_on
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
        is_live: s.is_live,
        starts_on: s.starts_on,
        ends_on: s.ends_on,
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
