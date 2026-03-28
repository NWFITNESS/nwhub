import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  iconBg: string
  trend?: number | null
  alert?: boolean
  alertLabel?: string
}

export function StatCard({ label, value, icon: Icon, iconBg, trend, alert, alertLabel = 'Needs attention' }: StatCardProps) {
  return (
    <div className="bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-xl p-3 @md/page:p-6 min-h-[110px] @md/page:min-h-[130px] flex flex-col justify-between hover:border-[rgba(212,160,23,0.22)] shadow-gold-sm hover:shadow-gold-md transition-all duration-200 h-full">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] @md/page:text-xs font-semibold text-white/40 uppercase tracking-[0.08em] leading-tight">
          {label}
        </p>
        <div
          className="w-7 h-7 @md/page:w-9 @md/page:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={16} className="text-white/70" strokeWidth={1.75} />
        </div>
      </div>
      <div>
        <p
          className="text-3xl @md/page:text-5xl font-bold text-[#F0F0F0]"
          style={{ fontFamily: 'League Spartan' }}
        >
          {value}
        </p>
        {alert ? (
          <p className="text-[10px] @md/page:text-xs mt-1 flex items-center gap-0.5 text-red-400">
            <ArrowUpRight size={10} />
            {alertLabel}
          </p>
        ) : trend != null ? (
          <p className="text-[10px] @md/page:text-xs text-white/40 mt-1 flex items-center gap-0.5">
            {trend >= 0
              ? <ArrowUpRight size={10} className="text-green-500" />
              : <ArrowDownRight size={10} className="text-red-500" />}
            {Math.abs(trend)}% vs last month
          </p>
        ) : null}
      </div>
    </div>
  )
}
