'use client'

import { Users, MessageSquare, Mail, Bell, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { MobileAppBar } from './MobileAppBar'
import type { DashboardData } from '@/components/widgets/DashboardWidgetGrid'

interface Props {
  data: DashboardData
  userName?: string
}

const QUICK_ACTIONS = [
  { label: 'Add Contact',  href: '/contacts',  color: '#1e3a2f' },
  { label: 'Add Lead',     href: '/leads',     color: '#1e2a3a' },
  { label: 'Enquiries',   href: '/enquiries', color: '#2a1e3a' },
  { label: 'Send Email',   href: '/mailchimp', color: '#3a2a1e' },
]

export function MobileDashboard({ data, userName }: Props) {
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="lg:hidden flex flex-col bg-[#0f0f0f] min-h-[100dvh]">
      <MobileAppBar
        title="Overview"
        actions={
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-white/50 active:bg-white/[0.06]">
            <Bell size={18} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Hero card */}
        <div className="mx-3 mt-3 rounded-2xl p-4 bg-[#1a1500] border border-[#3a2e00]">
          <p className="text-[10px] font-bold text-[#e0c97f]/60 uppercase tracking-widest mb-1"
             style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Northern Warrior Hub
          </p>
          <p className="text-[22px] font-semibold text-white"
             style={{ fontFamily: 'Rajdhani, League Spartan, sans-serif' }}>
            {greeting}{userName ? `, ${userName}` : ''}
          </p>
          <p className="text-[12px] text-[#888] mt-0.5">{formattedDate}</p>
        </div>

        {/* Stat cards — 2×2 */}
        <div className="grid grid-cols-2 mx-3 mt-2 gap-2">
          <div className="bg-[#111] rounded-xl p-3 border border-[#1e1e1e]">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-[#e0c97f]" />
              <p className="text-[10px] text-[#555] uppercase tracking-wide">Members</p>
            </div>
            <p className="text-[22px] font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {data.membersTotal}
            </p>
          </div>

          <div className="bg-[#111] rounded-xl p-3 border border-[#1e1e1e]">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={14} className={data.enquiriesAlert ? 'text-red-400' : 'text-[#e0c97f]'} />
              <p className="text-[10px] text-[#555] uppercase tracking-wide">Enquiries</p>
            </div>
            <p className={`text-[22px] font-bold ${data.enquiriesAlert ? 'text-red-400' : 'text-white'}`}
               style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {data.newContacts}
            </p>
          </div>

          <div className="bg-[#111] rounded-xl p-3 border border-[#1e1e1e]">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={14} className="text-[#e0c97f]" />
              <p className="text-[10px] text-[#555] uppercase tracking-wide">Subscribers</p>
            </div>
            <p className="text-[22px] font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {data.subscribers}
            </p>
          </div>

          <div className="bg-[#111] rounded-xl p-3 border border-[#1e1e1e]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[14px]">🏋️</span>
              <p className="text-[10px] text-[#555] uppercase tracking-wide">Open Tasks</p>
            </div>
            <p className="text-[22px] font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              —
            </p>
          </div>
        </div>

        {/* Quick actions — 2×2 */}
        <div className="grid grid-cols-2 mx-3 mt-3 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="bg-[#111] rounded-xl p-4 border border-[#1e1e1e] min-h-[80px] flex flex-col justify-between active:bg-[#1a1a1a]"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: a.color }}
              >
                <ChevronRight size={14} className="text-[#e0c97f]" />
              </div>
              <span
                className="text-[12px] text-white/70"
                style={{ fontFamily: 'Rajdhani, League Spartan, sans-serif' }}
              >
                {a.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Recent enquiries */}
        {data.recentEnquiries.length > 0 && (
          <div className="mx-3 mt-4">
            <p className="text-[10px] text-[#555] uppercase tracking-wider font-semibold mb-2">
              Recent Enquiries
            </p>
            <div className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
              {data.recentEnquiries.slice(0, 5).map((e, i) => (
                <Link
                  key={e.id}
                  href="/enquiries"
                  className={`flex items-start gap-3 px-4 py-3 active:bg-[#1a1a1a] ${i < data.recentEnquiries.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#1e2a3a] flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white/70">
                    {e.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white truncate">{e.name}</p>
                    <p className="text-[11px] text-[#888] truncate">{e.message ?? e.enquiry_type}</p>
                  </div>
                  <span className="text-[10px] text-[#555] flex-shrink-0 mt-0.5">
                    {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
