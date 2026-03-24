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
    <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors duration-200 h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">{label}</p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={18} className="text-white/70" strokeWidth={1.75} />
        </div>
      </div>
      <div>
        <p
          className={`text-5xl font-bold ${negative && value < 0 ? 'text-red-400' : 'text-[#F0F0F0]'}`}
          style={{ fontFamily: 'Rajdhani' }}
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
