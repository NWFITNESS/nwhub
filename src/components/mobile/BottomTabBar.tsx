'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, Baby, PoundSterling, MoreHorizontal, Settings, Mail, Megaphone, Inbox } from 'lucide-react'
import { BottomSheet } from './BottomSheet'

const tabs = [
  { id: 'overview',  label: 'Overview',  href: '/',          icon: LayoutDashboard },
  { id: 'members',   label: 'Members',   href: '/contacts',  icon: Users },
  { id: 'kids',      label: 'Classes',   href: '/kids',      icon: Baby },
  { id: 'financials',label: 'Reports',   href: '/financials',icon: PoundSterling },
  { id: 'more',      label: 'More',      href: null,         icon: MoreHorizontal },
]

const moreItems = [
  { label: 'Inbox Intelligence', href: '/inbox',              icon: Inbox },
  { label: 'Mailchimp',          href: '/mailchimp',          icon: Megaphone },
  { label: 'Email Campaigns',    href: '/email/campaigns',    icon: Mail },
  { label: 'Settings',           href: '/settings',           icon: Settings },
]

function getActiveTab(pathname: string) {
  if (pathname === '/') return 'overview'
  if (pathname.startsWith('/contacts')) return 'members'
  if (pathname.startsWith('/kids')) return 'kids'
  if (pathname.startsWith('/financials')) return 'financials'
  return 'more'
}

export function BottomTabBar() {
  const pathname = usePathname()
  const activeTab = getActiveTab(pathname)
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-nw-950 border-t border-[rgba(255,255,255,0.09)]"
        style={{ height: '56px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          if (tab.href === null) {
            return (
              <button
                key={tab.id}
                onClick={() => setMoreOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]"
              >
                <Icon size={20} className={isActive ? 'text-gold-300' : 'text-nw-600'} />
                <span className={`text-[10px] font-brand ${isActive ? 'text-gold-300' : 'text-nw-600'}`}>
                  {tab.label}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]"
            >
              <Icon size={20} className={isActive ? 'text-gold-300' : 'text-nw-600'} />
              <span className={`text-[10px] font-brand ${isActive ? 'text-gold-300' : 'text-nw-600'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* "More" bottom sheet */}
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        {moreItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
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
