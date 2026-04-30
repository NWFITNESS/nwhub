'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, X, Bell, Sun, Moon, RotateCw,
  Users, Mail, PenSquare, Baby, Image, AtSign,
  MessageSquare, Send, Tag, Phone,
  ChevronRight, Inbox, FileText, Clock, Zap,
  Settings, LogOut, User, ChevronDown, Shield,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme as useThemeHook } from '@/hooks/useTheme'
import { createClient } from '@/lib/supabase/client'
import type { StaffProfile } from '@/lib/staff'
import { ROLE_LABELS } from '@/lib/staff'

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
  email_campaigns:   { label: 'Email Campaigns',       icon: Send },
}

const PATH_LABELS: Record<string, string> = {
  inbox: 'Inbox Intelligence', calendar: 'Calendar', financials: 'Financials',
  contacts: 'Contacts', leads: 'Leads', enquiries: 'Enquiries',
  kids: 'Kids & Teens', email: 'Email', campaigns: 'Campaigns',
  mailchimp: 'Email Campaigns', content: 'Website Editor', blog: 'Blog',
  manage: 'Manage', media: 'Media', settings: 'Settings', sync: 'Integrations',
  branding: 'Branding Studio', workflows: 'Workflows', 'ai-chat': 'AI Chat',
  todo: 'To Do', 'email-campaigns': 'Email Campaigns', staff: 'Staff Management',
}

function getBreadcrumb(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return { segments: [] as string[], current: 'Overview' }
  const current = PATH_LABELS[parts[parts.length - 1]] ?? parts[parts.length - 1]
  const segments = parts.slice(0, -1).map(p => PATH_LABELS[p] ?? p)
  return { segments, current }
}

const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ opacity: 0.4 }}>
    <path d="M3 2l3.5 3L3 8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── Notification channels ────────────────────────────────────────────────────

const NOTIFICATION_CHANNELS = [
  { key: 'enquiries',      label: 'New Enquiries',      desc: 'When someone submits a contact form',    icon: Inbox },
  { key: 'emails',         label: 'Inbound Emails',     desc: 'Gmail inbox intelligence alerts',         icon: Mail },
  { key: 'todo',           label: 'To-Do Reminders',    desc: 'Task due dates and assignments',          icon: FileText },
  { key: 'morning_digest', label: 'Morning Digest',     desc: 'Daily summary at 8am',                   icon: Clock },
  { key: 'reviews',        label: 'Google Reviews',     desc: 'New reviews detected for your business',  icon: MessageSquare },
]

// ── Main component ───────────────────────────────────────────────────────────

interface TopBarProps {
  title?: string
  actions?: React.ReactNode
  staffProfile?: StaffProfile | null
  userEmail?: string
}

