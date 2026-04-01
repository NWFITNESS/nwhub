'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NWHubIcon } from '@/components/NWHubIcon'

// ── Colours ──────────────────────────────────────────────────────────────────

const DARK = {
  bg:       '#07090f',
  bg2:      '#0a0d16',
  border:   '#111825',
  gold:     '#c9a84c',
  goldBright: '#f5c842',
  goldDim:  'rgba(201,168,76,0.08)',
  goldBdr:  'rgba(201,168,76,0.2)',
  blue:     '#3b82f6',
  text:     '#ffffff',
  muted:    '#4a6080',
  dim:      '#1e2e48',
  sub:      '#3a5070',
  hoverBg:  'rgba(255,255,255,0.03)',
  hoverBdr: 'rgba(201,168,76,0.3)',
  tooltipBg: '#0e1628',
  avatarText: '#07090f',
  userName:  '#d0d8e8',
  glowShadow: '0 0 8px 2px rgba(201,168,76,0.5), 0 0 16px 3px rgba(201,168,76,0.18)',
  subGroupRule: '#0f1828',
  subGroupLabel: '#2a3d58',
  toggleBg: '#0e1628',
  toggleBdr: '#1a2840',
  badgeDotBorder: '#07090f',
}

const LIGHT = {
  bg:       '#f8f9fb',
  bg2:      '#f0f2f5',
  border:   '#e2e5ea',
  gold:     '#b8870f',
  goldBright: '#d4a017',
  goldDim:  'rgba(184,135,15,0.06)',
  goldBdr:  'rgba(184,135,15,0.18)',
  blue:     '#2563eb',
  text:     '#111827',
  muted:    '#6b7280',
  dim:      '#9ca3af',
  sub:      '#6b7280',
  hoverBg:  'rgba(0,0,0,0.03)',
  hoverBdr: 'rgba(184,135,15,0.35)',
  tooltipBg: '#ffffff',
  avatarText: '#ffffff',
  userName:  '#1f2937',
  glowShadow: '0 0 6px 1px rgba(184,135,15,0.35), 0 0 12px 2px rgba(184,135,15,0.12)',
  subGroupRule: '#e2e5ea',
  subGroupLabel: '#9ca3af',
  toggleBg: '#ffffff',
  toggleBdr: '#d1d5db',
  badgeDotBorder: '#f8f9fb',
}

