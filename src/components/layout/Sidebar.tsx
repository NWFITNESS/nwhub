'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Nav structure ─────────────────────────────────────────────────────────────

interface SubItem {
  label: string
  href: string
}

interface NavItem {
  key: string
  label: string
  href?: string
  icon: React.ReactNode
  badge?: number
  sub?: SubItem[]
}

const Icons = {
  overview: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  ),
  inbox: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="1" y="3" width="14" height="10" rx="2"/>
      <path d="M1 5l7 5 7-5"/>
    </svg>
  ),
  financials: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="1" y="1" width="14" height="14" rx="2"/>
    </svg>
  ),
  engagement: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="8" cy="5" r="3"/>
      <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/>
    </svg>
  ),
  content: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="2" y="2" width="12" height="12" rx="2"/>
      <path d="M5 6h6M5 9h4"/>
    </svg>
  ),
  system: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" strokeLinecap="round"/>
    </svg>
  ),
  chevron: (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M3 2l3.5 3L3 8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  signout: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M10 8H2M6 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 2h7a1 1 0 011 1v10a1 1 0 01-1 1H6" strokeLinecap="round"/>
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
    </svg>
  ),
}

const SPEED = '0.26s'
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

const MAIN_ITEMS: NavItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    href: '/',
    icon: Icons.overview,
  },
  {
    key: 'inbox',
    label: 'Inbox Intelligence',
    href: '/inbox',
    icon: Icons.inbox,
    sub: [
      { label: 'All Enquiries', href: '/enquiries' },
      { label: 'AI Chat Logs', href: '/ai-chat' },
      { label: 'Contacts', href: '/contacts' },
    ],
  },
  {
    key: 'financials',
    label: 'Financials',
    href: '/financials',
    icon: Icons.financials,
    sub: [
      { label: 'Revenue Overview', href: '/financials' },
      { label: 'Membership Billing', href: '/kids' },
    ],
  },
  {
    key: 'engagement',
    label: 'Engagement',
    icon: Icons.engagement,
    sub: [
      { label: 'Members', href: '/contacts' },
      { label: 'Subscribers', href: '/email' },
      { label: 'Kids & Teens', href: '/kids' },
    ],
  },
]

