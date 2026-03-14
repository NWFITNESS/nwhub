'use client'

import { Ripple } from '@/components/ui/material-design-3-ripple'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  ripple?: boolean
}

export function Card({ children, className = '', padding = true, ripple = false }: CardProps) {
  return (
    <div
      className={`relative bg-[#161616] border border-white/[0.08] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden ${padding ? 'p-8' : ''} ${className}`}
    >
      {children}
      {ripple && <Ripple color="text-white" opacity={0.08} />}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-5 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>
}

export function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  accent?: 'gold' | 'blue' | 'green' | 'red'
}) {
  const accentColor = {
    gold: 'text-[#c9a70a]',
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
  }[accent ?? 'gold']

  const iconBg = {
    gold: 'bg-[#967705]/15 text-[#c9a70a]',
    blue: 'bg-blue-500/15 text-blue-400',
    green: 'bg-green-500/15 text-green-400',
    red: 'bg-red-500/15 text-red-400',
  }[accent ?? 'gold']

  const glowColor = {
    gold: 'rgba(150,119,5,0.3)',
    blue: 'rgba(59,130,246,0.25)',
    green: 'rgba(34,197,94,0.25)',
    red: 'rgba(239,68,68,0.25)',
  }[accent ?? 'gold']

  const iconGlow = {
    gold: 'rgba(150,119,5,0.35)',
    blue: 'rgba(59,130,246,0.3)',
    green: 'rgba(34,197,94,0.3)',
    red: 'rgba(239,68,68,0.3)',
  }[accent ?? 'gold']

  return (
    <div className="relative bg-[#161616] border border-white/[0.08] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer">
      {/* Decorative layer — clipped independently so it never cuts content */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div
          className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-40"
          style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
        />
        <Ripple color="text-white" opacity={0.1} />
      </div>
      {/* Content — padded generously so it's well clear of the rounded corners */}
      <div className="relative z-10 p-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{label}</p>
          <p className={`text-5xl font-bold tracking-tight ${accentColor}`}>{value}</p>
        </div>
        {icon && (
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
            style={{ boxShadow: `0 0 20px ${iconGlow}` }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