export function TopBar({ title, actions, staffProfile, userEmail }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Search
  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState<SearchResults | null>(null)
  const [loading, setLoading]           = useState(false)
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  // Theme — single source of truth via zustand
  const { theme: currentTheme, toggle: toggleTheme } = useThemeHook()
  const lightMode = currentTheme === 'light'

  // Refresh
  const [refreshing, setRefreshing] = useState(false)
  function handleRefresh() {
    setRefreshing(true)
    window.location.reload()
  }

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const displayName = staffProfile?.display_name || userEmail?.split('@')[0] || 'Admin'
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const roleName = staffProfile ? ROLE_LABELS[staffProfile.role] : 'Administrator'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Notifications
  const [bellOpen, setBellOpen] = useState(false)
  const [notifSettings, setNotifSettings] = useState<Record<string, { desktop: boolean; mobile: boolean }>>({})
  const bellRef = useRef<HTMLDivElement>(null)

  // Load notification prefs
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nw-notifications')
      if (saved) setNotifSettings(JSON.parse(saved))
    } catch {}
  }, [])

  // Save notification settings
  useEffect(() => {
    if (Object.keys(notifSettings).length > 0) {
      localStorage.setItem('nw-notifications', JSON.stringify(notifSettings))
    }
  }, [notifSettings])

  function toggleNotif(key: string, type: 'desktop' | 'mobile') {
    setNotifSettings(prev => {
      const current = prev[key] ?? { desktop: false, mobile: false }
      return { ...prev, [key]: { ...current, [type]: !current[type] } }
    })
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === '/') { e.preventDefault(); setSearchVisible(true); return }
      if (e.key === 'Escape') { setBellOpen(false); return }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Search
  const { segments, current } = getBreadcrumb(pathname)
  const pageLabel = title ?? current

  useEffect(() => {
    if (query.length < 2) { setResults(null); setSearchOpen(false); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setSearchOpen(true)
      } finally { setLoading(false) }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSearchOpen(false); setSearchVisible(false); setQuery('')
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
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
    <header className="hidden md:flex h-[56px] min-h-[56px] flex-shrink-0 items-center border-b border-[rgba(255,255,255,0.09)] bg-nw-950 px-5 z-10">

      {/* ── LEFT: Page title ── */}
      <div className="flex items-center gap-3 min-w-0 flex-shrink-0" style={{ paddingLeft: 10 }}>
        {segments.length > 0 && (
          <div className="flex items-center gap-[6px] text-nw-500" style={{ fontSize: 12 }}>
            {segments.map((seg, i) => (
              <span key={i} className="flex items-center gap-[6px] whitespace-nowrap">{seg} <Chevron /></span>
            ))}
          </div>
        )}
        <span className="font-bold text-nw-100 whitespace-nowrap" style={{ fontSize: 16 }}>{pageLabel}</span>
      </div>

      {/* ── CENTRE: Search bar ── */}
      <div className="flex-1 flex justify-center px-6">
        <div ref={wrapperRef} className="relative w-full max-w-[480px]">
          <div className="relative">
            <Search size={16} strokeWidth={2} className="absolute top-1/2 -translate-y-1/2 text-nw-400 pointer-events-none" style={{ left: 12, zIndex: 1 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => { setSearchVisible(true); if (results && query.length >= 2) setSearchOpen(true) }}
              onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearchVisible(false); setQuery('') } }}
              placeholder="Search members, posts, campaigns…"
              className="h-10 w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-nw-800 text-sm text-nw-100 placeholder:text-nw-500 outline-none transition-all focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750 focus:shadow-[0_0_0_3px_rgba(212,160,23,0.08)]"
              style={{ paddingLeft: 38, paddingRight: 38 }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setSearchOpen(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-nw-500 hover:text-nw-300 transition-colors">
                <X size={14} />
              </button>
            )}
            {!query && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 text-[9px] font-mono text-nw-600">/</kbd>
            )}
          </div>

          {/* Search dropdown */}
          {searchOpen && query.length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[400px] overflow-y-auto rounded-[12px] border border-[rgba(255,255,255,0.11)] bg-nw-750 shadow-xl">
              {loading ? (
                <p className="p-4 text-[13px] text-nw-500">Searching…</p>
              ) : totalResults === 0 ? (
                <p className="p-4 text-[13px] text-nw-500">No results for &ldquo;{query}&rdquo;</p>
              ) : (
                categories.map(([cat, items]) => {
                  const meta = CATEGORY_META[cat]
                  if (!meta) return null
                  const Icon = meta.icon
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] px-4 py-2">
                        <Icon size={11} className="text-gold-400" />
                        <span className="text-[9px] font-semibold uppercase tracking-[1.2px] text-nw-500">{meta.label}</span>
                      </div>
                      {items.map(r => (
                        <Link
                          key={r.id} href={r.href}
                          onClick={() => { setSearchOpen(false); setQuery(''); setSearchVisible(false) }}
                          className="block border-b border-[rgba(255,255,255,0.05)] px-4 py-2.5 transition-colors hover:bg-[rgba(255,255,255,0.03)] no-underline"
                        >
                          <p className="text-[13px] text-nw-200">{r.label}</p>
                          {r.sub && <p className="text-xs font-medium text-nw-400 mt-0.5">{r.sub}</p>}
                        </Link>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Action icons ── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {actions && <div className="flex items-center gap-1 mr-1">{actions}</div>}

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-nw-400 transition-all hover:bg-[rgba(255,255,255,0.06)] hover:text-nw-200"
          title="Refresh"
        >
          <RotateCw size={16} strokeWidth={1.7} className={refreshing ? 'animate-spin' : ''} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-nw-400 transition-all hover:bg-[rgba(212,160,23,0.08)] hover:text-gold-400"
          title={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {lightMode ? <Moon size={16} strokeWidth={1.7} /> : <Sun size={16} strokeWidth={1.7} />}
        </button>

        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen(v => !v)}
            className={`flex h-[34px] w-[34px] items-center justify-center rounded-[9px] transition-all ${
              bellOpen
                ? 'bg-[rgba(212,160,23,0.12)] text-gold-300'
                : 'text-nw-400 hover:bg-[rgba(255,255,255,0.06)] hover:text-nw-200'
            }`}
            title="Notification settings"
          >
            <Bell size={16} strokeWidth={1.7} />
          </button>

          {/* Notification popup */}
          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-[340px] overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.11)] bg-nw-750 shadow-xl">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)]">
                    <Bell size={13} className="text-gold-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-nw-200">Notifications</p>
                    <p className="text-[10px] text-nw-500">Choose what alerts you</p>
                  </div>
                </div>
                <button onClick={() => setBellOpen(false)} className="text-nw-500 hover:text-nw-300 transition-colors"><X size={14} /></button>
              </div>
              <div className="flex items-center justify-end gap-0 border-b border-[rgba(255,255,255,0.05)] px-5 py-2">
                <span className="w-[52px] text-center text-[9px] font-semibold uppercase tracking-[1px] text-nw-500">Desktop</span>
                <span className="w-[52px] text-center text-[9px] font-semibold uppercase tracking-[1px] text-nw-500">Mobile</span>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {NOTIFICATION_CHANNELS.map(({ key, label, desc, icon: Icon }) => {
                  const s = notifSettings[key] ?? { desktop: false, mobile: false }
                  return (
                    <div key={key} className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] px-5 py-3 last:border-0">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[7px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]">
                        <Icon size={14} className="text-nw-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-nw-200">{label}</p>
                        <p className="text-[10px] text-nw-500 leading-tight mt-0.5">{desc}</p>
                      </div>
                      <button onClick={() => toggleNotif(key, 'desktop')} className={`relative h-[18px] w-[32px] flex-shrink-0 rounded-full transition-colors ${s.desktop ? 'bg-gold-500' : 'bg-nw-600'}`}>
                        <div className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow transition-transform ${s.desktop ? 'translate-x-[17px]' : 'translate-x-[3px]'}`} />
                      </button>
                      <button onClick={() => toggleNotif(key, 'mobile')} className={`relative h-[18px] w-[32px] flex-shrink-0 rounded-full transition-colors ${s.mobile ? 'bg-gold-500' : 'bg-nw-600'}`}>
                        <div className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow transition-transform ${s.mobile ? 'translate-x-[17px]' : 'translate-x-[3px]'}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-[rgba(255,255,255,0.07)] px-5 py-3 flex items-center justify-between">
                <p className="text-[10px] text-nw-500">Settings saved locally</p>
                <button
                  onClick={async () => {
                    if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission()
                    setBellOpen(false)
                  }}
                  className="rounded-[7px] border border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] px-3 py-[4px] text-[11px] font-medium text-gold-300 transition-colors hover:bg-[rgba(212,160,23,0.22)]"
                >
                  Enable Push
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-white/8 mx-2" />

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className={`flex items-center gap-2.5 rounded-lg transition-all ${
              profileOpen
                ? 'bg-[rgba(255,255,255,0.06)]'
                : 'hover:bg-[rgba(255,255,255,0.04)]'
            }`}
            style={{ padding: '5px 10px 5px 5px' }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 30,
                height: 30,
                background: 'linear-gradient(135deg, #967705, #f2ca50)',
                fontSize: 11,
                fontWeight: 700,
                color: '#07090f',
                fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif',
              }}
            >
              {initials}
            </div>
            <span className="text-nw-200 text-[13px] font-medium hidden xl:inline max-w-[120px] truncate">
              {displayName}
            </span>
            <ChevronDown
              size={14}
              className={`text-nw-500 transition-transform hidden xl:block ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 z-50 w-[260px] overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.11)] bg-nw-750 shadow-xl"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            >
              {/* Profile header */}
              <div className="border-b border-[rgba(255,255,255,0.07)]" style={{ padding: '16px 18px' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      background: 'linear-gradient(135deg, #967705, #f2ca50)',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#07090f',
                      fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif',
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-nw-100 truncate">{displayName}</p>
                    <p className="text-[11px] text-nw-500 truncate">{staffProfile?.email || userEmail}</p>
                  </div>
                </div>
                <div className="mt-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      padding: '3px 8px',
                      background: staffProfile?.role === 'owner' ? 'rgba(212,160,23,0.12)' : staffProfile?.role === 'admin' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)',
                      color: staffProfile?.role === 'owner' ? '#f2ca50' : staffProfile?.role === 'admin' ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${staffProfile?.role === 'owner' ? 'rgba(212,160,23,0.25)' : staffProfile?.role === 'admin' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    <Shield size={10} />
                    {roleName}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px 8px' }}>
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-lg text-[13px] text-nw-300 no-underline transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-nw-100"
                  style={{ padding: '9px 10px' }}
                >
                  <Settings size={15} className="text-nw-500" />
                  Settings
                </Link>
                {(staffProfile?.role === 'owner' || staffProfile?.role === 'admin') && (
                  <Link
                    href="/staff"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-lg text-[13px] text-nw-300 no-underline transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-nw-100"
                    style={{ padding: '9px 10px' }}
                  >
                    <Users size={15} className="text-nw-500" />
                    Staff Management
                  </Link>
                )}
              </div>

              {/* Sign out */}
              <div className="border-t border-[rgba(255,255,255,0.07)]" style={{ padding: '6px 8px' }}>
                <button
                  onClick={() => { setProfileOpen(false); handleSignOut() }}
                  className="flex w-full items-center gap-3 rounded-lg text-[13px] text-red-400/80 transition-colors hover:bg-red-500/8 hover:text-red-400"
                  style={{ padding: '9px 10px' }}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
