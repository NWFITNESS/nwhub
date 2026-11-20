'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Lock, Wand2, Trash2, X, StickyNote } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { DarkSelect } from '@/components/ui/DarkSelect'
import {
  DAY_LABELS, mondayOf, weekDates, addDays, fromISODate, toISODate, dayOfWeekIndex,
  formatTime, hexWithAlpha, sessionHours, formatHours,
} from '@/lib/rota'
import type { RotaSession, RotaCoach, RotaClassType } from '@/lib/rota'

// inline field styles (Tailwind-v4 padding gotcha) — colorScheme:dark fixes the
// native dropdown rendering (options were pale-on-white).
const fieldStyle: React.CSSProperties = {
  padding: '11px 12px', fontSize: 15, width: '100%', borderRadius: 10,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#edf3fb',
  colorScheme: 'dark',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      {children}
    </label>
  )
}

const t5 = (t: string) => (t || '').slice(0, 5)

interface SessionDraft {
  id?: string
  date: string
  start_time: string
  end_time: string
  class_type_id: string | null
  coach_id: string | null
  notes: string
  locked: boolean
  status: 'active' | 'cancelled'
}

function monthLabel(iso: string): string {
  const d = fromISODate(iso)
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
function firstOfMonth(iso: string): string {
  const d = fromISODate(iso)
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1))
}
function shiftMonth(iso: string, delta: number): string {
  const d = fromISODate(iso)
  return toISODate(new Date(d.getFullYear(), d.getMonth() + delta, 1))
}

