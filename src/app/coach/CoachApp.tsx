'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Lock, Check, X, ArrowLeftRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DarkSelect } from '@/components/ui/DarkSelect'
import { CoachSignOut } from './CoachSignOut'
import { CoachPush } from './CoachPush'
import {
  DAY_LABELS, DAY_LABELS_LONG, mondayOf, weekDates, addDays, fromISODate, toISODate, dayOfWeekIndex,
  formatTime, hexWithAlpha, sessionHours, sessionPay, formatHours, formatMoney,
  CLASS_COLOUR_PRESETS, DEFAULT_RATES,
} from '@/lib/rota'
import type { RotaSession, RotaClassType, RotaSettings } from '@/lib/rota'

function monthLabel(iso: string) { return fromISODate(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) }
function firstOfMonth(iso: string) { const d = fromISODate(iso); return toISODate(new Date(d.getFullYear(), d.getMonth(), 1)) }
function shiftMonth(iso: string, delta: number) { const d = fromISODate(iso); return toISODate(new Date(d.getFullYear(), d.getMonth() + delta, 1)) }

function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}
function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

interface CoachLite { id: string; name: string; color: string | null }
interface Props { coach: { id: string; name: string; hourly_rate: number; color: string | null }; userEmail: string }

const fieldStyle: React.CSSProperties = {
  padding: '12px 14px', fontSize: 16, width: '100%', borderRadius: 12,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#edf3fb',
  colorScheme: 'dark',
}

