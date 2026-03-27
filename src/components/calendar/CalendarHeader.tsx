const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface CalendarHeaderProps {
  year: number
  month: number
  view: 'month' | 'week' | 'agenda'
  onPrev: () => void
  onNext: () => void
  onViewChange: (v: 'month' | 'week' | 'agenda') => void
}

export function CalendarHeader({ year, month, view, onPrev, onNext, onViewChange }: CalendarHeaderProps) {
  const navBtn: React.CSSProperties = {
    width: 28, height: 28,
    background: 'var(--slate-800)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 6, cursor: 'pointer', color: 'var(--slate-400)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit', flexShrink: 0, transition: 'background 0.15s, color 0.15s',
  }

  const views: ('month' | 'week' | 'agenda')[] = ['month', 'week', 'agenda']

  return (
    <div style={{
      background: 'var(--slate-950)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '11px 17px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      flexWrap: 'wrap', flexShrink: 0,
    }}>
      {/* Left: eyebrow + title + pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>
          OVERVIEW
        </span>
        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.09)' }} />
        <span style={{ fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--slate-100)' }}>
          Calendar
        </span>
        <div style={{
          fontSize: 9, fontWeight: 600, color: 'var(--r-gold-300)',
          background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.22)',
          borderRadius: 9, padding: '2px 8px', letterSpacing: '0.5px',
        }}>
          WODBOARD SYNC
        </div>
      </div>

      {/* Centre: prev/next + month label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
        <button
          onClick={onPrev}
          aria-label="Previous month"
          style={navBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--slate-700)'; (e.currentTarget as HTMLElement).style.color = 'var(--slate-100)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--slate-800)'; (e.currentTarget as HTMLElement).style.color = 'var(--slate-400)' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M7 2L3.5 5 7 8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span style={{
          fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif',
          fontSize: 14, fontWeight: 700, color: 'var(--slate-100)',
          letterSpacing: '0.5px', minWidth: 130, textAlign: 'center',
        }}>
          {MONTHS[month]} {year}
        </span>

        <button
          onClick={onNext}
          aria-label="Next month"
          style={navBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--slate-700)'; (e.currentTarget as HTMLElement).style.color = 'var(--slate-100)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--slate-800)'; (e.currentTarget as HTMLElement).style.color = 'var(--slate-400)' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M3 2l3.5 3L3 8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Right: view tabs */}
      <div style={{
        display: 'flex', background: 'var(--slate-800)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, overflow: 'hidden',
      }}>
        {views.map(v => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            style={{
              padding: '5px 12px', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.8px', textTransform: 'uppercase',
              background: view === v ? 'rgba(212,160,23,0.11)' : 'transparent',
              color: view === v ? 'var(--r-gold-300)' : 'var(--slate-500)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