export function RotaBoard() {
  const [view, setView] = useState<'month' | 'week'>('month')
  const [cursor, setCursor] = useState(() => toISODate(new Date()))
  const [sessions, setSessions] = useState<RotaSession[]>([])
  const [coaches, setCoaches] = useState<RotaCoach[]>([])
  const [classTypes, setClassTypes] = useState<RotaClassType[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<SessionDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const [genBusy, setGenBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [daySheet, setDaySheet] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [gapsOnly, setGapsOnly] = useState(false)

  const classMap = useMemo(() => new Map(classTypes.map(c => [c.id, c])), [classTypes])
  const coachMap = useMemo(() => new Map(coaches.map(c => [c.id, c])), [coaches])

  // Visible date range for the current view. Month fetches/stats cover the month
  // only; `days` is the calendar grid (out-of-month cells render blank).
  const range = useMemo(() => {
    if (view === 'week') {
      const mon = mondayOf(cursor)
      return { start: mon, end: addDays(mon, 6), days: weekDates(mon) }
    }
    const first = firstOfMonth(cursor)
    const d = fromISODate(first)
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const lastOfMonth = toISODate(new Date(d.getFullYear(), d.getMonth(), daysInMonth))
    const gridStart = mondayOf(first)
    const totalCells = Math.ceil((dayOfWeekIndex(first) + daysInMonth) / 7) * 7
    const days = Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i))
    return { start: first, end: lastOfMonth, days }
  }, [view, cursor])

  const loadMeta = useCallback(async () => {
    const [cRes, ctRes] = await Promise.all([
      fetch('/api/coach-rota/coaches').then(r => r.json()),
      fetch('/api/coach-rota/class-types').then(r => r.json()),
    ])
    setCoaches(cRes.coaches ?? [])   // keep all for name lookup; dropdown filters to active
    setClassTypes(ctRes.classTypes ?? [])
  }, [])

  const activeCoaches = useMemo(() => coaches.filter(c => c.active), [coaches])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [sRes, nRes] = await Promise.all([
      fetch(`/api/coach-rota/sessions?from=${range.start}&to=${range.end}`).then(r => r.json()),
      fetch(`/api/coach-rota/notes?from=${range.start}&to=${range.end}`).then(r => r.json()),
    ])
    setSessions(sRes.sessions ?? [])
    const m: Record<string, string> = {}
    for (const n of (nRes.notes ?? [])) m[n.date] = n.note
    setNotes(m)
    setLoading(false)
  }, [range.start, range.end])

  async function saveNote(date: string, text: string) {
    await fetch('/api/coach-rota/notes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, note: text }) })
    flash(text.trim() ? 'Note saved' : 'Note cleared')
    loadData()
  }

  useEffect(() => { loadMeta() }, [loadMeta])
  useEffect(() => { loadData() }, [loadData])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2600) }

  const byDay = useMemo(() => {
    const map: Record<string, RotaSession[]> = {}
    for (const s of sessions) (map[s.date] ??= []).push(s)
    for (const d of Object.keys(map)) map[d].sort((a, b) => a.start_time.localeCompare(b.start_time))
    return map
  }, [sessions])

  // stats for the current period (active sessions)
  const active = sessions.filter(s => s.status === 'active')
  const openCount = active.filter(s => !s.coach_id).length
  const filledCount = active.filter(s => s.coach_id).length
  const periodHours = active.filter(s => s.coach_id).reduce((n, s) => n + sessionHours(s.start_time, s.end_time), 0)

  // ── CRUD ──
  function openNew(date: string) {
    setDraft({ date, start_time: '18:00', end_time: '19:00', class_type_id: classTypes[0]?.id ?? null, coach_id: null, notes: '', locked: false, status: 'active' })
  }
  function openEdit(s: RotaSession) {
    setDraft({ id: s.id, date: s.date, start_time: t5(s.start_time), end_time: t5(s.end_time), class_type_id: s.class_type_id, coach_id: s.coach_id, notes: s.notes ?? '', locked: s.locked, status: s.status })
  }
  async function saveDraft() {
    if (!draft) return
    setSaving(true)
    const payload = { date: draft.date, start_time: draft.start_time, end_time: draft.end_time, class_type_id: draft.class_type_id, coach_id: draft.coach_id, notes: draft.notes, locked: draft.locked, status: draft.status }
    const res = draft.id
      ? await fetch('/api/coach-rota/sessions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: draft.id, ...payload }) })
      : await fetch('/api/coach-rota/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (!res.ok) { const e = await res.json().catch(() => ({})); flash(e.error ?? 'Save failed'); return }
    setDraft(null)
    loadData()
  }
  async function deleteDraft() {
    if (!draft?.id) return
    setSaving(true)
    await fetch(`/api/coach-rota/sessions?id=${draft.id}`, { method: 'DELETE' })
    setSaving(false)
    setDraft(null)
    loadData()
  }
  async function generate(mode: 'template' | 'copy') {
    setGenBusy(true)
    // Month view + template → build every week of the visible month; otherwise the cursor's week.
    const mondays = (mode === 'template' && view === 'month')
      ? [0, 7, 14, 21, 28, 35].map(i => mondayOf(range.days[i]))
      : [mondayOf(cursor)]
    let ins = 0, upd = 0, failed = false
    for (const mon of mondays) {
      const body: Record<string, unknown> = { week: mon, mode }
      if (mode === 'copy') body.from = addDays(mon, -7)
      const res = await fetch('/api/coach-rota/generate-week', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { failed = true; continue }
      const j = await res.json()
      ins += j.inserted ?? 0; upd += j.updated ?? 0
    }
    setGenBusy(false)
    setGenOpen(false)
    flash(failed ? 'Some weeks failed to generate' : `${ins ? `Added ${ins}` : 'No new slots'}${upd ? ` · updated ${upd}` : ''}`)
    loadData()
  }

  const periodLabel = view === 'month'
    ? monthLabel(cursor)
    : `${fromISODate(range.days[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${fromISODate(range.days[6]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  const curMonth = fromISODate(cursor).getMonth()
  const todayISO = toISODate(new Date())

  function prev() { setCursor(view === 'month' ? shiftMonth(cursor, -1) : addDays(mondayOf(cursor), -7)) }
  function next() { setCursor(view === 'month' ? shiftMonth(cursor, 1) : addDays(mondayOf(cursor), 7)) }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Coaching"
        title="Coach Rota"
        description={`${periodLabel} · ${filledCount} filled · ${openCount} open · ${formatHours(periodHours)}h`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setGenOpen(true)}><Wand2 size={15} /> Generate</Button>
            <Button variant="gold" size="sm" onClick={() => openNew(view === 'week' ? range.days[0] : todayISO)}><Plus size={15} /> Add</Button>
          </>
        }
      />

      {/* Controls: view toggle + nav + legend */}
      <Panel>
        <div className="flex flex-col gap-3" style={{ padding: '12px 14px' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* View toggle */}
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: 11, padding: 4 }}>
              {(['month', 'week'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '11px 24px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', textTransform: 'capitalize',
                  background: view === v ? 'rgba(212,160,23,0.18)' : 'transparent', color: view === v ? '#f5d775' : '#8296b4',
                }}>{v}</button>
              ))}
            </div>
            {/* Nav */}
            <div className="flex items-center gap-1.5">
              <button onClick={prev} style={navBtn} aria-label="Previous"><ChevronLeft size={18} /></button>
              <button onClick={() => setCursor(todayISO)} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#8296b4' }}>Today</button>
              <button onClick={next} style={navBtn} aria-label="Next"><ChevronRight size={18} /></button>
              <span className="text-nw-100" style={{ fontSize: 15, fontWeight: 700, marginLeft: 8, minWidth: 120 }}>{periodLabel}</span>
            </div>
          </div>
          {/* Legend + gaps toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            {classTypes.map(ct => (
              <span key={ct.id} className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: '#8296b4' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: ct.color, display: 'inline-block' }} />{ct.name}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: '#f59e0b' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, border: '1.5px dashed #f59e0b', display: 'inline-block' }} />needs coach
            </span>
            <button onClick={() => setGapsOnly(g => !g)} style={{
              marginLeft: 'auto', padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${gapsOnly ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.12)'}`,
              background: gapsOnly ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.03)', color: gapsOnly ? '#f5b74e' : '#8296b4',
            }}>{gapsOnly ? '● Highlighting gaps' : 'Highlight gaps'}</button>
          </div>
        </div>
      </Panel>

      {view === 'month'
        ? <MonthGrid days={range.days} byDay={byDay} curMonth={curMonth} todayISO={todayISO} classMap={classMap} coachMap={coachMap} notes={notes} gapsOnly={gapsOnly} onDay={setDaySheet} loading={loading} />
        : <WeekGrid days={range.days} byDay={byDay} todayISO={todayISO} classMap={classMap} coachMap={coachMap} notes={notes} gapsOnly={gapsOnly} loading={loading} onEdit={openEdit} onAdd={openNew} onDayNote={setDaySheet} />
      }

      {/* Day detail sheet (month view tap) */}
      {daySheet && (
        <DaySheet
          date={daySheet}
          sessions={byDay[daySheet] ?? []}
          classMap={classMap} coachMap={coachMap}
          note={notes[daySheet] ?? ''}
          onSaveNote={(t) => saveNote(daySheet, t)}
          onClose={() => setDaySheet(null)}
          onEdit={(s) => { setDaySheet(null); openEdit(s) }}
          onAdd={() => { const d = daySheet; setDaySheet(null); openNew(d) }}
        />
      )}

      {/* Session edit modal */}
      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit session' : 'Add session'} width="md">
        {draft && (
          <div className="flex flex-col gap-3">
            <Field label="Date"><input type="date" style={fieldStyle} value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start"><input type="time" style={fieldStyle} value={draft.start_time} onChange={e => setDraft({ ...draft, start_time: e.target.value })} /></Field>
              <Field label="End"><input type="time" style={fieldStyle} value={draft.end_time} onChange={e => setDraft({ ...draft, end_time: e.target.value })} /></Field>
            </div>
            <Field label="Class type">
              <DarkSelect value={draft.class_type_id ?? ''} onChange={v => setDraft({ ...draft, class_type_id: v || null })} style={fieldStyle}
                options={[{ value: '', label: '— None —' }, ...classTypes.map(ct => ({ value: ct.id, label: ct.name }))]} />
            </Field>
            <Field label="Coach">
              <DarkSelect value={draft.coach_id ?? ''} onChange={v => setDraft({ ...draft, coach_id: v || null })} style={fieldStyle}
                options={[{ value: '', label: '— Needs filling —' }, ...activeCoaches.map(c => ({ value: c.id, label: c.name }))]} />
            </Field>
            <Field label="Notes"><input type="text" style={fieldStyle} value={draft.notes} placeholder="Optional" onChange={e => setDraft({ ...draft, notes: e.target.value })} /></Field>
            <div className="flex items-center gap-4" style={{ marginTop: 2 }}>
              <label className="inline-flex items-center gap-2" style={{ fontSize: 13, color: '#8296b4', cursor: 'pointer' }}>
                <input type="checkbox" checked={draft.locked} onChange={e => setDraft({ ...draft, locked: e.target.checked })} /> <Lock size={13} /> Lock
              </label>
              <label className="inline-flex items-center gap-2" style={{ fontSize: 13, color: '#8296b4', cursor: 'pointer' }}>
                <input type="checkbox" checked={draft.status === 'cancelled'} onChange={e => setDraft({ ...draft, status: e.target.checked ? 'cancelled' : 'active' })} /> Cancelled
              </label>
            </div>
            <div className="flex items-center justify-between gap-3" style={{ marginTop: 10 }}>
              {draft.id ? <Button variant="danger" size="sm" onClick={deleteDraft} disabled={saving}><Trash2 size={14} /> Delete</Button> : <span />}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
                <Button variant="gold" size="sm" onClick={saveDraft} loading={saving}>{draft.id ? 'Save' : 'Add'}</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate modal */}
      <Modal open={genOpen} onClose={() => setGenOpen(false)} title={view === 'month' ? `Build ${monthLabel(cursor)}` : `Build week of ${fromISODate(mondayOf(cursor)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`} width="md">
        <p className="text-nw-400" style={{ fontSize: 14, marginBottom: 16 }}>Existing sessions keep their coaches — class types &amp; times are refreshed from the template.</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => generate('template')} disabled={genBusy} style={genChoiceStyle}>
            <Wand2 size={18} className="text-gold-300" />
            <span><span style={{ display: 'block', fontWeight: 600, color: '#edf3fb', fontSize: 14 }}>From weekly template</span><span style={{ fontSize: 12, color: '#8296b4' }}>{view === 'month' ? 'Build every week of this month' : 'Add missing slots + refresh class types'}</span></span>
          </button>
          <button onClick={() => generate('copy')} disabled={genBusy} style={genChoiceStyle}>
            <ChevronLeft size={18} className="text-gold-300" />
            <span><span style={{ display: 'block', fontWeight: 600, color: '#edf3fb', fontSize: 14 }}>Copy previous week</span><span style={{ fontSize: 12, color: '#8296b4' }}>Duplicate last week’s sessions (coaches cleared)</span></span>
          </button>
        </div>
      </Modal>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: '#121820', border: '1px solid rgba(212,160,23,0.3)', color: '#edf3fb', padding: '10px 18px', borderRadius: 12, fontSize: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {toast}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#8296b4', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = { padding: 9, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#8296b4', cursor: 'pointer', display: 'flex', minWidth: 40, justifyContent: 'center' }
const genChoiceStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%', padding: '14px 16px', borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }

// ── Month calendar — shows time + coach at a glance; open slots flagged amber ─
function firstName(name?: string) { return name ? name.split(' ')[0] : 'Assigned' }

function MonthGrid({ days, byDay, curMonth, todayISO, classMap, coachMap, notes, gapsOnly, onDay, loading }: {
  days: string[]; byDay: Record<string, RotaSession[]>; curMonth: number; todayISO: string
  classMap: Map<string, RotaClassType>; coachMap: Map<string, RotaCoach>; notes: Record<string, string>; gapsOnly: boolean
  onDay: (d: string) => void; loading: boolean
}) {
  return (
    <Panel>
      <div style={{ padding: 10 }}>
        {/* weekday header */}
        <div className="grid grid-cols-7" style={{ gap: 5, marginBottom: 5 }}>
          {DAY_LABELS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#5e6e82', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '2px 0' }}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7" style={{ gap: 5 }}>
          {days.map(date => {
            const inMonth = fromISODate(date).getMonth() === curMonth
            if (!inMonth) return <div key={date} />   // show this month only
            const list = (byDay[date] ?? []).filter(s => s.status === 'active')
            const isToday = date === todayISO
            const open = list.filter(s => !s.coach_id).length
            const dimCell = gapsOnly && open === 0 && list.length > 0  // fully-filled days fade back
            return (
              <button key={date} onClick={() => onDay(date)} style={{
                textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
                minHeight: 152, padding: 8, borderRadius: 12,
                border: `1px solid ${isToday ? 'rgba(212,160,23,0.45)' : open > 0 && gapsOnly ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)'}`,
                background: 'rgba(255,255,255,0.025)', opacity: dimCell ? 0.4 : 1,
              }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: isToday ? '#e8c75a' : '#dce5f0' }}>{fromISODate(date).getDate()}</span>
                  {open > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.18)', borderRadius: 6, padding: '1px 6px' }}>{open} open</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden' }}>
                  {notes[date] && (
                    <span title={notes[date]} style={{ fontSize: 10, lineHeight: '15px', borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: 'rgba(245,158,11,0.18)', color: '#f5b74e', fontWeight: 700 }}>📌 {notes[date]}</span>
                  )}
                  {list.slice(0, 7).map(s => {
                    const color = classMap.get(s.class_type_id ?? '')?.color ?? '#64748b'
                    const needs = !s.coach_id
                    const who = needs ? 'OPEN' : firstName(coachMap.get(s.coach_id ?? '')?.name)
                    const faded = gapsOnly && !needs   // dim filled when highlighting gaps
                    return (
                      <span key={s.id} title={`${formatTime(s.start_time)} ${classMap.get(s.class_type_id ?? '')?.name ?? ''} — ${needs ? 'needs coach' : coachMap.get(s.coach_id ?? '')?.name ?? ''}`} style={{
                        display: 'flex', gap: 4, alignItems: 'baseline', fontSize: 11.5, lineHeight: '18px', borderRadius: 4, padding: '1px 5px',
                        whiteSpace: 'nowrap', overflow: 'hidden',
                        borderLeft: `3px solid ${needs ? '#f59e0b' : color}`,
                        background: needs ? 'rgba(245,158,11,0.16)' : hexWithAlpha(color, 0.18),
                        opacity: faded ? 0.3 : 1,
                        boxShadow: needs && gapsOnly ? '0 0 0 1px rgba(245,158,11,0.5)' : 'none',
                      }}>
                        <span style={{ fontWeight: 700, color: needs ? '#f5b74e' : '#edf3fb', flexShrink: 0 }}>{formatTime(s.start_time)}</span>
                        <span style={{ color: needs ? '#f5b74e' : '#b9c6da', fontWeight: needs ? 800 : 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{who}</span>
                      </span>
                    )
                  })}
                  {list.length > 7 && <span style={{ fontSize: 10.5, color: '#5e6e82', paddingLeft: 2 }}>+{list.length - 7} more</span>}
                </div>
              </button>
            )
          })}
        </div>
        {loading && <p style={{ padding: 12, color: '#8296b4', fontSize: 13, textAlign: 'center' }}>Loading…</p>}
      </div>
    </Panel>
  )
}

