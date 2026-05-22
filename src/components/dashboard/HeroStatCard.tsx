'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  trend?: { value: number; label: string }
  icon: React.ReactNode
  color: string
  colorLight: string
  illustration?: 'members' | 'revenue' | 'leads' | 'enquiries'
  href?: string
  onClick?: () => void
}

// ── Decorative SVG illustrations (one per card theme) ────────────────────────

function MembersIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="absolute -right-4 -bottom-4 w-[180px] h-[144px] opacity-50 group-hover:opacity-60 transition-opacity" aria-hidden="true">
      {/* Group of people silhouettes */}
      <circle cx="100" cy="48" r="22" fill={color} />
      <path d="M60 140c0-22 18-40 40-40s40 18 40 40" fill={color} />
      <circle cx="52" cy="58" r="16" fill={color} opacity="0.6" />
      <path d="M24 140c0-16 12-28 28-28s28 12 28 28" fill={color} opacity="0.6" />
      <circle cx="148" cy="58" r="16" fill={color} opacity="0.6" />
      <path d="M120 140c0-16 12-28 28-28s28 12 28 28" fill={color} opacity="0.6" />
      {/* Connecting dots */}
      <circle cx="76" cy="36" r="3" fill={color} opacity="0.3" />
      <circle cx="124" cy="36" r="3" fill={color} opacity="0.3" />
      <circle cx="100" cy="20" r="2" fill={color} opacity="0.2" />
    </svg>
  )
}

function RevenueIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="absolute -right-2 -bottom-2 w-[170px] h-[136px] opacity-50 group-hover:opacity-60 transition-opacity" aria-hidden="true">
      {/* Rising bar chart with trend line */}
      <rect x="20" y="100" width="24" height="40" rx="4" fill={color} opacity="0.4" />
      <rect x="56" y="80" width="24" height="60" rx="4" fill={color} opacity="0.5" />
      <rect x="92" y="55" width="24" height="85" rx="4" fill={color} opacity="0.6" />
      <rect x="128" y="30" width="24" height="110" rx="4" fill={color} opacity="0.8" />
      <rect x="164" y="15" width="24" height="125" rx="4" fill={color} />
      {/* Trend arrow */}
      <path d="M32 95L76 75L112 50L140 25L176 10" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <path d="M168 8L178 10L172 20" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      {/* Pound symbol */}
      <text x="90" y="30" fill={color} fontSize="28" fontWeight="700" opacity="0.15" fontFamily="system-ui">£</text>
    </svg>
  )
}

function LeadsIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="absolute -right-2 -bottom-2 w-[170px] h-[136px] opacity-50 group-hover:opacity-60 transition-opacity" aria-hidden="true">
      {/* Funnel shape */}
      <path d="M40 20L160 20L130 70L110 130L90 130L70 70Z" fill={color} opacity="0.3" />
      <path d="M50 20L150 20" stroke={color} strokeWidth="2" opacity="0.5" />
      <path d="M65 50L135 50" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <path d="M78 80L122 80" stroke={color} strokeWidth="1.5" opacity="0.3" />
      {/* Dots flowing through funnel */}
      <circle cx="80" cy="32" r="4" fill={color} opacity="0.6" />
      <circle cx="120" cy="28" r="4" fill={color} opacity="0.6" />
      <circle cx="100" cy="35" r="4" fill={color} opacity="0.6" />
      <circle cx="105" cy="60" r="3.5" fill={color} opacity="0.5" />
      <circle cx="92" cy="58" r="3.5" fill={color} opacity="0.5" />
      <circle cx="100" cy="88" r="3" fill={color} opacity="0.4" />
      {/* Conversion arrow */}
      <path d="M100 115L100 145" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <path d="M94 139L100 147L106 139" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      {/* Star = converted */}
      <path d="M100 150L102 155L108 155L103 158L105 164L100 161L95 164L97 158L92 155L98 155Z" fill={color} opacity="0.4" />
    </svg>
  )
}

function EnquiriesIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="absolute -right-2 -bottom-4 w-[170px] h-[136px] opacity-50 group-hover:opacity-60 transition-opacity" aria-hidden="true">
      {/* Chat bubbles */}
      <rect x="30" y="20" width="100" height="60" rx="16" fill={color} />
      <path d="M50 80L40 100L70 80" fill={color} />
      {/* Message lines */}
      <rect x="50" y="38" width="60" height="4" rx="2" fill="white" opacity="0.3" />
      <rect x="50" y="50" width="42" height="4" rx="2" fill="white" opacity="0.3" />
      <rect x="50" y="62" width="52" height="4" rx="2" fill="white" opacity="0.3" />
      {/* Reply bubble */}
      <rect x="80" y="85" width="90" height="50" rx="14" fill={color} opacity="0.5" />
      <path d="M140 135L155 150L145 135" fill={color} opacity="0.5" />
      {/* Reply lines */}
      <rect x="96" y="100" width="50" height="3.5" rx="2" fill="white" opacity="0.2" />
      <rect x="96" y="110" width="36" height="3.5" rx="2" fill="white" opacity="0.2" />
      {/* Notification dot */}
      <circle cx="135" cy="24" r="10" fill={color} opacity="0.7" />
      <text x="135" y="28" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" opacity="0.5">!</text>
    </svg>
  )
}

const ILLUSTRATIONS = {
  members: MembersIllustration,
  revenue: RevenueIllustration,
  leads: LeadsIllustration,
  enquiries: EnquiriesIllustration,
}

// ── Component ────────────────────────────────────────────────────────────────

export function HeroStatCard({ label, value, trend, icon, color, colorLight, illustration, href, onClick }: Props) {
  const router = useRouter()
  const Illustration = illustration ? ILLUSTRATIONS[illustration] : null

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

      {/* Themed illustration */}
      {Illustration && <Illustration color={color} />}

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
