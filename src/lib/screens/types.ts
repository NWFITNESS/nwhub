// ─────────────────────────────────────────────────────────────────────────────
// Screens — digital signage domain types
// ─────────────────────────────────────────────────────────────────────────────

export type SlideKind = 'image' | 'video' | 'embed'
export type SlideTransition = 'fade' | 'cut' | 'slide'

/** A `screens` row. */
export interface Screen {
  id: string
  name: string
  slug: string
  token: string
  is_active: boolean
  published_manifest: PublishedManifest | null
  published_at: string | null
  has_unpublished_changes: boolean
  last_seen_at: string | null
  created_at: string
}

/** A `screen_slides` row (working copy). */
export interface ScreenSlide {
  id: string
  screen_id: string
  position: number
  name: string
  kind: SlideKind
  media_id: string | null
  embed_url: string | null
  duration_seconds: number
  transition: SlideTransition
  /** Transition length in milliseconds (0 = instant). */
  transition_ms: number
  is_live: boolean
  starts_on: string | null
  ends_on: string | null
  /** Clock-time window 'HH:MM' (Europe/London), null = no bound. */
  start_time: string | null
  end_time: string | null
  days_of_week: number[]
  created_at: string
  updated_at: string
}

/** Slide row joined to its media for the admin list (thumbnail + resolved url). */
export interface SlideWithMedia extends ScreenSlide {
  media: { url: string; width: number | null; height: number | null; filename: string } | null
}

/**
 * A slide as stored inside `published_manifest`. It carries the resolved URL and
 * the scheduling metadata, so the manifest endpoint can apply is_live / date /
 * day-of-week filtering per request (in Europe/London) without touching the DB.
 */
export interface PublishedSlide {
  id: string
  kind: SlideKind
  url: string
  duration: number
  transition: SlideTransition
  transition_ms: number
  is_live: boolean
  starts_on: string | null
  ends_on: string | null
  start_time: string | null
  end_time: string | null
  days_of_week: number[]
}

/** The blob stored in `screens.published_manifest`. */
export interface PublishedManifest {
  screen: string
  slides: PublishedSlide[]
}

/** A slide as served to the display — dumb, display-ready, no scheduling logic. */
export interface ManifestSlide {
  id: string
  kind: SlideKind
  url: string
  duration: number
  transition: SlideTransition
  /** Transition length in milliseconds (0 = instant). */
  transitionMs: number
}

/** The JSON the display polls. */
export interface Manifest {
  version: string
  screen: string
  slides: ManifestSlide[]
}
