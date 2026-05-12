'use client'

import Link from 'next/link'
import { useMobileMenu } from '@/hooks/useMobileMenu'
import { useTheme } from '@/hooks/useTheme'

const SECTIONS = [
  {
    label: 'Members',
    items: [
      { label: 'Member List', href: '/leads', iconColor: 'gold' as const },
      { label: 'Leads', href: '/leads/pipeline', iconColor: 'gold' as const },
      { label: 'KPIs', href: '/members/kpis', iconColor: 'gold' as const },
      { label: 'Calendar', href: '/calendar', iconColor: 'blue' as const },
    ],
  },
  {
    label: 'Kids & Teens',
    items: [
      { label: 'Kids & Teens', href: '/kids', iconColor: 'blue' as const },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Website Popup', href: '/popup', iconColor: 'gold' as const },
      { label: 'All Campaigns', href: '/mailchimp', iconColor: 'gold' as const },
      { label: 'Create Campaign', href: '/mailchimp/create', iconColor: 'gold' as const },
      { label: 'AI Email Creator', href: '/mailchimp/create-ai', iconColor: 'gold' as const, tag: 'AI' },
      { label: 'Subscribers', href: '/email', iconColor: 'gold' as const },
      { label: 'Import Subscribers', href: '/email/import', iconColor: 'gold' as const },
      { label: 'Post Studio', href: '/branding', iconColor: 'gold' as const },
      { label: 'Google Reviews', href: '/branding/reviews', iconColor: 'gold' as const },
      { label: 'Documents', href: '/branding/documents', iconColor: 'gold' as const },
      { label: 'Brand Assets', href: '/branding/brand-guide', iconColor: 'gold' as const },
    ],
  },
  {
    label: 'AI',
    items: [
      { label: 'AI Chat', href: '/ai-chat', iconColor: 'gold' as const, tag: 'Bot' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Blog', href: '/blog/manage', iconColor: 'blue' as const },
      { label: 'Media Library', href: '/media', iconColor: 'blue' as const },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Integrations', href: '/sync', iconColor: 'sys' as const },
      { label: 'Settings', href: '/settings', iconColor: 'sys' as const },
    ],
  },
]

const ICONS: Record<string, React.ReactNode> = {
  'Member List': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>,
  'Leads': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  'KPIs': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
  'Calendar': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 7h12M5 1v4M11 1v4" strokeLinecap="round"/></svg>,
  'Kids & Teens': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="6" r="3"/><path d="M4 14c0-2.2 1.8-4 4-4s4 1.8 4 4"/><path d="M5 3c0-1 .5-2 3-2s3 1 3 2" strokeLinecap="round"/></svg>,
  'Website Popup': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M6 1v2M10 1v2" strokeLinecap="round"/><path d="M5 8h6M5 10.5h4" strokeLinecap="round"/></svg>,
  'All Campaigns': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5"/></svg>,
  'AI Email Creator': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 2l1.5 4.5H14l-3.5 2.5L12 14 8 11l-4 3 1.5-5L2 6.5h4.5z"/></svg>,
  'Subscribers': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>,
  'Import Subscribers': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 2v8M5 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12v2h12v-2"/></svg>,
  'Post Studio': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2" strokeLinecap="round"/></svg>,
  'Google Reviews': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 2l1.5 4.5H14l-3.5 2.5L12 14 8 11l-4 3 1.5-5L2 6.5h4.5z"/></svg>,
  'Brand Assets': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 10l4-4 3 3 3-3 2 2"/></svg>,
  'Documents': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z"/><path d="M9 1v4h4"/></svg>,
  'Blog': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></svg>,
  'Media Library': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="2" width="14" height="12" rx="2"/><circle cx="5" cy="6" r="1.5"/><path d="M1 12l4-4 3 3 3-3 4 4"/></svg>,
  'AI Chat': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>,
  'Integrations': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 1v4M4.5 3l2 3M11.5 3l-2 3M8 11v4M4.5 13l2-3M11.5 13l-2-3" strokeLinecap="round"/><circle cx="8" cy="8" r="2.5"/></svg>,
  'Settings': <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" strokeLinecap="round"/></svg>,
}

const iconStyles = {
  gold: { bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.18)', color: '#c9a84c' },
  blue: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  sys:  { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.07)', color: '#4a6080' },
}

export function MobileMenuSheet() {
  const { isOpen, close } = useMobileMenu()
  const { theme, toggle } = useTheme()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div onClick={close} className="fixed inset-0 z-[55]" style={{ background: 'rgba(0,0,0,0.5)' }} />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] overflow-y-auto rounded-t-[20px] border-t border-[rgba(255,255,255,0.09)] bg-nw-950"
        style={{ maxHeight: '85vh', paddingBottom: 'env(safe-area-inset-bottom, 20px)', animation: 'nwhub-sheet-up 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Handle */}
        <div className="mx-auto mt-2.5 mb-3 h-[3px] w-8 rounded-full bg-nw-600" />

        {/* Appearance toggle */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] px-4 pb-3 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-nw-500">Appearance</span>
          <div className="flex rounded-full bg-nw-800 border border-[rgba(255,255,255,0.07)] p-[3px]">
            <button
              onClick={() => theme !== 'dark' && toggle()}
              className="flex items-center gap-1 rounded-full px-2.5 py-[4px] text-[11px] font-semibold transition-all"
              style={{
                background: theme === 'dark' ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: theme === 'dark' ? '#c9a84c' : '#4a6080',
                boxShadow: theme === 'dark' ? '0 0 8px rgba(201,168,76,0.15)' : 'none',
              }}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => theme !== 'light' && toggle()}
              className="flex items-center gap-1 rounded-full px-2.5 py-[4px] text-[11px] font-semibold transition-all"
              style={{
                background: theme === 'light' ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: theme === 'light' ? '#b08020' : '#4a6080',
                boxShadow: theme === 'light' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              ☀️ Light
            </button>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map(section => (
          <div key={section.label}>
            <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[3px] text-nw-600">
              {section.label}
            </p>
            {section.items.map(item => {
              const s = iconStyles[item.iconColor]
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={close}
                  className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] px-4 py-2.5 no-underline active:bg-[rgba(255,255,255,0.03)]"
                >
                  <div
                    className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[8px]"
                    style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
                  >
                    {ICONS[item.label]}
                  </div>
                  <span className="flex-1 text-[13px] text-nw-300">{item.label}</span>
                  {'tag' in item && item.tag && (
                    <span className="rounded-[4px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.12)] px-1.5 py-px text-[9px] font-semibold text-gold-400">
                      {item.tag}
                    </span>
                  )}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-nw-600">
                    <path d="M3 2l3.5 3L3 8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}
