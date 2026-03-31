'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NWHubIcon } from '@/components/NWHubIcon'

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
  calendar: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="2" y="3" width="12" height="11" rx="2"/>
      <path d="M2 7h12M5 1v4M11 1v4" strokeLinecap="round"/>
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
      { label: 'Enquiries', href: '/enquiries' },
      { label: 'AI Chat', href: '/ai-chat' },
      { label: 'Contacts', href: '/contacts' },
    ],
  },
  {
    key: 'financials',
    label: 'Financials',
    href: '/financials',
    icon: Icons.financials,
  },
  {
    key: 'engagement',
    label: 'Engagement',
    href: '/leads',
    icon: Icons.engagement,
    sub: [
      { label: 'Members', href: '/leads' },
      { label: 'Calendar', href: '/calendar' },
      { label: 'SMS', href: '/sms' },
    ],
  },
]

const PLATFORM_ITEMS: NavItem[] = [
  {
    key: 'content',
    label: 'Content',
    icon: Icons.content,
    sub: [
      { label: 'Blog', href: '/blog/manage' },
      { label: 'Email', href: '/mailchimp' },
      { label: 'Editor', href: '/content' },
      { label: 'Media', href: '/media' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    icon: Icons.system,
    sub: [
      { label: 'Integrations', href: '/sync' },
      { label: 'Settings', href: '/settings' },
      { label: 'Branding', href: '/branding' },
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

  return (
    <>
      {/* Floating tooltip */}
      {!isMobile && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            background: 'var(--nw-750, #22293d)',
            border: '1px solid rgba(128,128,128,0.2)',
            color: 'var(--nw-200, #d2deee)',
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

      <aside
        onMouseEnter={isMobile ? undefined : handleMouseEnter}
        onMouseLeave={isMobile ? undefined : handleMouseLeave}
        className={`relative z-20 flex-shrink-0 flex-col bg-nw-950 border-r border-[rgba(212,160,23,0.18)] shadow-sidebar overflow-hidden transition-[width] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] h-full ${isMobile ? 'flex' : 'hidden md:flex'} ${isOpen ? 'w-[228px]' : 'w-[58px]'}`}
      >
        {/* Pull hint */}
        {!isMobile && (
          <div className={`pointer-events-none absolute right-[-22px] top-1/2 flex -translate-y-1/2 flex-col items-center gap-[5px] rounded-r-[7px] border border-l-0 border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.13)] px-[7px] py-[10px] text-[9px] font-semibold uppercase tracking-[0.8px] text-gold-400 transition-opacity duration-300 [writing-mode:vertical-rl] ${isOpen || pullGone ? 'opacity-0' : 'opacity-100'}`}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 2l4 3-4 3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Hover
          </div>
        )}

        {/* Logo row */}
        <div className="flex h-[62px] min-h-[62px] items-center gap-[11px] overflow-hidden whitespace-nowrap border-b border-[rgba(255,255,255,0.09)] px-[10px] flex-shrink-0">
          <div className="flex h-[38px] w-[38px] min-w-[38px] flex-shrink-0 items-center justify-center">
            <NWHubIcon size={38} />
          </div>

          <div className={`transition-opacity duration-[260ms] ${isOpen ? 'opacity-100' : 'opacity-0'} pointer-events-none leading-[1.15]`}>
            <span className="block font-brand text-[13px] font-bold uppercase tracking-[1.8px] text-white">Northern Warrior</span>
            <span className="text-[9.5px] uppercase tracking-[0.6px] text-nw-500">Admin Hub</span>
          </div>

          {onToggle && (
            <button
              onClick={onToggle}
              className="ml-auto flex items-center rounded-[5px] p-1 text-nw-400 hover:text-nw-200"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {Icons.close}
            </button>
          )}
        </div>

        {/* Nav scroll area */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden py-[10px] pb-[6px]"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--slate-700) transparent' }}
        >
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
        <div className="flex flex-shrink-0 items-center gap-[9px] overflow-hidden whitespace-nowrap border-t border-[rgba(255,255,255,0.09)] px-[11px] py-[10px]">
          <div className="flex h-[30px] w-[30px] min-w-[30px] items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-300 font-brand text-[11px] font-bold text-nw-950">
            {initials}
          </div>

          <div
            className="flex-1 min-w-0"
            style={{ opacity: isOpen ? 1 : 0, transition: `opacity ${SPEED} ${EASE}` }}
          >
            <div className="overflow-hidden text-ellipsis text-[12px] font-medium text-nw-200">{displayName}</div>
            <div className="text-[10px] text-nw-500">Administrator</div>
          </div>

          <button
            onClick={handleSignOut}
            title="Sign out"
            className="flex flex-shrink-0 items-center rounded-[5px] p-1 text-nw-600 hover:text-nw-300 transition-colors"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              opacity: isOpen ? 1 : 0,
              transition: `opacity ${SPEED} ${EASE}, color 0.15s`,
            }}
          >
            {Icons.signout}
          </button>
        </div>
      </aside>
    </>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label, isOpen }: { label: string; isOpen: boolean }) {
  return (
    <div className={`overflow-hidden whitespace-nowrap px-[18px] text-[9px] font-semibold uppercase tracking-[1.6px] text-nw-600 transition-[opacity,max-height] duration-[260ms] ${isOpen ? 'max-h-8 pt-3 pb-1 opacity-100' : 'max-h-0 opacity-0'}`}>
      {label}
    </div>
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
  const hasSub = !!(item.sub?.length)

  const rowClass = `relative mx-[7px] my-px flex h-[38px] cursor-pointer items-center gap-[10px] overflow-hidden whitespace-nowrap rounded-[7px] px-[11px] text-[13px] transition-colors duration-150 select-none ${isActive ? 'bg-[rgba(212,160,23,0.11)] font-medium text-gold-300' : 'text-nw-400 hover:bg-[rgba(255,255,255,0.04)] hover:text-nw-200'}`

  const inner = (
    <>
      {isActive && (
        <div className="absolute left-0 top-[22%] h-[56%] w-[2.5px] rounded-r-sm bg-gold-400" />
      )}
      <div className="flex h-4 w-4 min-w-[16px] items-center justify-center flex-shrink-0">
        {item.icon}
      </div>
      <div
        className={`flex flex-1 items-center justify-between transition-opacity duration-[260ms] min-w-0 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="overflow-hidden text-ellipsis">{item.label}</span>
        <div className="flex items-center gap-[5px] flex-shrink-0">
          {item.badge != null && item.badge > 0 && (
            <span className="rounded-[9px] bg-[rgba(212,160,23,0.18)] px-1.5 py-px text-[9px] font-semibold text-gold-300">
              {item.badge}
            </span>
          )}
          {hasSub && (
            <span
              className="flex items-center text-nw-600"
              style={{
                transition: 'transform 0.2s',
                transform: isSubOpen && isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              {Icons.chevron}
            </span>
          )}
        </div>
      </div>
    </>
  )

  const events = {
    onMouseEnter: (e: React.MouseEvent) => { onShowTooltip(e, item.label) },
    onMouseLeave: () => { onHideTooltip() },
  }

  return (
    <div>
      {item.href && !hasSub ? (
        <Link href={item.href} onClick={onNavigate} className={rowClass} style={{ textDecoration: 'none' }} {...events}>
          {inner}
        </Link>
      ) : item.href && hasSub ? (
        <div onClick={() => { onToggleSub() }} className={rowClass} {...events}>
          {inner}
        </div>
      ) : (
        <div onClick={onToggleSub} className={rowClass} {...events}>
          {inner}
        </div>
      )}

      {hasSub && (
        <div className={`overflow-hidden transition-[max-height] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${isSubOpen && isOpen ? 'max-h-56' : 'max-h-0'}`}>
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
  return (
    <Link
      href={sub.href}
      onClick={onNavigate}
      className={`relative mx-[7px] flex h-[30px] cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-[6px] pl-10 pr-[11px] text-xs transition-colors duration-150 before:absolute before:left-6 before:top-1/2 before:h-px before:w-[7px] before:bg-nw-700 ${active ? 'text-gold-300 before:bg-gold-600' : 'text-nw-500 hover:bg-[rgba(255,255,255,0.04)] hover:text-nw-300'}`}
      style={{ textDecoration: 'none' }}
    >
      <span style={{ opacity: isOpen ? 1 : 0, transition: `opacity ${SPEED} ${EASE}` }}>
        {sub.label}
      </span>
    </Link>
  )
}
