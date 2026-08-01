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
  Globe,
  Link2,
  SlidersHorizontal,
  Pencil,
  CalendarClock,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Panel, PanelHeader, PanelBody } from '@/components/ui/Card'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input, Select, Field } from '@/components/ui/Input'
import { MediaPickerModal } from '@/components/media/MediaPicker'
import { ScreenPreview } from './ScreenPreview'
import {
  createScreen,
  createSlide,
  deleteScreen,
  deleteSlide,
  publishScreen,
  renameScreen,
  reorderSlides,
  updateSlide,
} from '@/lib/screens/actions'
import type { Screen, SlideWithMedia, SlideTransition } from '@/lib/screens/types'

const GOLD = '#d4a017'

// Day-of-week chips, Monday-first for UK convention. `n` matches the schema
// (0 = Sunday … 6 = Saturday), the same values isSlideLiveNow() filters on.
const DOW: { n: number; l: string }[] = [
  { n: 1, l: 'M' },
  { n: 2, l: 'T' },
  { n: 3, l: 'W' },
  { n: 4, l: 'T' },
  { n: 5, l: 'F' },
  { n: 6, l: 'S' },
  { n: 0, l: 'S' },
]
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const s = new Set(a)
  return b.every((x) => s.has(x))
}

function fmtDate(ymd: string): string {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** A one-line summary of a slide's schedule, or null when it's always on. */
function scheduleSummary(slide: SlideWithMedia): string | null {
  const days = slide.days_of_week?.length ? slide.days_of_week : ALL_DAYS
  const allDays = days.length === 7

  let dayPart = ''
  if (!allDays) {
    if (sameSet(days, [1, 2, 3, 4, 5])) dayPart = 'Mon–Fri'
    else if (sameSet(days, [0, 6])) dayPart = 'Weekends'
    else dayPart = DOW.filter((d) => days.includes(d.n)).map((d) => SHORT[d.n]).join(', ')
  }

  let datePart = ''
  if (slide.starts_on && slide.ends_on) datePart = `${fmtDate(slide.starts_on)}–${fmtDate(slide.ends_on)}`
  else if (slide.ends_on) datePart = `until ${fmtDate(slide.ends_on)}`
  else if (slide.starts_on) datePart = `from ${fmtDate(slide.starts_on)}`

  if (!dayPart && !datePart) return null
  return [dayPart, datePart].filter(Boolean).join(' · ')
}

interface Props {
  screens: Screen[]
  screen: Screen | null
  slides: SlideWithMedia[]
}

export function ScreensPageClient({ screens, screen, slides: initialSlides }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [embedOpen, setEmbedOpen] = useState(false)
  const [newScreenOpen, setNewScreenOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteScreenOpen, setDeleteScreenOpen] = useState(false)
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

  /** Optimistically patch a slide locally so schedule/transition edits feel instant. */
  function patchLocal(id: string, patch: Partial<SlideWithMedia>) {
    setSlides((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  // ── No screen at all (migration not run) ────────────────────────────────────
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

  // ── Screen create (navigates to the new screen) ─────────────────────────────
  function addScreen(name: string) {
    setError(null)
    startTransition(async () => {
      try {
        const { id } = await createScreen({ name })
        setNewScreenOpen(false)
        router.push(`/screens?screen=${id}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  function removeScreen() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteScreen(screen!.id)
        setDeleteScreenOpen(false)
        router.push('/screens') // falls back to the first remaining screen
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Reception"
        title="Screens"
        description="Upload Canva exports, set how long each shows, then push to the reception TV."
        actions={
          <>
            {screen.has_unpublished_changes && <Badge variant="amber">Unpublished changes</Badge>}
            <Button variant="ghost" size="md" onClick={() => setEmbedOpen(true)}>
              <Link2 size={15} /> Add embed
            </Button>
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

      {/* ── Screen switcher ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {screens.map((s) => {
          const active = s.id === screen.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => !active && router.push(`/screens?screen=${s.id}`)}
              className="rounded-xl border transition-colors flex items-center gap-2"
              style={{
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 600,
                borderColor: active ? `${GOLD}55` : 'rgba(255,255,255,0.1)',
                background: active ? `${GOLD}18` : 'transparent',
                color: active ? GOLD : 'var(--nw-300, #b3bac6)',
              }}
            >
              <Monitor size={13} /> {s.name}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setNewScreenOpen(true)}
          className="rounded-xl border border-dashed border-[rgba(255,255,255,0.16)] text-nw-400 hover:text-nw-100 hover:border-[rgba(255,255,255,0.3)] transition-colors flex items-center gap-1.5"
          style={{ padding: '7px 12px', fontSize: 13, fontWeight: 600 }}
        >
          <Plus size={13} /> New screen
        </button>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-500/25 bg-red-500/10 text-red-300"
          style={{ padding: '10px 14px', fontSize: 13 }}
        >
          {error}
        </div>
      )}

      {/* ── Preview + timeline ─────────────────────────────────────────────── */}
      <Panel>
        <PanelHeader
          title="Preview"
          action={
            <span className="text-nw-500" style={{ fontSize: 12 }}>
              Live slides only · drag the timeline to scrub
            </span>
          }
        />
        <PanelBody>
          <ScreenPreview slides={slides} />
        </PanelBody>
      </Panel>

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
                  Add a Canva export or an embed to get started.
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
                    onToggleLive={() => {
                      patchLocal(slide.id, { is_live: !slide.is_live })
                      run(() => updateSlide({ id: slide.id, is_live: !slide.is_live }))
                    }}
                    onDuration={(d) => {
                      patchLocal(slide.id, { duration_seconds: d })
                      run(() => updateSlide({ id: slide.id, duration_seconds: d }))
                    }}
                    onTransition={(t) => {
                      patchLocal(slide.id, { transition: t })
                      run(() => updateSlide({ id: slide.id, transition: t }))
                    }}
                    onSpeed={(ms) => {
                      patchLocal(slide.id, { transition_ms: ms })
                      run(() => updateSlide({ id: slide.id, transition_ms: ms }))
                    }}
                    onDays={(days) => {
                      patchLocal(slide.id, { days_of_week: days })
                      run(() => updateSlide({ id: slide.id, days_of_week: days }))
                    }}
                    onDates={(patch) => {
                      patchLocal(slide.id, patch)
                      run(() => updateSlide({ id: slide.id, ...patch }))
                    }}
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
            <PanelHeader
              title={screen.name}
              action={
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRenameOpen(true)}
                    title="Rename screen"
                    className="rounded-lg text-nw-500 hover:text-nw-100 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                    style={{ padding: 6 }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteScreenOpen(true)}
                    title="Delete screen"
                    className="rounded-lg text-nw-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    style={{ padding: 6 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              }
            />
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

      <EmbedModal
        open={embedOpen}
        busy={isPending}
        onClose={() => setEmbedOpen(false)}
        onAdd={(embedUrl, name) => {
          run(() => createSlide({ screenId: screen.id, embedUrl, name }), 'Embed added')
          setEmbedOpen(false)
        }}
      />

      <NameModal
        open={newScreenOpen}
        title="New screen"
        label="Screen name"
        placeholder="e.g. Café TV"
        confirmLabel="Create"
        busy={isPending}
        onClose={() => setNewScreenOpen(false)}
        onSubmit={addScreen}
      />

      <NameModal
        open={renameOpen}
        title="Rename screen"
        label="Screen name"
        initial={screen.name}
        confirmLabel="Save"
        busy={isPending}
        onClose={() => setRenameOpen(false)}
        onSubmit={(name) => {
          run(() => renameScreen({ id: screen.id, name }), 'Screen renamed')
          setRenameOpen(false)
        }}
      />

      <ConfirmModal
        open={deleteScreenOpen}
        onClose={() => setDeleteScreenOpen(false)}
        onConfirm={removeScreen}
        title="Delete screen"
        message={`Delete "${screen.name}" and all its slides? The display URL will stop working. This can't be undone.`}
        confirmLabel="Delete screen"
        loading={isPending}
      />
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
  onTransition,
  onSpeed,
  onDays,
  onDates,
  onDelete,
}: {
  slide: SlideWithMedia
  busy: boolean
  onDragStart: () => void
  onDropRow: () => void
  onToggleLive: () => void
  onDuration: (seconds: number) => void
  onTransition: (t: SlideTransition) => void
  onSpeed: (ms: number) => void
  onDays: (days: number[]) => void
  onDates: (patch: { starts_on?: string | null; ends_on?: string | null }) => void
  onDelete: () => void
}) {
  const [duration, setDuration] = useState(String(slide.duration_seconds))
  const [open, setOpen] = useState(false)
  useEffect(() => setDuration(String(slide.duration_seconds)), [slide.duration_seconds])

  const isVideo = slide.kind === 'video'
  const isEmbed = slide.kind === 'embed'
  const url = slide.media?.url ?? ''
  const summary = scheduleSummary(slide)

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

  const days = slide.days_of_week?.length ? slide.days_of_week : ALL_DAYS

  function toggleDay(n: number) {
    const set = new Set(days)
    set.has(n) ? set.delete(n) : set.add(n)
    const next = [...set].sort((a, b) => a - b)
    onDays(next.length ? next : ALL_DAYS) // empty = always on, mirror the default
  }

  return (
    <div
      className={`rounded-xl border border-[rgba(255,255,255,0.08)] bg-nw-800 transition-opacity ${
        slide.is_live ? '' : 'opacity-45'
      }`}
    >
      {/* ── Main row ─────────────────────────────────────────────────────── */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropRow}
        className="flex items-center gap-3"
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
          {isEmbed ? (
            <div className="w-full h-full flex items-center justify-center text-nw-400">
              <Globe size={16} />
            </div>
          ) : url ? (
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

        {/* Name + kind + schedule summary */}
        <div className="flex-1 min-w-0">
          <p className="text-nw-100 truncate" style={{ fontSize: 14, fontWeight: 500 }}>
            {slide.name}
          </p>
          <p className="text-nw-500 flex items-center gap-1.5" style={{ fontSize: 11 }}>
            <span className="capitalize">{slide.kind}</span>
            {summary && (
              <>
                <span className="text-nw-700">·</span>
                <span className="inline-flex items-center gap-1 text-gold-400" style={{ color: `${GOLD}` }}>
                  <CalendarClock size={10} /> {summary}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Duration (ignored for video — it plays its full length) */}
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

        {/* Settings (transition + schedule) toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={busy}
          title="Transition & schedule"
          className="shrink-0 rounded-lg border transition-colors disabled:opacity-40"
          style={{
            padding: 7,
            borderColor: open ? `${GOLD}40` : 'rgba(255,255,255,0.1)',
            background: open ? `${GOLD}18` : 'transparent',
            color: open ? GOLD : 'var(--nw-400, #8b93a1)',
          }}
        >
          <SlidersHorizontal size={15} />
        </button>

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

      {/* ── Settings panel (transition + schedule) ───────────────────────── */}
      {open && (
        <div
          className="border-t border-[rgba(255,255,255,0.08)] flex flex-col gap-4"
          style={{ padding: 14 }}
        >
          {/* Transition + speed */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-nw-400 shrink-0" style={{ fontSize: 12, width: 88 }}>Transition</span>
            <div style={{ width: 130 }}>
              <Select
                value={slide.transition}
                disabled={busy}
                onChange={(e) => onTransition(e.target.value as SlideTransition)}
              >
                <option value="fade">Fade</option>
                <option value="cut">Cut</option>
                <option value="slide">Slide</option>
              </Select>
            </div>
            {slide.transition !== 'cut' && (
              <div className="flex items-center gap-2">
                <span className="text-nw-500" style={{ fontSize: 12 }}>Speed</span>
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={100}
                  value={slide.transition_ms ?? 700}
                  disabled={busy}
                  onChange={(e) => onSpeed(Number(e.target.value))}
                  style={{ width: 130, accentColor: GOLD }}
                />
                <span className="text-nw-400 tabular-nums" style={{ fontSize: 12, width: 34 }}>
                  {((slide.transition_ms ?? 700) / 1000).toFixed(1)}s
                </span>
              </div>
            )}
            {isVideo && slide.transition !== 'cut' && (
              <span className="text-nw-600 w-full" style={{ fontSize: 11 }}>Cuts if the previous slide is also a video.</span>
            )}
          </div>

          {/* Days of week */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-nw-400 shrink-0" style={{ fontSize: 12, width: 88 }}>Days</span>
            <div className="flex items-center gap-1.5">
              {DOW.map((d, i) => {
                const on = days.includes(d.n)
                return (
                  <button
                    key={`${d.n}-${i}`}
                    type="button"
                    onClick={() => toggleDay(d.n)}
                    disabled={busy}
                    className="rounded-lg border transition-colors disabled:opacity-40"
                    style={{
                      width: 30,
                      height: 30,
                      fontSize: 12,
                      fontWeight: 600,
                      borderColor: on ? `${GOLD}45` : 'rgba(255,255,255,0.1)',
                      background: on ? `${GOLD}20` : 'transparent',
                      color: on ? GOLD : 'var(--nw-500, #6b7280)',
                    }}
                  >
                    {d.l}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-1">
              <PresetBtn label="All" active={sameSet(days, ALL_DAYS)} busy={busy} onClick={() => onDays(ALL_DAYS)} />
              <PresetBtn label="Weekdays" active={sameSet(days, [1, 2, 3, 4, 5])} busy={busy} onClick={() => onDays([1, 2, 3, 4, 5])} />
              <PresetBtn label="Weekends" active={sameSet(days, [0, 6])} busy={busy} onClick={() => onDays([0, 6])} />
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-nw-400 shrink-0" style={{ fontSize: 12, width: 88 }}>Date range</span>
            <label className="flex items-center gap-2 text-nw-500" style={{ fontSize: 12 }}>
              From
              <input
                type="date"
                value={slide.starts_on ?? ''}
                disabled={busy}
                onChange={(e) => onDates({ starts_on: e.target.value || null })}
                className="bg-nw-900 border border-[rgba(255,255,255,0.1)] rounded-lg text-nw-100 focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
                style={{ padding: '5px 8px', fontSize: 12, colorScheme: 'dark' }}
              />
            </label>
            <label className="flex items-center gap-2 text-nw-500" style={{ fontSize: 12 }}>
              Until
              <input
                type="date"
                value={slide.ends_on ?? ''}
                disabled={busy}
                onChange={(e) => onDates({ ends_on: e.target.value || null })}
                className="bg-nw-900 border border-[rgba(255,255,255,0.1)] rounded-lg text-nw-100 focus:outline-none focus:border-gold-500/50 disabled:opacity-40"
                style={{ padding: '5px 8px', fontSize: 12, colorScheme: 'dark' }}
              />
            </label>
            {(slide.starts_on || slide.ends_on) && (
              <button
                type="button"
                onClick={() => onDates({ starts_on: null, ends_on: null })}
                disabled={busy}
                className="text-nw-500 hover:text-nw-200 transition-colors disabled:opacity-40"
                style={{ fontSize: 11 }}
              >
                Clear dates
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PresetBtn({ label, active, busy, onClick }: { label: string; active: boolean; busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="rounded-lg border transition-colors disabled:opacity-40"
      style={{
        padding: '5px 9px',
        fontSize: 11,
        fontWeight: 600,
        borderColor: active ? `${GOLD}40` : 'rgba(255,255,255,0.1)',
        background: active ? `${GOLD}14` : 'transparent',
        color: active ? GOLD : 'var(--nw-400, #8b93a1)',
      }}
    >
      {label}
    </button>
  )
}

// ─── Add-embed modal ─────────────────────────────────────────────────────────

function EmbedModal({
  open,
  busy,
  onClose,
  onAdd,
}: {
  open: boolean
  busy: boolean
  onClose: () => void
  onAdd: (url: string, name: string) => void
}) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  useEffect(() => {
    if (open) {
      setUrl('')
      setName('')
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="Add an embed" width="md">
      <div className="flex flex-col gap-4">
        <Field label="Page URL">
          <Input
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Name (optional)">
          <Input placeholder="e.g. Live timetable" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <p className="text-nw-500" style={{ fontSize: 12 }}>
          The page is shown full-screen in a display-only frame. Some sites block embedding — test with
          &ldquo;Open display&rdquo; after adding.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="gold" size="sm" loading={busy} disabled={!url.trim()} onClick={() => onAdd(url.trim(), name.trim())}>
            Add embed
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Name modal (create / rename screen) ─────────────────────────────────────

function NameModal({
  open,
  title,
  label,
  placeholder,
  initial = '',
  confirmLabel,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  label: string
  placeholder?: string
  initial?: string
  confirmLabel: string
  busy: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState(initial)
  useEffect(() => {
    if (open) setName(initial)
  }, [open, initial])

  return (
    <Modal open={open} onClose={onClose} title={title} width="sm">
      <div className="flex flex-col gap-4">
        <Field label={label}>
          <Input
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSubmit(name.trim())}
            autoFocus
          />
        </Field>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="gold" size="sm" loading={busy} disabled={!name.trim()} onClick={() => onSubmit(name.trim())}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
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
