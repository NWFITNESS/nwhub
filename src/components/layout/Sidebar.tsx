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
} from '@/components/ui/animated-nav-icons'
import { cn } from '@/lib/utils'
import {
  FileText,
  Users,
  Settings,
  PoundSterling,
  RefreshCw,
  Zap,
  Sparkles,
  CheckSquare2,
  ChevronsRight,
  ChevronDown,
} from 'lucide-react'
import { SidebarInstallBox } from './SidebarInstallBox'

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
    items: [
      { label: 'WodBoard Sync', href: '/sync', icon: RefreshCw },
      { label: 'Settings', href: '/settings', icon: SettingsNavIcon },
    ],
  },
]

interface SidebarProps {
  open?: boolean           // ignored — sidebar manages its own state
  onToggle?: () => void    // used on mobile to close drawer
  unreadCount?: number
  userEmail?: string
  onNavigate?: () => void
}

export function Sidebar({ onToggle, unreadCount = 0, userEmail, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [expanded, setExpanded] = useState(true)

  // Section collapse state — open if contains active route
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
    if (!expanded) return // sections always show when collapsed to icons
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
    <nav
      className={cn(
        'sticky top-0 h-screen shrink-0 flex flex-col border-r border-white/[0.06] bg-[#111110] transition-[width] duration-300 ease-in-out overflow-hidden',
        expanded ? 'w-64' : 'w-[60px]'
      )}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={cn(
        'flex items-center gap-3 border-b border-white/[0.06] flex-shrink-0',
        expanded ? 'px-4 py-4' : 'px-[10px] py-4 justify-center'
      )}>
        <img src="/nw-logo.svg" alt="NW" className="w-9 h-9 object-contain flex-shrink-0" />
        {expanded && (
          <div className="min-w-0">
            <p
              className="text-[#d4af37] font-bold uppercase tracking-wider text-[13px] leading-tight truncate"
              style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
            >
              Northern Warrior
            </p>
            <p className="text-white/30 text-[11px] leading-tight">Admin Dashboard</p>
          </div>
        )}
        {/* Mobile close button */}
        {onToggle && expanded && (
          <button
            onClick={onToggle}
            className="ml-auto w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
          >
            <ChevronsRight size={14} />
          </button>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">

        {/* Top-level items */}
        {topItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={<Icon size={17} className="flex-shrink-0" />}
              active={active}
              expanded={expanded}
              onNavigate={onNavigate}
            />
          )
        })}

        {/* Grouped sections */}
        {navGroups.map((group) => {
          const isCollapsed = sectionsCollapsed[group.key]
          return (
            <div
              key={group.key}
              className={cn('pt-3', group.hideOnMobile && 'hidden md:block')}
            >
              {/* Section header — hidden when sidebar is icon-only */}
              {expanded && (
                <button
                  onClick={() => toggleSection(group.key)}
                  className="w-full flex items-center justify-between px-2 pb-1.5 group"
                >
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/25 group-hover:text-white/45 transition-colors">
                    {group.label}
                  </span>
                  <ChevronDown
                    size={11}
                    className={cn(
                      'text-white/20 group-hover:text-white/40 transition-all duration-200',
                      isCollapsed && '-rotate-90'
                    )}
                  />
                </button>
              )}

              {/* Divider line in icon-only mode */}
              {!expanded && (
                <div className="mx-2 mb-1.5 h-px bg-white/[0.06]" />
              )}

              {/* Items — always show in icon-only mode */}
              {(!isCollapsed || !expanded) && (
                <div className="space-y-0.5">
                  {group.items.map(({ label, href, icon: Icon, badge, tag }) => {
                    const active = isActive(href)
                    const showBadge = badge === 'contacts' && unreadCount > 0
                    return (
                      <NavLink
                        key={href}
                        href={href}
                        label={label}
                        icon={<Icon size={16} className="flex-shrink-0" />}
                        active={active}
                        expanded={expanded}
                        onNavigate={onNavigate}
                        badge={showBadge ? <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" /> : undefined}
                        tag={expanded && tag ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#967705]/30 text-[#f2ca50] uppercase tracking-wide">
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

      {/* ── Install box ────────────────────────────────────── */}
      {expanded && <SidebarInstallBox />}

      {/* ── User footer ─────────────────────────────────────── */}
      {userEmail && (
        <div className={cn(
          'border-t border-white/[0.06] flex-shrink-0',
          expanded ? 'px-3 py-3' : 'px-2 py-3 flex justify-center'
        )}>
          {expanded ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#967705]/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[13px] font-bold text-[#f2ca50]">
                  {userEmail[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white/80 truncate leading-tight">
                  {userEmail.split('@')[0]}
                </p>
                <p className="text-[10px] text-white/30 leading-tight">Admin</p>
              </div>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors flex-shrink-0"
              >
                <LogOutNavIcon size={14} />
              </button>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#967705]/30 flex items-center justify-center">
              <span className="text-[13px] font-bold text-[#f2ca50]">
                {userEmail[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Collapse toggle ─────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex-shrink-0 flex items-center border-t border-white/[0.06] transition-colors hover:bg-white/[0.04]"
      >
        <div className={cn(
          'flex items-center py-3',
          expanded ? 'px-3' : 'px-[10px] justify-center w-full'
        )}>
          <div className="w-9 h-9 grid place-content-center flex-shrink-0">
            <ChevronsRight
              size={16}
              className={cn(
                'text-white/30 transition-transform duration-300',
                expanded && 'rotate-180'
              )}
            />
          </div>
          {expanded && (
            <span className="text-[13px] font-medium text-white/35 ml-1">
              Collapse
            </span>
          )}
        </div>
      </button>
    </nav>
  )
}

// ── Shared nav link ─────────────────────────────────────────────────────────

interface NavLinkProps {
  href: string
  label: string
  icon: React.ReactNode
  active: boolean
  expanded: boolean
  onNavigate?: () => void
  badge?: React.ReactNode
  tag?: React.ReactNode
}

function NavLink({ href, label, icon, active, expanded, onNavigate, badge, tag }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={!expanded ? label : undefined}
      className={cn(
        'relative flex items-center rounded-md transition-all duration-150 h-10',
        expanded ? 'px-0' : 'justify-center w-full',
        active
          ? 'bg-[#967705]/20 text-[#f2ca50] border-l-2 border-[#C9A70A]'
          : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80 border-l-2 border-transparent'
      )}
    >
      <div className={cn('grid place-content-center flex-shrink-0', expanded ? 'w-10 h-full' : 'w-full h-full')}>
        {icon}
      </div>
      {expanded && (
        <span className="flex-1 text-[13.5px] font-medium truncate">{label}</span>
      )}
      {expanded && tag}
      {expanded && badge}
    </Link>
  )
}
