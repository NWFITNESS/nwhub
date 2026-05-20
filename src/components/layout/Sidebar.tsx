'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { NWHubIcon } from '@/components/NWHubIcon'

// ── Colours ──────────────────────────────────────────────────────────────────

const DARK = {
  bg: '#0d1117', bg2: '#121820', border: 'rgba(255,255,255,0.06)',
  gold: '#d4b24a', goldBright: '#f5c842', goldDim: 'rgba(201,168,76,0.08)',
  goldBdr: 'rgba(201,168,76,0.18)', goldActive: 'rgba(201,168,76,0.12)',
  blue: '#3b82f6', text: '#edf3fb', muted: '#8296b4', dim: '#5e6e82',
  sub: '#6a80a8', hoverBg: 'rgba(255,255,255,0.04)',
  tooltipBg: '#121820', avatarBg: 'linear-gradient(135deg, #d4a017, #C9A70A)',
  avatarText: '#0d1117', userName: '#edf3fb', userRole: '#8296b4',
  sectionLabel: '#d4a017', badgeDotBorder: '#0d1117',
  toggleBg: '#121820', toggleBdr: '#1e2e48',
}

const LIGHT = {
  bg: '#ffffff', bg2: '#f7f8fc', border: 'rgba(0,0,0,0.06)',
  gold: '#b8870f', goldBright: '#c9a70a', goldDim: 'rgba(184,135,15,0.05)',
  goldBdr: 'rgba(184,135,15,0.15)', goldActive: 'rgba(184,135,15,0.08)',
  blue: '#2563eb', text: '#0f1623', muted: '#636d80', dim: '#9098a8',
  sub: '#636d80', hoverBg: 'rgba(0,0,0,0.03)',
  tooltipBg: '#ffffff', avatarBg: 'linear-gradient(135deg, #d4a017, #C9A70A)',
  avatarText: '#ffffff', userName: '#1c2536', userRole: '#636d80',
  sectionLabel: '#b8870f', badgeDotBorder: '#ffffff',
  toggleBg: '#f7f8fc', toggleBdr: '#e0e3e9',
}

