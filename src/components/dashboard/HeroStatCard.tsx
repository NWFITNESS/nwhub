'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  trend?: { value: number; label: string }
  icon: React.ReactNode
  color: string        // primary accent e.g. '#C9A70A'
  colorLight: string   // lighter shade e.g. '#f2cb55'
  href?: string
  onClick?: () => void
}

export function HeroStatCard({ label, value, trend, icon, color, colorLight, href, onClick }: Props) {
  const router = useRouter()

  function handleClick() {
    if (onClick) { onClick(); return }
    if (href) router.push(href)
  }

  return (
    <button
      onClick={handleClick}
      className="relative overflow-hidden rounded-2xl transition-all hover:scale-[1.02] hover:shadow-xl text-left w-full group"
      style={{
        padding: '24px 24px 20px',
        background: `linear-gradient(135deg, ${color}18 0%, ${color}08 50%, transparent 100%)`,
        border: `1px solid ${color}25`,
        cursor: href || onClick ? 'pointer' : 'default',
      }}
    >
      {/* Decorative gradient orb */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />

      {/* Top row: icon + menu */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <div style={{ color: colorLight }}>{icon}</div>
        </div>
        <div className="text-nw-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={16} />
        </div>
      </div>

      {/* Label */}
      <p className="relative z-10 text-nw-400" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
        {label}
      </p>

      {/* Value + trend inline */}
      <div className="relative z-10 flex items-baseline gap-3">
        <p className="font-brand text-nw-100" style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, letterSpacing: '-1px' }}>
          {value}
        </p>
        {trend && (
          <span
            className="rounded-md font-semibold"
            style={{
              fontSize: 12,
              padding: '2px 8px',
              background: trend.value >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: trend.value >= 0 ? '#4ade80' : '#f87171',
            }}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>

      {/* Comparison text */}
      {trend && (
        <p className="relative z-10 text-nw-500 mt-2" style={{ fontSize: 12 }}>
          Compared to {trend.label}
        </p>
      )}
    </button>
  )
}
