'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, X,
  Users, Mail, PenSquare, Baby, Image, AtSign,
  MessageSquare, Send, Tag, Phone,
} from 'lucide-react'
import Link from 'next/link'

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
    <header
      className="sticky top-0 z-30 h-16 border-b bg-[#0a0a0a]/95 backdrop-blur-sm flex items-center px-6 gap-5 relative"
      style={{ borderBottomColor: 'rgba(150,119,5,0.15)' }}
    >
      {/* Page title */}
      <h1 className="text-xs font-semibold text-white/40 whitespace-nowrap uppercase tracking-widest shrink-0">
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
            className="w-full pr-8 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50 focus:bg-white/[0.07] transition-all"
          />
          <Search
            size={15}
            className="absolute top-1/2 -translate-y-1/2 text-white/25 pointer-events-none z-10"
            style={{ left: '0.75rem' }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setOpen(false) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors z-10"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#161616] border border-white/[0.1] rounded-xl shadow-2xl z-50 max-h-[480px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-3 text-sm text-white/30 animate-pulse">Searching…</p>
            ) : totalResults === 0 ? (
              <p className="px-4 py-3 text-sm text-white/30">No results for &ldquo;{query}&rdquo;</p>
            ) : (
              categories.map(([cat, items]) => {
                const meta = CATEGORY_META[cat]
                if (!meta) return null
                const Icon = meta.icon
                return (
                  <div key={cat}>
                    <div className="px-4 py-1.5 flex items-center gap-1.5 bg-white/[0.02] border-b border-t border-white/[0.04]">
                      <Icon size={10} className="text-white/30" />
                      <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">{meta.label}</span>
                    </div>
                    {items.map((r) => (
                      <Link
                        key={r.id}
                        href={r.href}
                        onClick={() => { setOpen(false); setQuery('') }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] border-b border-white/[0.03] last:border-0 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/75 group-hover:text-white truncate transition-colors">{r.label}</p>
                          {r.sub && <p className="text-xs text-white/30 truncate mt-0.5">{r.sub}</p>}
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

      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}

      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(150,119,5,0.3) 40%, rgba(150,119,5,0.3) 60%, transparent)' }}
      />
    </header>
  )
}
