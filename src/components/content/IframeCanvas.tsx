'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'

interface SectionRect {
  key: string
  rect: {
    top: number
    bottom: number
    left: number
    right: number
    width: number
    height: number
  }
}

interface Props {
  slug: string
  liveEdits: Record<string, Record<string, unknown>>
  selectedKey: string | null
  onSectionClick: (sectionKey: string, clientX: number, clientY: number) => void
}

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
// The iframe always renders at full desktop width; CSS transform scales it to fit
const DESIGN_WIDTH = 1440

function slugToPath(slug: string): string {
  if (slug === 'home') return '/'
  return `/${slug}`
}

export function IframeCanvas({ slug, liveEdits, selectedKey, onSectionClick }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)
  const canvasWidthRef = useRef(0)
  const [sectionRects, setSectionRects] = useState<SectionRect[]>([])
  const [ready, setReady] = useState(false)
  const [iframeHeight, setIframeHeight] = useState(3000)
  const [scale, setScale] = useState(1)

  // ── Scale calculation ────────────────────────────────────────────────────────
  const recalcScale = useCallback(() => {
    if (!outerRef.current) return
    const w = outerRef.current.offsetWidth
    canvasWidthRef.current = w
    setScale(w / DESIGN_WIDTH)
  }, [])

  useLayoutEffect(() => {
    recalcScale()
    const ro = new ResizeObserver(recalcScale)
    if (outerRef.current) ro.observe(outerRef.current)
    return () => ro.disconnect()
  }, [recalcScale])

  // ── postMessage listener ─────────────────────────────────────────────────────
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data?.type) return

      // Height from AdminBridge — grow-only to prevent oscillation from late measurements
      if (e.data.type === 'NW_PAGE_HEIGHT' && e.data.height > 0) {
        setIframeHeight(prev => e.data.height > prev ? e.data.height : prev)
      }

      // Section rects from PreviewBridge — used for click detection and overlays
      if (e.data.type === 'nw:ready') {
        setReady(true)
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage({ type: 'nw:request-rects' }, '*')
        }, 1000)
      }

      if (e.data.type === 'nw:section-rects') {
        setSectionRects(e.data.sections ?? [])
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // ── Forward live edits to iframe ─────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return
    const win = iframeRef.current?.contentWindow
    if (!win) return
    Object.entries(liveEdits).forEach(([sectionKey, content]) => {
      win.postMessage({ type: 'nw:content-update', sectionKey, content }, '*')
    })
  }, [liveEdits, ready])

  // ── Click detection ──────────────────────────────────────────────────────────
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!outerRef.current || sectionRects.length === 0) return
    const containerTop = outerRef.current.getBoundingClientRect().top
    const relYInIframeSpace = (e.clientY - containerTop) / scale

    for (const s of sectionRects) {
      if (relYInIframeSpace >= s.rect.top && relYInIframeSpace <= s.rect.bottom) {
        onSectionClick(s.key, e.clientX, e.clientY)
        return
      }
    }
  }

  const scaledContainerHeight = iframeHeight * scale

  return (
    // Outer div: canvas-width, scaled height, clips the 1440px inner content
    <div
      ref={outerRef}
      className="relative w-full overflow-hidden"
      style={{ height: scaledContainerHeight }}
    >
      {/* Inner scaling wrapper: always 1440px wide, shrunk via CSS transform */}
      <div
        style={{
          width: DESIGN_WIDTH,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
        <iframe
          ref={iframeRef}
          src={`${SITE_ORIGIN}${slugToPath(slug)}`}
          style={{
            width: DESIGN_WIDTH,
            height: iframeHeight,
            display: 'block',
            border: 0,
          }}
          title="Site Preview"
        />
      </div>

      {/* Click-intercept overlay — absolute over the scaled container */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 10, cursor: 'pointer' }}
        onClick={handleOverlayClick}
      >
        {/* Section highlight boxes — positions multiplied by scale to match visual layout */}
        {sectionRects.map((s) => (
          <div
            key={s.key}
            className={[
              'absolute left-0 right-0 border transition-colors duration-150',
              s.key === selectedKey
                ? 'border-[#967705] bg-[#967705]/[0.08]'
                : 'border-transparent hover:border-[#967705]/40 hover:bg-[#967705]/[0.04]',
            ].join(' ')}
            style={{ top: s.rect.top * scale, height: s.rect.height * scale }}
          />
        ))}
      </div>

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080808]" style={{ zIndex: 20 }}>
          <div className="text-white/30 text-sm">Loading preview…</div>
        </div>
      )}
    </div>
  )
}
