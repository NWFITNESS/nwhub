'use client'

import { useState, useMemo } from 'react'
import { Mail, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmailRow } from './EmailRow'

interface Email {
  id: string
  gmail_id: string
  from_email: string | null
  from_name: string | null
  subject: string
  snippet: string | null
  category: string
  requires_reply: boolean
  replied_at: string | null
  is_flagged: boolean
  ai_summary: string | null
  ai_suggested_action: string | null
  urgency: string
  todo_id: string | null
  received_at: string | null
}

type TabKey = 'all' | 'PRIORITY' | 'NEEDS_REPLY' | 'flagged' | 'MEMBER' | 'FINANCIAL' | 'JUNK'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'PRIORITY', label: 'Priority' },
  { key: 'NEEDS_REPLY', label: 'Needs Reply' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'MEMBER', label: 'Member' },
  { key: 'FINANCIAL', label: 'Financial' },
  { key: 'JUNK', label: 'Junk' },
]

interface EmailTriageCardProps {
  initialEmails: Email[]
  gmailConnected: boolean
  gmailEmail: string | null
  onEmailsChange?: (emails: Email[]) => void
  onTodoAdded?: (todo: { id: string; title: string; source: 'email' }) => void
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-white/[0.05] bg-[#1a1a1a]">
      <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-24 bg-white/5 rounded" />
        <div className="h-2 w-40 bg-white/5 rounded" />
        <div className="h-2 w-32 bg-white/5 rounded" />
      </div>
    </div>
  )
}

export function EmailTriageCard({
  initialEmails,
  gmailConnected,
  gmailEmail,
  onTodoAdded,
}: EmailTriageCardProps) {
  const [emails, setEmails] = useState<Email[]>(initialEmails)
  const [tab, setTab] = useState<TabKey>('all')
  const [triaging, setTriaging] = useState(false)
  const [triageResult, setTriageResult] = useState<{ processed: number; todos_created: number; junk_moved: number } | null>(null)

  const filtered = useMemo(() => {
    if (tab === 'all') return emails
    if (tab === 'flagged') return emails.filter((e) => e.is_flagged)
    return emails.filter((e) => e.category === tab)
  }, [emails, tab])

  async function handleRunTriage() {
    setTriaging(true)
    setTriageResult(null)
    try {
      const res = await fetch('/api/gmail/triage', { method: 'POST' })
      const result = await res.json()
      if (res.ok) {
        setTriageResult(result)
        // Refresh email list
        const emailsRes = await fetch('/api/gmail/emails')
        if (emailsRes.ok) {
          setEmails(await emailsRes.json())
        }
      }
    } finally {
      setTriaging(false)
    }
  }

  async function handleUpdate(id: string, updates: Partial<Email>) {
    const res = await fetch(`/api/gmail/emails/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated = await res.json()
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)))
    }
  }

  async function handleAddTodo(email: Email) {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Reply: ${email.subject}`,
        source: 'email',
        email_gmail_id: email.gmail_id,
        email_subject: email.subject,
        email_from: email.from_email,
        priority: email.urgency === 'high' ? 'high' : 'medium',
      }),
    })
    if (res.ok) {
      const todo = await res.json()
      // Link todo to email
      await fetch(`/api/gmail/emails/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todo_id: todo.id }),
      })
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, todo_id: todo.id } : e)))
      onTodoAdded?.({ id: todo.id, title: todo.title, source: 'email' })
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/[0.06]" style={{ paddingLeft: 18, paddingRight: 18, paddingTop: 18, paddingBottom: 12 }}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium mb-0.5">Gmail Inbox</p>
            <h2
              className="text-xl font-bold text-[#C9A70A]"
              style={{ fontFamily: 'var(--font-rajdhani, Rajdhani), system-ui, sans-serif' }}
            >
              AI Triage
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {gmailConnected && gmailEmail && (
              <span className="text-[10px] text-white/30 truncate max-w-[140px]">{gmailEmail}</span>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0.5 flex-wrap mt-3">
          {TABS.map(({ key, label }) => {
            const count = key === 'all'
              ? emails.length
              : key === 'flagged'
              ? emails.filter((e) => e.is_flagged).length
              : emails.filter((e) => e.category === key).length
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all',
                  tab === key
                    ? 'text-[#C9A70A] border-b-2 border-[#C9A70A] rounded-none pb-0.5'
                    : 'text-white/35 hover:text-white/60'
                )}
              >
                {label}
                {count > 0 && (
                  <span className={cn('ml-1 text-[9px]', tab === key ? 'text-[#C9A70A]/70' : 'text-white/20')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto space-y-1.5" style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}>
        {!gmailConnected ? (
          /* Not connected */
          <div className="flex flex-col items-center justify-center h-full py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#967705]/10 border border-[#967705]/20 flex items-center justify-center">
              <Mail size={24} className="text-[#C9A70A]" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-white/70 mb-1">Connect Gmail</p>
              <p className="text-[12px] text-white/30 max-w-[220px] mx-auto">
                Connect your gym's Gmail account to start triaging emails with AI
              </p>
            </div>
            <a
              href="/api/gmail/connect"
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity"
            >
              Connect Gmail
            </a>
          </div>
        ) : triaging ? (
          /* Loading skeletons */
          <div className="space-y-1.5">
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Mail size={28} className="text-white/10" />
            <p className="text-[13px] text-white/25">
              {tab === 'all' ? 'No triaged emails yet — run AI Triage to start' : `No ${tab.toLowerCase()} emails`}
            </p>
          </div>
        ) : (
          filtered.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              onUpdate={handleUpdate}
              onAddTodo={handleAddTodo}
            />
          ))
        )}
      </div>

      {/* Footer: triage result */}
      {triageResult && (
        <div className="border-t border-white/[0.06] bg-[#1a1a1a]" style={{ paddingLeft: 18, paddingRight: 18, paddingTop: 10, paddingBottom: 10 }}>
          <p className="text-[11px] text-white/40">
            Processed <span className="text-white/60">{triageResult.processed}</span> emails ·{' '}
            <span className="text-[#C9A70A]">{triageResult.todos_created}</span> tasks created ·{' '}
            <span className="text-red-400/70">{triageResult.junk_moved}</span> junk moved
          </p>
        </div>
      )}

      {/* Triage button (bottom-right of card) */}
      {gmailConnected && (
        <div className="border-t border-white/[0.06] flex justify-end" style={{ paddingLeft: 18, paddingRight: 18, paddingTop: 12, paddingBottom: 12 }}>
          <button
            onClick={handleRunTriage}
            disabled={triaging}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#967705]/20 text-[#C9A70A] border border-[#967705]/30 hover:bg-[#967705]/30 transition-colors disabled:opacity-50"
          >
            {triaging ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {triaging ? 'Triaging…' : 'Run AI Triage'}
          </button>
        </div>
      )}
    </div>
  )
}
