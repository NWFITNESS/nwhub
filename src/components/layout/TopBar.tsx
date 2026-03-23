'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, X, Smartphone,
  Users, Mail, PenSquare, Baby, Image, AtSign,
  MessageSquare, Send, Tag, Phone,
} from 'lucide-react'
import Link from 'next/link'
import { useSidebarCtx } from './SidebarProvider'

type SearchResult = { id: string; label: string; sub: string; href: string }
type SearchResults = Record<string, SearchResult[]>

const CATEGORY_META: Record<string, {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}> = {
  contacts:          { label: 'Contacts',            icon: Users },
  enquiries:         { label: 'Enquiries',           icon: Mail },
  blog:              { label: 'Blog Posts',          icon: PenSquare },
  blog_categories:   { label: 'Blog Categories',    icon: Tag },
  media:             { label: 'Media',               icon: Image },
  kids:              { label: 'Kids & Teens',        icon: Baby },
  email_subscribers: { label: 'Email Subscribers',  icon: AtSign },
  sms_subscribers:   { label: 'WhatsApp Subscribers', icon: Phone },
  email_campaigns:   { label: 'Email Campaigns',    icon: Send },
  sms_campaigns:     { label: 'WhatsApp Campaigns',  icon: MessageSquare },
}

interface TopBarProps {
  title: string
  actions?: React.ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  const { isMobileView, setIsMobileView } = useSidebarCtx()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) { setResults(null); setOpen(false); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const categories = Object.entries(results ?? {}).filter(([, items]) => items?.length > 0)
  const totalResults = categories.reduce((n, [, items]) => n + items.length, 0)

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-16 border-b border-[#4d4635]/20 bg-[#131313]/95 backdrop-blur-sm items-center gap-5 relative page-pad">
      {/* Page title */}
      <h1
        className="text-sm font-semibold text-[#d0c5af]/50 whitespace-nowrap uppercase tracking-widest shrink-0"
        style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
      >
        {title}
      </h1>

      {/* Global search */}
      <div ref={wrapperRef} className="flex-1 relative">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results && query.length >= 2) setOpen(true) }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }}
            placeholder="Search everything — contacts, blog, media, campaigns…"
            style={{ paddingLeft: '2.5rem' }}
            className="w-full pr-8 py-2 rounded-lg bg-[#1c1b1b] border border-[#4d4635]/25 text-[15px] text-[#e5e2e1] placeholder:text-[#d0c5af]/25 focus:outline-none focus:border-[#d4af37]/50 focus:bg-[#1c1b1b] transition-all"
          />
          <Search
            size={15}
            className="absolute top-1/2 -translate-y-1/2 text-[#d0c5af]/30 pointer-events-none z-10"
            style={{ left: '0.75rem' }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setOpen(false) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#d0c5af]/30 hover:text-[#f2ca50] transition-colors z-10"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#1c1b1b] border border-[#4d4635]/30 rounded-xl shadow-2xl z-50 max-h-[480px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-3 text-sm text-[#d0c5af]/40 animate-pulse">Searching…</p>
            ) : totalResults === 0 ? (
              <p className="px-4 py-3 text-sm text-[#d0c5af]/40">No results for &ldquo;{query}&rdquo;</p>
            ) : (
              categories.map(([cat, items]) => {
                const meta = CATEGORY_META[cat]
                if (!meta) return null
                const Icon = meta.icon
                return (
                  <div key={cat}>
                    <div className="px-4 py-1.5 flex items-center gap-1.5 bg-[#4d4635]/8 border-b border-t border-[#4d4635]/20">
                      <Icon size={10} className="text-[#d4af37]/50" />
                      <span className="text-[10px] font-semibold text-[#d0c5af]/40 uppercase tracking-widest">{meta.label}</span>
                    </div>
                    {items.map((r) => (
                      <Link
                        key={r.id}
                        href={r.href}
                        onClick={() => { setOpen(false); setQuery('') }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#2a2a2a] border-b border-[#4d4635]/15 last:border-0 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] text-[#d0c5af]/70 group-hover:text-[#f2ca50] truncate transition-colors">{r.label}</p>
                          {r.sub && <p className="text-sm text-[#d0c5af]/35 truncate mt-0.5">{r.sub}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Mobile view toggle */}
      <button
        onClick={() => setIsMobileView(!isMobileView)}
        title="Toggle mobile view"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-all duration-200 border shrink-0
                    ${isMobileView
                      ? 'text-[#f2ca50] border-[#d4af37]/40 bg-[#d4af37]/10'
                      : 'text-[#d0c5af]/40 border-[#4d4635]/25 hover:text-[#d0c5af]/70 hover:border-[#4d4635]/50'
                    }`}
      >
        <Smartphone size={14} />
        <span className="hidden lg:inline">Mobile</span>
      </button>

      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}

      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25) 40%, rgba(212,175,55,0.25) 60%, transparent)' }}
      />
    </header>
  )
}
