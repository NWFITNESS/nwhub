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
// Layers: two full-bleed layers keyed by SLIDE ID. During a transition the
// incoming layer animates in over the current one; when it settles it simply
// becomes the current layer. Because both are keyed by slide id, the incoming
// element is REUSED (not remounted) when promoted — so a video that fades in
// keeps playing uninterrupted rather than restarting. That's what makes
// video↔image transitions work.
//
//   • Video plays its NATURAL length: advances on `ended`, with a generous
//     safety cap so a stalled video can never freeze the wall.
//   • Transitions animate for every combination EXCEPT video→video (crossfading
//     two decoding videos janks a mini PC). Images and webpage embeds all fade /
//     slide. `cut` / 0ms also cut. The incoming layer is reused on settle, so a
//     fading-in video or iframe never reloads.
//   • Embed slides render in a display-only iframe (no pointer events).
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS = 30_000
const DEFAULT_TRANSITION_MS = 700
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

  // curIdx = the settled, fully-shown slide. incoming = a slide animating in over
  // it during a transition (null when idle). Settling makes incoming the current.
  const [curIdx, setCurIdx] = useState(0)
  const [incoming, setIncoming] = useState<number | null>(null)
  const curIdxRef = useRef(0)
  const incomingRef = useRef<number | null>(null)
  useEffect(() => {
    curIdxRef.current = curIdx
  }, [curIdx])
  useEffect(() => {
    incomingRef.current = incoming
  }, [incoming])

  const cur = slides.length > 0 ? slides[curIdx % slides.length] : null
  const inc = incoming != null && slides.length > 0 ? slides[incoming % slides.length] : null

  // ── Advance to the next slide, animating unless the pair can't crossfade. ────
  const advance = useCallback(() => {
    if (slides.length <= 1) return
    if (incomingRef.current != null) return // already mid-transition
    const current = slides[curIdxRef.current % slides.length]
    const nextIdx = (curIdxRef.current + 1) % slides.length
    const next = slides[nextIdx]
    // Only video→video cuts unconditionally — crossfading two decoding videos
    // janks a mini PC. Everything else (images, webpage embeds) animates.
    const bothVideo = current.kind === 'video' && next.kind === 'video'
    const animate =
      next.transition !== 'cut' &&
      (next.transitionMs ?? DEFAULT_TRANSITION_MS) > 0 &&
      !bothVideo
    if (animate) {
      setIncoming(nextIdx) // fades/slides in over the current, then settles
    } else {
      setCurIdx(nextIdx) // instant swap
    }
  }, [slides])

  // Transition finished animating — the incoming layer becomes the current one.
  const settle = useCallback(() => {
    const next = incomingRef.current
    if (next != null) {
      setCurIdx(next)
      setIncoming(null)
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
      setCurIdx(0)
      setIncoming(null)
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
    if (!ready || slides.length <= 1 || incoming != null) return
    const current = slides[curIdx % slides.length]
    if (!current || current.kind === 'video') return
    const ms = Math.max(3, current.duration || 10) * 1000
    const t = setTimeout(advance, ms)
    return () => clearTimeout(t)
  }, [ready, curIdx, incoming, slides, advance])

  // ── Safety net: never let a stalled video freeze the loop. ──────────────────
  useEffect(() => {
    if (!ready || slides.length <= 1 || incoming != null) return
    const current = slides[curIdx % slides.length]
    if (!current || current.kind !== 'video') return
    const t = setTimeout(advance, VIDEO_SAFETY_MS)
    return () => clearTimeout(t)
  }, [ready, curIdx, incoming, slides, advance])

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

      {/* Keyed by slide id so the incoming layer is reused (not remounted) when
          it becomes current — a fading-in video keeps playing. */}
      {cur && (
        <SlideLayer
          key={`s-${cur.id}`}
          slide={cur}
          single={single}
          z={1}
          active={incoming == null}
          onVideoEnded={advance}
        />
      )}

      {inc && (
        <SlideLayer
          key={`s-${inc.id}`}
          slide={inc}
          single={false}
          z={2}
          entering
          onEntered={settle}
        />
      )}
    </div>
  )
}

// ─── A single full-bleed slide layer ─────────────────────────────────────────

function SlideLayer({
  slide,
  single,
  z,
  entering,
  active,
  onEntered,
  onVideoEnded,
}: {
  slide: ManifestSlide
  single: boolean
  z: number
  /** Animating in over the layer below. */
  entering?: boolean
  /** The settled current layer — only this one drives the loop on video end. */
  active?: boolean
  onEntered?: () => void
  onVideoEnded?: () => void
}) {
  const ms = slide.transitionMs ?? DEFAULT_TRANSITION_MS
  const anim =
    entering && slide.transition === 'slide'
      ? `nw-slide-in ${ms}ms ease forwards`
      : entering
        ? `nw-fade-in ${ms}ms ease forwards`
        : undefined

  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: z,
    animation: anim,
  }

  // A video only advances the loop once it's the settled current layer.
  const videoAdvance = active && !single ? onVideoEnded : undefined

  return (
    <div style={style} onAnimationEnd={entering ? onEntered : undefined}>
      {slide.kind === 'video' ? (
        <video
          src={slide.url}
          autoPlay
          muted
          playsInline
          // Loop while entering (so a short clip doesn't freeze mid-transition)
          // or when it's the only slide; otherwise play once and advance on end.
          loop={single || entering}
          onEnded={videoAdvance}
          onError={videoAdvance}
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