function useThemeColors() {
  const [light, setLight] = useState(false)
  useEffect(() => {
    setLight(document.documentElement.classList.contains('nw-light'))
    const observer = new MutationObserver(() => setLight(document.documentElement.classList.contains('nw-light')))
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
  invoices: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="1" width="10" height="14" rx="1.5"/><path d="M6 5h4M6 8h4M6 11h2" strokeLinecap="round"/></svg>,
  seo: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="6.5" cy="6.5" r="4"/><path d="M10 10l4 4" strokeLinecap="round"/><path d="M2 12l3-4 2 2 3-4 3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  email: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>,
  branding: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2" strokeLinecap="round"/></svg>,
  ai: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 12V8a4 4 0 018 0v4" strokeLinecap="round"/><rect x="3" y="12" width="10" height="2" rx="1"/><circle cx="8" cy="5" r="1" fill="currentColor"/></svg>,
  blog: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></svg>,
  editor: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10.5 2.5l3 3M4 9l-1 4 4-1 7.5-7.5-3-3L4 9z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  media: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="2" width="14" height="12" rx="2"/><circle cx="5" cy="6" r="1.5"/><path d="M1 12l4-4 3 3 3-3 4 4"/></svg>,
  integrations: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 1v4M4.5 3l2 3M11.5 3l-2 3M8 11v4M4.5 13l2-3M11.5 13l-2-3" strokeLinecap="round"/><circle cx="8" cy="8" r="2.5"/></svg>,
  staff: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.5 2-4.5 5-4.5s5 2 5 4.5"/><circle cx="12" cy="5" r="1.5"/><path d="M15 12c0-1.5-1.2-2.8-3-2.8" strokeLinecap="round"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" strokeLinecap="round"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 7h12M5 1v4M11 1v4" strokeLinecap="round"/></svg>,
  kids: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="6" r="3"/><path d="M4 14c0-2.2 1.8-4 4-4s4 1.8 4 4"/><path d="M5 3c0-1 .5-2 3-2s3 1 3 2" strokeLinecap="round"/></svg>,
  popup: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M6 1v2M10 1v2" strokeLinecap="round"/><path d="M5 8h6M5 10.5h4" strokeLinecap="round"/></svg>,
  changelog: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="1" width="12" height="14" rx="2"/><path d="M5 5h6M5 8h4M5 11h5" strokeLinecap="round"/></svg>,
  chevron: <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M3 2l3.5 3L3 8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/></svg>,
  collapse: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2L4 6l4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  expand: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

// ── Nav structure — 4 clean sections ────────────────────────────────────────

interface NavEntry { key: string; label: string; icon: React.ReactNode; href?: string; badge?: 'unread'; tag?: string; sub?: { label: string; href: string }[]; permKey?: string }
interface NavSection { label: string; items: NavEntry[] }

function buildNav(unreadCount: number): NavSection[] {
  return [
    { label: 'Overview', items: [
      { key: 'overview', label: 'Dashboard', icon: I.overview, href: '/', permKey: 'overview' },
      { key: 'inbox', label: 'Inbox Intelligence', icon: I.inbox, href: '/inbox', badge: unreadCount > 0 ? 'unread' : undefined, permKey: 'inbox' },
      { key: 'calendar', label: 'Calendar', icon: I.calendar, href: '/calendar', permKey: 'contacts' },
    ]},
    { label: 'Business', items: [
      { key: 'members', label: 'Members', icon: I.members, permKey: 'contacts', sub: [
        { label: 'Member List', href: '/leads' },
        { label: 'Leads', href: '/leads/pipeline' },
        { label: 'Contacts', href: '/contacts' },
        { label: 'Enquiries', href: '/enquiries' },
        { label: 'KPIs', href: '/members/kpis' },
      ]},
      { key: 'financials', label: 'Financials', icon: I.financials, href: '/financials', permKey: 'financials' },
      { key: 'invoices', label: 'Invoice Vault', icon: I.invoices, href: '/invoices', permKey: 'invoices' },
      { key: 'kids', label: 'Kids & Teens', icon: I.kids, permKey: 'kids', sub: [
        { label: 'Dashboard', href: '/kids' },
        { label: 'Register', href: '/kids/register' },
      ]},
    ]},
    { label: 'Marketing', items: [
      { key: 'email', label: 'Campaigns', icon: I.email, permKey: 'email_campaigns', sub: [
        { label: 'All Campaigns', href: '/mailchimp' },
        { label: 'Create Campaign', href: '/mailchimp/create-ai' },
        { label: 'Subscribers', href: '/email' },
        { label: 'Import Subscribers', href: '/email/import' },
      ]},
      { key: 'popup', label: 'Website Popup', icon: I.popup, href: '/popup', permKey: 'email_campaigns' },
      { key: 'branding', label: 'Branding Studio', icon: I.branding, permKey: 'branding', sub: [
        { label: 'Post Studio', href: '/branding' },
        { label: 'Google Reviews', href: '/branding/reviews' },
        { label: 'Documents', href: '/branding/documents' },
        { label: 'Brand Assets', href: '/branding/brand-guide' },
      ]},
      { key: 'blog', label: 'Blog', icon: I.blog, href: '/blog/manage', permKey: 'blog' },
      { key: 'seo', label: 'SEO Engine', icon: I.seo, href: '/seo', permKey: 'seo' },
      { key: 'editor', label: 'Website Editor', icon: I.editor, href: '/content', permKey: 'content_editor' },
      { key: 'media', label: 'Media Library', icon: I.media, href: '/media', permKey: 'media' },
    ]},
    { label: 'System', items: [
      { key: 'ai-chat', label: 'AI Chat', icon: I.ai, href: '/ai-chat', tag: 'Bot', permKey: 'ai_chat' },
      { key: 'changelog', label: 'System Log', icon: I.changelog, href: '/changelog', permKey: 'settings' },
      { key: 'staff', label: 'Staff', icon: I.staff, href: '/staff', permKey: 'staff_management' },
      { key: 'integrations', label: 'Integrations', icon: I.integrations, href: '/sync', permKey: 'integrations' },
      { key: 'settings', label: 'Settings', icon: I.settings, href: '/settings', permKey: 'settings' },
    ]},
  ]
}

// ── Props & Component ───────────────────────────────────────────────────────

interface SidebarProps { onToggle?: () => void; onNavigate?: () => void; userEmail?: string; unreadCount?: number; staffProfile?: import('@/lib/staff').StaffProfile | null }

export function Sidebar({ onToggle, onNavigate, userEmail, unreadCount = 0, staffProfile }: SidebarProps) {
  const pathname = usePathname()
  const isMobile = !!onToggle
  const C = useThemeColors()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined' || isMobile) return false
    return localStorage.getItem('nwhub_sidebar_collapsed') === 'true'
  })
  const [openSections, setOpenSections] = useState<string[]>(() => {
    const auto: string[] = []
    if (pathname.startsWith('/leads') || pathname.startsWith('/members') || pathname.startsWith('/calendar') || pathname.startsWith('/contacts') || pathname.startsWith('/enquiries')) auto.push('members')
    if (pathname.startsWith('/email') || pathname.startsWith('/mailchimp')) auto.push('email')
    if (pathname.startsWith('/branding')) auto.push('branding')
    if (pathname.startsWith('/kids')) auto.push('kids')
    return auto
  })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const isOpen = isMobile ? true : !collapsed

  function toggleCollapse() { const next = !collapsed; setCollapsed(next); localStorage.setItem('nwhub_sidebar_collapsed', String(next)) }
  function toggleSection(key: string) { setOpenSections(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]) }
  function isActive(href: string) { if (href === '/') return pathname === '/'; return pathname.startsWith(href) }
  function isParentActive(entry: NavEntry) { if (entry.href && isActive(entry.href)) return true; return entry.sub?.some(s => isActive(s.href)) ?? false }
  function showTooltip(e: React.MouseEvent, label: string) { if (isOpen || !tooltipRef.current) return; const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); tooltipRef.current.style.top = `${rect.top + rect.height / 2}px`; tooltipRef.current.style.left = '70px'; tooltipRef.current.style.opacity = '1'; tooltipRef.current.textContent = label }
  function hideTooltip() { if (tooltipRef.current) tooltipRef.current.style.opacity = '0' }

  useEffect(() => {
    const auto: string[] = []
    if (pathname.startsWith('/leads') || pathname.startsWith('/members') || pathname.startsWith('/calendar') || pathname.startsWith('/contacts') || pathname.startsWith('/enquiries')) auto.push('members')
    if (pathname.startsWith('/email') || pathname.startsWith('/mailchimp')) auto.push('email')
    if (pathname.startsWith('/branding')) auto.push('branding')
    if (pathname.startsWith('/kids')) auto.push('kids')
    if (auto.length) setOpenSections(prev => [...new Set([...prev, ...auto])])
  }, [pathname])

  const rawNav = buildNav(unreadCount)
  const isFullAccess = !staffProfile || staffProfile.role === 'owner' || staffProfile.role === 'admin'
  const nav = isFullAccess ? rawNav : rawNav.map(section => ({ ...section, items: section.items.filter(entry => !entry.permKey || (staffProfile.permissions as unknown as Record<string, boolean>)[entry.permKey]) })).filter(section => section.items.length > 0)

  const sidebarWidth = isMobile ? 260 : (collapsed ? 64 : 248)
  const displayName = staffProfile?.display_name || userEmail?.split('@')[0] || 'User'
  const roleLabel = staffProfile?.role ? staffProfile.role.charAt(0).toUpperCase() + staffProfile.role.slice(1) : ''
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      {!isMobile && <div ref={tooltipRef} style={{ position: 'fixed', background: C.tooltipBg, border: `1px solid ${C.goldBdr}`, borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 500, color: C.gold, whiteSpace: 'nowrap', pointerEvents: 'none', opacity: 0, zIndex: 999, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'opacity 0.12s', transform: 'translateY(-50%)' }} />}

      <aside className={isMobile ? 'flex' : 'hidden md:flex'} style={{ width: sidebarWidth, minWidth: sidebarWidth, height: '100%', background: C.bg, borderRight: `1px solid ${C.border}`, flexDirection: 'column', position: 'relative', flexShrink: 0, overflow: 'hidden', transition: 'width 250ms cubic-bezier(0.4,0,0.2,1), min-width 250ms cubic-bezier(0.4,0,0.2,1)', zIndex: 20 }}>

        {/* Toggle */}
        {!isMobile && <button onClick={toggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} style={{ position: 'absolute', top: 24, right: -12, width: 24, height: 24, background: C.toggleBg, border: `1px solid ${C.toggleBdr}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: C.gold }}>{collapsed ? I.expand : I.collapse}</button>}

        {/* Logo + Welcome */}
        <div style={{ borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ padding: isOpen ? '16px 16px 0' : '16px 0 0', display: 'flex', alignItems: 'center', gap: 10, justifyContent: isOpen ? 'flex-start' : 'center', minHeight: 48 }}>
            <NWHubIcon size={isOpen ? 36 : 30} animated />
            {isOpen && <div><p style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '0.5px' }}>Northern Warrior</p><p style={{ fontSize: 10, color: C.sectionLabel, letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.7 }}>HUB</p></div>}
            {isMobile && onToggle && <button onClick={onToggle} aria-label="Close sidebar" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 2 }}>{I.close}</button>}
          </div>
          {isOpen && (
            <div style={{ padding: '14px 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.avatarText, flexShrink: 0 }}>
                {staffProfile?.avatar_url ? <img src={staffProfile.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.userName, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                {roleLabel && <p style={{ fontSize: 11, color: C.userRole }}>{roleLabel}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="nwhub-nav" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isOpen ? '8px 8px 4px' : '8px 0 4px' }}>
          {nav.map((section, sIdx) => (
            <div key={section.label}>
              {isOpen ? (
                <p style={{ fontSize: 12, fontWeight: 600, color: C.sectionLabel, padding: sIdx === 0 ? '4px 10px 8px' : '16px 10px 8px', letterSpacing: '0.3px' }}>{section.label}</p>
              ) : (
                sIdx > 0 && <div style={{ width: 28, height: 1, background: C.border, margin: '10px auto 6px' }} />
              )}
              {section.items.map(entry => (
                <NavItem key={entry.key} entry={entry} isOpen={isOpen} isActive={isActive} isParentActive={isParentActive} openSections={openSections} toggleSection={toggleSection} onNavigate={onNavigate} showTooltip={showTooltip} hideTooltip={hideTooltip} unreadCount={unreadCount} collapsed={collapsed && !isMobile} C={C} />
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          {isOpen ? (
            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}><NWHubIcon size={16} animated={false} /><span style={{ fontSize: 9, color: C.dim, letterSpacing: '2px', textTransform: 'uppercase' }}>NW &middot; HUB</span></div>
          ) : (
            <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center' }}><NWHubIcon size={16} animated={false} /></div>
          )}
        </div>
      </aside>
    </>
  )
}

// ── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ entry, isOpen, isActive, isParentActive, openSections, toggleSection, onNavigate, showTooltip, hideTooltip, unreadCount, collapsed, C }: {
  entry: NavEntry; isOpen: boolean; isActive: (h: string) => boolean; isParentActive: (e: NavEntry) => boolean
  openSections: string[]; toggleSection: (k: string) => void; onNavigate?: () => void
  showTooltip: (e: React.MouseEvent, l: string) => void; hideTooltip: () => void
  unreadCount: number; collapsed: boolean; C: typeof DARK
}) {
  const hasSub = !!(entry.sub?.length)
  const active = isParentActive(entry)
  const subOpen = openSections.includes(entry.key)

  const baseStyle: React.CSSProperties = {
    padding: isOpen ? '0 10px' : '0', display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 500,
    color: active ? C.gold : C.muted, position: 'relative',
    transition: 'background 0.15s, color 0.15s', textDecoration: 'none',
    background: active ? C.goldActive : 'transparent', borderRadius: 10,
    height: isOpen ? 42 : 40, justifyContent: isOpen ? 'flex-start' : 'center',
    margin: isOpen ? '2px 0' : '3px auto', width: isOpen ? undefined : 40,
  }

  const events = {
    onMouseEnter: (e: React.MouseEvent) => { if (!active) (e.currentTarget as HTMLElement).style.background = C.hoverBg; showTooltip(e, entry.label) },
    onMouseLeave: (e: React.MouseEvent) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; hideTooltip() },
  }

  const activeBar = active && isOpen && <div style={{ position: 'absolute', left: 0, top: '25%', height: '50%', width: 3, background: C.gold, borderRadius: 2 }} />
  const badge = entry.badge === 'unread' && unreadCount > 0 && (
    isOpen
      ? <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, marginLeft: 'auto', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>{unreadCount}</span>
      : <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: C.blue, borderRadius: '50%', border: `1.5px solid ${C.badgeDotBorder}` }} />
  )
  const tag = entry.tag && isOpen && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, marginLeft: 4, background: 'rgba(201,168,76,0.1)', color: C.gold, border: `1px solid ${C.goldBdr}` }}>{entry.tag}</span>

  const handleClick = () => { if (hasSub) { toggleSection(entry.key); return }; onNavigate?.() }
  const iconEl = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }} aria-hidden="true">{entry.icon}</div>

  const content = <>{activeBar}{iconEl}{isOpen && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>{entry.label}{tag}</span>}{isOpen && badge}{!isOpen && badge}{isOpen && hasSub && <span style={{ color: C.dim, transition: 'transform 200ms', transform: subOpen ? 'rotate(90deg)' : 'rotate(0)', display: 'flex', marginLeft: 'auto' }}>{I.chevron}</span>}</>

  return (
    <div>
      {entry.href && !hasSub
        ? <Link href={entry.href} onClick={handleClick} style={baseStyle} {...events}>{content}</Link>
        : <div onClick={handleClick} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }} style={baseStyle} {...events}>{content}</div>
      }
      {hasSub && isOpen && (
        <div style={{ maxHeight: subOpen ? 300 : 0, overflow: 'hidden', transition: 'max-height 200ms cubic-bezier(0.4,0,0.2,1)', marginLeft: 20, paddingLeft: 12, borderLeft: `1px solid ${C.border}`, marginBottom: 2 }}>
          {entry.sub!.map(sub => {
            const subActive = isActive(sub.href)
            return <Link key={sub.href} href={sub.href} onClick={onNavigate} style={{ padding: '8px 12px', fontSize: 13, fontWeight: subActive ? 600 : 450, color: subActive ? C.gold : C.sub, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', transition: 'color 0.15s, background 0.15s', background: subActive ? C.goldDim : 'transparent' }} onMouseEnter={e => { if (!subActive) (e.currentTarget as HTMLElement).style.color = C.muted }} onMouseLeave={e => { if (!subActive) (e.currentTarget as HTMLElement).style.color = C.sub }}>{sub.label}</Link>
          })}
        </div>
      )}
    </div>
  )
}
