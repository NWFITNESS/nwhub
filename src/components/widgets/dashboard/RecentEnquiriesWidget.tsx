'use client'

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

interface Enquiry {
  id: string
  name: string
  enquiry_type: string
  message: string | null
  created_at: string
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  enquiries: Enquiry[]
}

export function RecentEnquiriesWidget({ enquiries }: Props) {
  if (!enquiries || enquiries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <MessageSquare size={20} className="text-white/20" />
        </div>
        <p className="text-sm font-medium text-white/40">No enquiries yet</p>
        <p className="text-xs text-white/20 text-center max-w-[240px]">
          New enquiries from the website will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end mb-2">
        <Link href="/contacts" className="text-xs font-semibold text-white/40 hover:text-[#C9A70A] transition-colors duration-200">
          View all →
        </Link>
      </div>
      <ul className="divide-y divide-white/[0.04] flex-1">
        {enquiries.map((e) => {
          const initials = e.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
          const preview = e.message
            ? String(e.message).slice(0, 70) + (String(e.message).length > 70 ? '…' : '')
            : e.enquiry_type
          return (
            <li
              key={e.id}
              className="py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors duration-200 rounded-lg px-1"
            >
              <div className="w-9 h-9 rounded-full bg-[#967705]/15 border border-[#967705]/25 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#C9A70A]">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F0F0F0] truncate">{e.name}</p>
                <p className="text-xs text-white/30 truncate mt-0.5">{preview}</p>
              </div>
              <span className="text-xs text-white/20 flex-shrink-0">{formatTimeAgo(e.created_at)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