function useThemeColors() {
  const [light, setLight] = useState(false)
  useEffect(() => {
    setLight(document.documentElement.classList.contains('nw-light'))
    const observer = new MutationObserver(() => {
      setLight(document.documentElement.classList.contains('nw-light'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return light ? LIGHT : DARK
}

// ── Icons (18px, strokeWidth 1.7) ────────────────────────────────────────────

const I = {
  overview: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
  inbox: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5"/></svg>,
  members: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>,
  financials: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="1" width="14" height="14" rx="2"/></svg>,
  email: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>,
  branding: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2" strokeLinecap="round"/></svg>,
  ai: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 12V8a4 4 0 018 0v4" strokeLinecap="round"/><rect x="3" y="12" width="10" height="2" rx="1"/><circle cx="8" cy="5" r="1" fill="currentColor"/></svg>,
  blog: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></svg>,
  editor: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10.5 2.5l3 3M4 9l-1 4 4-1 7.5-7.5-3-3L4 9z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  media: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="2" width="14" height="12" rx="2"/><circle cx="5" cy="6" r="1.5"/><path d="M1 12l4-4 3 3 3-3 4 4"/></svg>,
  integrations: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 1v4M4.5 3l2 3M11.5 3l-2 3M8 11v4M4.5 13l2-3M11.5 13l-2-3" strokeLinecap="round"/><circle cx="8" cy="8" r="2.5"/></svg>,
  workflows: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 4h5l2 2h5M2 8h12M2 12h5l2-2h5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" strokeLinecap="round"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 7h12M5 1v4M11 1v4" strokeLinecap="round"/></svg>,
  kids: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="6" r="3"/><path d="M4 14c0-2.2 1.8-4 4-4s4 1.8 4 4"/><path d="M5 3c0-1 .5-2 3-2s3 1 3 2" strokeLinecap="round"/></svg>,
  chevron: <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M3 2l3.5 3L3 8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  signout: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10 8H2M6 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 2h7a1 1 0 011 1v10a1 1 0 01-1 1H6" strokeLinecap="round"/></svg>,
  close: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/></svg>,
  collapse: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2L4 6l4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  expand: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

// ── Nav structure ────────────────────────────────────────────────────────────

interface NavEntry {
  key: string
  label: string
  icon: React.ReactNode
  href?: string
  badge?: 'unread'
  tag?: string
  sub?: { label: string; href: string }[]
}

interface NavSection {
  label: string
  items: NavEntry[]
  subGroup?: { label: string; items: NavEntry[] }
}

function buildNav(unreadCount: number): NavSection[] {
  return [
    {
      label: 'MAIN',
      items: [
        { key: 'overview', label: 'Overview', icon: I.overview, href: '/' },
        { key: 'inbox', label: 'Inbox Intelligence', icon: I.inbox, href: '/inbox', badge: unreadCount > 0 ? 'unread' : undefined },
        { key: 'members', label: 'Members', icon: I.members, sub: [
          { label: 'Member List', href: '/leads' },
          { label: 'Leads', href: '/leads/pipeline' },
          { label: 'KPIs', href: '/members/kpis' },
          { label: 'Calendar', href: '/calendar' },
          { label: 'Kids & Teens', href: '/kids' },
        ]},
        { key: 'financials', label: 'Financials', icon: I.financials, href: '/financials' },
      ],
    },
    {
      label: 'MARKETING',
      items: [
        { key: 'email', label: 'Email Campaigns', icon: I.email, sub: [
          { label: 'All Campaigns', href: '/email/campaigns' },
          { label: 'Subscribers', href: '/email' },
          { label: 'Import Subscribers', href: '/email/import' },
          { label: 'AI Email Creator', href: '/mailchimp/create-ai' },
        ]},
        { key: 'branding', label: 'Branding Studio', icon: I.branding, sub: [
          { label: 'Post Studio', href: '/branding' },
          { label: 'Documents', href: '/branding/documents' },
          { label: 'Brand Assets', href: '/branding/brand-guide' },
        ]},
      ],
    },
    {
      label: 'AI',
      items: [
        { key: 'ai-chat', label: 'AI Chat', icon: I.ai, href: '/ai-chat', tag: 'Bot' },
      ],
    },
    {
      label: 'CONTENT',
      items: [
        { key: 'blog', label: 'Blog', icon: I.blog, href: '/blog/manage' },
        { key: 'editor', label: 'Website Editor', icon: I.editor, href: '/content' },
        { key: 'media', label: 'Media Library', icon: I.media, href: '/media' },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { key: 'integrations', label: 'Integrations', icon: I.integrations, href: '/sync' },
        { key: 'workflows', label: 'Workflows', icon: I.workflows, href: '/workflows' },
        { key: 'settings', label: 'Settings', icon: I.settings, href: '/settings' },
      ],
    },
  ]
}

// ── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  onToggle?: () => void
  onNavigate?: () => void
  userEmail?: string
  unreadCount?: number
}

// ── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ onToggle, onNavigate, userEmail, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isMobile = !!onToggle
  const C = useThemeColors()

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined' || isMobile) return false
    return localStorage.getItem('nwhub_sidebar_collapsed') === 'true'
  })

  const [openSections, setOpenSections] = useState<string[]>(() => {
    const auto: string[] = []
    if (pathname.startsWith('/leads') || pathname.startsWith('/members') || pathname.startsWith('/calendar') || pathname.startsWith('/kids')) auto.push('members')
    if (pathname.startsWith('/email') || pathname.startsWith('/mailchimp')) auto.push('email')
    if (pathname.startsWith('/branding')) auto.push('branding')
    return auto
  })

  const tooltipRef = useRef<HTMLDivElement>(null)
  const isOpen = isMobile ? true : !collapsed

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('nwhub_sidebar_collapsed', String(next))
  }

  function toggleSection(key: string) {
    setOpenSections(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  function isParentActive(entry: NavEntry) {
    if (entry.href && isActive(entry.href)) return true
    return entry.sub?.some(s => isActive(s.href)) ?? false
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function showTooltip(e: React.MouseEvent, label: string) {
    if (isOpen || !tooltipRef.current) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    tooltipRef.current.style.top = `${rect.top + rect.height / 2}px`
    tooltipRef.current.style.left = '62px'
    tooltipRef.current.style.opacity = '1'
    tooltipRef.current.textContent = label
  }

  function hideTooltip() {
    if (tooltipRef.current) tooltipRef.current.style.opacity = '0'
  }

  useEffect(() => {
    // Auto-expand sections containing active route
    const auto: string[] = []
    if (pathname.startsWith('/leads') || pathname.startsWith('/members') || pathname.startsWith('/calendar') || pathname.startsWith('/kids')) auto.push('members')
    if (pathname.startsWith('/email') || pathname.startsWith('/mailchimp')) auto.push('email')
    if (pathname.startsWith('/branding')) auto.push('branding')
    if (auto.length) setOpenSections(prev => [...new Set([...prev, ...auto])])
  }, [pathname])

  const nav = buildNav(unreadCount)
  const initials = userEmail ? userEmail.split('@')[0].slice(0, 2).toUpperCase() : 'NW'
  const displayName = userEmail ? userEmail.split('@')[0] : 'Admin'

  const sidebarWidth = isMobile ? 242 : (collapsed ? 56 : 232)

  return (
    <>
      {/* Tooltip (collapsed only) */}
      {!isMobile && (
        <div ref={tooltipRef} style={{
          position: 'fixed', background: C.tooltipBg, border: `1px solid ${C.goldBdr}`,
          borderRadius: 6, padding: '4px 10px', fontSize: 12, color: C.gold,
          whiteSpace: 'nowrap', pointerEvents: 'none', opacity: 0, zIndex: 999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'opacity 0.12s',
          transform: 'translateY(-50%)',
        }} />
      )}

      <aside
        onMouseEnter={undefined}
        onMouseLeave={undefined}
        className={isMobile ? 'flex' : 'hidden md:flex'}
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: '100%',
          background: C.bg,
          borderRight: `1px solid ${C.border}`,
          flexDirection: 'column',
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 250ms cubic-bezier(0.4,0,0.2,1), min-width 250ms cubic-bezier(0.4,0,0.2,1)',
          zIndex: 20,
        }}
      >
        {/* Toggle button */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            style={{
              position: 'absolute', top: 22, right: -12, width: 24, height: 24,
              background: C.toggleBg, border: `1px solid ${C.toggleBdr}`, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10, color: C.gold,
            }}
          >
            {collapsed ? I.expand : I.collapse}
          </button>
        )}

        {/* Logo */}
        <div style={{
          padding: isOpen ? '16px 14px 12px' : '14px 0 12px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: isOpen ? 'flex-start' : 'center',
          flexShrink: 0, minHeight: 64,
        }}>
          <NWHubIcon size={isOpen ? 36 : 32} animated />
          {isOpen && (
            <div style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 200ms' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: '1px', textTransform: 'uppercase' }}>Northern Warrior</p>
              <p style={{ fontSize: 9, color: 'rgba(201,168,76,0.55)', letterSpacing: '2px', textTransform: 'uppercase' }}>NWHub</p>
            </div>
          )}
          {isMobile && onToggle && (
            <button onClick={onToggle} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 2 }}>
              {I.close}
            </button>
          )}
        </div>

        {/* Nav scroll area */}
        <div className="nwhub-nav" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 4 }}>
          {nav.map((section) => (
            <div key={section.label}>
              {/* Section label */}
              {isOpen ? (
                <p style={{ fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: '3px', textTransform: 'uppercase', padding: '14px 16px 5px' }}>
                  {section.label}
                </p>
              ) : (
                <div style={{ width: 24, height: 1, background: C.border, margin: '8px auto 4px' }} />
              )}

              {/* Items */}
              {section.items.map(entry => (
                <NavItem key={entry.key} entry={entry} isOpen={isOpen} isActive={isActive} isParentActive={isParentActive} openSections={openSections} toggleSection={toggleSection} onNavigate={onNavigate} showTooltip={showTooltip} hideTooltip={hideTooltip} unreadCount={unreadCount} collapsed={collapsed && !isMobile} C={C} />
              ))}

              {/* Sub-group */}
              {section.subGroup && (
                <>
                  {isOpen && (
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.subGroupLabel, letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 16px 3px 28px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {section.subGroup.label}
                      <div style={{ flex: 1, height: 1, background: C.subGroupRule, marginLeft: 4 }} />
                    </div>
                  )}
                  {section.subGroup.items.map(entry => (
                    <NavItem key={entry.key} entry={entry} isOpen={isOpen} isActive={isActive} isParentActive={isParentActive} openSections={openSections} toggleSection={toggleSection} onNavigate={onNavigate} showTooltip={showTooltip} hideTooltip={hideTooltip} unreadCount={unreadCount} collapsed={collapsed && !isMobile} C={C} indented />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          {/* Icon showcase */}
          {isOpen ? (
            <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <NWHubIcon size={20} animated={false} />
              <NWHubIcon size={16} animated={false} />
              <NWHubIcon size={12} animated={false} />
              <span style={{ marginLeft: 'auto', fontSize: 9, color: C.dim, letterSpacing: '2px', textTransform: 'uppercase' }}>NW · HUB</span>
            </div>
          ) : (
            <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
              <NWHubIcon size={16} animated={false} />
            </div>
          )}

          {/* User + sign out */}
          <div style={{ padding: isOpen ? '8px 12px 10px' : '8px 0 10px', display: 'flex', alignItems: 'center', gap: 9, justifyContent: isOpen ? 'flex-start' : 'center', borderTop: `1px solid ${C.border}` }}>
            <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldBright})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.avatarText, fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif' }}>
              {initials}
            </div>
            {isOpen && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.userName, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Administrator</div>
                </div>
                <button onClick={handleSignOut} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 2 }}>
                  {I.signout}
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

// ── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ entry, isOpen, isActive, isParentActive, openSections, toggleSection, onNavigate, showTooltip, hideTooltip, unreadCount, collapsed, indented, C }: {
  entry: NavEntry; isOpen: boolean; isActive: (h: string) => boolean; isParentActive: (e: NavEntry) => boolean
  openSections: string[]; toggleSection: (k: string) => void; onNavigate?: () => void
  showTooltip: (e: React.MouseEvent, l: string) => void; hideTooltip: () => void
  unreadCount: number; collapsed: boolean; indented?: boolean; C: typeof DARK
}) {
  const hasSub = !!(entry.sub?.length)
  const active = isParentActive(entry)
  const subOpen = openSections.includes(entry.key)

  const baseStyle: React.CSSProperties = {
    padding: isOpen ? `8px ${indented ? '14px' : '14px'} 8px ${indented ? '26px' : '14px'}` : '0',
    display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', fontSize: 13, color: active ? C.gold : C.muted,
    position: 'relative', borderRight: `2px solid ${active ? C.gold : 'transparent'}`,
    transition: 'background 0.15s, border-color 0.2s, color 0.15s',
    textDecoration: 'none', background: active ? C.goldDim : 'transparent',
    minHeight: isOpen ? undefined : 36,
    justifyContent: isOpen ? 'flex-start' : 'center',
    margin: isOpen ? '1px 0' : '2px auto',
    width: isOpen ? undefined : 36, height: isOpen ? undefined : 36,
    borderRadius: isOpen ? 0 : 8,
  }

  const events = {
    onMouseEnter: (e: React.MouseEvent) => {
      if (!active) {
        (e.currentTarget as HTMLElement).style.background = C.hoverBg;
        (e.currentTarget as HTMLElement).style.borderRightColor = C.hoverBdr
      }
      showTooltip(e, entry.label)
    },
    onMouseLeave: (e: React.MouseEvent) => {
      if (!active) {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.borderRightColor = 'transparent'
      }
      hideTooltip()
    },
  }

  // Gold glow bar
  const glowBar = active && (
    <div style={{ position: 'absolute', right: -2, top: '20%', height: '60%', width: 2, background: C.gold, boxShadow: C.glowShadow, borderRadius: 2 }} />
  )

  // Badge
  const badge = entry.badge === 'unread' && unreadCount > 0 && (
    isOpen ? (
      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, marginLeft: 'auto', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
        {unreadCount}
      </span>
    ) : (
      <div style={{ position: 'absolute', top: 5, right: 4, width: 7, height: 7, background: C.blue, borderRadius: '50%', border: `1.5px solid ${C.badgeDotBorder}` }} />
    )
  )

  // Tag
  const tag = entry.tag && isOpen && (
    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, marginLeft: 4, background: 'rgba(201,168,76,0.12)', color: C.gold, border: `1px solid ${C.goldBdr}` }}>
      {entry.tag}
    </span>
  )

  const handleClick = () => {
    if (hasSub) { toggleSection(entry.key); return }
    onNavigate?.()
  }

  const iconEl = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>{entry.icon}</div>

  const content = (
    <>
      {glowBar}
      {iconEl}
      {isOpen && (
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'opacity 200ms', display: 'flex', alignItems: 'center' }}>
          {entry.label}{tag}
        </span>
      )}
      {isOpen && badge}
      {!isOpen && badge}
      {isOpen && hasSub && (
        <span style={{ color: C.muted, transition: 'transform 200ms', transform: subOpen ? 'rotate(90deg)' : 'rotate(0)', display: 'flex', marginLeft: 'auto' }}>
          {I.chevron}
        </span>
      )}
    </>
  )

  return (
    <div>
      {entry.href && !hasSub ? (
        <Link href={entry.href} onClick={handleClick} style={baseStyle} {...events}>{content}</Link>
      ) : (
        <div onClick={handleClick} style={baseStyle} {...events}>{content}</div>
      )}

      {/* Sub-items */}
      {hasSub && isOpen && (
        <div style={{
          maxHeight: subOpen ? 200 : 0, overflow: 'hidden',
          transition: 'max-height 200ms cubic-bezier(0.4,0,0.2,1)',
          marginLeft: 12, paddingLeft: 10, borderLeft: `1px solid ${C.border}`, marginBottom: 2,
        }}>
          {entry.sub!.map(sub => {
            const subActive = isActive(sub.href)
            return (
              <Link key={sub.href} href={sub.href} onClick={onNavigate} style={{
                padding: '6px 12px', fontSize: 12, color: subActive ? C.gold : C.sub,
                borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
                textDecoration: 'none', transition: 'color 0.15s, background 0.15s',
                background: subActive ? C.goldDim : 'transparent',
              }}
                onMouseEnter={e => { if (!subActive) (e.currentTarget as HTMLElement).style.color = '#8a9ab8' }}
                onMouseLeave={e => { if (!subActive) (e.currentTarget as HTMLElement).style.color = C.sub }}
              >
                {sub.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
