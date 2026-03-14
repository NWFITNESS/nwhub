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
  ChatNavIcon,
  UsersNavIcon,
  BabyNavIcon,
  StarNavIcon,
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
import { FileText, Users, Settings } from 'lucide-react'

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
      { label: 'Enquiries', href: '/enquiries', icon: MailNavIcon, badge: 'contacts' as const },
      { label: 'Kids & Teens', href: '/kids', icon: BabyNavIcon },
      { label: 'Subscribers', href: '/email', icon: UsersNavIcon },
      { label: 'WhatsApp Campaigns', href: '/sms', icon: ChatNavIcon },
      { label: 'Reviews', href: '/reviews', icon: StarNavIcon },
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

  // Determine which accordion groups should be open by default (those containing the active route)
  const defaultOpenGroups = navGroups
    .filter((group) =>
      group.items.some(({ href }) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href)
      )
    )
    .map((g) => g.value)

  const overviewActive = pathname === '/'

  return (
    <aside
      className="fixed left-0 top-0 h-screen border-r border-white/[0.08] flex flex-col z-40 transition-transform duration-300 ease-in-out"
      style={{
        width: 'var(--sidebar-w)',
        background: 'linear-gradient(180deg, #131313 0%, #0d0d0d 100%)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
      }}
    >
      {/* Logo */}
      <div className="relative px-5 pt-7 pb-6 border-b border-[#967705]/20 flex flex-col items-center gap-3 text-center">
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label="Close sidebar"
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          >
            <PanelCloseNavIcon size={15} />
          </button>
        )}
        <div className="relative">
          <div
            className="absolute -inset-4 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(150,119,5,0.25), transparent 70%)' }}
          />
          <img src="/nw-logo.svg" alt="NW" className="w-28 h-28 object-contain relative" />
        </div>
        <div className="leading-tight">
          <p className="text-xl font-bold text-white tracking-tight">Northern Warrior</p>
          <p className="text-lg font-semibold text-[#c9a70a]">Hub</p>
          <span className="inline-block mt-1.5 text-[11px] uppercase tracking-[0.25em] text-white/25 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-full">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-3">
        {/* Overview — standalone link */}
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-lg text-base transition-colors group relative border',
            overviewActive
              ? 'bg-gradient-to-r from-[#967705]/15 to-transparent text-[#c9a70a] border-[#967705]/25 shadow-[inset_0_1px_0_rgba(150,119,5,0.15)]'
              : 'text-white/55 hover:text-white hover:bg-white/[0.05] border-transparent'
          )}
        >
          <DashboardNavIcon size={20} className="flex-shrink-0" />
          <span className="flex-1">Overview</span>
        </Link>

        {/* Accordion groups */}
        <Accordion
          type="multiple"
          defaultValue={defaultOpenGroups.length > 0 ? defaultOpenGroups : ['content']}
          className="w-full -space-y-px"
        >
          {navGroups.map((group, idx) => {
            const GroupIcon = group.icon
            const groupHasActive = group.items.some(({ href }) =>
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            )
            const isFirst = idx === 0
            const isLast = idx === navGroups.length - 1
            const isContentGroup = group.value === 'content'

            return (
              <AccordionItem
                key={group.value}
                value={group.value}
                className={cn(
                  'border border-white/[0.08] bg-[#161616]',
                  isFirst && 'rounded-t-lg',
                  isLast && 'rounded-b-lg border-b',
                  isContentGroup && 'hidden md:block',
                )}
              >
                <AccordionTrigger
                  className={cn(
                    'px-3 hover:no-underline hover:bg-white/[0.03] rounded-[inherit] transition-colors',
                    groupHasActive && 'text-[#c9a70a]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2.5 rounded-xl',
                        groupHasActive
                          ? 'bg-[#967705]/20 text-[#c9a70a]'
                          : 'bg-[#967705]/10 text-[#967705]'
                      )}
                    >
                      <GroupIcon size={19} />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className={cn('text-[15px] font-semibold', groupHasActive ? 'text-[#c9a70a]' : 'text-white/80')}>
                        {group.label}
                      </span>
                      <span className="text-[12px] text-white/35">{group.subtitle}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-0">
                  <div className="space-y-0.5">
                    {group.items.map(({ label, href, icon: Icon, badge }) => {
                      const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                      const showBadge = badge === 'contacts' && unreadCount > 0
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] transition-colors group relative border',
                            active
                              ? 'bg-gradient-to-r from-[#967705]/15 to-transparent text-[#c9a70a] border-[#967705]/25 shadow-[inset_0_1px_0_rgba(150,119,5,0.15)]'
                              : 'text-white/45 hover:text-white/80 hover:bg-white/[0.05] border-transparent'
                          )}
                        >
                          <Icon size={17} className="flex-shrink-0" />
                          <span className="flex-1">{label}</span>
                          {showBadge && (
                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                          )}
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

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.08]">
        {userEmail && (
          <div className="flex items-center gap-2.5 px-1 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#967705]/20 border border-[#967705]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-base font-semibold text-[#c9a70a]">
                {userEmail[0]?.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-white/40 truncate">{userEmail}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-3 rounded-lg text-[15px] text-white/40 hover:text-white/75 hover:bg-white/[0.05] transition-colors"
        >
          <LogOutNavIcon size={17} className="flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