const PLATFORM_ITEMS: NavItem[] = [
  {
    key: 'content',
    label: 'Content',
    icon: Icons.content,
    sub: [
      { label: 'Blog & Posts', href: '/blog/manage' },
      { label: 'Email Campaigns', href: '/mailchimp' },
      { label: 'Website Editor', href: '/content' },
      { label: 'Media Library', href: '/media' },
      { label: 'Branding Studio', href: '/branding' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    icon: Icons.system,
    sub: [
      { label: 'Integrations', href: '/sync' },
      { label: 'Settings', href: '/settings' },
      { label: 'Workflows', href: '/workflows' },
    ],
  },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  onToggle?: () => void
  onNavigate?: () => void
  userEmail?: string
  unreadCount?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({ onToggle, onNavigate, userEmail, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isMobile = !!onToggle

  const [expanded, setExpanded] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [openSub, setOpenSub] = useState<string | null>(() => {
    const all = [...MAIN_ITEMS, ...PLATFORM_ITEMS]
    const active = all.find(item =>
      item.sub?.some(s => s.href !== '/' && pathname.startsWith(s.href))
    )
    return active?.key ?? null
  })

  const [pullGone, setPullGone] = useState(false)
  useEffect(() => {
    setPullGone(localStorage.getItem('nw-pull-gone') === '1')
  }, [])

  const tooltipRef = useRef<HTMLDivElement>(null)
  const isOpen = isMobile ? true : expanded

  function handleMouseEnter() {
    clearTimeout(closeTimerRef.current)
    setExpanded(true)
    if (!pullGone) {
      setPullGone(true)
      localStorage.setItem('nw-pull-gone', '1')
    }
  }

  function handleMouseLeave() {
    closeTimerRef.current = setTimeout(() => setExpanded(false), 180)
  }

  function toggleSub(key: string) {
    setOpenSub(prev => prev === key ? null : key)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isItemActive(item: NavItem): boolean {
    if (item.href) {
      return item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
    }
    return item.sub?.some(s => pathname.startsWith(s.href)) ?? false
  }

  function isSubActive(href: string): boolean {
    return pathname.startsWith(href)
  }

  function showTooltip(e: React.MouseEvent, label: string) {
    if (isOpen) return
    const el = tooltipRef.current
    if (!el) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    el.style.top = `${rect.top + rect.height / 2}px`
    el.style.left = `68px`
    el.style.opacity = '1'
    el.textContent = label
  }

  function hideTooltip() {
    if (tooltipRef.current) tooltipRef.current.style.opacity = '0'
  }

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  const initials = userEmail
    ? userEmail.split('@')[0].slice(0, 2).toUpperCase()
    : 'NW'
  const displayName = userEmail ? userEmail.split('@')[0] : 'Admin'

  const brand = 'var(--font-rajdhani), Rajdhani, sans-serif'

  return (
    <>
      {/* Floating tooltip */}
      {!isMobile && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            background: 'var(--slate-750)',
            border: '1px solid var(--slate-600)',
            color: 'var(--slate-200)',
            fontSize: 12,
            padding: '5px 10px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: 0,
            zIndex: 999,
            boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
            transition: 'opacity 0.12s',
            transform: 'translateY(-50%)',
          }}
        />
      )}

      <nav
        onMouseEnter={isMobile ? undefined : handleMouseEnter}
        onMouseLeave={isMobile ? undefined : handleMouseLeave}
        style={{
          width: isMobile ? 228 : (isOpen ? 228 : 58),
          transition: isMobile ? 'none' : `width ${SPEED} ${EASE}`,
          background: 'var(--slate-950)',
          borderRight: '1px solid rgba(212, 160, 23, 0.18)',
          boxShadow: '4px 0 32px rgba(212, 160, 23, 0.08), 2px 0 8px rgba(212, 160, 23, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* Pull hint */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              right: -22,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(212,160,23,0.13)',
              border: '1px solid rgba(212,160,23,0.28)',
              borderLeft: 'none',
              borderRadius: '0 7px 7px 0',
              padding: '10px 7px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              color: 'var(--r-gold-400)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              writingMode: 'vertical-rl',
              pointerEvents: 'none',
              opacity: pullGone || isOpen ? 0 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 2l4 3-4 3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Hover
          </div>
        )}

        {/* Logo row */}
        <div style={{
          height: 54, minHeight: 54,
          borderBottom: '1px solid var(--r-panel-border)',
          display: 'flex', alignItems: 'center',
          padding: '0 13px', gap: 11,
          overflow: 'hidden', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <div style={{
            width: 32, minWidth: 32, height: 32,
            background: 'linear-gradient(140deg, var(--r-gold-500) 0%, var(--r-gold-300) 100%)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: brand, fontWeight: 700, fontSize: 14,
            color: 'var(--slate-950)', letterSpacing: '0.5px', flexShrink: 0,
          }}>NW</div>

          <div style={{
            opacity: isOpen ? 1 : 0,
            transition: `opacity ${SPEED} ${EASE}`,
            pointerEvents: 'none', lineHeight: 1.15,
          }}>
            <span style={{
              fontFamily: brand, fontWeight: 700, fontSize: 12.5,
              letterSpacing: '1.8px', color: '#fff',
              textTransform: 'uppercase', display: 'block',
            }}>Northern Warrior</span>
            <span style={{ fontSize: 9.5, color: 'var(--slate-500)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              Admin Dashboard
            </span>
          </div>

          {onToggle && (
            <button
              onClick={onToggle}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'var(--slate-400)', cursor: 'pointer', padding: 4,
                borderRadius: 5, display: 'flex', alignItems: 'center',
              }}
            >
              {Icons.close}
            </button>
          )}
        </div>

        {/* Nav scroll area */}
        <div style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '10px 0 6px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--slate-700) transparent',
        }}>
          <SectionLabel label="Main" isOpen={isOpen} />

          {MAIN_ITEMS.map(item => (
            <NavRow
              key={item.key}
              item={item}
              isOpen={isOpen}
              isActive={isItemActive(item)}
              isSubOpen={openSub === item.key}
              isSubActive={isSubActive}
              onToggleSub={() => toggleSub(item.key)}
              onNavigate={onNavigate}
              onShowTooltip={showTooltip}
              onHideTooltip={hideTooltip}
            />
          ))}

          <SectionLabel label="Platform" isOpen={isOpen} />

          {PLATFORM_ITEMS.map(item => (
            <NavRow
              key={item.key}
              item={item}
              isOpen={isOpen}
              isActive={isItemActive(item)}
              isSubOpen={openSub === item.key}
              isSubActive={isSubActive}
              onToggleSub={() => toggleSub(item.key)}
              onNavigate={onNavigate}
              onShowTooltip={showTooltip}
              onHideTooltip={hideTooltip}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--r-panel-border)',
          padding: '10px 11px',
          display: 'flex', alignItems: 'center', gap: 9,
          overflow: 'hidden', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <div style={{
            width: 30, minWidth: 30, height: 30,
            background: 'linear-gradient(140deg, var(--r-gold-500), var(--r-gold-300))',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: brand, fontSize: 11, fontWeight: 700,
            color: 'var(--slate-950)', flexShrink: 0,
          }}>{initials}</div>

          <div style={{
            flex: 1, minWidth: 0,
            opacity: isOpen ? 1 : 0,
            transition: `opacity ${SPEED} ${EASE}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--slate-200)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--slate-500)' }}>Administrator</div>
          </div>

          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--slate-600)', display: 'flex', alignItems: 'center',
              padding: 4, borderRadius: 5, flexShrink: 0,
              opacity: isOpen ? 1 : 0,
              transition: `opacity ${SPEED} ${EASE}, color 0.15s`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--slate-300)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--slate-600)' }}
          >
            {Icons.signout}
          </button>
        </div>
      </nav>
    </>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label, isOpen }: { label: string; isOpen: boolean }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 600, letterSpacing: '1.6px',
      textTransform: 'uppercase', color: 'var(--slate-600)',
      padding: '12px 18px 5px', whiteSpace: 'nowrap', overflow: 'hidden',
      opacity: isOpen ? 1 : 0,
      maxHeight: isOpen ? 32 : 0,
      transition: `opacity ${SPEED} ${EASE}, max-height ${SPEED} ${EASE}`,
    }}>{label}</div>
  )
}

// ── Nav row ───────────────────────────────────────────────────────────────────

interface NavRowProps {
  item: NavItem
  isOpen: boolean
  isActive: boolean
  isSubOpen: boolean
  isSubActive: (href: string) => boolean
  onToggleSub: () => void
  onNavigate?: () => void
  onShowTooltip: (e: React.MouseEvent, label: string) => void
  onHideTooltip: () => void
}

function NavRow({ item, isOpen, isActive, isSubOpen, isSubActive, onToggleSub, onNavigate, onShowTooltip, onHideTooltip }: NavRowProps) {
  const [hovered, setHovered] = useState(false)
  const hasSub = !!(item.sub?.length)

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    gap: 10, padding: '0 11px', height: 38,
    margin: '1px 7px', borderRadius: 7,
    cursor: 'pointer', fontSize: 13,
    whiteSpace: 'nowrap', overflow: 'hidden',
    position: 'relative', textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
    background: isActive
      ? 'rgba(212, 160, 23, 0.11)'
      : hovered ? 'var(--r-panel-bg)' : 'transparent',
    color: isActive
      ? 'var(--r-gold-300)'
      : hovered ? 'var(--slate-200)' : 'var(--slate-400)',
    fontWeight: isActive ? 500 : 400,
  }

  const inner = (
    <>
      {isActive && (
        <div style={{
          position: 'absolute', left: 0, top: '22%', height: '56%',
          width: 2.5, background: 'var(--r-gold-400)', borderRadius: '0 2px 2px 0',
        }} />
      )}
      <div style={{
        width: 16, minWidth: 16, height: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        color: isActive ? 'var(--r-gold-400)' : 'inherit',
      }}>
        {item.icon}
      </div>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        opacity: isOpen ? 1 : 0,
        transition: `opacity ${SPEED} ${EASE}`,
        minWidth: 0, overflow: 'hidden',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {item.badge != null && item.badge > 0 && (
            <span style={{
              background: 'rgba(212,160,23,0.18)', color: 'var(--r-gold-300)',
              fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 9,
            }}>{item.badge}</span>
          )}
          {hasSub && (
            <span style={{
              color: 'var(--slate-600)',
              transition: 'transform 0.2s',
              transform: isSubOpen && isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'flex', alignItems: 'center',
            }}>
              {Icons.chevron}
            </span>
          )}
        </div>
      </div>
    </>
  )

  const events = {
    onMouseEnter: (e: React.MouseEvent) => { setHovered(true); onShowTooltip(e, item.label) },
    onMouseLeave: () => { setHovered(false); onHideTooltip() },
  }

  return (
    <div>
      {item.href && !hasSub ? (
        <Link href={item.href} onClick={onNavigate} style={rowStyle} {...events}>
          {inner}
        </Link>
      ) : item.href && hasSub ? (
        <div onClick={() => { onToggleSub() }} style={rowStyle} {...events}>
          {inner}
        </div>
      ) : (
        <div onClick={onToggleSub} style={rowStyle} {...events}>
          {inner}
        </div>
      )}

      {hasSub && (
        <div style={{
          overflow: 'hidden',
          maxHeight: isSubOpen && isOpen ? `${item.sub!.length * 32}px` : 0,
          transition: `max-height 0.25s ${EASE}`,
        }}>
          {item.sub!.map(sub => (
            <SubRow
              key={sub.label}
              sub={sub}
              active={isSubActive(sub.href)}
              isOpen={isOpen}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sub row ───────────────────────────────────────────────────────────────────

function SubRow({ sub, active, isOpen, onNavigate }: {
  sub: SubItem; active: boolean; isOpen: boolean; onNavigate?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={sub.href}
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center',
        padding: '0 11px 0 40px', height: 30,
        margin: '0 7px', borderRadius: 6,
        cursor: 'pointer', fontSize: 12,
        whiteSpace: 'nowrap', overflow: 'hidden',
        position: 'relative', textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s',
        color: active ? 'var(--r-gold-300)' : hovered ? 'var(--slate-300)' : 'var(--slate-500)',
        background: hovered ? 'var(--r-panel-bg)' : 'transparent',
      }}
    >
      <div style={{
        position: 'absolute', left: 24, top: '50%',
        width: 7, height: 1,
        background: active ? 'var(--r-gold-600)' : hovered ? 'var(--slate-500)' : 'var(--slate-700)',
        transition: 'background 0.15s',
      }} />
      <span style={{ opacity: isOpen ? 1 : 0, transition: `opacity ${SPEED} ${EASE}` }}>
        {sub.label}
      </span>
    </Link>
  )
}
