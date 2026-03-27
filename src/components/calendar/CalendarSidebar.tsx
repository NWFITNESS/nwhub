import type { CalendarEvent } from '@/app/(dashboard)/calendar/types'
import { EventChip } from './EventChip'

interface CalendarSidebarProps {
  events: CalendarEvent[]
  selectedDate: string | null
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (diff < 1) return 'Today'
  if (diff < 2) return 'Tomorrow'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function CalendarSidebar({ events, selectedDate }: CalendarSidebarProps) {
  // Upcoming: events from today forward, sorted by date
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = [...events]
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8)

  // If a date is selected, show events for that day first
  const filtered = selectedDate
    ? [
        ...events.filter(e => e.date === selectedDate),
        ...upcoming.filter(e => e.date !== selectedDate),
      ].slice(0, 8)
    : upcoming

  return (
    <div style={{
      width: 210, flexShrink: 0,
      background: 'var(--slate-950)',
      borderLeft: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Legend */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 9 }}>
          EVENT TYPES
        </p>

        {/* Trial bar swatches */}
        {[
          { bg: 'rgba(212,160,23,0.1)', border: 'rgba(212,160,23,0.22)', label: 'Trial (WodBoard)' },
          { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.22)',  label: 'Trial (continued)' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <div style={{ width: 16, height: 5, borderRadius: 2, background: s.bg, border: `1px solid ${s.border}`, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{s.label}</span>
          </div>
        ))}

        {/* Event dot swatches */}
        {[
          { color: '#f87171',             label: 'Gmail event' },
          { color: 'var(--r-gold-300)',   label: 'Enquiry follow-up' },
          { color: 'var(--r-green)',      label: 'Renewal' },
          { color: '#a78bfa',             label: 'Class' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming events */}
      <div style={{ padding: '14px 14px 10px', flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 9 }}>
          {selectedDate ? 'SELECTED DAY' : 'UPCOMING'}
        </p>

        {filtered.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--slate-600)', textAlign: 'center', paddingTop: 16 }}>
            No upcoming events
          </p>
        ) : (
          filtered.map(ev => (
            <div
              key={ev.id}
              style={{
                background: 'var(--slate-800)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '9px 10px', marginBottom: 7,
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--slate-750)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,160,23,0.22)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--slate-800)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
              }}
            >
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>
                {timeAgo(ev.date)}
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--slate-200)', marginTop: 2 }}>{ev.label}</p>
              <div style={{ marginTop: 3 }}>
                <EventChip type={ev.type} label={ev.type} />
              </div>
              {ev.meta && (
                <p style={{ fontSize: 10, color: 'var(--slate-600)', marginTop: 2 }}>{ev.meta}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add event button */}
      <button
        style={{
          margin: 14,
          background: 'rgba(212,160,23,0.1)',
          border: '1px solid rgba(212,160,23,0.22)',
          borderRadius: 8, color: 'var(--r-gold-300)',
          fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif',
          fontSize: 13, fontWeight: 700, letterSpacing: '0.5px',
          padding: '9px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,23,0.18)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,160,23,0.38)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,23,0.1)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,160,23,0.22)'
        }}
      >
        + Add event ↗
      </button>
    </div>
  )
}
