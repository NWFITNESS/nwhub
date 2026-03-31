import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode | React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  iconBg?: string
  gold?: boolean
  trend?: number | null
  alert?: boolean
  alertLabel?: string
}

export function StatCard({ label, value, sub, icon, iconBg, gold = false, trend, alert, alertLabel = 'Needs attention' }: StatCardProps) {
  let iconElement: React.ReactNode = null
  if (icon) {
    if (React.isValidElement(icon)) {
      iconElement = icon
    } else {
      const Icon = icon as React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
      iconElement = <Icon size={16} className="text-nw-300" strokeWidth={1.7} />
    }
  }

  const subText = sub ?? (alert
    ? alertLabel
    : trend != null
      ? `${Math.abs(trend)}% vs last month`
      : null)

  return (
    <div className="relative cursor-default overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-nw-750 p-[15px_17px_13px] shadow-gold-sm transition-[background,border-color,box-shadow] duration-[180ms] hover:border-[rgba(212,160,23,0.22)] hover:bg-nw-700 hover:shadow-gold-md">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">{label}</span>
        {iconElement && (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)]"
            style={iconBg ? { background: iconBg } : undefined}
          >
            {iconElement}
          </div>
        )}
      </div>
      <div className={`mt-2 font-brand text-[32px] font-bold leading-none tracking-[-0.5px] ${gold ? 'text-gold-300' : 'text-white'}`}>
        {value}
      </div>
      {subText && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-nw-500">
          {alert ? (
            <><ArrowUpRight size={10} className="text-red-400" />{subText}</>
          ) : trend != null ? (
            <>{trend >= 0 ? <ArrowUpRight size={10} className="text-[#4ade80]" /> : <ArrowDownRight size={10} className="text-red-400" />}{subText}</>
          ) : (
            subText
          )}
        </div>
      )}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${gold ? 'bg-gradient-to-r from-[rgba(212,160,23,0.65)] to-transparent' : 'bg-gradient-to-r from-nw-600 to-transparent'}`} />
    </div>
  )
}
