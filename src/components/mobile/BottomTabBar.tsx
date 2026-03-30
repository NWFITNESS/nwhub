'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, PoundSterling, BookOpen,
  Inbox, Mail, Megaphone, Baby, Calendar, Image, Settings, MoreHorizontal,
} from 'lucide-react'
import { BottomSheet } from './BottomSheet'

const tabs = [
  { id: 'overview',   label: 'Overview', href: '/',           icon: LayoutDashboard },
  { id: 'members',    label: 'Members',  href: '/leads',      icon: Users },
  { id: 'content',    label: 'Content',  href: '/content',    icon: BookOpen },
  { id: 'revenue',    label: 'Revenue',  href: '/financials', icon: PoundSterling },
]

const menuItems = [
  { label: 'Inbox Intelligence', href: '/inbox',           icon: Inbox },
  { label: 'Email Marketing',    href: '/mailchimp',       icon: Megaphone },
  { label: 'Blog & Posts',       href: '/blog/manage',     icon: Mail },
  { label: 'Calendar',           href: '/calendar',        icon: Calendar },
  { label: 'Media Library',      href: '/media',           icon: Image },
  { label: 'Kids & Teens',       href: '/kids',            icon: Baby },
  { label: 'Settings',           href: '/settings',        icon: Settings },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function BottomTabBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 md:hidden items-center justify-around border-t border-[rgba(255,255,255,0.09)] bg-nw-950 px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(pathname, tab.href)
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex flex-col items-center gap-0.5 rounded-[8px] px-3 py-1.5 transition-colors ${active ? 'text-gold-300' : 'text-nw-500'}`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-gold-400" />}
            </Link>
          )
        })}

        {/* More tab */}
        <button
          onClick={() => setMenuOpen(true)}
          className="relative flex flex-col items-center gap-0.5 rounded-[8px] px-3 py-1.5 transition-colors text-nw-500"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* Navigation bottom sheet */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Navigation">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-4 px-5 py-4 border-b border-[rgba(255,255,255,0.07)] last:border-0 active:bg-nw-800"
            >
              <Icon size={18} className="text-gold-300 flex-shrink-0" />
              <span className="text-[14px] text-nw-200">{item.label}</span>
            </Link>
          )
        })}
      </BottomSheet>
    </>
  )
}
