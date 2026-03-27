import type { CalendarEvent } from '@/app/(dashboard)/calendar/types'
import { EventChip } from './EventChip'

interface CalendarCellProps {
  day: number | null         // null = filler cell (other month)
  dateStr: string | null     // ISO date string for this cell
  isToday: boolean
  isSelected: boolean
  isOtherMonth: boolean
  events: CalendarEvent[]
  onClick: () => void
}

export function CalendarCell({
  day, dateStr, isToday, isSelected, isOtherMonth, events, onClick,
}: CalendarCellProps) {
  const visible = events.slice(0, 2)
  const overflow = events.length - 2

  return (
    <div
      role="gridcell"
      aria-label={dateStr ?? undefined}
      aria-current={isToday ? 'date' : undefined}
      onClick={onClick}
      tabIndex={dateStr ? 0 : -1}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      style={{
        borderRight: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '8px 6px 5px',
        minHeight: 90,
        cursor: 'pointer',
        transition: 'background 0.15s',
        position: 'relative',
        background: isOtherMonth
          ? 'rgba(0,0,0,0.15)'
          : isSelected
            ? 'rgba(212,160,23,0.06)'
            : 'transparent',
        outline: 'none',
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--slate-700)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = isOtherMonth
          ? 'rgba(0,0,0,0.15)'
          : isSelected
            ? 'rgba(212,160,23,0.06)'
            : 'transparent'
      }}
    >
      {/* Day number */}
      {day !== null && (
        isToday ? (
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--r-gold-400)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif',
            fontWeight: 700, fontSize: 11,
            color: 'var(--slate-950)',
          }}>
            {day}
          </div>
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: isOtherMonth ? '#1e2436' : 'var(--slate-500)',
          }}>
            {day}
          </span>
        )
      )}

      {/* Events */}
      <div style={{ marginTop: 3 }}>
        {visible.map(ev => (
          <EventChip key={ev.id} type={ev.type} label={ev.label} />
        ))}
        {overflow > 0 && (
          <div style={{ fontSize: 9, color: 'var(--slate-600)', marginTop: 2 }}>
            +{overflow} more
          </div>
        )}
      </div>
    </div>
  )
}
