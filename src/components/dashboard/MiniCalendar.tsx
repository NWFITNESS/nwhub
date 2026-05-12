'use client'

import { useState } from 'react'
import Link from 'next/link'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_LETTERS = ['M','T','W','T','F','S','S']

function buildMiniCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()
  const total = Math.ceil((offset + daysInMonth) / 7) * 7
  const cells: { day: number; dateStr: string; isOther: boolean }[] = []
  for (let i = 0; i < total; i++) {
    if (i < offset) {
      const d = daysInPrev - offset + i + 1
      const pm = month === 0 ? 11 : month - 1
      const py = month === 0 ? year - 1 : year
      cells.push({ day: d, dateStr: `${py}-${String(pm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, isOther: true })
    } else if (i < offset + daysInMonth) {
      const d = i - offset + 1
      cells.push({ day: d, dateStr: `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, isOther: false })
    } else {
      const d = i - offset - daysInMonth + 1
      const nm = month === 11 ? 0 : month + 1
      const ny = month === 11 ? year + 1 : year
      cells.push({ day: d, dateStr: `${ny}-${String(nm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, isOther: true })
    }
  }
  return cells
}

export function MiniCalendar() {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState<string | null>(today)

  const cells = buildMiniCells(year, month)

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div style={{
      background: 'var(--slate-750)', border: '1px solid rgba(255,255,255,0.11)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>Calendar</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={prev} aria-label="Previous month" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', display: 'flex', padding: 2 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--slate-200)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--slate-500)' }}
          >
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 2L3.5 5 7 8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--slate-100)', minWidth: 72, textAlign: 'center' }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={next} aria-label="Next month" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', display: 'flex', padding: 2 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--slate-200)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--slate-500)' }}
          >
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2l3.5 3L3 8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '8px 10px 10px' }}>
        {/* Day letters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {DAY_LETTERS.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 8, fontWeight: 600, color: 'var(--slate-600)', letterSpacing: '0.5px', padding: '2px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {cells.map((cell, i) => {
            const isToday = cell.dateStr === today
            const isSel   = cell.dateStr === selected
            return (
              <button
                key={i}
                onClick={() => setSelected(cell.dateStr)}
                style={{
                  border: 'none', cursor: 'pointer', padding: 0,
                  width: '100%', aspectRatio: '1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 4, fontSize: 9.5, fontWeight: isToday ? 700 : 400,
                  background: isToday
                    ? 'var(--r-gold-400)'
                    : isSel
                      ? 'rgba(212,160,23,0.12)'
                      : 'transparent',
                  color: isToday
                    ? 'var(--slate-950)'
                    : cell.isOther
                      ? 'var(--slate-700)'
                      : isSel
                        ? 'var(--r-gold-300)'
                        : 'var(--slate-400)',
                  transition: 'background 0.1s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  if (!isToday && !isSel) (e.currentTarget as HTMLElement).style.background = 'var(--slate-700)'
                }}
                onMouseLeave={e => {
                  if (!isToday && !isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                {cell.day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer link */}
      <Link
        href="/calendar"
        style={{
          display: 'block', textAlign: 'center', padding: '7px 14px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          fontSize: 10, fontWeight: 600, color: 'var(--r-gold-400)',
          textDecoration: 'none', letterSpacing: '0.5px',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,23,0.06)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        View full calendar ↗
      </Link>
    </div>
  )
}
