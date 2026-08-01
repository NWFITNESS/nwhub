'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, Monitor, Globe, Film } from 'lucide-react'
import type { SlideWithMedia } from '@/lib/screens/types'

// ─────────────────────────────────────────────────────────────────────────────
// ScreenPreview — an in-admin "what the TV will show" player + scrubbable
// timeline. Renders the SAME transitions the display uses, but time-driven
// (deterministic from a playhead) rather than event-driven, so dragging the
// playhead across a slide boundary shows the fade/slide mid-way.
//
// It previews only what's LIVE now (is_live) — it does NOT re-apply date /
// day-of-week scheduling, so Mat can see a paused/out-of-window slide by
// toggling it live. Videos are measured for accurate timeline widths.
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = '#d4a017'
const DEFAULT_MS = 700

type Kind = 'image' | 'video' | 'embed'

interface PSlide {
  id: string
  kind: Kind
  url: string
  name: string
  duration: number // seconds (nominal; videos get overwritten once measured)
  transition: string
  transitionMs: number
}

interface Seg {
  slide: PSlide
  start: number
  dur: number
}

function toPreview(slides: SlideWithMedia[]): PSlide[] {
  return slides
    .filter((s) => s.is_live)
    .map((s) => ({
      id: s.id,
      kind: s.kind,
      url: s.kind === 'embed' ? (s.embed_url ?? '') : (s.media?.url ?? ''),
      name: s.name,
      duration: s.duration_seconds,
      transition: s.transition,
      transitionMs: s.transition_ms ?? DEFAULT_MS,
    }))
    .filter((s) => s.url)
}