export function CoachApp({ coach }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<'rota' | 'hours'>('rota')
  const [view, setView] = useState<'month' | 'week'>('month')
  const [cursor, setCursor] = useState(() => toISODate(new Date()))
  const [sessions, setSessions] = useState<RotaSession[]>([])
  const [classTypes, setClassTypes] = useState<RotaClassType[]>([])
  const [rates, setRates] = useState<RotaSettings>(DEFAULT_RATES)
  const [coachNames, setCoachNames] = useState<Map<string, CoachLite>>(new Map())
  const [filter, setFilter] = useState<'all' | 'open' | 'mine'>('all')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [daySheet, setDaySheet] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [gapsOnly, setGapsOnly] = useState(false)
  const [changeFor, setChangeFor] = useState<RotaSession | null>(null)

  const range = useMemo(() => {
    if (view === 'week') { const mon = mondayOf(cursor); return { start: mon, end: addDays(mon, 6), days: weekDates(mon) } }
    const first = firstOfMonth(cursor)
    const d = fromISODate(first)
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const lastOfMonth = toISODate(new Date(d.getFullYear(), d.getMonth(), daysInMonth))
    const gridStart = mondayOf(first)
    const totalCells = Math.ceil((dayOfWeekIndex(first) + daysInMonth) / 7) * 7
    const days = Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i))
    return { start: first, end: lastOfMonth, days }
  }, [view, cursor])
  const classMap = useMemo(() => new Map(classTypes.map(c => [c.id, c])), [classTypes])

  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 2600) }

  const loadMeta = useCallback(async () => {
    const [{ data: ct }, { data: cs }, { data: st }] = await Promise.all([
      supabase.from('rota_class_types').select('*').eq('archived', false).order('sort_order'),
      supabase.from('rota_coaches_public').select('*').eq('active', true),
      supabase.from('rota_settings').select('weekday_rate, weekend_rate').eq('id', true).maybeSingle(),
    ])
    setClassTypes((ct as RotaClassType[]) ?? [])
    setCoachNames(new Map(((cs as CoachLite[]) ?? []).map(c => [c.id, c])))
    if (st) setRates(st as RotaSettings)
  }, [supabase])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: sess }, { data: nts }] = await Promise.all([
      supabase.from('rota_sessions').select('*').gte('date', range.start).lte('date', range.end).order('date').order('start_time'),
      supabase.from('rota_day_notes').select('date, note').gte('date', range.start).lte('date', range.end),
    ])
    setSessions((sess as RotaSession[]) ?? [])
    const m: Record<string, string> = {}
    for (const n of ((nts as { date: string; note: string }[]) ?? [])) m[n.date] = n.note
    setNotes(m)
    setLoading(false)
  }, [supabase, range.start, range.end])

  useEffect(() => { loadMeta() }, [loadMeta])
  useEffect(() => { loadData() }, [loadData])

  async function claim(s: RotaSession) {
    setBusyId(s.id)
    const { data, error } = await supabase.from('rota_sessions')
      .update({ coach_id: coach.id, claimed_at: new Date().toISOString() })
      .eq('id', s.id).is('coach_id', null).eq('locked', false).eq('status', 'active')
      .select()
    setBusyId(null)
    if (error || !data || data.length === 0) { flash('That session was just taken or locked.'); loadData(); return }
    flash('Claimed ✓'); loadData()
  }

  async function release(s: RotaSession) {
    setBusyId(s.id)
    const { error } = await supabase.from('rota_sessions')
      .update({ coach_id: null, claimed_at: null })
      .eq('id', s.id).eq('coach_id', coach.id).eq('locked', false)
    setBusyId(null)
    if (error) { flash('Could not release. It may be locked.'); loadData(); return }
    flash('Released'); loadData()
  }

  // Reassign a session to another coach (or unassign). Goes through the API so
  // the newly-assigned coach can be notified, and RLS stays tight.
  async function assign(s: RotaSession, toCoachId: string | null) {
    setBusyId(s.id)
    const res = await fetch('/api/coach-rota/assign', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: s.id, toCoachId }),
    })
    setBusyId(null); setChangeFor(null)
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      flash(j?.error || 'Could not update that session.'); loadData(); return
    }
    const name = toCoachId ? (toCoachId === coach.id ? 'you' : coachNames.get(toCoachId)?.name?.split(' ')[0] ?? 'coach') : null
    flash(toCoachId ? `Assigned to ${name}` : 'Set to open'); loadData()
  }

  const activeCoaches = useMemo(
    () => [...coachNames.values()].sort((a, b) => a.name.localeCompare(b.name)),
    [coachNames],
  )

  const byDay = useMemo(() => {
    const m: Record<string, RotaSession[]> = {}
    for (const d of range.days) m[d] = []
    for (const s of sessions) {
      if (s.status === 'cancelled') continue
      if (filter === 'open' && s.coach_id) continue
      if (filter === 'mine' && s.coach_id !== coach.id) continue
      if (m[s.date]) m[s.date].push(s)
    }
    return m
  }, [sessions, range.days, filter, coach.id])

  const todayISO = toISODate(new Date())
  const curMonth = fromISODate(cursor).getMonth()
  const periodLabel = view === 'month' ? monthLabel(cursor)
    : `${fromISODate(range.days[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${fromISODate(range.days[6]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  function prev() { setCursor(view === 'month' ? shiftMonth(cursor, -1) : addDays(mondayOf(cursor), -7)) }
  function next() { setCursor(view === 'month' ? shiftMonth(cursor, 1) : addDays(mondayOf(cursor), 7)) }
  const firstName = coach.name.split(' ')[0]

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', paddingBottom: 96 }}>
      {/* Header (sticky) */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'linear-gradient(180deg, #090c12 72%, rgba(9,12,18,0.82))', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: '16px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div aria-hidden style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#10151f', background: coach.color ? coach.color : 'linear-gradient(135deg, #e8c75a, #c9a70a)', boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}>{initials(coach.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: '#c9a70a', fontWeight: 700 }}>Northern Warrior</div>
            <h1 style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{greeting()}, {firstName}</h1>
          </div>
          <CoachSignOut compact />
        </div>

        {/* Tabs — sliding segmented control */}
        <div style={{ position: 'relative', display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginTop: 14 }}>
          <div style={{ position: 'absolute', top: 4, bottom: 4, width: 'calc(50% - 4px)', left: tab === 'rota' ? 4 : '50%', borderRadius: 9, background: 'rgba(212,160,23,0.18)', border: '1px solid rgba(212,160,23,0.4)', transition: 'left .28s cubic-bezier(.16,1,.3,1)' }} />
          {(['rota', 'hours'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              position: 'relative', zIndex: 1, flex: 1, padding: '9px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              border: 'none', background: 'transparent', color: tab === t ? '#f5d775' : '#8296b4', transition: 'color .2s',
            }}>{t === 'rota' ? 'Rota' : 'My hours'}</button>
          ))}
        </div>
      </div>

      {tab === 'rota' ? (
        <>
          <CoachPush />
          {/* View toggle */}
          <div style={{ display: 'flex', padding: '0 16px 10px' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: 11, padding: 4, width: '100%' }}>
              {(['month', 'week'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  flex: 1, padding: '9px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', textTransform: 'capitalize',
                  background: view === v ? 'rgba(212,160,23,0.18)' : 'transparent', color: view === v ? '#f5d775' : '#8296b4',
                }}>{v}</button>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 10px' }}>
            <button onClick={prev} style={navBtn} aria-label="Previous"><ChevronLeft size={18} /></button>
            <button onClick={() => setCursor(todayISO)} style={{ fontSize: 15, fontWeight: 700, color: '#edf3fb', background: 'none', border: 'none', cursor: 'pointer' }}>{periodLabel}</button>
            <button onClick={next} style={navBtn} aria-label="Next"><ChevronRight size={18} /></button>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', flexWrap: 'wrap' }}>
            {(['all', 'open', 'mine'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid', borderColor: filter === f ? 'rgba(212,160,23,0.4)' : 'rgba(255,255,255,0.1)',
                background: filter === f ? 'rgba(212,160,23,0.14)' : 'transparent', color: filter === f ? '#f5d775' : '#8296b4',
              }}>{f === 'all' ? 'All' : f === 'open' ? 'Needs coach' : 'My sessions'}</button>
            ))}
            {view === 'month' && (
              <button onClick={() => setGapsOnly(g => !g)} style={{
                marginLeft: 'auto', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${gapsOnly ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                background: gapsOnly ? 'rgba(245,158,11,0.18)' : 'transparent', color: gapsOnly ? '#f5b74e' : '#8296b4',
              }}>{gapsOnly ? '● Highlighting gaps' : 'Highlight gaps'}</button>
            )}
          </div>

          {view === 'month' ? (
            <CoachMonth days={range.days} byDay={byDay} curMonth={curMonth} todayISO={todayISO} classMap={classMap} coachId={coach.id} coachNames={coachNames} notes={notes} gapsOnly={gapsOnly} onDay={setDaySheet} loading={loading} />
          ) : (
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loading && [0, 1, 2].map(i => (
                <div key={i}>
                  <div className="cs-skel" style={{ height: 14, width: 120, borderRadius: 6, marginBottom: 10 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[0, 1].map(j => <div key={j} className="cs-skel" style={{ height: 64, borderRadius: 14 }} />)}
                  </div>
                </div>
              ))}
              {!loading && range.days.map((date, i) => {
                const list = byDay[date] ?? []
                if (list.length === 0 && !notes[date]) return null
                return (
                  <div key={date}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: date === todayISO ? '#e8c75a' : '#8296b4', marginBottom: 8 }}>
                      {DAY_LABELS_LONG[i]} <span style={{ color: '#5e6e82', fontWeight: 500 }}>{fromISODate(date).getDate()}</span>
                    </div>
                    {notes[date] && (
                      <div style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', color: '#f5b74e', fontSize: 13, fontWeight: 600 }}>📌 {notes[date]}</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {list.map(s => (
                        <CoachSessionCard key={s.id} s={s} ct={classMap.get(s.class_type_id ?? '')} mine={s.coach_id === coach.id}
                          coachName={coachNames.get(s.coach_id ?? '')?.name} coachColor={coachNames.get(s.coach_id ?? '')?.color} busy={busyId === s.id}
                          onClaim={() => claim(s)} onRelease={() => release(s)} onChange={() => setChangeFor(s)} />
                      ))}
                    </div>
                  </div>
                )
              })}
              {!loading && range.days.every(d => (byDay[d] ?? []).length === 0 && !notes[d]) && (
                <p style={{ color: '#8296b4', fontSize: 14, textAlign: 'center', padding: 24 }}>
                  {filter === 'mine' ? 'You have no sessions this week.' : filter === 'open' ? 'Nothing needs a coach this week.' : 'No sessions this week yet.'}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <MyHours supabase={supabase} coach={coach} classMap={classMap} rates={rates} />
      )}

      {/* Day detail sheet (month-view tap) */}
      {daySheet && (
        <CoachDaySheet
          date={daySheet} sessions={byDay[daySheet] ?? []} classMap={classMap} coachNames={coachNames}
          coachId={coach.id} busyId={busyId} note={notes[daySheet] ?? ''} onClaim={claim} onRelease={release}
          onChange={(s) => setChangeFor(s)} onClose={() => setDaySheet(null)}
        />
      )}

      {/* Coach picker — reassign a session */}
      {changeFor && (
        <CoachPicker
          session={changeFor} coaches={activeCoaches} classMap={classMap} myId={coach.id} busy={busyId === changeFor.id}
          onPick={(toCoachId) => assign(changeFor, toCoachId)} onClose={() => setChangeFor(null)}
        />
      )}

      {/* FAB: add own session */}
      {tab === 'rota' && (
        <button className="cs-press" onClick={() => setAddOpen(true)} aria-label="Add session" style={{
          position: 'fixed', bottom: 24, right: 'max(24px, calc(50% - 280px + 24px))', width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #d4a017, #C9A70A)', color: '#10151f', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 40,
        }}><Plus size={26} /></button>
      )}

      {addOpen && (
        <AddSessionSheet
          supabase={supabase} coach={coach} classTypes={classTypes} defaultDate={todayISO}
          onClose={() => setAddOpen(false)}
          onAdded={() => { setAddOpen(false); loadMeta(); loadData(); flash('Session added') }}
        />
      )}

      {toast && (
        <div className="cs-pop" style={{ position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: '#121820', border: '1px solid rgba(212,160,23,0.3)', color: '#edf3fb', padding: '10px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.4)', maxWidth: 'calc(100% - 32px)', textAlign: 'center' }}>{toast}</div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = { padding: 8, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#8296b4', cursor: 'pointer', display: 'flex' }
const claimBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.16)', color: '#6ee7a0', flexShrink: 0 }
const releaseBtn: React.CSSProperties = { padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#8296b4', flexShrink: 0 }
const changeBtn: React.CSSProperties = { padding: '7px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(212,160,23,0.35)', background: 'rgba(212,160,23,0.12)', color: '#f5d775', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }

// ── Session card (week list + day sheet) ─────────────────────────────────────
function CoachSessionCard({ s, ct, mine, coachName, coachColor, busy, onClaim, onRelease, onChange }: {
  s: RotaSession; ct?: RotaClassType; mine: boolean; coachName?: string; coachColor?: string | null
  busy: boolean; onClaim: () => void; onRelease: () => void; onChange: () => void
}) {
  const color = ct?.color ?? '#64748b'
  const open = !s.coach_id
  const locked = s.locked
  return (
    <div className="cs-pop" style={{ borderRadius: 14, border: `1px solid ${hexWithAlpha(color, 0.28)}`, borderLeft: `4px solid ${color}`, background: hexWithAlpha(color, 0.09), padding: '11px 12px 11px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
      {/* assignee avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 800,
        ...(open
          ? { border: '1.5px dashed rgba(245,158,11,0.55)', color: '#f5b74e', background: 'rgba(245,158,11,0.07)' }
          : { color: '#10151f', background: coachColor || '#64748b' }),
      }}>{open ? '+' : initials(coachName ?? 'NW')}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{formatTime(s.start_time)} – {formatTime(s.end_time)}</div>
        <div style={{ fontSize: 12.5, color: '#9fb0c6', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ct?.name ?? 'Class'}{s.notes ? ` · ${s.notes}` : ''}</div>
        <div style={{ marginTop: 5 }}>
          {open
            ? <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.4px', color: '#f59e0b', background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '2px 7px' }}>NEEDS COACH</span>
            : mine
              ? <span style={{ fontSize: 12, fontWeight: 700, color: '#6ee7a0', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> You{locked && <Lock size={11} style={{ color: '#8296b4' }} />}</span>
              : <span style={{ fontSize: 12.5, color: '#b9c6da', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{coachName ?? 'Assigned'}{locked && <Lock size={11} style={{ color: '#8296b4' }} />}</span>}
        </div>
      </div>

      {locked ? (
        <Lock size={16} style={{ color: '#5e6e82', flexShrink: 0 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'stretch' }}>
          {open && <button className="cs-press" onClick={onClaim} disabled={busy} style={claimBtn}>{busy ? '…' : 'Claim'}</button>}
          {mine && <button className="cs-press" onClick={onRelease} disabled={busy} style={releaseBtn}>Release</button>}
          <button className="cs-press" onClick={onChange} disabled={busy} style={changeBtn}><ArrowLeftRight size={12} /> Change</button>
        </div>
      )}
    </div>
  )
}

// ── Month calendar for coaches ───────────────────────────────────────────────
function CoachMonth({ days, byDay, curMonth, todayISO, classMap, coachId, coachNames, notes, gapsOnly, onDay, loading }: {
  days: string[]; byDay: Record<string, RotaSession[]>; curMonth: number; todayISO: string
  classMap: Map<string, RotaClassType>; coachId: string; coachNames: Map<string, CoachLite>; notes: Record<string, string>; gapsOnly: boolean; onDay: (d: string) => void; loading: boolean
}) {
  return (
    <div style={{ padding: '0 10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
        {DAY_LABELS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#5e6e82', textTransform: 'uppercase' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {days.map(date => {
          const inMonth = fromISODate(date).getMonth() === curMonth
          if (!inMonth) return <div key={date} />   // this month only
          const list = byDay[date] ?? []
          const isToday = date === todayISO
          const open = list.filter(s => !s.coach_id).length
          const dimCell = gapsOnly && open === 0 && list.length > 0
          return (
            <button key={date} onClick={() => onDay(date)} style={{
              textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3, minHeight: 118, minWidth: 0, padding: 6, borderRadius: 11,
              border: `1px solid ${isToday ? 'rgba(212,160,23,0.45)' : open > 0 && gapsOnly ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)'}`,
              background: 'rgba(255,255,255,0.025)', opacity: dimCell ? 0.4 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: isToday ? '#e8c75a' : '#dce5f0' }}>{fromISODate(date).getDate()}</span>
                {open > 0 && <span style={{ fontSize: 9.5, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.18)', borderRadius: 5, padding: '0 4px' }}>{open}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0, overflow: 'hidden' }}>
                {notes[date] && (
                  <span title={notes[date]} style={{ fontSize: 10, lineHeight: '15px', borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: 'rgba(245,158,11,0.18)', color: '#f5b74e', fontWeight: 700 }}>📌 {notes[date]}</span>
                )}
                {list.slice(0, 5).map(s => {
                  const color = classMap.get(s.class_type_id ?? '')?.color ?? '#64748b'
                  const isOpen = !s.coach_id
                  const isMine = s.coach_id === coachId
                  const bar = isOpen ? '#f59e0b' : isMine ? '#22c55e' : color
                  const bg = isOpen ? 'rgba(245,158,11,0.18)' : isMine ? 'rgba(34,197,94,0.16)' : hexWithAlpha(color, 0.16)
                  const faded = gapsOnly && !isOpen
                  // Who's on — this is what coaches want to see at a glance.
                  const who = isOpen ? 'Open' : isMine ? 'You' : (coachNames.get(s.coach_id ?? '')?.name?.split(' ')[0] ?? 'Assigned')
                  return (
                    <span key={s.id} title={`${formatTime(s.start_time)} — ${who}`} style={{ display: 'block', minWidth: 0, borderRadius: 4, padding: '1px 4px', overflow: 'hidden', borderLeft: `3px solid ${bar}`, background: bg, opacity: faded ? 0.3 : 1, boxShadow: isOpen && gapsOnly ? '0 0 0 1px rgba(245,158,11,0.5)' : 'none' }}>
                      <span style={{ display: 'block', fontSize: 10.5, lineHeight: '14px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isOpen ? '#f5b74e' : '#dce5f0' }}>{formatTime(s.start_time)}</span>
                      <span style={{ display: 'block', fontSize: 9.5, lineHeight: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isOpen ? '#f5b74e' : isMine ? '#6ee7a0' : '#9fb0c6', fontWeight: isOpen || isMine ? 700 : 500 }}>{who}</span>
                    </span>
                  )
                })}
                {list.length > 5 && <span style={{ fontSize: 10, color: '#5e6e82', paddingLeft: 2 }}>+{list.length - 5}</span>}
              </div>
            </button>
          )
        })}
      </div>
      {loading && <p style={{ padding: 12, color: '#8296b4', fontSize: 13, textAlign: 'center' }}>Loading…</p>}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', padding: '14px 0 4px', fontSize: 12, color: '#8296b4' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#f59e0b', display: 'inline-block' }} />Needs coach</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#22c55e', display: 'inline-block' }} />You</span>
      </div>
      <p style={{ fontSize: 12, color: '#5e6e82', textAlign: 'center' }}>Tap a day to claim or view sessions</p>
    </div>
  )
}

