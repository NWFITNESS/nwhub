'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, PoundSterling, Menu,
  Inbox, Mail, Megaphone, Baby, Calendar, Image, Settings, BookOpen,
} from 'lucide-react'
import { BottomSheet } from './BottomSheet'

const tabs = [
  { id: 'overview',   label: 'Overview',   href: '/',            icon: LayoutDashboard },
  { id: 'blog',       label: 'Blog',       href: '/blog/manage', icon: BookOpen },
  { id: 'financials', label: 'Financials', href: '/financials',  icon: PoundSterling },
  { id: 'clients',    label: 'Clients',    href: '/contacts',    icon: Users },
]

const menuItems = [
  { label: 'Inbox Intelligence', href: '/inbox',           icon: Inbox },
  { label: 'Email Campaigns',    href: '/email/campaigns', icon: Mail },
  { label: 'Mailchimp',          href: '/mailchimp',       icon: Megaphone },
  { label: 'Kids / Classes',     href: '/kids',            icon: Baby },
  { label: 'Calendar',           href: '/calendar',        icon: Calendar },
  { label: 'Media',              href: '/media',           icon: Image },
  { label: 'Settings',           href: '/settings',        icon: Settings },
]

function getActiveTab(pathname: string): string | null {
  if (pathname === '/') return 'overview'
  if (pathname.startsWith('/blog')) return 'blog'
  if (pathname.startsWith('/financials')) return 'financials'
  if (pathname.startsWith('/contacts')) return 'clients'
  return null
}

export function BottomTabBar() {
  const pathname = usePathname()
  const activeTab = getActiveTab(pathname)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-nw-950 border-t border-[rgba(255,255,255,0.09)]"
        style={{ height: '56px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Burger / Menu */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative"
        >
          <Menu size={20} className="text-nw-500" />
          <span className="text-[10px] font-brand text-nw-500">Menu</span>
        </button>

        {/* 4 main tabs */}
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative"
            >
              <Icon size={20} className={isActive ? 'text-gold-300' : 'text-nw-500'} />
              <span className={`text-[10px] font-brand ${isActive ? 'text-gold-300' : 'text-nw-500'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-gold-300" />
              )}
            </Link>
          )
        })}
      </div>

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
