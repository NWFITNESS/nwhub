'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useMobileMenu } from '@/hooks/useMobileMenu'

const TABS = [
  {
    label: 'Overview',
    href: '/',
    icon: (c: string) => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.7"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
  },
  {
    label: 'Inbox',
    href: '/inbox',
    badge: true,
    icon: (c: string) => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5"/></svg>,
  },
  {
    label: 'Members',
    href: '/leads',
    icon: (c: string) => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.7"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>,
  },
  {
    label: 'Financials',
    href: '/financials',
    icon: (c: string) => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.7"><path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="1" width="14" height="14" rx="2"/></svg>,
  },
  {
    label: 'Menu',
    href: null,
    icon: (c: string) => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/></svg>,
  },
]

function isTabActive(pathname: string, href: string | null) {
  if (href === null) return false
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function BottomTabBar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()
  const { isOpen, open, close } = useMobileMenu()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-[rgba(255,255,255,0.09)] bg-nw-950"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
    >
      {TABS.map((tab) => {
        const active = tab.href === null ? isOpen : isTabActive(pathname, tab.href)
        const color = active ? 'var(--nw-gold, #c9a84c)' : 'var(--nw-muted, #4a6080)'

        const inner = (
          <div className="relative flex flex-1 flex-col items-center gap-[3px] py-2 cursor-pointer">
            {active && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[22px] h-[2px] rounded-b-sm" style={{ background: 'var(--nw-gold, #c9a84c)', boxShadow: '0 0 6px rgba(201,168,76,0.5)' }} />
            )}
            <div className="relative">
              {tab.icon(color)}
              {tab.badge && unreadCount > 0 && (
                <div className="absolute -top-0.5 -right-1 w-[7px] h-[7px] rounded-full bg-[#3b82f6]" style={{ border: '1.5px solid var(--nw-950, #07090f)' }} />
              )}
            </div>
            <span style={{ fontSize: 9, color, letterSpacing: '0.3px' }}>{tab.label}</span>
          </div>
        )

        if (tab.href === null) {
          return <div key={tab.label} className="flex-1" onClick={isOpen ? close : open}>{inner}</div>
        }

        return (
          <Link key={tab.label} href={tab.href} className="flex-1 no-underline" onClick={isOpen ? close : undefined}>
            {inner}
          </Link>
        )
      })}
    </nav>
  )
}
