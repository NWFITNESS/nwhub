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
    <div className="relative cursor-default overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 p-6 shadow-gold-sm transition-[background,border-color,box-shadow] duration-[180ms] hover:border-[rgba(212,160,23,0.22)] hover:bg-nw-700 hover:shadow-gold-md h-full flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[1.3px] text-nw-400">{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)]" style={iconBg ? { background: iconBg } : undefined}>
          <Icon size={16} className="text-nw-300" strokeWidth={1.7} />
        </div>
      </div>
      <div>
        <div className={`mt-2 font-brand text-[32px] font-bold leading-none tracking-[-0.5px] ${negative && value < 0 ? 'text-red-400' : 'text-white'}`}>
          £{value.toLocaleString()}
        </div>
        {trend != null ? (
          <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-nw-400">
            {trend >= 0
              ? <ArrowUpRight size={10} className="text-[#4ade80]" />
              : <ArrowDownRight size={10} className="text-red-400" />}
            {Math.abs(trend)}% vs last month
          </div>
        ) : sub ? (
          <div className="mt-1.5 text-xs font-medium text-nw-400">{sub}</div>
        ) : null}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-nw-600 to-transparent" />
    </div>
  )
}
