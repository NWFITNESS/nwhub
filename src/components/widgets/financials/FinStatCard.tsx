import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface FinStatCardProps {
  label: string
  value: number
  iconBg: string
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  sub?: string
  trend?: number
  negative?: boolean
}

export function FinStatCard({ label, value, iconBg, icon: Icon, sub, trend, negative }: FinStatCardProps) {
  return (
    <div className="rounded-xl p-6 min-h-[130px] flex flex-col justify-between transition-all duration-200 h-full" style={{ background: 'var(--slate-750)', border: '1px solid var(--r-panel-border)' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(150,119,5,0.3)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--r-panel-border)' }}>
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={18} className="text-white/70" strokeWidth={1.75} />
        </div>
      </div>
      <div>
        <p
          style={{ fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif', fontSize: '2.75rem', fontWeight: 700, color: negative && value < 0 ? 'var(--r-red, #f87171)' : 'var(--slate-100)' }}
        >
          £{value.toLocaleString()}
        </p>
        {trend != null ? (
          <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
            {trend >= 0
              ? <ArrowUpRight size={12} className="text-green-500" />
              : <ArrowDownRight size={12} className="text-red-500" />}
            {Math.abs(trend)}% vs last month
          </p>
        ) : sub ? (
          <p className="text-xs text-white/40 mt-1">{sub}</p>
        ) : null}
      </div>
    </div>
  )
}
