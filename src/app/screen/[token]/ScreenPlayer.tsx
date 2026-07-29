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
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS = 30_000

/** Decode every image slide so it's ready to paint. Videos are left to the tag. */
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
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)

  // Track the live version without retriggering effects on every poll.
  const versionRef = useRef(initial.version)

  const slides = manifest.slides
  const current = slides.length > 0 ? slides[index % slides.length] : null

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
      setIndex(0)
      setReady(true)
    } catch {
      // Network dropped — keep playing what's on screen. Never surface an error.
    }
  }, [token])

  useEffect(() => {
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [poll])

  // ── Advance the loop by each slide's duration. ──────────────────────────────
  useEffect(() => {
    if (!ready || slides.length === 0) return
    const slide = slides[index % slides.length]
    const ms = Math.max(3, slide.duration || 10) * 1000
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), ms)
    return () => clearTimeout(t)
  }, [ready, index, slides])

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
      {current && (
        current.kind === 'video' ? (
          <video
            key={current.id}
            src={current.url}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.id}
            src={current.url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
          />
        )
      )}
    </div>
  )
}
