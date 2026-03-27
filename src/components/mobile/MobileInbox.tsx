'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MobileAppBar } from './MobileAppBar'
import { FilterChips } from './FilterChips'
import { SectionHeader } from './SectionHeader'

interface Email {
  id: string
  sender_name?: string
  sender?: string
  subject?: string
  ai_summary?: string
  category?: string
  flagged?: boolean
  received_at?: string
}

interface Task {
  id: string
  title: string
  completed?: boolean
  due_date?: string
  priority?: string
}

interface Props {
  emails: Email[]
  tasks: Task[]
  gmailConnected: boolean
}

const EMAIL_FILTERS = [
  { id: 'all',              label: 'All' },
  { id: 'needs_attention',  label: 'Action' },
  { id: 'new_lead',         label: 'Leads' },
  { id: 'flagged',          label: 'Flagged' },
]

const TASK_FILTERS = [
  { id: 'active',   label: 'Active' },
  { id: 'all',      label: 'All' },
  { id: 'done',     label: 'Done' },
]

function categoryBadge(category?: string) {
  switch (category) {
    case 'needs_attention': return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'new_lead':        return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'newsletter':      return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    case 'receipt_notification': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    default: return 'bg-white/[0.05] text-white/30 border-white/[0.08]'
  }
}

function categoryLabel(category?: string) {
  switch (category) {
    case 'needs_attention': return 'Action'
    case 'new_lead':        return 'Lead'
    case 'newsletter':      return 'Newsletter'
    case 'receipt_notification': return 'Receipt'
    default: return category ?? ''
  }
}

function dueBadge(dueDate?: string) {
  if (!dueDate) return ''
  const due = new Date(dueDate)
  const now = new Date()
  const diff = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'bg-red-500/10 text-red-400 border-red-500/20'
  if (diff === 0) return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  if (diff <= 3) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-[#967705]/10 text-[#e0c97f] border-[#967705]/20'
}

type TabId = 'emails' | 'tasks'

export function MobileInbox({ emails, tasks, gmailConnected }: Props) {
  const [tab, setTab] = useState<TabId>('emails')
  const [emailFilter, setEmailFilter] = useState('all')
  const [taskFilter, setTaskFilter] = useState('active')

  const filteredEmails = emails.filter((e) => {
    if (emailFilter === 'all') return true
    if (emailFilter === 'flagged') return e.flagged
    return e.category === emailFilter
  })

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'active') return !t.completed
    if (taskFilter === 'done') return t.completed
    return true
  })

  const flaggedCount = emails.filter(e => e.flagged).length
  const openTaskCount = tasks.filter(t => !t.completed).length

  return (
    <div className="lg:hidden flex flex-col bg-[#0f0f0f] min-h-[100dvh]">
      <MobileAppBar
        title="Inbox"
        count={flaggedCount + openTaskCount}
      />

      {/* Tab switcher */}
      <div className="flex border-b border-[#1e1e1e] px-3">
        {(['emails', 'tasks'] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[13px] font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[#e0c97f] text-[#e0c97f]'
                : 'border-transparent text-[#555]'
            }`}
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            {t === 'emails' ? `Emails${flaggedCount > 0 ? ` (${flaggedCount})` : ''}` : `Tasks${openTaskCount > 0 ? ` (${openTaskCount})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'emails' && (
        <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))]">
          {!gmailConnected ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-[14px] text-[#888]">Gmail not connected</p>
              <Link href="/api/gmail/connect" className="px-5 py-2.5 rounded-xl bg-[#e0c97f] text-[#0d0d0d] text-[13px] font-semibold">
                Connect Gmail
              </Link>
            </div>
          ) : (
            <>
              <FilterChips filters={EMAIL_FILTERS} active={emailFilter} onChange={setEmailFilter} />
              {filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-[14px] text-[#555]">No emails</p>
                </div>
              ) : (
                filteredEmails.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#1a1a1a]">
                    <div className="w-9 h-9 rounded-full bg-[#1e2a3a] flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white/70">
                      {(e.sender_name ?? e.sender ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-medium text-white truncate">{e.sender_name ?? e.sender}</span>
                        {e.category && (
                          <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${categoryBadge(e.category)}`}>
                            {categoryLabel(e.category)}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-white/60 truncate">{e.subject}</p>
                      {e.ai_summary && (
                        <p className="text-[11px] text-[#888] truncate mt-0.5">{e.ai_summary}</p>
                      )}
                    </div>
                    {e.received_at && (
                      <span className="text-[10px] text-[#555] flex-shrink-0 mt-0.5">
                        {new Date(e.received_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))]">
          <FilterChips filters={TASK_FILTERS} active={taskFilter} onChange={setTaskFilter} />
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-[14px] text-[#555]">No tasks</p>
            </div>
          ) : (
            <>
              <SectionHeader label={taskFilter === 'done' ? 'Completed' : 'Open'} />
              {filteredTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1a1a1a]">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${t.completed ? 'bg-[#e0c97f] border-[#e0c97f]' : 'border-[#333]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-medium ${t.completed ? 'line-through text-[#555]' : 'text-white'}`}>
                      {t.title}
                    </p>
                  </div>
                  {t.due_date && (
                    <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${dueBadge(t.due_date)}`}>
                      {new Date(t.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
