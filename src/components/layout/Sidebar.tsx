'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  Image,
  Mail,
  MessageSquare,
  Users,
  Baby,
  Settings,
  LogOut,
  PanelLeftClose,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: 'contacts'
}

interface NavGroup {
  label: string | null
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ label: 'Overview', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'CONTENT',
    items: [
      { label: 'Content', href: '/content', icon: FileText },
      { label: 'Blog', href: '/blog', icon: PenSquare },
      { label: 'Media', href: '/media', icon: Image },
    ],
  },
  {
    label: 'ENGAGEMENT',
    items: [
      { label: 'Contacts', href: '/contacts', icon: Mail, badge: 'contacts' as const },
      { label: 'Kids & Teens', href: '/kids', icon: Baby },
      { label: 'Email', href: '/email', icon: Users },
      { label: 'SMS', href: '/sms', icon: MessageSquare },
    ],
  },
  {
    label: 'SYSTEM',
    items: [{ label: 'Settings', href: '/settings', icon: Settings }],
  },
]

interface SidebarProps {
  open?: boolean
  onToggle?: () => void
  unreadCount?: number
  userEmail?: string
}

export function Sidebar({ open = true, onToggle, unreadCount = 0, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen border-r border-white/[0.08] flex flex-col z-40 transition-transform duration-300 ease-in-out"
      style={{
        width: 'var(--sidebar-w)',
        background: 'linear-gradient(180deg, #131313 0%, #0d0d0d 100%)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
      }}
    >
      {/* Logo — centered, prominent */}
      <div className="relative px-5 pt-7 pb-6 border-b border-[#967705]/20 flex flex-col items-center gap-3 text-center">
        {/* Close sidebar button */}
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label="Close sidebar"
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          >
            <PanelLeftClose size={15} />
          </button>
        )}
        <div className="relative">
          <div
            className="absolute -inset-4 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(150,119,5,0.25), transparent 70%)' }}
          />
          <img src="/nw-logo.svg" alt="NW" className="w-20 h-20 object-contain relative" />
        </div>
        <div className="leading-tight">
          <p className="text-lg font-bold text-white tracking-tight">Northern Warrior</p>
          <p className="text-base font-semibold text-[#c9a70a]">Hub</p>
          <span className="inline-block mt-1.5 text-[10px] uppercase tracking-[0.25em] text-white/25 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-full">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">
        {navGroups.map((group) => (
          <div key={group.label ?? 'main'}>
            {group.label && (
              <p className="px-3 mb-2 text-xs font-semibold text-white/20 uppercase tracking-[0.2em]">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map(({ label, href, icon: Icon, badge }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                const showBadge = badge === 'contacts' && unreadCount > 0
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] transition-colors group relative ${
                      active
                        ? 'bg-gradient-to-r from-[#967705]/15 to-transparent text-[#c9a70a] border border-[#967705]/25 shadow-[inset_0_1px_0_rgba(150,119,5,0.15)]'
                        : 'text-white/55 hover:text-white hover:bg-white/[0.05] border border-transparent'
                    }`}
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
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.08]">
        {userEmail && (
          <div className="flex items-center gap-2.5 px-1 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#967705]/20 border border-[#967705]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-[#c9a70a]">
                {userEmail[0]?.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-white/30 truncate">{userEmail}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/75 hover:bg-white/[0.05] transition-colors"
        >
          <LogOut size={15} className="flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
