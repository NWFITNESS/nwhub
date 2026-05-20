'use client'

interface Props {
  label: string
  value: string | number
  sub?: string
  trend?: { value: number; label: string }
  icon: React.ReactNode
  gradient: string
  glowColor?: string
  onClick?: () => void
}

export function HeroStatCard({ label, value, sub, trend, icon, gradient, glowColor, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] transition-all hover:border-[rgba(255,255,255,0.14)] hover:shadow-lg text-left w-full group"
      style={{
        padding: '28px 28px 24px',
        background: gradient,
        boxShadow: glowColor ? `0 8px 32px ${glowColor}` : undefined,
      }}
    >
      {/* Subtle glow overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04), transparent 60%)' }} />

      <div className="relative z-10">
        {/* Icon + label */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {icon}
          </div>
          <span className="text-nw-300 font-semibold" style={{ fontSize: 12, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            {label}
          </span>
        </div>

        {/* Big value */}
        <p className="font-brand text-nw-100" style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: '-1px' }}>
          {value}
        </p>

        {/* Subtitle + trend */}
        <div className="flex items-center gap-3 mt-3">
          {sub && <span className="text-nw-400" style={{ fontSize: 13 }}>{sub}</span>}
          {trend && (
            <span
              className="rounded-full font-semibold"
              style={{
                fontSize: 11,
                padding: '2px 8px',
                background: trend.value >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: trend.value >= 0 ? '#4ade80' : '#f87171',
                border: `1px solid ${trend.value >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
