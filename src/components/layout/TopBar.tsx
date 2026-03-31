'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, X, Smartphone,
  Users, Mail, PenSquare, Baby, Image, AtSign,
  MessageSquare, Send, Tag, Phone,
  SlidersHorizontal, Monitor, Zap, LayoutGrid, ChevronRight, Sun,
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
  calendar: 'Calendar',
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
  const [customiseOpen, setCustomiseOpen] = useState(false)
  const [compactMode, setCompactMode]     = useState(false)
  const [showGridLines, setShowGridLines] = useState(false)
  const [focusMode, setFocusMode]         = useState(false)
  const [lightMode, setLightMode]         = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  // Init from localStorage and apply DOM classes
  useEffect(() => {
    const compact   = localStorage.getItem('nw-compact')   === '1'
    const grid      = localStorage.getItem('nw-gridlines') === '1'
    const focus     = localStorage.getItem('nw-focus')     === '1'
    const light     = localStorage.getItem('nw-theme')     === 'light'
    setCompactMode(compact)
    setShowGridLines(grid)
    setFocusMode(focus)
    setLightMode(light)
    document.documentElement.classList.toggle('nw-compact', compact)
    document.documentElement.classList.toggle('nw-grid',    grid)
    document.documentElement.classList.toggle('nw-focus',   focus)
  }, [])

  useEffect(() => {
    localStorage.setItem('nw-compact', compactMode ? '1' : '0')
    document.documentElement.classList.toggle('nw-compact', compactMode)
  }, [compactMode])

  useEffect(() => {
    localStorage.setItem('nw-gridlines', showGridLines ? '1' : '0')
    document.documentElement.classList.toggle('nw-grid', showGridLines)
  }, [showGridLines])

  useEffect(() => {
    localStorage.setItem('nw-focus', focusMode ? '1' : '0')
    document.documentElement.classList.toggle('nw-focus', focusMode)
  }, [focusMode])

  useEffect(() => {
    localStorage.setItem('nw-theme', lightMode ? 'light' : 'dark')
    document.documentElement.classList.toggle('nw-light', lightMode)
  }, [lightMode])

  // Global keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === 'm' || e.key === 'M') { setIsMobileView(!isMobileView); return }
      if (e.key === '/') { e.preventDefault(); setSearchVisible(true); return }
      if (e.key === 'Escape') { setCustomiseOpen(false); return }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isMobileView, setIsMobileView])

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

  return (
    <>
    <header
      className="hidden md:flex h-[54px] min-h-[54px] flex-shrink-0 items-center gap-[14px] border-b border-[rgba(255,255,255,0.09)] bg-nw-950 px-[22px] z-10"
    >
      {/* Brand */}
      <span className="font-brand text-sm font-bold uppercase tracking-[2px] text-nw-300 whitespace-nowrap">NW HUB</span>

      {/* Divider */}
      <div className="h-[18px] w-px flex-shrink-0 bg-[rgba(255,255,255,0.09)]" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-[6px] text-xs text-nw-500">
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-[6px]">
            {seg} <Chevron />
          </span>
        ))}
        <span className="text-nw-200">{pageLabel}</span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">

        {/* Search */}
        <div ref={wrapperRef} className="relative">
          {searchVisible ? (
            <div className="relative">
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
            <button
              onClick={() => setSearchVisible(true)}
              className="flex items-center gap-1.5 rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] px-3 py-[5px] text-xs text-nw-300 transition-colors hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.08)] hover:text-nw-100"
            >
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
          className={`flex items-center gap-1.5 rounded-[7px] border px-3 py-[5px] text-xs transition-colors ${isMobileView ? 'border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-gold-300' : 'border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] text-nw-300 hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.08)] hover:text-nw-100'}`}
        >
          <Smartphone size={13} />
        </button>

        {/* Page Settings — gold */}
        <button
          onClick={() => setCustomiseOpen(v => !v)}
          className="flex items-center gap-1.5 rounded-[7px] border border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] px-3 py-[5px] text-xs text-gold-300 transition-colors hover:bg-[rgba(212,160,23,0.22)]"
        >
          <SlidersHorizontal size={13} /> Page Settings
        </button>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>

    {/* Customise Drawer */}
    {customiseOpen && (
      <>
        {/* backdrop */}
        <div
          onClick={() => setCustomiseOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 29 }}
        />
        <aside style={{
          position: 'fixed', top: 54, right: 0, bottom: 0,
          width: 280, zIndex: 30,
          background: 'var(--slate-900)',
          borderLeft: '1px solid var(--r-panel-border)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          animation: 'slideInRight 0.2s ease',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--r-panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SlidersHorizontal size={14} style={{ color: 'var(--r-gold-400)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-100)', fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif', letterSpacing: '0.5px' }}>PAGE SETTINGS</span>
            </div>
            <button onClick={() => setCustomiseOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', display: 'flex', padding: 2 }}>
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 0' }}>

            {/* Display */}
            <div style={{ padding: '0 18px 8px' }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 10 }}>Display</p>

              {[
                { label: 'Light Mode', sub: 'Switch to light gray theme', icon: Sun, value: lightMode, set: setLightMode },
                { label: 'Compact Mode', sub: 'Reduce padding & spacing', icon: LayoutGrid, value: compactMode, set: setCompactMode },
                { label: 'Focus Mode', sub: 'Hide non-essential UI', icon: Zap, value: focusMode, set: setFocusMode },
                { label: 'Show Grid Lines', sub: 'Visual grid on panels', icon: Monitor, value: showGridLines, set: setShowGridLines },
              ].map(({ label, sub, icon: Icon, value, set }) => (
                <div
                  key={label}
                  onClick={() => set(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 7, cursor: 'pointer',
                    background: value ? 'rgba(212,160,23,0.07)' : 'transparent',
                    border: `1px solid ${value ? 'rgba(212,160,23,0.2)' : 'transparent'}`,
                    marginBottom: 4, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!value) (e.currentTarget as HTMLElement).style.background = 'var(--r-panel-bg)' }}
                  onMouseLeave={e => { if (!value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: value ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
                    <Icon size={13} style={{ color: value ? 'var(--r-gold-400)' : 'var(--slate-500)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: value ? 'var(--r-gold-300)' : 'var(--slate-200)', fontWeight: 500 }}>{label}</p>
                    <p style={{ fontSize: 10, color: 'var(--slate-500)', marginTop: 1 }}>{sub}</p>
                  </div>
                  {/* Toggle */}
                  <div style={{
                    width: 32, height: 18, borderRadius: 9, flexShrink: 0,
                    background: value ? 'rgba(212,160,23,0.5)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 3, left: value ? 17 : 3,
                      width: 12, height: 12, borderRadius: '50%',
                      background: value ? 'var(--r-gold-300)' : 'var(--slate-500)',
                      transition: 'left 0.2s, background 0.2s',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--r-panel-border)', margin: '8px 18px 14px' }} />

            {/* Page */}
            <div style={{ padding: '0 18px' }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 10 }}>Current Page</p>
              <div style={{ padding: '10px 12px', borderRadius: 7, background: 'var(--r-panel-bg)', border: '1px solid var(--r-panel-border)' }}>
                <p style={{ fontSize: 12, color: 'var(--slate-300)', marginBottom: 2 }}>{pageLabel}</p>
                <p style={{ fontSize: 10, color: 'var(--slate-500)' }}>{pathname}</p>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--r-panel-border)', margin: '14px 18px 14px' }} />

            {/* Quick Actions */}
            <div style={{ padding: '0 18px' }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 10 }}>Quick Actions</p>
              {([
                {
                  key: 'M',
                  label: 'Toggle mobile view',
                  action: () => { setIsMobileView(!isMobileView); setCustomiseOpen(false) },
                },
                {
                  key: '/',
                  label: 'Open search',
                  action: () => { setCustomiseOpen(false); setTimeout(() => setSearchVisible(true), 150) },
                },
                {
                  key: 'Esc',
                  label: 'Close panels',
                  action: () => setCustomiseOpen(false),
                },
              ] as const).map(({ key, label, action }) => (
                <button
                  key={key}
                  onClick={action}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', marginBottom: 6, padding: '7px 8px',
                    background: 'transparent', border: '1px solid transparent',
                    borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--r-panel-bg)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--r-panel-border)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--slate-300)' }}>{label}</span>
                  <kbd style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--slate-500)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--r-panel-border)', borderRadius: 4, padding: '2px 6px' }}>{key}</kbd>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--r-panel-border)' }}>
            <p style={{ fontSize: 10, color: 'var(--slate-600)', textAlign: 'center' }}>NW HUB v2 — Settings persist locally</p>
          </div>
        </aside>
      </>
    )}
    </>
  )
}
