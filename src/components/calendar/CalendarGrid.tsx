'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { CalendarEvent, Trial } from '@/app/(dashboard)/calendar/types'
import { CalendarCell } from './CalendarCell'
import { TrialBar, computeTrialSegments } from './TrialBar'

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CalendarGridProps {
  year: number
  month: number
  events: CalendarEvent[]
  trials: Trial[]
  selectedDate: string | null
  onSelectDate: (d: string) => void
}

function buildCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const startOffset = (firstDay + 6) % 7 // Mon-based: Mon=0..Sun=6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const total = Math.ceil((startOffset + daysInMonth) / 7) * 7

  const cells: {
    day: number | null
    dateStr: string | null
    isOtherMonth: boolean
    row: number
    col: number
  }[] = []

  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / 7)
    const col = i % 7
    if (i < startOffset) {
      const d = daysInPrev - startOffset + i + 1
      const pm = month === 0 ? 11 : month - 1
      const py = month === 0 ? year - 1 : year
      cells.push({ day: d, dateStr: `${py}-${String(pm + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, isOtherMonth: true, row, col })
    } else if (i < startOffset + daysInMonth) {
      const d = i - startOffset + 1
      cells.push({ day: d, dateStr: `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, isOtherMonth: false, row, col })
    } else {
      const d = i - startOffset - daysInMonth + 1
      const nm = month === 11 ? 0 : month + 1
      const ny = month === 11 ? year + 1 : year
      cells.push({ day: d, dateStr: `${ny}-${String(nm + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, isOtherMonth: true, row, col })
    }
  }
  return { cells, rowCount: total / 7 }
}

export function CalendarGrid({ year, month, events, trials, selectedDate, onSelectDate }: CalendarGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 })

  const { cells, rowCount } = buildCells(year, month)
  const today = new Date().toISOString().slice(0, 10)

  const updateSize = useCallback(() => {
    if (gridRef.current) {
      setGridSize({ width: gridRef.current.offsetWidth, height: gridRef.current.offsetHeight })
    }
  }, [])

  useEffect(() => {
    updateSize()
    const ro = new ResizeObserver(updateSize)
    if (gridRef.current) ro.observe(gridRef.current)
    return () => ro.disconnect()
  }, [updateSize])

  const cellWidth  = gridSize.width  / 7
  const cellHeight = gridSize.height / rowCount

  const trialCells = cells
    .filter(c => c.dateStr !== null)
    .map(c => ({ dateStr: c.dateStr!, row: c.row, col: c.col }))

  const segments = gridSize.width > 0
    ? computeTrialSegments(trials, trialCells, cellWidth, cellHeight)
    : []

  const eventsByDate: Record<string, CalendarEvent[]> = {}
  events.forEach(ev => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = []
    eventsByDate[ev.date].push(ev)
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        background: 'var(--slate-800)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        {DAY_HEADERS.map(d => (
          <div key={d} style={{
            fontSize: 9, fontWeight: 600, letterSpacing: '1.1px',
            textTransform: 'uppercase', color: 'var(--slate-500)',
            padding: '8px 0 7px', textAlign: 'center',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        role="grid"
        ref={gridRef}
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${rowCount}, 1fr)`,
          position: 'relative',
        }}
      >
        {cells.map((cell, i) => (
          <CalendarCell
            key={i}
            day={cell.day}
            dateStr={cell.dateStr}
            isToday={cell.dateStr === today}
            isSelected={cell.dateStr === selectedDate}
            isOtherMonth={cell.isOtherMonth}
            events={cell.dateStr ? (eventsByDate[cell.dateStr] ?? []) : []}
            onClick={() => cell.dateStr && onSelectDate(cell.dateStr)}
          />
        ))}

        {/* Trial bars — absolutely positioned over grid */}
        {segments.map((seg, i) => (
          <TrialBar key={`${seg.trial.id}-${i}`} segment={seg} />
        ))}
      </div>
    </div>
  )
}