// ── Week grid (columns of days) ──────────────────────────────────────────────
function WeekGrid({ days, byDay, todayISO, classMap, coachMap, notes, gapsOnly, loading, onEdit, onAdd, onDayNote }: {
  days: string[]; byDay: Record<string, RotaSession[]>; todayISO: string
  classMap: Map<string, RotaClassType>; coachMap: Map<string, RotaCoach>; notes: Record<string, string>; gapsOnly: boolean; loading: boolean
  onEdit: (s: RotaSession) => void; onAdd: (date: string) => void; onDayNote: (date: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((date, i) => {
        const isToday = date === todayISO
        const list = byDay[date] ?? []
        return (
          <div key={date} className="rounded-2xl border" style={{ borderColor: isToday ? 'rgba(212,160,23,0.35)' : 'rgba(255,255,255,0.08)', background: 'var(--nw-750, #121820)', minHeight: 120, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '8px 10px 8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => onDayNote(date)} style={{ textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'baseline', gap: 6, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#e8c75a' : '#edf3fb' }}>{DAY_LABELS[i]}</span>
                <span style={{ fontSize: 12, color: '#5e6e82' }}>{fromISODate(date).getDate()}</span>
              </button>
              <button onClick={() => onDayNote(date)} aria-label="Add or edit day note"
                title={notes[date] ? 'Edit day note' : 'Add a day note (e.g. Christmas Day)'}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 7px', borderRadius: 7, cursor: 'pointer',
                  border: `1px solid ${notes[date] ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  background: notes[date] ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', color: notes[date] ? '#f5b74e' : '#8296b4' }}>
                <StickyNote size={12} />{!notes[date] && <span style={{ fontSize: 10.5, fontWeight: 700 }}>Note</span>}
              </button>
            </div>
            {notes[date] && (
              <div style={{ margin: '6px 8px 0', padding: '5px 8px', borderRadius: 7, background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', color: '#f5b74e', fontSize: 11.5, fontWeight: 600 }}>📌 {notes[date]}</div>
            )}
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {list.map(s => (
                <div key={s.id} style={{ opacity: gapsOnly && s.coach_id ? 0.35 : 1 }}>
                  <SessionCell s={s} ct={classMap.get(s.class_type_id ?? '')} coach={coachMap.get(s.coach_id ?? '')} onClick={() => onEdit(s)} />
                </div>
              ))}
              {list.length === 0 && !loading && <span style={{ fontSize: 12, color: '#5e6e82', textAlign: 'center', padding: '8px 0' }}>—</span>}
              <button onClick={() => onAdd(date)} style={{ marginTop: 'auto', padding: 8, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.14)', background: 'transparent', color: '#5e6e82', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Plus size={13} /> Add
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Day detail bottom sheet ──────────────────────────────────────────────────
function DaySheet({ date, sessions, classMap, coachMap, note, onSaveNote, onClose, onEdit, onAdd }: {
  date: string; sessions: RotaSession[]; classMap: Map<string, RotaClassType>; coachMap: Map<string, RotaCoach>
  note: string; onSaveNote: (text: string) => void
  onClose: () => void; onEdit: (s: RotaSession) => void; onAdd: () => void
}) {
  const [noteText, setNoteText] = useState(note)
  const list = sessions.filter(s => s.status === 'active' || s.status === 'cancelled')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 520, background: '#121820', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', padding: 20, maxHeight: '85dvh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.55)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#edf3fb' }}>{fromISODate(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8296b4', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Day note — coaches see this on the rota */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>📌 Day note <span style={{ textTransform: 'none', fontWeight: 400 }}>(all coaches see this)</span></div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="e.g. Christmas Day, gym closed" rows={2}
            style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          {noteText !== note && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => setNoteText(note)}>Cancel</Button>
              <Button variant="gold" size="sm" onClick={() => onSaveNote(noteText)}>{noteText.trim() ? 'Save note' : 'Clear note'}</Button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.length === 0 && <p style={{ fontSize: 14, color: '#8296b4', padding: '8px 0' }}>No sessions.</p>}
          {list.map(s => {
            const ct = classMap.get(s.class_type_id ?? '')
            const color = ct?.color ?? '#64748b'
            const coach = coachMap.get(s.coach_id ?? '')
            const needs = !s.coach_id && s.status === 'active'
            const cancelled = s.status === 'cancelled'
            return (
              <button key={s.id} onClick={() => onEdit(s)} style={{
                textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                borderRadius: 12, padding: '12px 14px', border: `1px solid ${hexWithAlpha(color, 0.3)}`, borderLeft: `4px solid ${cancelled ? '#5e6e82' : color}`,
                background: cancelled ? 'rgba(255,255,255,0.03)' : hexWithAlpha(color, 0.1), opacity: cancelled ? 0.6 : 1,
              }}>
                <div style={{ minWidth: 92 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#edf3fb' }}>{formatTime(s.start_time)}</div>
                  <div style={{ fontSize: 11, color: '#8296b4' }}>{formatTime(s.end_time)}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#edf3fb' }}>{ct?.name ?? 'Class'}{s.locked && <Lock size={12} style={{ color: '#8296b4', marginLeft: 6, display: 'inline' }} />}</div>
                  {cancelled
                    ? <span style={{ fontSize: 12, fontWeight: 700, color: '#8296b4' }}>Cancelled</span>
                    : needs
                      ? <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '2px 7px', display: 'inline-block', marginTop: 2 }}>NEEDS COACH</span>
                      : <span style={{ fontSize: 13, color: '#b9c6da' }}>{coach?.name ?? 'Assigned'}</span>}
                </div>
              </button>
            )
          })}
        </div>
        <button onClick={onAdd} style={{ marginTop: 14, width: '100%', padding: 13, borderRadius: 12, border: '1px solid rgba(212,160,23,0.4)', background: 'rgba(212,160,23,0.14)', color: '#f5d775', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Plus size={16} /> Add session
        </button>
      </div>
    </div>
  )
}

// ── week session cell ────────────────────────────────────────────────────────
function SessionCell({ s, ct, coach, onClick }: { s: RotaSession; ct?: RotaClassType; coach?: RotaCoach; onClick: () => void }) {
  const color = ct?.color ?? '#64748b'
  const cancelled = s.status === 'cancelled'
  const needs = !s.coach_id && !cancelled
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', width: '100%', borderRadius: 10, cursor: 'pointer', padding: '8px 10px',
      background: cancelled ? 'rgba(255,255,255,0.03)' : hexWithAlpha(color, 0.16),
      border: `1px solid ${cancelled ? 'rgba(255,255,255,0.06)' : hexWithAlpha(color, 0.3)}`,
      borderLeft: `3px solid ${cancelled ? '#5e6e82' : color}`,
      opacity: cancelled ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: cancelled ? '#8296b4' : '#edf3fb', textDecoration: cancelled ? 'line-through' : 'none' }}>{formatTime(s.start_time)}</span>
        {s.locked && <Lock size={11} className="text-nw-500" />}
      </div>
      <div style={{ fontSize: 12, color: '#b9c6da', marginTop: 1 }}>{ct?.name ?? 'Class'}</div>
      {cancelled ? (
        <span style={{ fontSize: 11, fontWeight: 700, color: '#8296b4' }}>Cancelled</span>
      ) : needs ? (
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.4px', color: '#f59e0b', background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '2px 6px', display: 'inline-block', marginTop: 3 }}>NEEDS COACH</span>
      ) : (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#edf3fb', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: coach?.color ?? '#22c55e', display: 'inline-block' }} />
          {coach?.name ?? 'Assigned'}
        </span>
      )}
    </button>
  )
}
