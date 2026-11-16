'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Lock, Wand2, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import {
  DAY_LABELS, DAY_LABELS_LONG, mondayOf, weekDates, addDays, fromISODate, toISODate,
  formatTime, hexWithAlpha, sessionHours, formatHours,
} from '@/lib/rota'
import type { RotaSession, RotaCoach, RotaClassType } from '@/lib/rota'

// ── small styled inputs (inline padding per NWHub Tailwind-v4 gotcha) ────────
const fieldStyle: React.CSSProperties = {
  padding: '9px 12px', fontSize: 14, width: '100%', borderRadius: 10,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#edf3fb',
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      {children}
    </label>
  )
}

const t5 = (t: string) => (t || '').slice(0, 5)  // 'HH:MM:SS' → 'HH:MM'

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

export function RotaBoard() {
  const [week, setWeek] = useState(() => mondayOf())
  const [sessions, setSessions] = useState<RotaSession[]>([])
  const [coaches, setCoaches] = useState<RotaCoach[]>([])
  const [classTypes, setClassTypes] = useState<RotaClassType[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<SessionDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const [genBusy, setGenBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const dates = useMemo(() => weekDates(week), [week])
  const classMap = useMemo(() => new Map(classTypes.map(c => [c.id, c])), [classTypes])
  const coachMap = useMemo(() => new Map(coaches.map(c => [c.id, c])), [coaches])

  const loadMeta = useCallback(async () => {
    const [cRes, ctRes] = await Promise.all([
      fetch('/api/coach-rota/coaches').then(r => r.json()),
      fetch('/api/coach-rota/class-types').then(r => r.json()),
    ])
    setCoaches((cRes.coaches ?? []).filter((c: RotaCoach) => c.active))
    setClassTypes(ctRes.classTypes ?? [])
  }, [])

  const loadWeek = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/coach-rota/sessions?week=${week}`).then(r => r.json())
    setSessions(res.sessions ?? [])
    setLoading(false)
  }, [week])

  useEffect(() => { loadMeta() }, [loadMeta])
  useEffect(() => { loadWeek() }, [loadWeek])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2600) }

  // ── stats ──
  const activeSessions = sessions.filter(s => s.status === 'active')
  const openCount = activeSessions.filter(s => !s.coach_id).length
  const filledCount = activeSessions.filter(s => s.coach_id).length
  const weekHours = activeSessions.filter(s => s.coach_id).reduce((n, s) => n + sessionHours(s.start_time, s.end_time), 0)

  const byDay = useMemo(() => {
    const map: Record<string, RotaSession[]> = {}
    for (const d of dates) map[d] = []
    for (const s of sessions) if (map[s.date]) map[s.date].push(s)
    for (const d of dates) map[d].sort((a, b) => a.start_time.localeCompare(b.start_time))
    return map
  }, [sessions, dates])

  // ── session CRUD ──
  function openNew(date: string) {
    setDraft({ date, start_time: '18:00', end_time: '19:00', class_type_id: classTypes[0]?.id ?? null, coach_id: null, notes: '', locked: false, status: 'active' })
  }
  function openEdit(s: RotaSession) {
    setDraft({ id: s.id, date: s.date, start_time: t5(s.start_time), end_time: t5(s.end_time), class_type_id: s.class_type_id, coach_id: s.coach_id, notes: s.notes ?? '', locked: s.locked, status: s.status })
  }

  async function saveDraft() {
    if (!draft) return
    setSaving(true)
    const payload = {
      date: draft.date, start_time: draft.start_time, end_time: draft.end_time,
      class_type_id: draft.class_type_id, coach_id: draft.coach_id, notes: draft.notes,
      locked: draft.locked, status: draft.status,
    }
    const res = draft.id
      ? await fetch('/api/coach-rota/sessions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: draft.id, ...payload }) })
      : await fetch('/api/coach-rota/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (!res.ok) { const e = await res.json().catch(() => ({})); flash(e.error ?? 'Save failed'); return }
    setDraft(null)
    loadWeek()
  }

  async function deleteDraft() {
    if (!draft?.id) return
    setSaving(true)
    await fetch(`/api/coach-rota/sessions?id=${draft.id}`, { method: 'DELETE' })
    setSaving(false)
    setDraft(null)
    loadWeek()
  }

  async function generate(mode: 'template' | 'copy') {
    setGenBusy(true)
    const body: Record<string, unknown> = { week, mode }
    if (mode === 'copy') body.from = addDays(week, -7)
    const res = await fetch('/api/coach-rota/generate-week', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setGenBusy(false)
    setGenOpen(false)
    if (!res.ok) { const e = await res.json().catch(() => ({})); flash(e.error ?? 'Generate failed'); return }
    const { inserted } = await res.json()
    flash(inserted > 0 ? `Added ${inserted} session${inserted === 1 ? '' : 's'}` : 'Nothing new to add — week already populated')
    loadWeek()
  }

  const rangeLabel = `${fromISODate(dates[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${fromISODate(dates[6]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
  const isThisWeek = week === mondayOf()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Coaching"
        title="Coach Rota"
        description={`${rangeLabel} · ${filledCount} filled · ${openCount} need coaches · ${formatHours(weekHours)}h`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setGenOpen(true)}><Wand2 size={15} /> Generate week</Button>
            <Button variant="gold" size="sm" onClick={() => openNew(dates[0])}><Plus size={15} /> Add session</Button>
          </>
        }
      />

      {/* Week navigation + legend */}
      <Panel>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setWeek(addDays(week, -7))} aria-label="Previous week"><ChevronLeft size={16} /></Button>
            <button onClick={() => setWeek(mondayOf())} style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(212,160,23,0.3)', background: isThisWeek ? 'rgba(212,160,23,0.14)' : 'transparent', color: isThisWeek ? '#e8c75a' : '#8296b4' }}>
              {isThisWeek ? 'This week' : 'Jump to today'}
            </button>
            <Button variant="ghost" size="sm" onClick={() => setWeek(addDays(week, 7))} aria-label="Next week"><ChevronRight size={16} /></Button>
            <span className="text-nw-200" style={{ fontSize: 14, fontWeight: 600, marginLeft: 6 }}>{rangeLabel}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {classTypes.map(ct => (
              <span key={ct.id} className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: '#8296b4' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: ct.color, display: 'inline-block' }} />{ct.name}
              </span>
            ))}
          </div>
        </div>
      </Panel>

      {/* The week grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {dates.map((date, i) => {
          const isToday = date === toISODate(new Date())
          return (
            <div key={date} className="rounded-2xl border" style={{ borderColor: isToday ? 'rgba(212,160,23,0.35)' : 'rgba(255,255,255,0.08)', background: 'var(--nw-750, #121820)', minHeight: 120, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#e8c75a' : '#edf3fb' }}>
                  <span className="md:hidden">{DAY_LABELS_LONG[i]}</span><span className="hidden md:inline">{DAY_LABELS[i]}</span>
                </span>
                <span style={{ fontSize: 12, color: '#5e6e82' }}>{fromISODate(date).getDate()}</span>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {byDay[date]?.map(s => (
                  <SessionCell key={s.id} s={s} ct={classMap.get(s.class_type_id ?? '')} coach={coachMap.get(s.coach_id ?? '')} onClick={() => openEdit(s)} />
                ))}
                {(!byDay[date] || byDay[date].length === 0) && !loading && (
                  <span style={{ fontSize: 12, color: '#5e6e82', textAlign: 'center', padding: '8px 0' }}>—</span>
                )}
                <button onClick={() => openNew(date)} style={{ marginTop: 'auto', padding: '6px', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.14)', background: 'transparent', color: '#5e6e82', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Session modal */}
      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit session' : 'Add session'} width="md">
        {draft && (
          <div className="flex flex-col gap-3">
            <Field label="Date"><input type="date" style={fieldStyle} value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start"><input type="time" style={fieldStyle} value={draft.start_time} onChange={e => setDraft({ ...draft, start_time: e.target.value })} /></Field>
              <Field label="End"><input type="time" style={fieldStyle} value={draft.end_time} onChange={e => setDraft({ ...draft, end_time: e.target.value })} /></Field>
            </div>
            <Field label="Class type">
              <select style={fieldStyle} value={draft.class_type_id ?? ''} onChange={e => setDraft({ ...draft, class_type_id: e.target.value || null })}>
                <option value="">— None —</option>
                {classTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </Field>
            <Field label="Coach">
              <select style={fieldStyle} value={draft.coach_id ?? ''} onChange={e => setDraft({ ...draft, coach_id: e.target.value || null })}>
                <option value="">— Needs filling —</option>
                {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Notes"><input type="text" style={fieldStyle} value={draft.notes} placeholder="Optional" onChange={e => setDraft({ ...draft, notes: e.target.value })} /></Field>
            <div className="flex items-center gap-4" style={{ marginTop: 2 }}>
              <label className="inline-flex items-center gap-2" style={{ fontSize: 13, color: '#8296b4', cursor: 'pointer' }}>
                <input type="checkbox" checked={draft.locked} onChange={e => setDraft({ ...draft, locked: e.target.checked })} /> <Lock size={13} /> Lock (coaches can’t change)
              </label>
              <label className="inline-flex items-center gap-2" style={{ fontSize: 13, color: '#8296b4', cursor: 'pointer' }}>
                <input type="checkbox" checked={draft.status === 'cancelled'} onChange={e => setDraft({ ...draft, status: e.target.checked ? 'cancelled' : 'active' })} /> Cancelled
              </label>
            </div>
            <div className="flex items-center justify-between gap-3" style={{ marginTop: 10 }}>
              {draft.id
                ? <Button variant="danger" size="sm" onClick={deleteDraft} disabled={saving}><Trash2 size={14} /> Delete</Button>
                : <span />}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
                <Button variant="gold" size="sm" onClick={saveDraft} loading={saving}>{draft.id ? 'Save' : 'Add session'}</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate week modal */}
      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Build this week" width="md">
        <p className="text-nw-400" style={{ fontSize: 14, marginBottom: 16 }}>
          Populate <strong className="text-nw-200">{rangeLabel}</strong>. Existing sessions are kept — this only adds what’s missing.
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={() => generate('template')} disabled={genBusy} style={genChoiceStyle}>
            <Wand2 size={18} className="text-gold-300" />
            <span><span style={{ display: 'block', fontWeight: 600, color: '#edf3fb', fontSize: 14 }}>From weekly template</span><span style={{ fontSize: 12, color: '#8296b4' }}>Create the standard timetable as needs-filled slots</span></span>
          </button>
          <button onClick={() => generate('copy')} disabled={genBusy} style={genChoiceStyle}>
            <ChevronLeft size={18} className="text-gold-300" />
            <span><span style={{ display: 'block', fontWeight: 600, color: '#edf3fb', fontSize: 14 }}>Copy last week</span><span style={{ fontSize: 12, color: '#8296b4' }}>Duplicate last week’s sessions (coaches cleared)</span></span>
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

const genChoiceStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
}

// ── session cell ─────────────────────────────────────────────────────────────
function SessionCell({ s, ct, coach, onClick }: { s: RotaSession; ct?: RotaClassType; coach?: RotaCoach; onClick: () => void }) {
  const color = ct?.color ?? '#64748b'
  const cancelled = s.status === 'cancelled'
  const needs = !s.coach_id && !cancelled
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', width: '100%', borderRadius: 10, cursor: 'pointer',
        padding: '8px 10px',
        background: cancelled ? 'rgba(255,255,255,0.03)' : hexWithAlpha(color, 0.16),
        borderLeft: `3px solid ${cancelled ? '#5e6e82' : color}`,
        border: `1px solid ${cancelled ? 'rgba(255,255,255,0.06)' : hexWithAlpha(color, 0.3)}`,
        borderLeftWidth: 3,
        borderStyle: needs ? 'dashed' : 'solid',
        borderLeftStyle: 'solid',
        opacity: cancelled ? 0.6 : 1,
        position: 'relative',
      }}
    >
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
