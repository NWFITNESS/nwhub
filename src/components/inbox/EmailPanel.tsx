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

export function EmailPanel({ emails, onAddTask, onRefresh }: Props) {
  const [filter, setFilter] = useState<FilterType>('all')

  // suppress unused warning — onRefresh is passed through for future use
  void onRefresh

  const filtered = emails.filter(e => {
    if (filter === 'all') return true
    if (filter === 'spam') return e.archived
    if (filter === 'newsletter') return e.category === 'newsletter' || e.category === 'receipt_notification'
    return e.category === filter
  })

  return (
    <div className="flex flex-col h-full">
      {/* Filter chips */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] overflow-x-auto">
        {FILTERS.map(f => {
          const count = f.key === 'all' ? emails.length
            : f.key === 'spam' ? emails.filter(e => e.archived).length
            : f.key === 'newsletter' ? emails.filter(e => e.category === 'newsletter' || e.category === 'receipt_notification').length
            : emails.filter(e => e.category === f.key).length
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-medium transition-colors ${
                filter === f.key
                  ? 'bg-[#967705]/25 border border-[#967705]/50 text-[#f2ca50]'
                  : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/[0.07]'
              }`}
            >
              {f.label}
              {count > 0 && <span className="text-[10px] opacity-70">{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/30 text-[13px]">
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
