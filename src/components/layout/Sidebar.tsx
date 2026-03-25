'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DashboardNavIcon,
  FileNavIcon,
  PenNavIcon,
  ImageNavIcon,
  MailNavIcon,
  UsersNavIcon,
  BabyNavIcon,
  BotNavIcon,
  MailchimpNavIcon,
  SettingsNavIcon,
  LogOutNavIcon,
  PanelCloseNavIcon,
} from '@/components/ui/animated-nav-icons'
import { cn } from '@/lib/utils'
import {
  PoundSterling,
  RefreshCw,
  Zap,
  Sparkles,
  CheckSquare2,
  ChevronDown,
  Users,
  FileText,
  Settings,
} from 'lucide-react'
import { SidebarInstallBox } from './SidebarInstallBox'

// ── Nav structure ────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: 'contacts'
  tag?: string
}

interface NavGroup {
  key: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  items: NavItem[]
  hideOnMobile?: boolean
}

const topItems: NavItem[] = [
  { label: 'Overview', href: '/', icon: DashboardNavIcon },
  { label: 'Financials', href: '/financials', icon: PoundSterling },
]

const navGroups: NavGroup[] = [
  {
    key: 'engagement',
    label: 'Engagement',
    icon: Users,
    items: [
      { label: 'To Do', href: '/todo', icon: CheckSquare2 },
      { label: 'Contacts', href: '/contacts', icon: UsersNavIcon },
      { label: 'Leads', href: '/leads', icon: UsersNavIcon },
      { label: 'Enquiries', href: '/enquiries', icon: MailNavIcon, badge: 'contacts' },
      { label: 'Kids & Teens', href: '/kids', icon: BabyNavIcon },
      { label: 'Subscribers', href: '/email', icon: UsersNavIcon },
      { label: 'AI Chat', href: '/ai-chat', icon: BotNavIcon, tag: 'AI' },
    ],
  },
  {
    key: 'content',
    label: 'Content',
    icon: FileText,
    hideOnMobile: true,
    items: [
      { label: 'Content', href: '/content', icon: FileNavIcon },
      { label: 'Blog', href: '/blog/manage', icon: PenNavIcon },
      { label: 'Media', href: '/media', icon: ImageNavIcon },
      { label: 'Branding Studio', href: '/branding', icon: Sparkles },
      { label: 'Email Campaigns', href: '/mailchimp', icon: MailchimpNavIcon },
      { label: 'Workflows', href: '/workflows', icon: Zap },
    ],
  },
  {
    key: 'system',
    label: 'System',
    icon: Settings,
    items: [
      { label: 'WodBoard Sync', href: '/sync', icon: RefreshCw },
      { label: 'Settings', href: '/settings', icon: SettingsNavIcon },
    ],
  },
]

// ── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  /** Whether the sidebar is expanded (controlled by parent hover) */
  open?: boolean
  /** Mobile only: close drawer button */
  onToggle?: () => void
  unreadCount?: number
  userEmail?: string
  onNavigate?: () => void
}

// ── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ open = false, onToggle, unreadCount = 0, userEmail, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Section collapse — open if it contains the active route
  const [sectionsCollapsed, setSectionsCollapsed] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {}
    for (const group of navGroups) {
      const hasActive = group.items.some(({ href }) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href)
      )
      state[group.key] = !hasActive
    }
    return state
  })

  function toggleSection(key: string) {
    setSectionsCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    // Width is always w-64 — the parent container clips it to 64px when collapsed
    <nav className="h-full w-64 flex flex-col border-r border-white/[0.06] bg-[#111110]">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06] flex-shrink-0">
        <img src="/nw-logo.svg" alt="NW" className="w-8 h-8 object-contain flex-shrink-0" />
        {/* Text rendered always — clipped by parent when collapsed */}
        <div className="min-w-0 flex-1">
          <p
            className="text-[#d4af37] font-bold uppercase tracking-wider text-[13px] leading-tight whitespace-nowrap"
            style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
          >
            Northern Warrior
          </p>
          <p className="text-white/30 text-[11px] leading-tight whitespace-nowrap">Admin Dashboard</p>
        </div>
        {/* Mobile close button */}
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label="Close sidebar"
            className="w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
          >
            <PanelCloseNavIcon size={14} />
          </button>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      {/*
        Layout maths (collapsed = 64px container):
          px-2 (8px) + item pl-2 (8px) + icon w-9 (36px) + gap-3 (12px) = 64px
          → text label starts exactly at the clipping boundary ✓
          → icon left edge sits 16px from sidebar edge ≈ 4mm ✓
      */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">

        {/* Top-level items */}
        {topItems.map(({ label, href, icon: Icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={<Icon size={16} />}
            active={isActive(href)}
            onNavigate={onNavigate}
          />
        ))}

        {/* Grouped sections */}
        {navGroups.map((group) => {
          const isCollapsed = sectionsCollapsed[group.key]
          const GroupIcon = group.icon
          return (
            <div key={group.key} className={cn('pt-1', group.hideOnMobile && 'hidden md:block')}>

              {/* Section header */}
              <button
                onClick={() => toggleSection(group.key)}
                className="w-full flex items-center gap-3 pl-2 pr-2 h-10 rounded-lg transition-colors duration-150 text-white/50 hover:text-white/75 hover:bg-white/[0.05]"
              >
                <span className="w-9 flex-shrink-0 flex items-center justify-center">
                  <GroupIcon size={16} />
                </span>
                <span className="flex-1 text-[13.5px] font-semibold truncate text-left">
                  {group.label}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: '#f2ca50',
                    transition: 'transform 0.2s',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  }}
                >
                  <ChevronDown size={14} style={{ color: '#000' }} />
                </span>
              </button>

              {/* Items */}
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {group.items.map(({ label, href, icon: Icon, badge, tag }) => {
                    const active = isActive(href)
                    const showBadge = badge === 'contacts' && unreadCount > 0
                    return (
                      <NavItem
                        key={href}
                        href={href}
                        label={label}
                        icon={<Icon size={16} />}
                        active={active}
                        onNavigate={onNavigate}
                        badge={showBadge ? <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" /> : undefined}
                        tag={tag ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#967705]/30 text-[#f2ca50] uppercase tracking-wide flex-shrink-0 whitespace-nowrap">
                            {tag}
                          </span>
                        ) : undefined}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Install box ─────────────────────────────────────── */}
      {open && <SidebarInstallBox />}

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-3 py-3 space-y-2">
        {/* User row */}
        {userEmail && (
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-[#967705]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[13px] font-bold text-[#f2ca50]">
                {userEmail[0]?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white/80 truncate leading-tight whitespace-nowrap">
                {userEmail.split('@')[0]}
              </p>
              <p className="text-[10px] text-white/30 leading-tight whitespace-nowrap">Admin</p>
            </div>
          </div>
        )}

        {/* Logout button — large, prominent */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:border-red-500/50 hover:text-red-300 transition-all duration-150 font-semibold text-[14px]"
        >
          <LogOutNavIcon size={16} />
          <span className="whitespace-nowrap">Sign Out</span>
        </button>
      </div>
    </nav>
  )
}

// ── Nav item ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string
  label: string
  icon: React.ReactNode
  active: boolean
  onNavigate?: () => void
  badge?: React.ReactNode
  tag?: React.ReactNode
}

function NavItem({ href, label, icon, active, onNavigate, badge, tag }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={label}
      className={cn(
        // pl-2 + icon w-9 + gap-3 = 8+36+12 = 56px before text
        // container px-2 adds 8px → total 64px = exact clip point when collapsed
        'relative flex items-center gap-3 pl-2 pr-2 h-10 rounded-lg transition-colors duration-150',
        active
          ? 'bg-[#967705]/20 text-[#f2ca50]'
          : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
      )}
    >
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 inset-y-2 w-[3px] bg-[#C9A70A] rounded-r-full" />
      )}

      {/* Icon column — w-9 (36px), always visible in 64px collapsed state */}
      <span className="w-9 flex-shrink-0 flex items-center justify-center">
        {icon}
      </span>

      {/* Label + extras — clipped at 64px when sidebar is collapsed */}
      <span className="flex-1 text-[13.5px] font-medium truncate whitespace-nowrap">{label}</span>
      {tag}
      {badge}
    </Link>
  )
}
