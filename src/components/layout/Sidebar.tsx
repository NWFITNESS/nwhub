'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { FileText, Users, Settings, PoundSterling, RefreshCw, Zap, Sparkles } from 'lucide-react'
import { SidebarInstallBox } from './SidebarInstallBox'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: 'contacts'
}

interface NavGroup {
  value: string
  label: string
  subtitle: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    value: 'content',
    label: 'Content',
    subtitle: 'Manage site content',
    icon: FileText,
    items: [
      { label: 'Content', href: '/content', icon: FileNavIcon },
      { label: 'Blog', href: '/blog/manage', icon: PenNavIcon },
      { label: 'Media', href: '/media', icon: ImageNavIcon },
    ],
  },
  {
    value: 'engagement',
    label: 'Engagement',
    subtitle: 'Connect with your audience',
    icon: Users,
    items: [
      { label: 'Contacts', href: '/contacts', icon: UsersNavIcon },
      { label: 'Leads', href: '/leads', icon: UsersNavIcon },
      { label: 'Enquiries', href: '/enquiries', icon: MailNavIcon, badge: 'contacts' as const },
      { label: 'Kids & Teens', href: '/kids', icon: BabyNavIcon },
      { label: 'Subscribers', href: '/email', icon: UsersNavIcon },
      { label: 'Branding Studio', href: '/branding', icon: Sparkles },
      { label: 'Workflows', href: '/workflows', icon: Zap },
      { label: 'Email Campaigns', href: '/mailchimp', icon: MailchimpNavIcon },
      { label: 'AI Chat', href: '/ai-chat', icon: BotNavIcon },
    ],
  },
  {
    value: 'system',
    label: 'System',
    subtitle: 'Configuration & preferences',
    icon: Settings,
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

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const defaultOpenGroups = navGroups
    .filter((group) =>
      group.items.some(({ href }) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href)
      )
    )
    .map((g) => g.value)

  const overviewActive = pathname === '/'

  return (
    <aside className="h-full flex flex-col overflow-hidden bg-[#1c1b1b]">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="relative pl-8 pr-5 pt-6 pb-5 border-b border-[#4d4635]/20">
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label="Close sidebar"
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md text-[#d0c5af]/40 hover:text-[#f2ca50] hover:bg-[#2a2a2a] transition-all"
          >
            <PanelCloseNavIcon size={14} />
          </button>
        )}
        <div className="flex items-center gap-3 mb-2">
          <div className="relative flex-shrink-0">
            <div
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.18), transparent 70%)' }}
            />
            <img src="/nw-logo.svg" alt="NW" className="w-10 h-10 object-contain relative" />
          </div>
          <div className="min-w-0">
            <p
              className="text-[#d4af37] font-bold uppercase tracking-widest text-base leading-tight"
              style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
            >
              Northern Warrior
            </p>
            <p className="text-[#f2ca50] text-sm font-semibold leading-tight" style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}>
              Hub
            </p>
          </div>
        </div>
        <span className="inline-block text-[10px] uppercase tracking-[0.22em] text-[#d0c5af]/50 font-medium">
          Admin Panel
        </span>
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="flex-1 pl-5 pr-3 py-4 overflow-y-auto space-y-1.5">
        {/* Overview */}
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-200 group relative border',
            overviewActive
              ? 'bg-[#2a2a2a] text-[#d4af37] border-[#4d4635]/30 shadow-[inset_0_0_8px_rgba(212,175,55,0.1)] translate-x-0.5'
              : 'text-[#d0c5af] hover:bg-[#2a2a2a] hover:text-[#f2ca50] border-transparent hover:translate-x-1'
          )}
        >
          <DashboardNavIcon size={17} className="flex-shrink-0" />
          <span className="flex-1">Overview</span>
          {overviewActive && <span className="w-1 h-1 rounded-full bg-[#f2ca50] flex-shrink-0" />}
        </Link>

        {/* Financials */}
        <Link
          href="/financials"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-200 group relative border',
            pathname.startsWith('/financials')
              ? 'bg-[#2a2a2a] text-[#d4af37] border-[#4d4635]/30 shadow-[inset_0_0_8px_rgba(212,175,55,0.1)] translate-x-0.5'
              : 'text-[#d0c5af] hover:bg-[#2a2a2a] hover:text-[#f2ca50] border-transparent hover:translate-x-1'
          )}
        >
          <PoundSterling size={17} className="flex-shrink-0" />
          <span className="flex-1">Financials</span>
        </Link>

        {/* Accordion groups */}
        <Accordion
          type="multiple"
          defaultValue={defaultOpenGroups.length > 0 ? defaultOpenGroups : ['content']}
          className="w-full space-y-1"
        >
          {navGroups.map((group, idx) => {
            const GroupIcon = group.icon
            const groupHasActive = group.items.some(({ href }) =>
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            )
            const isContentGroup = group.value === 'content'

            return (
              <AccordionItem
                key={group.value}
                value={group.value}
                className={cn(
                  'border border-[#4d4635]/15 bg-[#1c1b1b] rounded-lg overflow-hidden',
                  isContentGroup && 'hidden md:block',
                )}
              >
                <AccordionTrigger
                  className={cn(
                    'px-3 py-2.5 hover:no-underline hover:bg-[#2a2a2a] transition-all duration-200 rounded-t-lg',
                    groupHasActive && 'text-[#d4af37]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        groupHasActive
                          ? 'bg-[#d4af37]/20 text-[#f2ca50]'
                          : 'bg-[#d4af37]/8 text-[#d0c5af]'
                      )}
                    >
                      <GroupIcon size={15} />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className={cn(
                        'text-[15px] font-semibold',
                        groupHasActive ? 'text-[#d4af37]' : 'text-[#e5e2e1]'
                      )}>
                        {group.label}
                      </span>
                      <span className="text-[11px] text-[#d0c5af]/45">{group.subtitle}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2 pt-0">
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map(({ label, href, icon: Icon, badge }) => {
                      const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                      const showBadge = badge === 'contacts' && unreadCount > 0
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-200 group relative border',
                            active
                              ? 'bg-[#2a2a2a] text-[#d4af37] border-[#4d4635]/30 shadow-[inset_0_0_8px_rgba(212,175,55,0.1)] translate-x-0.5'
                              : 'text-[#d0c5af]/70 hover:text-[#f2ca50] hover:bg-[#2a2a2a] border-transparent hover:translate-x-1'
                          )}
                        >
                          <Icon size={15} className="flex-shrink-0" />
                          <span className="flex-1">{label}</span>
                          {showBadge && (
                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                          )}
                          {active && <span className="w-1 h-1 rounded-full bg-[#f2ca50]/60 flex-shrink-0" />}
                        </Link>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </nav>

      {/* ── Install box ────────────────────────────────────── */}
      <SidebarInstallBox />

      {/* ── User card footer ───────────────────────────────── */}
      <div className="pl-5 pr-3 py-3 border-t border-[#4d4635]/20">
        {userEmail && (
          <div className="flex items-center gap-2.5 p-3 bg-[#2a2a2a] rounded-xl mb-2 border border-[#4d4635]/15">
            <div className="w-9 h-9 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/25 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[#f2ca50]">
                {userEmail[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-[#e5e2e1] truncate">{userEmail.split('@')[0]}</p>
              <p className="text-[10px] text-[#d0c5af]/50 uppercase tracking-wider">Admin</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] text-[#d0c5af]/50 hover:text-[#f2ca50] hover:bg-[#2a2a2a] transition-all duration-200 hover:translate-x-0.5"
        >
          <LogOutNavIcon size={15} className="flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
