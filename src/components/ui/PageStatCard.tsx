'use client'

import Link from 'next/link'

interface Props {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color?: string
  href?: string
  alert?: boolean
  gold?: boolean
}

// Each card gets a subtle themed background graphic based on its position
const ILLUSTRATIONS = [
  // Card 1 — bar chart rising
  (c: string) => (
    <svg viewBox="0 0 120 100" fill="none" className="absolute -right-1 -bottom-1 w-[90px] h-[75px] opacity-[0.45] group-hover:opacity-[0.55] transition-opacity" aria-hidden="true">
      <rect x="10" y="65" width="14" height="25" rx="3" fill={c} opacity="0.2" />
      <rect x="30" y="50" width="14" height="40" rx="3" fill={c} opacity="0.25" />
      <rect x="50" y="35" width="14" height="55" rx="3" fill={c} opacity="0.3" />
      <rect x="70" y="18" width="14" height="72" rx="3" fill={c} opacity="0.35" />
      <path d="M17 60L37 45L57 30L77 14" stroke={c} strokeWidth="1.5" opacity="0.15" strokeLinecap="round" />
    </svg>
  ),
  // Card 2 — pie/donut segment
  (c: string) => (
    <svg viewBox="0 0 120 100" fill="none" className="absolute -right-1 -bottom-1 w-[90px] h-[75px] opacity-[0.45] group-hover:opacity-[0.55] transition-opacity" aria-hidden="true">
      <circle cx="60" cy="50" r="35" stroke={c} strokeWidth="8" opacity="0.08" />
      <circle cx="60" cy="50" r="35" stroke={c} strokeWidth="8" opacity="0.25" strokeDasharray="80 140" strokeLinecap="round" />
      <circle cx="60" cy="50" r="20" fill={c} opacity="0.06" />
    </svg>
  ),
  // Card 3 — pulse/activity
  (c: string) => (
    <svg viewBox="0 0 120 100" fill="none" className="absolute -right-1 -bottom-1 w-[90px] h-[75px] opacity-[0.45] group-hover:opacity-[0.55] transition-opacity" aria-hidden="true">
      <path d="M5 55h20l8-25 12 45 10-35 8 20h20l6-12 10 22h16" stroke={c} strokeWidth="2" opacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="75" cy="40" r="4" fill={c} opacity="0.25" />
      <circle cx="75" cy="40" r="10" stroke={c} strokeWidth="1" opacity="0.1" />
      <circle cx="75" cy="40" r="18" stroke={c} strokeWidth="0.5" opacity="0.06" />
    </svg>
  ),
  // Card 4 — grid/tiles
  (c: string) => (
    <svg viewBox="0 0 120 100" fill="none" className="absolute -right-1 -bottom-1 w-[90px] h-[75px] opacity-[0.45] group-hover:opacity-[0.55] transition-opacity" aria-hidden="true">
      <rect x="15" y="20" width="22" height="22" rx="5" fill={c} opacity="0.2" />
      <rect x="43" y="20" width="22" height="22" rx="5" fill={c} opacity="0.12" />
      <rect x="71" y="20" width="22" height="22" rx="5" fill={c} opacity="0.08" />
      <rect x="15" y="50" width="22" height="22" rx="5" fill={c} opacity="0.08" />
      <rect x="43" y="50" width="22" height="22" rx="5" fill={c} opacity="0.15" />
      <rect x="71" y="50" width="22" height="22" rx="5" fill={c} opacity="0.25" />
    </svg>
  ),
  // Card 5 — target/bullseye
  (c: string) => (
    <svg viewBox="0 0 120 100" fill="none" className="absolute -right-1 -bottom-1 w-[90px] h-[75px] opacity-[0.45] group-hover:opacity-[0.55] transition-opacity" aria-hidden="true">
      <circle cx="60" cy="50" r="35" stroke={c} strokeWidth="1.5" opacity="0.1" />
      <circle cx="60" cy="50" r="25" stroke={c} strokeWidth="1.5" opacity="0.15" />
      <circle cx="60" cy="50" r="15" stroke={c} strokeWidth="1.5" opacity="0.2" />
      <circle cx="60" cy="50" r="5" fill={c} opacity="0.3" />
    </svg>
  ),
]

export function PageStatCard({ label, value, sub, icon, color = '#C9A70A', href, alert, gold }: Props & { index?: number }) {
  // Use a hash of the label to pick a consistent illustration
  const idx = label.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % ILLUSTRATIONS.length

  const inner = (
    <div className={`relative cursor-default overflow-hidden rounded-2xl border shadow-gold-sm transition-[background,border-color,box-shadow] duration-[180ms] hover:border-[rgba(212,160,23,0.22)] hover:bg-nw-700 hover:shadow-gold-md h-full group ${
      alert ? 'border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.04)]' : 'border-[rgba(255,255,255,0.1)] bg-nw-750'
    }`} style={{ padding: 18 }}>
      {ILLUSTRATIONS[idx](alert ? '#ef4444' : color)}
      <div className="relative z-10 flex items-start justify-between">
        <span className="text-nw-400" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.3px', textTransform: 'uppercase' }}>{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${alert ? '#ef4444' : color}15`, border: `1px solid ${alert ? '#ef4444' : color}25` }}>
          {icon}
        </div>
      </div>
      <div className={`relative z-10 mt-3 font-brand font-bold leading-none tracking-[-0.5px] ${gold ? 'text-gold-300' : alert ? 'text-red-400' : 'text-nw-100'}`} style={{ fontSize: 32 }}>{value}</div>
      {sub && <div className="relative z-10 mt-2 text-xs font-medium text-nw-400">{sub}</div>}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${alert ? 'from-red-500/50' : gold ? 'from-[rgba(212,160,23,0.55)]' : 'from-nw-600'} to-transparent`} />
    </div>
  )

  if (href) {
    return <Link href={href} className="no-underline block h-full">{inner}</Link>
  }
  return inner
}
