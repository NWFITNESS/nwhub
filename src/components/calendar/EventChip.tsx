import type { EventType } from '@/app/(dashboard)/calendar/types'

const CHIP_STYLES: Record<EventType, { bg: string; color: string }> = {
  gmail:   { bg: 'rgba(248,113,113,0.12)', color: '#ef4444' },
  enquiry: { bg: 'rgba(212,160,23,0.12)',  color: 'var(--r-gold-300)' },
  renewal: { bg: 'rgba(74,222,128,0.1)',   color: 'var(--r-green)' },
  class:   { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  gcal:    { bg: 'rgba(66,133,244,0.14)',  color: '#6ba3f5' },
}

interface EventChipProps {
  type: EventType
  label: string
}

export function EventChip({ type, label }: EventChipProps) {
  const s = CHIP_STYLES[type]
  return (
    <div style={{
      fontSize: 9, padding: '2px 5px', borderRadius: 4,
      fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      maxWidth: '100%', marginTop: 2, letterSpacing: '0.3px',
      background: s.bg, color: s.color,
    }}>
      {label}
    </div>
  )
}
