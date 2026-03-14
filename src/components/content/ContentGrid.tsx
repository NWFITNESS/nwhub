'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Home, Dumbbell, Flame, Baby, CreditCard, Building2,
  Rocket, Users, Phone, CalendarDays, ScrollText, Globe,
  Edit3, Eye, Clock, CheckCircle2, Circle, Search,
  LucideIcon,
} from 'lucide-react'

interface ContentPage {
  slug: string
  label: string
  updated?: string
  status?: 'published' | 'draft'
}

const PAGE_META: Record<string, { icon: LucideIcon; color: string; bg: string; glow: string }> = {
  home: { icon: Home, color: 'text-[#C9A70A]', bg: 'bg-[#967705]/20', glow: 'rgba(150,119,5,0.4)' },
  training: { icon: Dumbbell, color: 'text-blue-400', bg: 'bg-blue-500/15', glow: 'rgba(59,130,246,0.35)' },
  hyrox: { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/15', glow: 'rgba(249,115,22,0.35)' },
  'kids-teens': { icon: Baby, color: 'text-pink-400', bg: 'bg-pink-500/15', glow: 'rgba(236,72,153,0.35)' },
  membership: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/15', glow: 'rgba(52,211,153,0.35)' },
  'our-facilities': { icon: Building2, color: 'text-violet-400', bg: 'bg-violet-500/15', glow: 'rgba(167,139,250,0.35)' },
  'start-here': { icon: Rocket, color: 'text-[#C9A70A]', bg: 'bg-[#967705]/20', glow: 'rgba(150,119,5,0.4)' },
  team: { icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/15', glow: 'rgba(56,189,248,0.35)' },
  contact: { icon: Phone, color: 'text-green-400', bg: 'bg-green-500/15', glow: 'rgba(74,222,128,0.35)' },
  timetable: { icon: CalendarDays, color: 'text-[#C9A70A]', bg: 'bg-[#967705]/20', glow: 'rgba(150,119,5,0.4)' },
  'membership-terms': { icon: ScrollText, color: 'text-slate-400', bg: 'bg-slate-500/15', glow: 'rgba(148,163,184,0.3)' },
  global: { icon: Globe, color: 'text-teal-400', bg: 'bg-teal-500/15', glow: 'rgba(45,212,191,0.35)' },
}

const FALLBACK = { icon: Globe, color: 'text-white/40', bg: 'bg-white/[0.06]', glow: 'rgba(255,255,255,0.1)' }

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
}

export function ContentGrid({ pages }: { pages: ContentPage[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  const allPages = pages.map(p => ({ ...p, status: p.status ?? 'published' as const }))

  const filtered = useMemo(() => {
    return allPages.filter(p => {
      const matchesSearch = p.label.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === 'all' || p.status === filter
      return matchesSearch && matchesFilter
    })
  }, [allPages, search, filter])

  const published = allPages.filter(p => p.status === 'published').length
  const drafts = allPages.filter(p => p.status === 'draft').length

  const latestUpdate = allPages
    .filter(p => p.updated)
    .sort((a, b) => new Date(b.updated!).getTime() - new Date(a.updated!).getTime())[0]?.updated

  const FILTERS = [
    { key: 'all' as const, label: 'All' },
    { key: 'published' as const, label: 'Published' },
    { key: 'draft' as const, label: 'Drafts' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Search + Filter row */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative group">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#C9A70A] transition-colors duration-200"
          />
          <input
            type="text"
            placeholder="Search pages…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-white/[0.08] rounded-lg text-sm text-[#F0F0F0] placeholder:text-white/20 focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-all duration-200"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f.key
                  ? 'bg-[#967705]/15 border border-[#967705]/40 text-[#C9A70A]'
                  : 'bg-white/[0.03] border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.14]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 px-5 py-3 bg-[#111111] border border-white/[0.06] rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C9A70A] shadow-[0_0_6px_rgba(201,167,10,0.8)]" />
          <span className="text-xs text-white/40">Total Pages</span>
          <span className="text-sm font-semibold text-[#C9A70A]" style={{ fontFamily: 'Rajdhani' }}>
            {allPages.length}
          </span>
        </div>
        <div className="w-px h-4 bg-white/[0.06]" />
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
          <span className="text-xs text-white/40">Published</span>
          <span className="text-sm font-semibold text-green-400" style={{ fontFamily: 'Rajdhani' }}>
            {published}
          </span>
        </div>
        <div className="w-px h-4 bg-white/[0.06]" />
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
          <span className="text-xs text-white/40">Drafts</span>
          <span className="text-sm font-semibold text-amber-400" style={{ fontFamily: 'Rajdhani' }}>
            {drafts}
          </span>
        </div>
        {latestUpdate && (
          <>
            <div className="w-px h-4 bg-white/[0.06]" />
            <div className="ml-auto flex items-center gap-1.5 text-xs text-white/25">
              <Clock size={12} />
              <span>Last updated {timeAgo(latestUpdate)}</span>
            </div>
          </>
        )}
      </div>

      {/* Cards grid */}
      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            key="grid"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {filtered.map(({ slug, label, updated, status }) => {
              const meta = PAGE_META[slug] ?? FALLBACK
              const Icon = meta.icon
              const isDraft = status === 'draft'

              return (
                <motion.div
                  key={slug}
                  variants={cardVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
                  className="relative bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden hover:border-[#967705]/35 transition-colors duration-200 group"
                >
                  {/* Top-right corner accent line */}
                  <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                    <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-[#967705]/30 to-transparent" />
                    <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-[#967705]/30 to-transparent" />
                  </div>

                  {/* Hover glow overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 50% 0%, rgba(201,167,10,0.05), transparent 70%)' }}
                  />

                  <div className="relative z-10 p-6 flex flex-col gap-4">
                    {/* Icon + status badge */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}
                        style={{ boxShadow: `0 0 14px ${meta.glow}` }}
                      >
                        <Icon size={22} strokeWidth={1.75} />
                      </div>
                      {isDraft ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Circle size={8} className="fill-amber-400" />
                          Draft
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle2 size={10} />
                          Published
                        </span>
                      )}
                    </div>

                    {/* Label + timestamp */}
                    <div>
                      <p
                        className="text-[15px] font-semibold text-[#F0F0F0] group-hover:text-[#C9A70A] transition-colors duration-200 leading-tight"
                        style={{ fontFamily: 'Rajdhani' }}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-white/25 mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        {updated ? `Updated ${timeAgo(updated)} ago` : 'Not yet seeded'}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/content/${slug}`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity shadow-[0_0_14px_rgba(201,167,10,0.2)]"
                      >
                        <Edit3 size={13} />
                        Edit Content
                      </Link>
                      <a
                        href={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/${slug === 'home' ? '' : slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-[#C9A70A] hover:border-[#967705]/40 hover:bg-white/[0.07] transition-all duration-200"
                      >
                        <Eye size={14} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Search size={20} className="text-white/20" />
            </div>
            <p className="text-sm font-medium text-white/40">No pages found</p>
            <p className="text-xs text-white/20 text-center max-w-[220px]">
              No pages match &ldquo;{search}&rdquo;. Try a different search term.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
