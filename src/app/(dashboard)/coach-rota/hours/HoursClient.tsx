'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Card'
import { formatHours, formatMoney } from '@/lib/rota'

interface Row { coach_id: string; name: string; sessions: number; hours: number; paid_hours: number; pay: number; active: boolean }
interface Grand { hours: number; pay: number; sessions: number }
interface Rates { weekday_rate: number; weekend_rate: number }

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function HoursClient() {
  const [month, setMonth] = useState(currentMonth())
  const [rows, setRows] = useState<Row[]>([])
  const [grand, setGrand] = useState<Grand>({ hours: 0, pay: 0, sessions: 0 })
  const [rates, setRates] = useState<Rates>({ weekday_rate: 13, weekend_rate: 20 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/coach-rota/hours?month=${month}`).then(r => r.json())
    setRows(res.rows ?? [])
    setGrand(res.grand ?? { hours: 0, pay: 0, sessions: 0 })
    if (res.rates) setRates(res.rates)
    setLoading(false)
  }, [month])
  useEffect(() => { load() }, [load])

  function exportCsv() {
    const header = ['Coach', 'Sessions', 'Hours', 'Paid hours', 'Pay (£)']
    const lines = rows.map(r => [r.name, r.sessions, r.hours, r.paid_hours, r.pay].join(','))
    const total = ['TOTAL', grand.sessions, grand.hours, '', grand.pay].join(',')
    const csv = [header.join(','), ...lines, total].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coach-hours-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Coaching" title="Hours & Wages" description={`Weekday £${rates.weekday_rate}/h · Weekend £${rates.weekend_rate}/h · unpaid classes count hours at £0`} actions={<Button variant="secondary" size="sm" onClick={exportCsv} disabled={rows.length === 0}><Download size={15} /> Export CSV</Button>} />

      {/* Month selector + totals */}
      <Panel>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ChevronLeft size={16} /></Button>
            <span className="text-nw-100" style={{ fontSize: 15, fontWeight: 700, minWidth: 150, textAlign: 'center' }}>{monthLabel(month)}</span>
            <Button variant="ghost" size="sm" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"><ChevronRight size={16} /></Button>
          </div>
          <div className="flex items-center gap-5">
            <Stat label="Sessions" value={String(grand.sessions)} />
            <Stat label="Hours" value={formatHours(grand.hours)} />
            <Stat label="Wages" value={formatMoney(grand.pay)} gold />
          </div>
        </div>
      </Panel>

      {/* Per-coach table */}
      <Panel>
        <div style={{ padding: 8 }}>
          <div className="hidden md:grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span>Coach</span><span style={{ textAlign: 'right' }}>Sessions</span><span style={{ textAlign: 'right' }}>Hours</span><span style={{ textAlign: 'right' }}>Pay</span>
          </div>
          {loading && <p style={{ padding: 16, color: '#8296b4', fontSize: 14 }}>Loading…</p>}
          {!loading && rows.length === 0 && <p style={{ padding: 16, color: '#8296b4', fontSize: 14 }}>No filled sessions in {monthLabel(month)}.</p>}
          {rows.map(r => (
            <div key={r.coach_id} className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] items-center" style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#edf3fb' }}>{r.name}</span>
              <span className="hidden md:block" style={{ textAlign: 'right', fontSize: 14, color: '#b9c6da' }}>{r.sessions}</span>
              <span style={{ textAlign: 'right', fontSize: 14, color: '#b9c6da' }}>{formatHours(r.hours)}h{r.paid_hours !== r.hours ? <span style={{ color: '#5e6e82' }}> ({formatHours(r.paid_hours)} paid)</span> : null}</span>
              <span style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#e8c75a' }}>{formatMoney(r.pay)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: gold ? '#e8c75a' : '#edf3fb' }}>{value}</div>
    </div>
  )
}
