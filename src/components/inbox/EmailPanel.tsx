'use client'

import { useState, useMemo } from 'react'
import { EmailCard } from './EmailCard'
import { Check } from 'lucide-react'

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
  onArchive: (emailId: string) => void
  onBulkArchive: (emailIds: string[]) => void
  onRefresh: () => void
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'needs_attention', label: 'Needs Action' },
  { key: 'new_lead', label: 'New Leads' },
  { key: 'newsletter', label: 'Categorised' },
  { key: 'spam', label: 'Archived' },
]

export function EmailPanel({ emails, onAddTask, onArchive, onBulkArchive }: Props) {
  // Default to needs_attention so the admin lands on priority emails, not the
  // full firehose including archives and newsletters.
  const [filter, setFilter] = useState<FilterType>('needs_attention')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => emails.filter(e => {
    // "All" shows everything EXCEPT archived — it's the active inbox, not a
    // full history dump. Archived emails live in their own tab.
    if (filter === 'all') return !e.archived
    if (filter === 'spam') return e.archived
    if (filter === 'newsletter') return !e.archived && (e.category === 'newsletter' || e.category === 'receipt_notification')
    if (filter === 'needs_attention') return !e.archived && e.category === 'needs_attention'
    if (filter === 'new_lead') return !e.archived && e.category === 'new_lead'
    return e.category === filter
  }), [emails, filter])

  // Only allow selection on non-archived emails (you can't "handle" what's already archived)
  const selectableIds = useMemo(() => new Set(filtered.filter(e => !e.archived).map(e => e.id)), [filtered])
  const allSelected = selectableIds.size > 0 && [...selectableIds].every(id => selectedIds.has(id))
  const someSelected = selectedIds.size > 0

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(selectableIds))
    }
  }

  function handleBulkHandled() {
    const ids = [...selectedIds].filter(id => selectableIds.has(id))
    if (!ids.length) return
    onBulkArchive(ids)
    setSelectedIds(new Set())
  }

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="border-b border-white/[0.06]" style={{ paddingLeft: 18, paddingRight: 18, paddingTop: 18, paddingBottom: 16 }}>
        <p className="text-[10px] font-semibold text-[#d4af37]/70 uppercase tracking-[0.2em]">
          Processed Emails
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {FILTERS.map(f => {
            const count = f.key === 'all' ? emails.filter(e => !e.archived).length
              : f.key === 'spam' ? emails.filter(e => e.archived).length
              : f.key === 'newsletter' ? emails.filter(e => !e.archived && (e.category === 'newsletter' || e.category === 'receipt_notification')).length
              : f.key === 'needs_attention' ? emails.filter(e => !e.archived && e.category === 'needs_attention').length
              : f.key === 'new_lead' ? emails.filter(e => !e.archived && e.category === 'new_lead').length
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

      {/* Bulk action bar — appears when any emails are selected */}
      {someSelected && (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#967705]/10" style={{ paddingLeft: 18, paddingRight: 18, paddingTop: 10, paddingBottom: 10 }}>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-white/60">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 accent-[#967705]"
              />
              {allSelected ? 'Deselect all' : 'Select all'}
            </label>
            <span className="text-[11px] text-white/40">
              {selectedIds.size} selected
            </span>
          </div>
          <button
            onClick={handleBulkHandled}
            className="flex items-center gap-1.5 rounded-lg bg-[#967705]/20 border border-[#967705]/40 px-3 py-1.5 text-[12px] font-semibold text-[#f2ca50] transition-colors hover:bg-[#967705]/30"
          >
            <Check size={13} />
            Mark {selectedIds.size} handled
          </button>
        </div>
      )}

      {/* Select-all toggle when no selection active (subtle, under the filter tabs) */}
      {!someSelected && selectableIds.size > 0 && (
        <div className="flex items-center gap-2 border-b border-white/[0.04]" style={{ paddingLeft: 18, paddingRight: 18, paddingTop: 8, paddingBottom: 8 }}>
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-white/35 hover:text-white/55 transition-colors">
            <input
              type="checkbox"
              checked={false}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 accent-[#967705]"
            />
            Select all
          </label>
        </div>
      )}

      {/* Email list */}
      <div className="space-y-2" style={{ padding: 16 }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/25 text-[13px]">
            No emails in this category
          </div>
        ) : (
          filtered.map(email => (
            <EmailCard
              key={email.id}
              email={email}
              onAddTask={onAddTask}
              onArchive={onArchive}
              selected={selectedIds.has(email.id)}
              onToggleSelect={email.archived ? undefined : toggleSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