function fmt(t: number): string {
  const s = Math.max(0, Math.floor(t))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export function ScreenPreview({ slides }: { slides: SlideWithMedia[] }) {
  const pslides = useMemo(() => toPreview(slides), [slides])

  // Measured video lengths keyed by slide id (for true timeline widths).
  const [vidDur, setVidDur] = useState<Record<string, number>>({})
  const [playing, setPlaying] = useState(true)
  const [t, setT] = useState(0)

  const tRef = useRef(0)
  const lastRef = useRef<number | null>(null)
  const scrubbing = useRef(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const durOf = (s: PSlide) => (s.kind === 'video' ? vidDur[s.id] ?? s.duration : s.duration)

  const segs = useMemo<Seg[]>(() => {
    let acc = 0
    const out: Seg[] = []
    for (const s of pslides) {
      const d = Math.max(0.1, durOf(s))
      out.push({ slide: s, start: acc, dur: d })
      acc += d
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pslides, vidDur])

  const total = segs.length ? segs[segs.length - 1].start + segs[segs.length - 1].dur : 0

  function setPlayhead(next: number) {
    const nt = total > 0 ? ((next % total) + total) % total : 0
    tRef.current = nt
    setT(nt)
  }

  // ── rAF playback loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || total <= 0) {
      lastRef.current = null
      return
    }
    let raf = 0
    const tick = (now: number) => {
      if (scrubbing.current) {
        lastRef.current = now
      } else if (lastRef.current != null) {
        const dt = (now - lastRef.current) / 1000
        setPlayhead(tRef.current + dt)
        lastRef.current = now
      } else {
        lastRef.current = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      lastRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, total])

  // Keep the playhead in range if slides change under it.
  useEffect(() => {
    if (total > 0 && tRef.current > total) setPlayhead(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  // ── Which segment is showing, and how far into its transition ───────────────
  const idx = useMemo(() => {
    if (!segs.length) return -1
    for (let i = 0; i < segs.length; i++) {
      if (t >= segs[i].start && t < segs[i].start + segs[i].dur) return i
    }
    return segs.length - 1
  }, [segs, t])

  const cur = idx >= 0 ? segs[idx] : null
  const local = cur ? t - cur.start : 0
  const tms = cur ? cur.slide.transitionMs / 1000 : 0
  const p = cur && tms > 0 ? Math.min(1, local / tms) : 1

  // The slide underneath during a transition (crossfade / slide). Mirrors the
  // display: animate every pair except video→video.
  const prevIdx = idx > 0 ? idx - 1 : segs.length > 1 ? segs.length - 1 : -1
  const prevSlide = prevIdx >= 0 ? segs[prevIdx].slide : null
  const bothVideo = !!cur && !!prevSlide && cur.slide.kind === 'video' && prevSlide.kind === 'video'
  const showUnder =
    p < 1 &&
    !!cur &&
    cur.slide.transition !== 'cut' &&
    prevIdx >= 0 &&
    prevIdx !== idx &&
    !bothVideo
  const under = showUnder ? segs[prevIdx].slide : null

  // Incoming layer style from transition progress.
  const topStyle: React.CSSProperties =
    cur && showUnder
      ? cur.slide.transition === 'slide'
        ? { transform: `translateX(${(1 - p) * 100}%)` }
        : { opacity: p }
      : {}

  // ── Scrubbing on the timeline ───────────────────────────────────────────────
  function seekFromClientX(clientX: number) {
    const el = trackRef.current
    if (!el || total <= 0) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    setPlayhead(ratio * total)
  }

  const hasSlides = segs.length > 0

  return (
    <div className="flex flex-col gap-3">
      {/* ── Preview pane ─────────────────────────────────────────────────── */}
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]"
        style={{ aspectRatio: '16 / 9', maxHeight: 360, background: '#000' }}
      >
        {!hasSlides ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-nw-500">
            <Monitor size={28} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>No live slides to preview.</p>
          </div>
        ) : (
          <>
            {under && <MediaLayer slide={under} playing={false} />}
            {cur && <MediaLayer slide={cur.slide} playing={playing} style={topStyle} seekTo={scrubbing.current ? local : undefined} />}
          </>
        )}

        {/* Hidden metadata loaders to measure video lengths. */}
        {pslides
          .filter((s) => s.kind === 'video' && vidDur[s.id] == null)
          .map((s) => (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              key={`meta-${s.id}`}
              src={s.url}
              preload="metadata"
              muted
              style={{ display: 'none' }}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration
                setVidDur((m) => ({ ...m, [s.id]: Number.isFinite(d) && d > 0 ? d : s.duration }))
              }}
            />
          ))}
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          disabled={!hasSlides}
          className="rounded-lg border transition-colors disabled:opacity-40"
          style={{ padding: 8, borderColor: `${GOLD}40`, background: `${GOLD}18`, color: GOLD }}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <span className="text-nw-400 tabular-nums" style={{ fontSize: 12, minWidth: 78 }}>
          {fmt(t)} / {fmt(total)}
        </span>
        {cur && (
          <span className="text-nw-500 truncate" style={{ fontSize: 12 }}>
            {cur.slide.name}
          </span>
        )}
      </div>

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      {hasSlides && (
        <div
          ref={trackRef}
          className="relative flex w-full select-none overflow-hidden rounded-lg border border-[rgba(255,255,255,0.08)] bg-nw-900"
          style={{ height: 48, cursor: 'pointer' }}
          onPointerDown={(e) => {
            ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
            scrubbing.current = true
            seekFromClientX(e.clientX)
          }}
          onPointerMove={(e) => {
            if (scrubbing.current) seekFromClientX(e.clientX)
          }}
          onPointerUp={() => {
            scrubbing.current = false
          }}
          onPointerCancel={() => {
            scrubbing.current = false
          }}
        >
          {segs.map((seg, i) => (
            <div
              key={seg.slide.id}
              className="relative h-full overflow-hidden border-r border-[rgba(0,0,0,0.5)] flex items-center justify-center"
              style={{
                width: `${(seg.dur / total) * 100}%`,
                background: i === idx ? 'rgba(212,160,23,0.10)' : 'transparent',
              }}
              title={`${seg.slide.name} · ${Math.round(seg.dur)}s`}
            >
              <TimelineThumb slide={seg.slide} />
              <div
                className="absolute inset-x-0 bottom-0 truncate text-center text-white"
                style={{ fontSize: 9, padding: '1px 3px', background: 'rgba(0,0,0,0.55)' }}
              >
                {seg.slide.name}
              </div>
            </div>
          ))}

          {/* Playhead */}
          <div
            className="pointer-events-none absolute top-0 bottom-0"
            style={{ left: `${total > 0 ? (t / total) * 100 : 0}%`, width: 2, background: GOLD, boxShadow: `0 0 6px ${GOLD}` }}
          >
            <div
              className="absolute -top-1 -translate-x-1/2 rounded-full"
              style={{ left: 1, width: 9, height: 9, background: GOLD }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── A full-bleed media layer inside the preview pane ────────────────────────

function MediaLayer({
  slide,
  playing,
  style,
  seekTo,
}: {
  slide: PSlide
  playing: boolean
  style?: React.CSSProperties
  seekTo?: number
}) {
  const vRef = useRef<HTMLVideoElement>(null)

  // Reflect play/pause + scrub position onto the actual <video> element.
  useEffect(() => {
    const v = vRef.current
    if (!v) return
    if (seekTo != null && Number.isFinite(seekTo)) {
      try {
        v.currentTime = Math.min(seekTo, v.duration || seekTo)
      } catch {
        /* not seekable yet */
      }
    }
    if (playing) v.play().catch(() => {})
    else v.pause()
  }, [playing, seekTo])

  const base: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: '#000',
    ...style,
  }

  if (slide.kind === 'video') {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video ref={vRef} src={slide.url} autoPlay={playing} muted playsInline loop style={base} />
    )
  }
  if (slide.kind === 'embed') {
    return (
      <iframe
        src={slide.url}
        title={slide.name}
        style={{ ...base, border: 0, pointerEvents: 'none' }}
        referrerPolicy="no-referrer"
      />
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={slide.url} alt="" style={base} />
}

// ─── A tiny thumbnail for the timeline blocks ────────────────────────────────

function TimelineThumb({ slide }: { slide: PSlide }) {
  if (slide.kind === 'embed') {
    return (
      <div className="flex h-full w-full items-center justify-center text-nw-400">
        <Globe size={14} />
      </div>
    )
  }
  if (slide.kind === 'video') {
    return (
      <div className="relative h-full w-full">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={slide.url} muted preload="metadata" className="h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 flex items-center justify-center text-white/80">
          <Film size={12} />
        </div>
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={slide.url} alt="" className="h-full w-full object-cover opacity-80" />
}
