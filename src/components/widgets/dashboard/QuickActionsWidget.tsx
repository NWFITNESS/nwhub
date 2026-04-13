'use client'

import Link from 'next/link'
import { Mail, LayoutTemplate, Newspaper, Send } from 'lucide-react'

const QUICK_ACTIONS = [
  {
    icon: Mail,
    title: 'Contacts & Enquiries',
    desc: 'View inbound enquiries, track leads from the AI chat, and manage your contacts.',
    href: '/contacts',
  },
  {
    icon: LayoutTemplate,
    title: 'Edit Website Content',
    desc: 'Update page copy, hero sections, memberships, FAQs and more without touching code.',
    href: '/content',
    mobileHide: true,
  },
  {
    icon: Newspaper,
    title: 'Blog & Posts',
    desc: 'Write and publish blog posts to keep members informed and improve SEO.',
    href: '/blog',
  },
  {
    icon: Send,
    title: 'Email Campaigns',
    desc: 'Send newsletters and campaigns to your subscriber list via Mailchimp.',
    href: '/mailchimp',
  },
]

export function QuickActionsWidget() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.title}
            href={action.href}
            className={`group bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-start gap-4 hover:border-[#967705]/40 hover:bg-[#1a1a1a] transition-all duration-200 cursor-pointer ${action.mobileHide ? 'hidden md:flex' : ''}`}
            style={{ padding: 16 }}
          >
            <div className="w-10 h-10 rounded-lg bg-[#967705]/10 border border-[#967705]/20 flex items-center justify-center flex-shrink-0 group-hover:border-[#967705]/40 transition-colors duration-200">
              <Icon size={18} className="text-[#C9A70A]" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#F0F0F0] group-hover:text-[#C9A70A] transition-colors duration-200 leading-tight">
                {action.title}
              </p>
              <p className="text-xs text-white/40 mt-1 leading-relaxed">{action.desc}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
