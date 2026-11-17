'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Lock, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DarkSelect } from '@/components/ui/DarkSelect'
import { CoachSignOut } from './CoachSignOut'
import {
  DAY_LABELS, DAY_LABELS_LONG, mondayOf, weekDates, addDays, fromISODate, toISODate,
  formatTime, hexWithAlpha, sessionHours, sessionPay, formatHours, formatMoney,
  CLASS_COLOUR_PRESETS, DEFAULT_RATES,
} from '@/lib/rota'
import type { RotaSession, RotaClassType, RotaSettings } from '@/lib/rota'

function monthLabel(iso: string) { return fromISODate(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) }
function firstOfMonth(iso: string) { const d = fromISODate(iso); return toISODate(new Date(d.getFullYear(), d.getMonth(), 1)) }
function shiftMonth(iso: string, delta: number) { const d = fromISODate(iso); return toISODate(new Date(d.getFullYear(), d.getMonth() + delta, 1)) }

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

  const range = useMemo(() => {
    if (view === 'week') { const mon = mondayOf(cursor); return { start: mon, end: addDays(mon, 6), days: weekDates(mon) } }
    const gridStart = mondayOf(firstOfMonth(cursor))
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
    return { start: days[0], end: days[41], days }
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
    if (error) { flash('Could not release — it may be locked.'); loadData(); return }
    flash('Released'); loadData()
  }

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
      {/* Header */}
      <div style={{ padding: '18px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#c9a70a', fontWeight: 700 }}>Northern Warrior</div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Hi {firstName}</h1>
        </div>
        <CoachSignOut compact />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
        {(['rota', 'hours'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            border: '1px solid', borderColor: tab === t ? 'rgba(212,160,23,0.4)' : 'rgba(255,255,255,0.1)',
            background: tab === t ? 'rgba(212,160,23,0.16)' : 'rgba(255,255,255,0.03)',
            color: tab === t ? '#f5d775' : '#8296b4',
          }}>{t === 'rota' ? 'Rota' : 'My hours'}</button>
        ))}
      </div>

      {tab === 'rota' ? (
        <>
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
          <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
            {(['all', 'open', 'mine'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid', borderColor: filter === f ? 'rgba(212,160,23,0.4)' : 'rgba(255,255,255,0.1)',
                background: filter === f ? 'rgba(212,160,23,0.14)' : 'transparent', color: filter === f ? '#f5d775' : '#8296b4',
              }}>{f === 'all' ? 'All' : f === 'open' ? 'Needs coach' : 'My sessions'}</button>
            ))}
          </div>

          {view === 'month' ? (
            <CoachMonth days={range.days} byDay={byDay} curMonth={curMonth} todayISO={todayISO} classMap={classMap} coachId={coach.id} notes={notes} onDay={setDaySheet} loading={loading} />
          ) : (
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loading && <p style={{ color: '#8296b4', fontSize: 14, textAlign: 'center', padding: 24 }}>Loading…</p>}
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
                          coachName={coachNames.get(s.coach_id ?? '')?.name} busy={busyId === s.id}
                          onClaim={() => claim(s)} onRelease={() => release(s)} />
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
          coachId={coach.id} busyId={busyId} note={notes[daySheet] ?? ''} onClaim={claim} onRelease={release} onClose={() => setDaySheet(null)}
        />
      )}

      {/* FAB: add own session */}
      {tab === 'rota' && (
        <button onClick={() => setAddOpen(true)} aria-label="Add session" style={{
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
        <div style={{ position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: '#121820', border: '1px solid rgba(212,160,23,0.3)', color: '#edf3fb', padding: '10px 18px', borderRadius: 12, fontSize: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>{toast}</div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = { padding: 8, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#8296b4', cursor: 'pointer', display: 'flex' }
const claimBtn: React.CSSProperties = { padding: '9px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.16)', color: '#4ade80', flexShrink: 0 }
const releaseBtn: React.CSSProperties = { padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#8296b4', flexShrink: 0 }

// ── Session card (week list + day sheet) ─────────────────────────────────────
function CoachSessionCard({ s, ct, mine, coachName, busy, onClaim, onRelease }: {
  s: RotaSession; ct?: RotaClassType; mine: boolean; coachName?: string; busy: boolean; onClaim: () => void; onRelease: () => void
}) {
  const color = ct?.color ?? '#64748b'
  const open = !s.coach_id
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${hexWithAlpha(color, 0.3)}`, borderLeft: `4px solid ${color}`, background: hexWithAlpha(color, 0.1), padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{formatTime(s.start_time)} – {formatTime(s.end_time)}</div>
        <div style={{ fontSize: 13, color: '#b9c6da', marginTop: 1 }}>{ct?.name ?? 'Class'}{s.notes ? ` · ${s.notes}` : ''}</div>
        <div style={{ marginTop: 5 }}>
          {open
            ? <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.4px', color: '#f59e0b', background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '2px 7px' }}>NEEDS COACH</span>
            : mine
              ? <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> You{s.locked && <Lock size={11} style={{ color: '#8296b4' }} />}</span>
              : <span style={{ fontSize: 12, color: '#8296b4' }}>{coachName ?? 'Assigned'}</span>}
        </div>
      </div>
      {open && !s.locked && <button onClick={onClaim} disabled={busy} style={claimBtn}>{busy ? '…' : 'Claim'}</button>}
      {mine && !s.locked && <button onClick={onRelease} disabled={busy} style={releaseBtn}>{busy ? '…' : 'Release'}</button>}
    </div>
  )
}

// ── Month calendar for coaches ───────────────────────────────────────────────
function CoachMonth({ days, byDay, curMonth, todayISO, classMap, coachId, notes, onDay, loading }: {
  days: string[]; byDay: Record<string, RotaSession[]>; curMonth: number; todayISO: string
  classMap: Map<string, RotaClassType>; coachId: string; notes: Record<string, string>; onDay: (d: string) => void; loading: boolean
}) {
  return (
    <div style={{ padding: '0 10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 3 }}>
        {DAY_LABELS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#5e6e82', textTransform: 'uppercase' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {days.map(date => {
          const list = byDay[date] ?? []
          const inMonth = fromISODate(date).getMonth() === curMonth
          const isToday = date === todayISO
          const open = list.filter(s => !s.coach_id).length
          return (
            <button key={date} onClick={() => onDay(date)} style={{
              textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 72, padding: 4, borderRadius: 9,
              border: `1px solid ${isToday ? 'rgba(212,160,23,0.4)' : 'rgba(255,255,255,0.06)'}`,
              background: inMonth ? 'rgba(255,255,255,0.02)' : 'transparent', opacity: inMonth ? 1 : 0.4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#e8c75a' : '#b9c6da' }}>{fromISODate(date).getDate()}</span>
                {open > 0 && <span style={{ fontSize: 8.5, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.16)', borderRadius: 4, padding: '0 3px' }}>{open}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                {notes[date] && (
                  <span title={notes[date]} style={{ fontSize: 9, lineHeight: '13px', borderRadius: 3, padding: '1px 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: 'rgba(245,158,11,0.18)', color: '#f5b74e', fontWeight: 700 }}>📌 {notes[date]}</span>
                )}
                {list.slice(0, 4).map(s => {
                  const color = classMap.get(s.class_type_id ?? '')?.color ?? '#64748b'
                  const isOpen = !s.coach_id
                  const isMine = s.coach_id === coachId
                  const bar = isOpen ? '#f59e0b' : isMine ? '#22c55e' : color
                  const bg = isOpen ? 'rgba(245,158,11,0.16)' : isMine ? 'rgba(34,197,94,0.16)' : hexWithAlpha(color, 0.16)
                  return (
                    <span key={s.id} style={{ fontSize: 9, lineHeight: '13px', borderRadius: 3, padding: '0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderLeft: `2px solid ${bar}`, background: bg, color: isOpen ? '#f5b74e' : '#cdd8e8', fontWeight: isOpen || isMine ? 700 : 500 }}>{formatTime(s.start_time)}</span>
                  )
                })}
                {list.length > 4 && <span style={{ fontSize: 9, color: '#5e6e82', paddingLeft: 2 }}>+{list.length - 4}</span>}
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
function CoachDaySheet({ date, sessions, classMap, coachNames, coachId, busyId, note, onClaim, onRelease, onClose }: {
  date: string; sessions: RotaSession[]; classMap: Map<string, RotaClassType>; coachNames: Map<string, CoachLite>
  coachId: string; busyId: string | null; note: string; onClaim: (s: RotaSession) => void; onRelease: (s: RotaSession) => void; onClose: () => void
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 560, background: '#121820', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTop: '1px solid rgba(255,255,255,0.1)', padding: 18, paddingBottom: 'max(18px, env(safe-area-inset-bottom))', maxHeight: '85dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800 }}>{fromISODate(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8296b4', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        {note && (
          <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', color: '#f5b74e', fontSize: 14, fontWeight: 600 }}>📌 {note}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.length === 0 && <p style={{ fontSize: 14, color: '#8296b4', padding: '8px 0' }}>No sessions.</p>}
          {sessions.map(s => (
            <CoachSessionCard key={s.id} s={s} ct={classMap.get(s.class_type_id ?? '')} mine={s.coach_id === coachId}
              coachName={coachNames.get(s.coach_id ?? '')?.name} busy={busyId === s.id}
              onClaim={() => onClaim(s)} onRelease={() => onRelease(s)} />
          ))}
        </div>
      </div>
    </div>
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
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 560, background: '#121820', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTop: '1px solid rgba(255,255,255,0.1)', padding: 20, paddingBottom: 'max(20px, env(safe-area-inset-bottom))', maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Add a session</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8296b4', cursor: 'pointer' }}><X size={20} /></button>
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
