'use client'

import { useState } from 'react'
import { EmailCard } from './EmailCard'

type FilterType = 'all' | 'needs_attention' | 'new_lead' | 'newsletter' | 'receipt_notification' | 'spam'

interface Email {
  id: string
  gmail_message_id: string
  sender: string
  sender_name: string | null
  subject: string
  preview: string | null
  received_at: string | null
  category: string
  ai_summary: string | null
  flagged: boolean
  archived: boolean
  task_created: boolean
  task_id: string | null
}

interface Props {
  emails: Email[]
  onAddTask: (title: string, due_date?: string) => void
  onRefresh: () => void
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'needs_attention', label: 'Needs Action' },
  { key: 'new_lead', label: 'New Leads' },
  { key: 'newsletter', label: 'Categorised' },
  { key: 'spam', label: 'Archived' },
]

export function EmailPanel({ emails, onAddTask }: Props) {
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = emails.filter(e => {
    if (filter === 'all') return true
    if (filter === 'spam') return e.archived
    if (filter === 'newsletter') return e.category === 'newsletter' || e.category === 'receipt_notification'
    return e.category === filter
  })

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <p className="text-[10px] font-semibold text-[#d4af37]/70 uppercase tracking-[0.2em]">
          Processed Emails
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {FILTERS.map(f => {
            const count = f.key === 'all' ? emails.length
              : f.key === 'spam' ? emails.filter(e => e.archived).length
              : f.key === 'newsletter' ? emails.filter(e => e.category === 'newsletter' || e.category === 'receipt_notification').length
              : emails.filter(e => e.category === f.key).length
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-medium transition-all ${
                  filter === f.key
                    ? 'bg-[#967705]/20 border border-[#967705]/40 text-[#f2ca50]'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.06]'
                }`}
              >
                {f.label}
                {count > 0 && <span className="text-[10px] opacity-60">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Email list */}
      <div className="p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/25 text-[13px]">
            No emails in this category
          </div>
        ) : (
          filtered.map(email => (
            <EmailCard key={email.id} email={email} onAddTask={onAddTask} />
          ))
        )}
      </div>
    </div>
  )
}
