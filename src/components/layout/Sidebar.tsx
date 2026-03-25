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
  FileText,
  Users,
  Settings,
  PoundSterling,
  RefreshCw,
  Zap,
  Sparkles,
  CheckSquare2,
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
  open?: boolean
  onToggle?: () => void
  unreadCount?: number
  userEmail?: string
  onNavigate?: () => void
}

export function Sidebar({ open = true, onToggle, unreadCount = 0, userEmail, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Default open: any group that contains the active route
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {}
    for (const group of navGroups) {
      const hasActive = group.items.some(({ href }) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href)
      )
      state[group.key] = !hasActive
    }
    return state
  })

  function toggleGroup(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <aside className="h-full flex flex-col overflow-hidden bg-[#111110]">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="relative flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
        <img src="/nw-logo.svg" alt="NW" className="w-8 h-8 object-contain flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p
            className="text-[#d4af37] font-bold uppercase tracking-wider text-[13px] leading-tight"
            style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
          >
            Northern Warrior
          </p>
          <p className="text-white/30 text-[11px] leading-tight">Admin Dashboard</p>
        </div>
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

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">

        {/* Top-level items (Overview, Financials) */}
        {topItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors duration-150',
                active
                  ? 'bg-[#967705]/25 text-[#f2ca50]'
                  : 'text-white/55 hover:text-white/80 hover:bg-white/[0.05]'
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}

        {/* Grouped sections */}
        {navGroups.map((group) => {
          const isCollapsed = collapsed[group.key]
          return (
            <div
              key={group.key}
              className={cn('pt-3', group.hideOnMobile && 'hidden md:block')}
            >
              {/* Section header */}
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-3 pb-1 group"
              >
                <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/25 group-hover:text-white/40 transition-colors">
                  {group.label}
                </span>
                <ChevronDown
                  size={12}
                  className={cn(
                    'text-white/20 group-hover:text-white/40 transition-all duration-200',
                    isCollapsed && '-rotate-90'
                  )}
                />
              </button>

              {/* Items */}
              {!isCollapsed && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map(({ label, href, icon: Icon, badge, tag }) => {
                    const active = isActive(href)
                    const showBadge = badge === 'contacts' && unreadCount > 0
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors duration-150',
                          active
                            ? 'bg-[#967705]/25 text-[#f2ca50]'
                            : 'text-white/55 hover:text-white/80 hover:bg-white/[0.05]'
                        )}
                      >
                        <Icon size={16} className="flex-shrink-0" />
                        <span className="flex-1">{label}</span>
                        {tag && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#967705]/30 text-[#f2ca50] uppercase tracking-wide">
                            {tag}
                          </span>
                        )}
                        {showBadge && (
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Install box ────────────────────────────────────── */}
      <SidebarInstallBox />

      {/* ── User footer ─────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] p-3">
        {userEmail && (
          <div className="flex items-center gap-2.5 px-2 py-2">
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
        )}
      </div>
    </aside>
  )
}
