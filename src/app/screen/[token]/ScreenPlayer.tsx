'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Manifest, ManifestSlide } from '@/lib/screens/types'

// ─────────────────────────────────────────────────────────────────────────────
// ScreenPlayer — the dumb loop that runs on the reception TV.
//
// Design goal above all others: THE SCREEN MUST NEVER GO BLANK.
//   • Polls the manifest every 30s; if the version is unchanged, does nothing.
//   • On change, DECODES every new image before switching over — never swaps to
//     an undecoded image (that's the flash of blank this whole thing avoids).
//   • On any fetch failure, keeps playing what's already in memory. It never
//     renders an error state.
//   • No localStorage (Chrome kiosk may run --incognito and clear it).
// All scheduling/filtering already happened server-side — this does none.
//
// Phase 2 additions:
//   • Video plays its NATURAL length: advances on `ended`, not a fixed timer,
//     with a generous safety cap so a stalled video can never freeze the wall.
//   • Transitions: image→image swaps animate (fade dissolve / slide-in) via a
//     top layer that settles onto the base. Anything involving a video, or a
//     slide marked `cut`, is an instant swap (video crossfades are heavy and
//     jank on a mini PC).
//   • Embed slides render in a display-only iframe (no pointer events).
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS = 30_000
const TRANSITION_MS = 700
// If a video's `ended`/`error` never fires (a rare mid-stream stall), advance
// anyway after this cap so the loop can never lock up on one slide.
const VIDEO_SAFETY_MS = 10 * 60_000

/** Decode every image slide so it's ready to paint. Videos/embeds are left alone. */
async function preloadImages(slides: ManifestSlide[]): Promise<void> {
  await Promise.all(
    slides
      .filter((s) => s.kind === 'image')
      .map(async (s) => {
        try {
          const img = new Image()
          img.src = s.url
          if (img.decode) await img.decode()
        } catch {
          // A single bad image must not block the swap — it just won't paint.
        }
      }),
  )
}

export function ScreenPlayer({ token, initial }: { token: string; initial: Manifest }) {
  const [manifest, setManifest] = useState<Manifest>(initial)
  const [ready, setReady] = useState(false)

  // Track the live version without retriggering effects on every poll.
  const versionRef = useRef(initial.version)

  const slides = manifest.slides
  const single = slides.length === 1

  // base = the settled, fully-shown slide. top = a slide animating in over it
  // during a transition (null when idle). Promoting top→base ends a transition.
  const [baseIdx, setBaseIdx] = useState(0)
  const [topIdx, setTopIdx] = useState<number | null>(null)
  const baseIdxRef = useRef(0)
  const topIdxRef = useRef<number | null>(null)
  useEffect(() => {
    baseIdxRef.current = baseIdx
  }, [baseIdx])
  useEffect(() => {
    topIdxRef.current = topIdx
  }, [topIdx])

  const base = slides.length > 0 ? slides[baseIdx % slides.length] : null
  const top = topIdx != null && slides.length > 0 ? slides[topIdx % slides.length] : null

  // ── Advance to the next slide, animating the swap when it's image→image. ────
  const advance = useCallback(() => {
    if (slides.length <= 1) return
    const cur = slides[baseIdxRef.current % slides.length]
    const nextIdx = (baseIdxRef.current + 1) % slides.length
    const next = slides[nextIdx]
    const animate =
      next.transition !== 'cut' && next.kind === 'image' && cur.kind === 'image'
    if (animate) {
      setTopIdx(nextIdx) // fades/slides in over the base, then settles
    } else {
      setBaseIdx(nextIdx) // instant swap
    }
  }, [slides])

  // Transition finished animating — promote the top layer to base.
  const settleTop = useCallback(() => {
    const t = topIdxRef.current
    if (t != null) {
      setBaseIdx(t)
      setTopIdx(null)
    }
  }, [])

  // ── Initial preload: decode the seeded slides before revealing anything. ────
  useEffect(() => {
    let cancelled = false
    preloadImages(initial.slides).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [initial])

  // ── Poll the manifest. Only swap after the new media is decoded. ────────────
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/screens/${token}/manifest`, { cache: 'no-store' })
      if (!res.ok) return // keep playing from memory
      const next = (await res.json()) as Manifest
      if (next.version === versionRef.current) return // nothing changed
      await preloadImages(next.slides) // decode BEFORE switching over
      versionRef.current = next.version
      setManifest(next)
      setBaseIdx(0)
      setTopIdx(null)
      setReady(true)
    } catch {
      // Network dropped — keep playing what's on screen. Never surface an error.
    }
  }, [token])

  useEffect(() => {
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [poll])

  // ── Timed advance for image/embed slides (video drives itself via onEnded). ─
  useEffect(() => {
    if (!ready || slides.length <= 1 || topIdx != null) return
    const cur = slides[baseIdx % slides.length]
    if (!cur || cur.kind === 'video') return
    const ms = Math.max(3, cur.duration || 10) * 1000
    const t = setTimeout(advance, ms)
    return () => clearTimeout(t)
  }, [ready, baseIdx, topIdx, slides, advance])

  // ── Safety net: never let a stalled video freeze the loop. ──────────────────
  useEffect(() => {
    if (!ready || slides.length <= 1 || topIdx != null) return
    const cur = slides[baseIdx % slides.length]
    if (!cur || cur.kind !== 'video') return
    const t = setTimeout(advance, VIDEO_SAFETY_MS)
    return () => clearTimeout(t)
  }, [ready, baseIdx, topIdx, slides, advance])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
        cursor: 'none',
      }}
    >
      <style>{KEYFRAMES}</style>

      {base && (
        <SlideLayer
          key={`base-${baseIdx}-${base.id}`}
          slide={base}
          single={single}
          onVideoEnded={advance}
        />
      )}

      {top && (
        <SlideLayer
          key={`top-${topIdx}-${top.id}`}
          slide={top}
          single={false}
          entering
          onEntered={settleTop}
        />
      )}
    </div>
  )
}

// ─── A single full-bleed slide layer ─────────────────────────────────────────

function SlideLayer({
  slide,
  single,
  entering,
  onEntered,
  onVideoEnded,
}: {
  slide: ManifestSlide
  single: boolean
  entering?: boolean
  onEntered?: () => void
  onVideoEnded?: () => void
}) {
  const anim =
    entering && slide.transition === 'slide'
      ? `nw-slide-in ${TRANSITION_MS}ms ease forwards`
      : entering
        ? `nw-fade-in ${TRANSITION_MS}ms ease forwards`
        : undefined

  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: entering ? 2 : 1,
    animation: anim,
  }

  return (
    <div style={style} onAnimationEnd={entering ? onEntered : undefined}>
      {slide.kind === 'video' ? (
        <video
          src={slide.url}
          autoPlay
          muted
          playsInline
          loop={single}
          onEnded={single ? undefined : onVideoEnded}
          onError={single ? undefined : onVideoEnded}
          style={MEDIA_STYLE}
        />
      ) : slide.kind === 'embed' ? (
        <iframe
          src={slide.url}
          title="embed"
          style={{ ...MEDIA_STYLE, border: 0, pointerEvents: 'none' }}
          referrerPolicy="no-referrer"
          allow="autoplay; fullscreen"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.url} alt="" style={MEDIA_STYLE} />
      )}
    </div>
  )
}

const MEDIA_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  background: '#000',
}

const KEYFRAMES = `
@keyframes nw-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes nw-slide-in { from { transform: translateX(100%) } to { transform: translateX(0) } }
`
