'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, X, Smartphone,
  Users, Mail, PenSquare, Baby, Image, AtSign,
  MessageSquare, Send, Tag, Phone,
} from 'lucide-react'
import Link from 'next/link'
import { useSidebarCtx } from './SidebarProvider'
import { usePathname } from 'next/navigation'

type SearchResult = { id: string; label: string; sub: string; href: string }
type SearchResults = Record<string, SearchResult[]>

const CATEGORY_META: Record<string, {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}> = {
  contacts:          { label: 'Contacts',              icon: Users },
  enquiries:         { label: 'Enquiries',             icon: Mail },
  blog:              { label: 'Blog Posts',            icon: PenSquare },
  blog_categories:   { label: 'Blog Categories',       icon: Tag },
  media:             { label: 'Media',                 icon: Image },
  kids:              { label: 'Kids & Teens',          icon: Baby },
  email_subscribers: { label: 'Email Subscribers',     icon: AtSign },
  sms_subscribers:   { label: 'WhatsApp Subscribers',  icon: Phone },
  email_campaigns:   { label: 'Email Campaigns',       icon: Send },
  sms_campaigns:     { label: 'WhatsApp Campaigns',    icon: MessageSquare },
}

const PATH_LABELS: Record<string, string> = {
  inbox: 'Inbox Intelligence',
  financials: 'Financials',
  contacts: 'Contacts',
  leads: 'Leads',
  enquiries: 'Enquiries',
  kids: 'Kids & Teens',
  email: 'Email',
  campaigns: 'Campaigns',
  mailchimp: 'Email Campaigns',
  content: 'Website Editor',
  blog: 'Blog',
  manage: 'Manage',
  media: 'Media',
  settings: 'Settings',
  sync: 'Integrations',
  branding: 'Branding Studio',
  workflows: 'Workflows',
  'ai-chat': 'AI Chat',
  todo: 'To Do',
  'email-campaigns': 'Email Campaigns',
}

function getBreadcrumb(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return { segments: [] as string[], current: 'Overview' }
  const current = PATH_LABELS[parts[parts.length - 1]] ?? parts[parts.length - 1]
  const segments = parts.slice(0, -1).map(p => PATH_LABELS[p] ?? p)
  return { segments, current }
}

interface TopBarProps {
  title?: string
  actions?: React.ReactNode
}

const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ opacity: 0.4 }}>
    <path d="M3 2l3.5 3L3 8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export function TopBar({ title, actions }: TopBarProps) {
  const { isMobileView, setIsMobileView } = useSidebarCtx()
  const pathname = usePathname()
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<SearchResults | null>(null)
  const [loading, setLoading]       = useState(false)
  const [open, setOpen]             = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  const { segments, current } = getBreadcrumb(pathname)
  const pageLabel = title ?? current

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
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false); setSearchVisible(false); setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (searchVisible) inputRef.current?.focus()
  }, [searchVisible])

  const categories = Object.entries(results ?? {}).filter(([, items]) => items?.length > 0)
  const totalResults = categories.reduce((n, [, items]) => n + items.length, 0)

  const btnBase: React.CSSProperties = {
    background: 'var(--r-panel-bg)',
    border: '1px solid var(--r-panel-border)',
    borderRadius: 7, padding: '5px 12px',
    fontSize: 12, color: 'var(--slate-300)',
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
  }

  return (
    <header
      className="hidden lg:flex sticky top-0 z-30 flex-shrink-0 items-center gap-3"
      style={{
        height: 54,
        background: 'var(--slate-950)',
        borderBottom: '1px solid var(--r-panel-border)',
        padding: '0 22px',
      }}
    >
      {/* Brand */}
      <span style={{
        fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif',
        fontWeight: 700, fontSize: 14,
        letterSpacing: '2px', textTransform: 'uppercase',
        color: 'var(--slate-300)', whiteSpace: 'nowrap',
      }}>NW HUB</span>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: 'var(--r-panel-border)', flexShrink: 0 }} />

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--slate-500)' }}>
        {segments.map((seg, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {seg} <Chevron />
          </span>
        ))}
        <span style={{ color: 'var(--slate-200)' }}>{pageLabel}</span>
      </div>

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Search */}
        <div ref={wrapperRef} style={{ position: 'relative' }}>
          {searchVisible ? (
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => { if (results && query.length >= 2) setOpen(true) }}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setOpen(false); setSearchVisible(false); setQuery('') }
                }}
                placeholder="Search everything…"
                style={{
                  paddingLeft: '2rem', paddingRight: '2rem',
                  paddingTop: '5px', paddingBottom: '5px',
                  borderRadius: 7,
                  background: 'var(--r-panel-bg)',
                  border: '1px solid rgba(212,160,23,0.3)',
                  color: 'var(--slate-200)', fontSize: 12, outline: 'none',
                  width: 220,
                }}
              />
              <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-500)', pointerEvents: 'none' }} />
              {query && (
                <button
                  onClick={() => { setQuery(''); setOpen(false) }}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', display: 'flex', padding: 0 }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ) : (
            <button onClick={() => setSearchVisible(true)} style={btnBase}>
              <Search size={13} /> Search
            </button>
          )}

          {/* Dropdown */}
          {open && (
            <div style={{
              position: 'absolute', top: '100%', marginTop: 6, right: 0,
              background: 'var(--slate-800)', border: '1px solid var(--slate-600)',
              borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 50, maxHeight: 400, overflowY: 'auto', width: 280,
            }}>
              {loading ? (
                <p style={{ padding: '10px 14px', fontSize: 12, color: 'var(--slate-500)' }}>Searching…</p>
              ) : totalResults === 0 ? (
                <p style={{ padding: '10px 14px', fontSize: 12, color: 'var(--slate-500)' }}>No results for &ldquo;{query}&rdquo;</p>
              ) : (
                categories.map(([cat, items]) => {
                  const meta = CATEGORY_META[cat]
                  if (!meta) return null
                  const Icon = meta.icon
                  return (
                    <div key={cat}>
                      <div style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--r-panel-border)', background: 'rgba(255,255,255,0.02)' }}>
                        <Icon size={10} className="text-[#e8b933]" />
                        <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{meta.label}</span>
                      </div>
                      {items.map(r => (
                        <Link
                          key={r.id}
                          href={r.href}
                          onClick={() => { setOpen(false); setQuery(''); setSearchVisible(false) }}
                          style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid var(--r-panel-border)', textDecoration: 'none' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--r-panel-bg)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <div>
                            <p style={{ fontSize: 12, color: 'var(--slate-200)' }}>{r.label}</p>
                            {r.sub && <p style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 1 }}>{r.sub}</p>}
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
          style={{
            ...btnBase,
            ...(isMobileView ? {
              background: 'rgba(212,160,23,0.12)',
              borderColor: 'rgba(212,160,23,0.28)',
              color: 'var(--r-gold-300)',
            } : {}),
          }}
          onMouseEnter={e => {
            if (!isMobileView) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--slate-100)'
            }
          }}
          onMouseLeave={e => {
            if (!isMobileView) {
              (e.currentTarget as HTMLElement).style.background = 'var(--r-panel-bg)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--slate-300)'
            }
          }}
        >
          <Smartphone size={13} />
        </button>

        {/* Customise — gold */}
        <button
          style={{
            ...btnBase,
            background: 'rgba(212,160,23,0.12)',
            borderColor: 'rgba(212,160,23,0.28)',
            color: 'var(--r-gold-300)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,23,0.22)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,23,0.12)' }}
        >
          Customise
        </button>

        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
      </div>
    </header>
  )
}
