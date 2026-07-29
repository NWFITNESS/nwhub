'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  GripVertical,
  Plus,
  Trash2,
  Play,
  Pause,
  Monitor,
  ExternalLink,
  Copy,
  Check,
  Film,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Panel, PanelHeader, PanelBody } from '@/components/ui/Card'
import { MediaPickerModal } from '@/components/media/MediaPicker'
import {
  createSlide,
  deleteSlide,
  publishScreen,
  reorderSlides,
  updateSlide,
} from '@/lib/screens/actions'
import type { Screen, SlideWithMedia } from '@/lib/screens/types'

const GOLD = '#d4a017'

interface Props {
  screen: Screen | null
  slides: SlideWithMedia[]
}

export function ScreensPageClient({ screen, slides: initialSlides }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Local copy so drag reorder + toggles feel instant; the server refresh
  // reconciles it. Keep it in sync when the server data changes.
  const [slides, setSlides] = useState<SlideWithMedia[]>(initialSlides)
  useEffect(() => setSlides(initialSlides), [initialSlides])

  const dragId = useRef<string | null>(null)

  function flashToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  /** Run a server action, surface errors, and refresh server data on success. */
  function run(fn: () => Promise<unknown>, okMsg?: string) {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
        if (okMsg) flashToast(okMsg)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  if (!screen) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader eyebrow="Reception" title="Screens" description="Digital signage for the gym TV" />
        <Panel>
          <PanelBody>
            <p className="text-nw-300" style={{ fontSize: 14 }}>
              No screen is set up yet. Run the <code className="text-gold-400">20260730000000_screens.sql</code>{' '}
              migration to seed the Reception screen, then reload this page.
            </p>
          </PanelBody>
        </Panel>
      </div>
    )
  }

  const displayPath = `/screen/${screen.token}`
  const liveCount = slides.filter((s) => s.is_live).length

  // ── Drag reorder (HTML5) ────────────────────────────────────────────────────
  function onDrop(targetId: string) {
    const from = dragId.current
    dragId.current = null
    if (!from || from === targetId) return
    const ids = slides.map((s) => s.id)
    const fromIdx = ids.indexOf(from)
    const toIdx = ids.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return
    const next = [...slides]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setSlides(next) // optimistic
    run(() => reorderSlides({ screenId: screen!.id, orderedIds: next.map((s) => s.id) }))
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Reception"
        title="Screens"
        description="Upload Canva exports, set how long each shows, then push to the reception TV."
        actions={
          <>
            {screen.has_unpublished_changes && (
              <Badge variant="amber">Unpublished changes</Badge>
            )}
            <Button variant="ghost" size="md" onClick={() => setPickerOpen(true)}>
              <Plus size={15} /> Add a slide
            </Button>
            <Button
              variant="gold"
              size="md"
              loading={isPending}
              disabled={!screen.has_unpublished_changes}
              onClick={() => run(() => publishScreen(screen.id), 'Pushed to screen')}
            >
              Push to screen
            </Button>
          </>
        }
      />

      {error && (
        <div
          className="rounded-xl border border-red-500/25 bg-red-500/10 text-red-300"
          style={{ padding: '10px 14px', fontSize: 13 }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* ── Slide list ─────────────────────────────────────────────────── */}
        <Panel>
          <PanelHeader
            title="Slides"
            action={
              <span className="text-nw-500" style={{ fontSize: 12 }}>
                {slides.length} slide{slides.length !== 1 ? 's' : ''} · {liveCount} live
              </span>
            }
          />
          <PanelBody>
            {slides.length === 0 ? (
              <div className="text-center" style={{ padding: '40px 0' }}>
                <Monitor size={30} className="mx-auto text-nw-600" style={{ marginBottom: 10 }} />
                <p className="text-nw-300" style={{ fontSize: 14 }}>No slides yet.</p>
                <p className="text-nw-500" style={{ fontSize: 12, marginTop: 4 }}>
                  Add a Canva export to get started.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {slides.map((slide) => (
                  <SlideRow
                    key={slide.id}
                    slide={slide}
                    busy={isPending}
                    onDragStart={() => (dragId.current = slide.id)}
                    onDropRow={() => onDrop(slide.id)}
                    onToggleLive={() =>
                      run(() => updateSlide({ id: slide.id, is_live: !slide.is_live }))
                    }
                    onDuration={(d) => run(() => updateSlide({ id: slide.id, duration_seconds: d }))}
                    onDelete={() => run(() => deleteSlide(slide.id), 'Slide removed')}
                  />
                ))}
              </div>
            )}
          </PanelBody>
        </Panel>

        {/* ── Screen info / display link ─────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader title="Reception TV" />
            <PanelBody>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-nw-500" style={{ fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Status
                  </p>
                  <p className="text-nw-100" style={{ fontSize: 14, marginTop: 4 }}>
                    {screen.published_at
                      ? `Published ${new Date(screen.published_at).toLocaleString('en-GB')}`
                      : 'Not yet published'}
                  </p>
                </div>
                <DisplayLink path={displayPath} />
                <a href={displayPath} target="_blank" rel="noopener noreferrer" className="no-underline">
                  <Button variant="ghost" size="sm" className="w-full">
                    <ExternalLink size={14} /> Open display
                  </Button>
                </a>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-xl border shadow-lg flex items-center gap-2"
          style={{ padding: '10px 16px', background: '#111', borderColor: `${GOLD}55`, color: '#fff', fontSize: 13 }}
        >
          <Check size={15} style={{ color: GOLD }} /> {toast}
        </div>
      )}

      {pickerOpen && (
        <MediaPickerModal
          value=""
          onSelect={(url) => run(() => createSlide({ screenId: screen.id, url }), 'Slide added')}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Slide row ─────────────────────────────────────────────────────────────────

function SlideRow({
  slide,
  busy,
  onDragStart,
  onDropRow,
  onToggleLive,
  onDuration,
  onDelete,
}: {
  slide: SlideWithMedia
  busy: boolean
  onDragStart: () => void
  onDropRow: () => void
  onToggleLive: () => void
  onDuration: (seconds: number) => void
  onDelete: () => void
}) {
  const [duration, setDuration] = useState(String(slide.duration_seconds))
  useEffect(() => setDuration(String(slide.duration_seconds)), [slide.duration_seconds])

  const url = slide.media?.url ?? ''
  const isVideo = slide.kind === 'video'

  function commitDuration() {
    const n = Math.round(Number(duration))
    if (!Number.isFinite(n) || n === slide.duration_seconds) {
      setDuration(String(slide.duration_seconds))
      return
    }
    const clamped = Math.min(300, Math.max(3, n))
    setDuration(String(clamped))
    onDuration(clamped)
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropRow}
      className={`flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-nw-800 transition-opacity ${
        slide.is_live ? '' : 'opacity-45'
      }`}
      style={{ padding: 10 }}
    >
      <span className="cursor-grab text-nw-600 hover:text-nw-400" title="Drag to reorder">
        <GripVertical size={16} />
      </span>

      {/* Thumbnail */}
      <div
        className="relative shrink-0 overflow-hidden rounded-lg border border-[rgba(255,255,255,0.08)] bg-black"
        style={{ width: 72, height: 44 }}
      >
        {url ? (
          isVideo ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={url} className="w-full h-full object-cover" muted preload="metadata" />
              <div className="absolute top-1 left-1 rounded bg-black/60 flex items-center justify-center" style={{ width: 16, height: 16 }}>
                <Film size={9} className="text-white" />
              </div>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-nw-600">
            <Monitor size={14} />
          </div>
        )}
      </div>

      {/* Name + kind */}
      <div className="flex-1 min-w-0">
        <p className="text-nw-100 truncate" style={{ fontSize: 14, fontWeight: 500 }}>
          {slide.name}
        </p>
        <p className="text-nw-500 capitalize" style={{ fontSize: 11 }}>
          {slide.kind}
        </p>
      </div>

      {/* Duration (ignored for video, which plays its natural length in Phase 2) */}
      <div className="flex items-center gap-1 shrink-0" title={isVideo ? 'Videos play their full length' : 'Seconds on screen'}>
        <input
          type="number"
          min={3}
          max={300}
          value={duration}
          disabled={isVideo || busy}
          onChange={(e) => setDuration(e.target.value)}
          onBlur={commitDuration}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="bg-nw-900 border border-[rgba(255,255,255,0.1)] rounded-lg text-nw-100 text-center focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
          style={{ width: 52, padding: '5px 6px', fontSize: 13 }}
        />
        <span className="text-nw-500" style={{ fontSize: 11 }}>s</span>
      </div>

      {/* Live / paused toggle */}
      <button
        type="button"
        onClick={onToggleLive}
        disabled={busy}
        title={slide.is_live ? 'Playing — click to pause' : 'Paused — click to play'}
        className="shrink-0 rounded-lg border transition-colors disabled:opacity-40"
        style={{
          padding: '6px 10px',
          fontSize: 12,
          borderColor: slide.is_live ? `${GOLD}40` : 'rgba(255,255,255,0.1)',
          background: slide.is_live ? `${GOLD}18` : 'transparent',
          color: slide.is_live ? GOLD : 'var(--nw-400, #8b93a1)',
        }}
      >
        <span className="flex items-center gap-1.5">
          {slide.is_live ? <Play size={12} /> : <Pause size={12} />}
          {slide.is_live ? 'Live' : 'Paused'}
        </span>
      </button>

      {/* Remove */}
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        title="Remove slide"
        className="shrink-0 rounded-lg text-nw-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
        style={{ padding: 7 }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ─── Display URL with copy ───────────────────────────────────────────────────

function DisplayLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)
  const full = useMemo(() => {
    if (typeof window === 'undefined') return path
    return `${window.location.origin}${path}`
  }, [path])

  return (
    <div>
      <p className="text-nw-500" style={{ fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
        Display URL
      </p>
      <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
        <code
          className="flex-1 min-w-0 truncate rounded-lg bg-nw-900 border border-[rgba(255,255,255,0.1)] text-nw-300"
          style={{ padding: '7px 10px', fontSize: 12 }}
          title={full}
        >
          {full}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(full)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="shrink-0 rounded-lg border border-[rgba(255,255,255,0.1)] text-nw-400 hover:text-nw-100 transition-colors"
          style={{ padding: 8 }}
          title="Copy display URL"
        >
          {copied ? <Check size={14} style={{ color: GOLD }} /> : <Copy size={14} />}
        </button>
      </div>
      <p className="text-nw-600" style={{ fontSize: 11, marginTop: 6 }}>
        Open this full-screen on the reception mini PC. It updates within 30s of a push.
      </p>
    </div>
  )
}
