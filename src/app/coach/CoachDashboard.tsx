'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarPlus, Share2, Download, X, Sun, Moon } from 'lucide-react'
import type { createClient } from '@/lib/supabase/client'
import {
  formatTime, sessionHours, sessionPay, isWeekendISO, formatHours, formatMoney, fromISODate,
} from '@/lib/rota'
import type { RotaSession, RotaClassType, RotaSettings } from '@/lib/rota'
import { buildICS, downloadText } from '@/lib/coach-export'
import * as htmlToImage from 'html-to-image'

type SB = ReturnType<typeof createClient>
interface Coach { id: string; name: string; color: string | null; hourly_rate: number }

export function thisMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number)
  const first = `${month}-01`
  const nextFirst = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`
  return { first, nextFirst }
}
function monthLabelOf(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
function shiftMonthStr(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function useCoachMonth(supabase: SB, coachId: string, month: string) {
  const [rows, setRows] = useState<RotaSession[]>([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const { first, nextFirst } = monthRange(month)
    const { data } = await supabase.from('rota_sessions').select('*')
      .eq('coach_id', coachId).eq('status', 'active')
      .gte('date', first).lt('date', nextFirst).order('date').order('start_time')
    setRows((data as RotaSession[]) ?? [])
    setLoading(false)
  }, [supabase, coachId, month])
  useEffect(() => { load() }, [load])
  return { rows, loading }
}

function summarise(rows: RotaSession[], classMap: Map<string, RotaClassType>, rates: RotaSettings) {
  let weekday = 0, weekend = 0, hours = 0, pay = 0, wdPay = 0, wePay = 0
  for (const s of rows) {
    const paid = s.class_type_id ? (classMap.get(s.class_type_id)?.paid ?? true) : true
    const h = sessionHours(s.start_time, s.end_time)
    const p = sessionPay(s, paid, rates)
    hours += h; pay += p
    if (isWeekendISO(s.date)) { weekend++; wePay += p } else { weekday++; wdPay += p }
  }
  return { count: rows.length, weekday, weekend, hours, pay, wdPay, wePay }
}

function round2(n: number) { return Math.round(n * 100) / 100 }

async function addToCalendar(rows: RotaSession[], classMap: Map<string, RotaClassType>, month: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const ics = buildICS(rows, classMap, stamp)
  downloadText(`nw-rota-${month}.ics`, 'text/calendar;charset=utf-8', ics)
}

// ── Home dashboard ───────────────────────────────────────────────────────────
export function HomeTab({ supabase, coach, classMap, rates, todayISO, goPay, onShare }: {
  supabase: SB; coach: Coach; classMap: Map<string, RotaClassType>; rates: RotaSettings
  todayISO: string; goPay: () => void; onShare: () => void
}) {
  const month = thisMonth()
  const { rows, loading } = useCoachMonth(supabase, coach.id, month)
  const today = useMemo(() => rows.filter(s => s.date === todayISO), [rows, todayISO])
  const upcoming = useMemo(() => rows.filter(s => s.date > todayISO).slice(0, 1)[0], [rows, todayISO])
  const sum = useMemo(() => summarise(rows, classMap, rates), [rows, classMap, rates])
  const [calBusy, setCalBusy] = useState(false)

  return (
    <div style={{ padding: '2px 16px' }}>
      {/* Today */}
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#8296b4', margin: '6px 2px 10px' }}>
        {fromISODate(todayISO).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[0, 1].map(i => <div key={i} className="cs-skel" style={{ height: 60, borderRadius: 14 }} />)}</div>
      ) : today.length === 0 ? (
        <div style={{ borderRadius: 16, border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', padding: '22px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#cdd8e8' }}>No sessions today</div>
          <div style={{ fontSize: 13, color: '#8296b4', marginTop: 3 }}>{upcoming ? `Next: ${fromISODate(upcoming.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(upcoming.start_time)}` : 'Enjoy the day off.'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {today.map(s => {
            const ct = classMap.get(s.class_type_id ?? '')
            const color = ct?.color ?? '#64748b'
            return (
              <div key={s.id} className="cs-pop" style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, border: `1px solid ${color}33`, borderLeft: `4px solid ${color}`, background: `${color}15`, padding: '13px 14px' }}>
                <div style={{ textAlign: 'center', minWidth: 52 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#edf3fb' }}>{formatTime(s.start_time).replace(/(am|pm)/, '')}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8296b4', textTransform: 'uppercase' }}>{formatTime(s.start_time).match(/am|pm/)?.[0]}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{ct?.name ?? 'Class'}</div>
                  <div style={{ fontSize: 12.5, color: '#9fb0c6' }}>{formatTime(s.start_time)} – {formatTime(s.end_time)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* This month */}
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#8296b4', margin: '22px 2px 10px' }}>This month</div>
      <button onClick={goPay} className="cs-press" style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, background: 'rgba(255,255,255,0.03)', padding: 14, display: 'flex', gap: 10 }}>
        <Stat label="Sessions" value={loading ? '—' : String(sum.count)} />
        <Divider />
        <Stat label="Hours" value={loading ? '—' : formatHours(round2(sum.hours))} />
        <Divider />
        <Stat label="Est. pay" value={loading ? '—' : formatMoney(round2(sum.pay))} gold />
      </button>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button disabled={loading || calBusy || rows.length === 0} className="cs-press" onClick={async () => { setCalBusy(true); try { await addToCalendar(rows, classMap, month) } finally { setCalBusy(false) } }}
          style={actionBtn}>
          <CalendarPlus size={17} /> Add to calendar
        </button>
        <button onClick={onShare} className="cs-press" style={actionBtn}>
          <Share2 size={17} /> Share rota
        </button>
      </div>
    </div>
  )
}

// ── Pay tab ──────────────────────────────────────────────────────────────────
export function PayTab({ supabase, coach, classMap, rates, onShare }: {
  supabase: SB; coach: Coach; classMap: Map<string, RotaClassType>; rates: RotaSettings; onShare: () => void
}) {
  const [month, setMonth] = useState(thisMonth())
  const { rows, loading } = useCoachMonth(supabase, coach.id, month)
  const sum = useMemo(() => summarise(rows, classMap, rates), [rows, classMap, rates])
  const [calBusy, setCalBusy] = useState(false)

  return (
    <div style={{ padding: '2px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={() => setMonth(m => shiftMonthStr(m, -1))} className="cs-press" style={navBtn} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{monthLabelOf(month)}</span>
        <button onClick={() => setMonth(m => shiftMonthStr(m, 1))} className="cs-press" style={navBtn} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sessions</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{loading ? '—' : sum.count}</div>
          <div style={{ fontSize: 12, color: '#8296b4', marginTop: 2 }}>{loading ? '' : `${formatHours(round2(sum.hours))} hrs`}</div>
        </div>
        <div style={{ flex: 1, borderRadius: 16, border: '1px solid rgba(212,160,23,0.25)', background: 'rgba(212,160,23,0.08)', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#c9a70a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. pay</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f5d775' }}>{loading ? '—' : formatMoney(round2(sum.pay))}</div>
          <div style={{ fontSize: 12, color: '#8296b4', marginTop: 2 }}>guide only</div>
        </div>
      </div>

      {/* Weekday / weekend split */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <SplitCard icon={<Sun size={15} />} label="Weekday" count={sum.weekday} pay={sum.wdPay} rate={rates.weekday_rate} loading={loading} />
        <SplitCard icon={<Moon size={15} />} label="Weekend" count={sum.weekend} pay={sum.wePay} rate={rates.weekend_rate} loading={loading} accent />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button disabled={loading || calBusy || rows.length === 0} className="cs-press" onClick={async () => { setCalBusy(true); try { await addToCalendar(rows, classMap, month) } finally { setCalBusy(false) } }} style={actionBtn}>
          <CalendarPlus size={17} /> Add to calendar
        </button>
        <button onClick={onShare} className="cs-press" style={actionBtn}><Share2 size={17} /> Share</button>
      </div>

      {/* Session list */}
      {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[0, 1, 2].map(i => <div key={i} className="cs-skel" style={{ height: 52, borderRadius: 12 }} />)}</div>}
      {!loading && rows.length === 0 && <p style={{ color: '#8296b4', fontSize: 14, textAlign: 'center', padding: 16 }}>No sessions in {monthLabelOf(month)}.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(s => {
          const ct = classMap.get(s.class_type_id ?? '')
          const color = ct?.color ?? '#64748b'
          const weekend = isWeekendISO(s.date)
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${color}`, padding: '10px 14px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fromISODate(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}{weekend && <span style={{ fontSize: 10, fontWeight: 800, color: '#f5d775', marginLeft: 6, verticalAlign: 'middle' }}>WKND</span>}</div>
                <div style={{ fontSize: 12, color: '#8296b4' }}>{formatTime(s.start_time)} – {formatTime(s.end_time)} · {ct?.name ?? 'Class'}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#b9c6da' }}>{formatHours(sessionHours(s.start_time, s.end_time))}h</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Share modal (rota screenshot) ────────────────────────────────────────────
export function ShareModal({ supabase, coach, classMap, rates, onClose }: {
  supabase: SB; coach: Coach; classMap: Map<string, RotaClassType>; rates: RotaSettings; onClose: () => void
}) {
  const month = thisMonth()
  const { rows, loading } = useCoachMonth(supabase, coach.id, month)
  const sum = useMemo(() => summarise(rows, classMap, rates), [rows, classMap, rates])
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function go(forceDownload: boolean) {
    if (!cardRef.current) return
    setBusy(true); setMsg(null)
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#0b0e14' })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `nw-rota-${month}.png`, { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }
      if (!forceDownload && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: 'My Northern Warrior rota' } as ShareData)
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
        setMsg('Saved to your device')
      }
    } catch {
      setMsg('Could not create the image')
    } finally { setBusy(false) }
  }

  const firstName = coach.name.split(' ')[0]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="cs-backdrop" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
      <div className="cs-sheet" style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#121820', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', maxHeight: '92dvh', overflowY: 'auto' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '4px auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800 }}>Share your rota</h2>
          <button className="cs-press" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#8296b4', cursor: 'pointer', borderRadius: 9, padding: 7, display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Capture target */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div ref={cardRef} style={{ width: 340, background: 'linear-gradient(170deg, #0f141d, #0b0e14)', borderRadius: 20, border: '1px solid rgba(212,160,23,0.25)', padding: 20, color: '#edf3fb' }}>
            <div style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#c9a70a', fontWeight: 800 }}>Northern Warrior</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{firstName}&rsquo;s rota</div>
            <div style={{ fontSize: 13, color: '#8296b4', marginBottom: 14 }}>{monthLabelOf(month)}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <MiniStat label="Sessions" value={String(sum.count)} />
              <MiniStat label="Weekday" value={String(sum.weekday)} />
              <MiniStat label="Weekend" value={String(sum.weekend)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rows.slice(0, 12).map(s => {
                const ct = classMap.get(s.class_type_id ?? '')
                const color = ct?.color ?? '#64748b'
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'block', flexShrink: 0 }} />
                    <span style={{ width: 78, color: '#b9c6da', flexShrink: 0 }}>{fromISODate(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}</span>
                    <span style={{ width: 58, color: '#edf3fb', fontWeight: 600, flexShrink: 0 }}>{formatTime(s.start_time)}</span>
                    <span style={{ flex: 1, minWidth: 0, color: '#9fb0c6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ct?.name ?? 'Class'}</span>
                  </div>
                )
              })}
              {rows.length > 12 && <div style={{ fontSize: 12, color: '#8296b4', paddingLeft: 17 }}>+{rows.length - 12} more</div>}
              {!loading && rows.length === 0 && <div style={{ fontSize: 13, color: '#8296b4' }}>No sessions this month.</div>}
            </div>
          </div>
        </div>

        {msg && <p style={{ fontSize: 13, color: '#8296b4', textAlign: 'center', marginBottom: 10 }}>{msg}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button disabled={busy || loading} className="cs-press" onClick={() => go(false)} style={{ flex: 1, padding: '13px', borderRadius: 13, fontSize: 15, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(212,160,23,0.5)', background: 'rgba(212,160,23,0.22)', color: '#f5d775', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Share2 size={17} /> {busy ? 'Preparing…' : 'Share'}</button>
          <button disabled={busy || loading} className="cs-press" onClick={() => go(true)} aria-label="Download" style={{ padding: '13px 16px', borderRadius: 13, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#b9c6da', display: 'flex' }}><Download size={18} /></button>
        </div>
      </div>
    </div>
  )
}

// ── small bits ───────────────────────────────────────────────────────────────
function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10.5, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 800, color: gold ? '#f5d775' : '#edf3fb', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}
function Divider() { return <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} /> }
function SplitCard({ icon, label, count, pay, rate, loading, accent }: { icon: React.ReactNode; label: string; count: number; pay: number; rate: number; loading: boolean; accent?: boolean }) {
  return (
    <div style={{ flex: 1, borderRadius: 16, border: `1px solid ${accent ? 'rgba(212,160,23,0.22)' : 'rgba(255,255,255,0.1)'}`, background: accent ? 'rgba(212,160,23,0.06)' : 'rgba(255,255,255,0.03)', padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: accent ? '#f5d775' : '#9fb0c6', marginBottom: 6 }}>{icon}<span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span></div>
      <div style={{ fontSize: 23, fontWeight: 800 }}>{loading ? '—' : count}<span style={{ fontSize: 13, fontWeight: 600, color: '#8296b4' }}> session{count === 1 ? '' : 's'}</span></div>
      <div style={{ fontSize: 12, color: '#8296b4', marginTop: 2 }}>{loading ? '' : `${formatMoney(round2(pay))} · £${rate}/h`}</div>
    </div>
  )
}
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '9px 10px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#f5d775' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
    </div>
  )
}

const navBtn: React.CSSProperties = { padding: 8, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#8296b4', cursor: 'pointer', display: 'flex' }
const actionBtn: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: 13, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#cdd8e8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }
