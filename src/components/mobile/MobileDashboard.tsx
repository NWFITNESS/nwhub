'use client'

import { Users, MessageSquare, Mail, Bell, UserPlus, TrendingUp, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { MobileAppBar } from './MobileAppBar'
import type { DashboardData } from '@/components/widgets/DashboardWidgetGrid'

interface Props {
  data: DashboardData
  userName?: string
}

const QUICK_ACTIONS = [
  { label: 'Add Contact', href: '/contacts',  icon: UserPlus },
  { label: 'Add Lead',    href: '/leads',     icon: TrendingUp },
  { label: 'Enquiries',  href: '/enquiries', icon: MessageSquare },
  { label: 'Send Email',  href: '/mailchimp', icon: Mail },
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
    <div className="lg:hidden flex flex-col bg-nw-950 min-h-[100dvh]">
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
        <div className="mx-3 mt-3 rounded-2xl p-4 bg-gold-600/[0.07] border border-gold-600/20">
          <p className="text-[10px] font-bold text-gold-300/60 uppercase tracking-widest mb-1 font-brand">
            Northern Warrior Hub
          </p>
          <p className="text-[22px] font-semibold text-white font-brand">
            {greeting}{userName ? `, ${userName}` : ''}
          </p>
          <p className="text-[12px] text-nw-400 mt-0.5">{formattedDate}</p>
        </div>

        {/* Stat cards — 2×2 */}
        <div className="grid grid-cols-2 mx-3 mt-2 gap-2">
          <div className="bg-nw-900 rounded-xl p-3 border border-[rgba(255,255,255,0.09)]">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-gold-300" />
              <p className="text-[10px] text-nw-500 uppercase tracking-wide">Members</p>
            </div>
            <p className="text-[22px] font-bold text-white font-brand">
              {data.membersTotal}
            </p>
          </div>

          <div className="bg-nw-900 rounded-xl p-3 border border-[rgba(255,255,255,0.09)]">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={14} className={data.enquiriesAlert ? 'text-red-400' : 'text-gold-300'} />
              <p className="text-[10px] text-nw-500 uppercase tracking-wide">Enquiries</p>
            </div>
            <p className={`text-[22px] font-bold font-brand ${data.enquiriesAlert ? 'text-red-400' : 'text-white'}`}>
              {data.newContacts}
            </p>
          </div>

          <div className="bg-nw-900 rounded-xl p-3 border border-[rgba(255,255,255,0.09)]">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={14} className="text-gold-300" />
              <p className="text-[10px] text-nw-500 uppercase tracking-wide">Subscribers</p>
            </div>
            <p className="text-[22px] font-bold text-white font-brand">
              {data.subscribers}
            </p>
          </div>

          <div className="bg-nw-900 rounded-xl p-3 border border-[rgba(255,255,255,0.09)]">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell size={14} className="text-gold-300" />
              <p className="text-[10px] text-nw-500 uppercase tracking-wide">Open Tasks</p>
            </div>
            <p className="text-[22px] font-bold text-white font-brand">
              {data.tasks.filter(t => !t.completed).length}
            </p>
          </div>
        </div>

        {/* Quick actions — 2×2 */}
        <div className="grid grid-cols-2 mx-3 mt-3 gap-2">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon
            return (
              <Link
                key={a.href}
                href={a.href}
                className="bg-nw-900 rounded-xl p-4 border border-[rgba(255,255,255,0.09)] min-h-[80px] flex flex-col justify-between active:bg-nw-800"
              >
                <div className="w-8 h-8 rounded-lg bg-nw-800 flex items-center justify-center">
                  <Icon size={14} className="text-gold-300" />
                </div>
                <span className="text-[12px] text-nw-200 font-brand">
                  {a.label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Recent enquiries */}
        {data.recentEnquiries.length > 0 && (
          <div className="mx-3 mt-4">
            <p className="text-[10px] text-nw-500 uppercase tracking-wider font-semibold mb-2">
              Recent Enquiries
            </p>
            <div className="bg-nw-900 rounded-xl border border-[rgba(255,255,255,0.09)] overflow-hidden">
              {data.recentEnquiries.slice(0, 5).map((e, i) => (
                <Link
                  key={e.id}
                  href="/enquiries"
                  className={`flex items-start gap-3 px-4 py-3 active:bg-nw-800 ${i < Math.min(data.recentEnquiries.length, 5) - 1 ? 'border-b border-[rgba(255,255,255,0.07)]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-nw-800 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white/70">
                    {e.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-nw-100 truncate">{e.name}</p>
                    <p className="text-[11px] text-nw-400 truncate">{e.message ?? e.enquiry_type}</p>
                  </div>
                  <span className="text-[10px] text-nw-500 flex-shrink-0 mt-0.5">
                    {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Blog Posts */}
        {data.recentPosts.length > 0 && (
          <div className="mx-3 mt-4">
            <p className="text-[10px] text-nw-500 uppercase tracking-wider font-semibold mb-2">
              Recent Blog Posts
            </p>
            <div className="bg-nw-900 rounded-xl border border-[rgba(255,255,255,0.09)] overflow-hidden">
              {data.recentPosts.slice(0, 4).map((post, i) => (
                <Link
                  key={post.id}
                  href="/blog/manage"
                  className={`flex items-center gap-3 px-4 py-3 active:bg-nw-800 ${i < Math.min(data.recentPosts.length, 4) - 1 ? 'border-b border-[rgba(255,255,255,0.07)]' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-nw-100 truncate">{post.title}</p>
                    <p className="text-[10px] text-nw-500 mt-0.5">
                      {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    post.status === 'published'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {post.status}
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