// ── Day detail sheet for coaches ─────────────────────────────────────────────
function CoachDaySheet({ date, sessions, classMap, coachNames, coachId, busyId, note, onClaim, onRelease, onChange, onClose }: {
  date: string; sessions: RotaSession[]; classMap: Map<string, RotaClassType>; coachNames: Map<string, CoachLite>
  coachId: string; busyId: string | null; note: string
  onClaim: (s: RotaSession) => void; onRelease: (s: RotaSession) => void; onChange: (s: RotaSession) => void; onClose: () => void
}) {
  const openCount = sessions.filter(s => !s.coach_id).length
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="cs-backdrop" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
      <div className="cs-sheet" style={{ position: 'relative', width: '100%', maxWidth: 560, background: '#121820', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px 18px', paddingBottom: 'max(18px, env(safe-area-inset-bottom))', maxHeight: '85dvh', overflowY: 'auto' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '4px auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>{fromISODate(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            <div style={{ fontSize: 12.5, color: '#8296b4', marginTop: 2 }}>
              {sessions.length} session{sessions.length === 1 ? '' : 's'}{openCount > 0 ? ` · ${openCount} needs a coach` : ''}
            </div>
          </div>
          <button className="cs-press" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#8296b4', cursor: 'pointer', borderRadius: 9, padding: 7, display: 'flex' }}><X size={18} /></button>
        </div>
        {note && (
          <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', color: '#f5b74e', fontSize: 14, fontWeight: 600 }}>📌 {note}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.length === 0 && <p style={{ fontSize: 14, color: '#8296b4', padding: '8px 0', textAlign: 'center' }}>No sessions on this day.</p>}
          {sessions.map(s => (
            <CoachSessionCard key={s.id} s={s} ct={classMap.get(s.class_type_id ?? '')} mine={s.coach_id === coachId}
              coachName={coachNames.get(s.coach_id ?? '')?.name} coachColor={coachNames.get(s.coach_id ?? '')?.color} busy={busyId === s.id}
              onClaim={() => onClaim(s)} onRelease={() => onRelease(s)} onChange={() => onChange(s)} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Coach picker (reassign a session) ────────────────────────────────────────
function CoachPicker({ session, coaches, classMap, myId, busy, onPick, onClose }: {
  session: RotaSession; coaches: CoachLite[]; classMap: Map<string, RotaClassType>; myId: string; busy: boolean
  onPick: (toCoachId: string | null) => void; onClose: () => void
}) {
  const ct = classMap.get(session.class_type_id ?? '')
  const current = session.coach_id
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="cs-backdrop" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
      <div className="cs-sheet" style={{ position: 'relative', width: '100%', maxWidth: 560, background: '#121820', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', maxHeight: '82dvh', overflowY: 'auto' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '4px auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800 }}>Who&rsquo;s coaching?</h2>
          <button className="cs-press" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#8296b4', cursor: 'pointer', borderRadius: 9, padding: 7, display: 'flex' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: '#8296b4', margin: '4px 0 14px' }}>{ct?.name ?? 'Session'} · {formatTime(session.start_time)} – {formatTime(session.end_time)}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <PickerRow label="Needs a coach" sub="Leave open" isCurrent={!current} busy={busy} onClick={() => onPick(null)}
            avatar={<div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, border: '1.5px dashed rgba(245,158,11,0.55)', color: '#f5b74e', background: 'rgba(245,158,11,0.07)' }}>+</div>} />
          {coaches.map(c => (
            <PickerRow key={c.id} label={c.id === myId ? `${c.name} (you)` : c.name}
              isCurrent={current === c.id} busy={busy} onClick={() => onPick(c.id)}
              avatar={<div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#10151f', background: c.color || '#64748b' }}>{initials(c.name)}</div>} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PickerRow({ label, sub, isCurrent, busy, onClick, avatar }: {
  label: string; sub?: string; isCurrent: boolean; busy: boolean; onClick: () => void; avatar: React.ReactNode
}) {
  return (
    <button className="cs-press" onClick={onClick} disabled={busy || isCurrent} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', cursor: isCurrent ? 'default' : 'pointer',
      padding: '8px 12px', borderRadius: 13, border: `1px solid ${isCurrent ? 'rgba(212,160,23,0.4)' : 'rgba(255,255,255,0.08)'}`,
      background: isCurrent ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.03)', opacity: busy && !isCurrent ? 0.5 : 1,
    }}>
      {avatar}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#edf3fb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#8296b4' }}>{sub}</div>}
      </div>
      {isCurrent && <Check size={18} style={{ color: '#f5d775', flexShrink: 0 }} />}
    </button>
  )
}

// ── My hours tab ─────────────────────────────────────────────────────────────
function MyHours({ supabase, coach, classMap, rates }: { supabase: ReturnType<typeof createClient>; coach: Props['coach']; classMap: Map<string, RotaClassType>; rates: RotaSettings }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
  const [rows, setRows] = useState<RotaSession[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [y, m] = month.split('-').map(Number)
    const first = `${month}-01`
    const nextFirst = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`
    const { data } = await supabase.from('rota_sessions').select('*')
      .eq('coach_id', coach.id).eq('status', 'active')
      .gte('date', first).lt('date', nextFirst)
      .order('date').order('start_time')
    setRows((data as RotaSession[]) ?? [])
    setLoading(false)
  }, [supabase, coach.id, month])
  useEffect(() => { load() }, [load])

  function shift(delta: number) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const [y, m] = month.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const totalHours = rows.reduce((n, s) => n + sessionHours(s.start_time, s.end_time), 0)
  const pay = rows.reduce((n, s) => {
    const paid = s.class_type_id ? (classMap.get(s.class_type_id)?.paid ?? true) : true
    return n + sessionPay(s, paid, rates)
  }, 0)

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={() => shift(-1)} style={navBtn} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
        <button onClick={() => shift(1)} style={navBtn} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hours</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{formatHours(Math.round(totalHours * 100) / 100)}</div>
        </div>
        <div style={{ flex: 1, borderRadius: 14, border: '1px solid rgba(212,160,23,0.25)', background: 'rgba(212,160,23,0.08)', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#c9a70a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. pay</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f5d775' }}>{formatMoney(Math.round(pay * 100) / 100)}</div>
        </div>
      </div>

      {loading && <p style={{ color: '#8296b4', fontSize: 14, textAlign: 'center', padding: 16 }}>Loading…</p>}
      {!loading && rows.length === 0 && <p style={{ color: '#8296b4', fontSize: 14, textAlign: 'center', padding: 16 }}>No sessions in {label}.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(s => {
          const ct = classMap.get(s.class_type_id ?? '')
          const color = ct?.color ?? '#64748b'
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${color}`, padding: '10px 14px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fromISODate(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                <div style={{ fontSize: 12, color: '#8296b4' }}>{formatTime(s.start_time)} – {formatTime(s.end_time)} · {ct?.name ?? 'Class'}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#b9c6da' }}>{formatHours(sessionHours(s.start_time, s.end_time))}h</span>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 11, color: '#5e6e82', textAlign: 'center', marginTop: 16 }}>Est. pay uses your current rate and is a guide only.</p>
    </div>
  )
}

// ── Add session sheet ────────────────────────────────────────────────────────
function AddSessionSheet({ supabase, coach, classTypes, defaultDate, onClose, onAdded }: {
  supabase: ReturnType<typeof createClient>; coach: Props['coach']; classTypes: RotaClassType[]; defaultDate: string
  onClose: () => void; onAdded: () => void
}) {
  const [date, setDate] = useState(defaultDate)
  const [start, setStart] = useState('18:00')
  const [end, setEnd] = useState('19:00')
  const [classId, setClassId] = useState<string>(classTypes[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [newClass, setNewClass] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(CLASS_COLOUR_PRESETS[4])

  async function add() {
    setBusy(true); setErr(null)
    let useClassId: string | null = classId || null
    if (newClass && newName.trim()) {
      const { data, error } = await supabase.from('rota_class_types').insert({ name: newName.trim(), color: newColor, sort_order: 200 }).select().single()
      if (error) { setBusy(false); setErr(error.message); return }
      useClassId = (data as RotaClassType).id
    }
    const { error } = await supabase.from('rota_sessions').insert({
      date, start_time: start, end_time: end, class_type_id: useClassId,
      coach_id: coach.id, source: 'manual', claimed_at: new Date().toISOString(), notes: notes || null,
    })
    setBusy(false)
    if (error) { setErr(error.message); return }
    onAdded()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="cs-backdrop" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
      <div className="cs-sheet" style={{ position: 'relative', width: '100%', maxWidth: 560, background: '#121820', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '4px auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Add a session</h2>
          <button className="cs-press" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#8296b4', cursor: 'pointer', borderRadius: 9, padding: 7, display: 'flex' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: '#8296b4', marginBottom: 14 }}>Adds a session assigned to you (e.g. team training).</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="date" style={fieldStyle} value={date} onChange={e => setDate(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input type="time" style={fieldStyle} value={start} onChange={e => setStart(e.target.value)} />
            <input type="time" style={fieldStyle} value={end} onChange={e => setEnd(e.target.value)} />
          </div>
          {!newClass ? (
            <>
              <DarkSelect value={classId} onChange={setClassId} style={fieldStyle}
                options={[{ value: '', label: '— No class type —' }, ...classTypes.map(ct => ({ value: ct.id, label: ct.name }))]} />
              <button onClick={() => setNewClass(true)} style={{ fontSize: 13, color: '#c9a70a', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>+ New class type</button>
            </>
          ) : (
            <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Class name (e.g. Team Training)" style={fieldStyle} value={newName} onChange={e => setNewName(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CLASS_COLOUR_PRESETS.map(c => <button key={c} onClick={() => setNewColor(c)} aria-label={c} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: newColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />)}
              </div>
              <button onClick={() => setNewClass(false)} style={{ fontSize: 13, color: '#8296b4', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Use existing instead</button>
            </div>
          )}
          <input placeholder="Notes (optional)" style={fieldStyle} value={notes} onChange={e => setNotes(e.target.value)} />
          {err && <p style={{ fontSize: 13, color: '#f87171' }}>{err}</p>}
          <button onClick={add} disabled={busy} style={{ padding: '14px', fontSize: 16, fontWeight: 700, borderRadius: 12, border: '1px solid rgba(212,160,23,0.4)', background: 'rgba(212,160,23,0.18)', color: '#f5d775', cursor: 'pointer', marginTop: 4 }}>{busy ? 'Adding…' : 'Add session'}</button>
        </div>
      </div>
    </div>
  )
}
