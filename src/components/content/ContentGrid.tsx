'use client'

import Link from 'next/link'
import { Ripple } from '@/components/ui/material-design-3-ripple'
import {
  Home,
  Dumbbell,
  Flame,
  Baby,
  CreditCard,
  Building2,
  Rocket,
  Users,
  Phone,
  CalendarDays,
  ScrollText,
  Globe,
  LucideIcon,
} from 'lucide-react'

interface ContentPage {
  slug: string
  label: string
  updated?: string
}

// Per-page icon + accent colour pair
const PAGE_META: Record<string, { icon: LucideIcon; color: string; bg: string; glow: string }> = {
  home: {
    icon: Home,
    color: 'text-[#c9a70a]',
    bg: 'bg-[#967705]/20',
    glow: 'rgba(150,119,5,0.4)',
  },
  training: {
    icon: Dumbbell,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    glow: 'rgba(59,130,246,0.35)',
  },
  hyrox: {
    icon: Flame,
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    glow: 'rgba(249,115,22,0.35)',
  },
  'kids-teens': {
    icon: Baby,
    color: 'text-pink-400',
    bg: 'bg-pink-500/15',
    glow: 'rgba(236,72,153,0.35)',
  },
  membership: {
    icon: CreditCard,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    glow: 'rgba(52,211,153,0.35)',
  },
  'our-facilities': {
    icon: Building2,
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    glow: 'rgba(167,139,250,0.35)',
  },
  'start-here': {
    icon: Rocket,
    color: 'text-[#c9a70a]',
    bg: 'bg-[#967705]/20',
    glow: 'rgba(150,119,5,0.4)',
  },
  team: {
    icon: Users,
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
    glow: 'rgba(56,189,248,0.35)',
  },
  contact: {
    icon: Phone,
    color: 'text-green-400',
    bg: 'bg-green-500/15',
    glow: 'rgba(74,222,128,0.35)',
  },
  timetable: {
    icon: CalendarDays,
    color: 'text-[#c9a70a]',
    bg: 'bg-[#967705]/20',
    glow: 'rgba(150,119,5,0.4)',
  },
  'membership-terms': {
    icon: ScrollText,
    color: 'text-slate-400',
    bg: 'bg-slate-500/15',
    glow: 'rgba(148,163,184,0.3)',
  },
  global: {
    icon: Globe,
    color: 'text-teal-400',
    bg: 'bg-teal-500/15',
    glow: 'rgba(45,212,191,0.35)',
  },
}

const FALLBACK = {
  icon: Globe,
  color: 'text-white/40',
  bg: 'bg-white/[0.06]',
  glow: 'rgba(255,255,255,0.1)',
}

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ContentGrid({ pages }: { pages: ContentPage[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {pages.map(({ slug, label, updated }) => {
        const meta = PAGE_META[slug] ?? FALLBACK
        const Icon = meta.icon

        return (
          <Link
            key={slug}
            href={`/content/${slug}`}
            className="relative block bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden group hover:border-[#967705]/30 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <div className="p-5 relative z-10 pointer-events-none">
              {/* Icon */}
              <div className="mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.color} transition-all`}
                  style={{ boxShadow: `0 0 18px ${meta.glow}` }}
                >
                  <Icon size={22} strokeWidth={1.75} />
                </div>
              </div>

              {/* Text */}
              <p className="text-[15px] font-semibold text-white group-hover:text-[#c9a70a] transition-colors leading-tight">
                {label}
              </p>
              <p className="text-xs text-white/30 mt-1.5">
                {updated ? `Updated ${timeAgo(updated)} ago` : 'Not yet seeded'}
              </p>
            </div>

            {/* Subtle corner glow on hover */}
            <div
              className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${meta.glow.replace('0.', '0.8').replace('0.4', '0.8')}, transparent 70%)` }}
            />

            <Ripple color="text-white" opacity={0.08} />
          </Link>
        )
      })}
    </div>
  )
}
