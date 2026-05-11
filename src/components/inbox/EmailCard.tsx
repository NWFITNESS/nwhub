'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, Plus, Check, RefreshCw } from 'lucide-react'

interface Email {
  id: string
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
  has_invoice?: boolean
}

interface Props {
  email: Email
  onAddTask: (title: string, due_date?: string) => void
  onArchive: (emailId: string) => void
  onReclassify?: (emailId: string) => void
  selected?: boolean
  onToggleSelect?: (emailId: string) => void
}

const CATEGORY_STYLES: Record<string, { label: string; className: string }> = {
  needs_attention: { label: 'Needs attention', className: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  new_lead: { label: 'New lead', className: 'bg-green-500/15 text-green-400 border-green-500/25' },
  newsletter: { label: 'Newsletter', className: 'bg-white/[0.05] text-white/35 border-white/[0.06]' },
  receipt_notification: { label: 'Receipt', className: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  spam: { label: 'Auto-archived', className: 'bg-white/[0.04] text-white/25 border-white/[0.04]' },
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function hashColor(str: string): string {
  const colors = ['#C9A70A', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
  let hash = 0
  for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) % colors.length
  return colors[Math.abs(hash)]
}

export function EmailCard({ email, onAddTask, onArchive, onReclassify, selected, onToggleSelect }: Props) {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [archiving, startArchiveTransition] = useTransition()
  const [reclassifying, setReclassifying] = useState(false)
  const category = CATEGORY_STYLES[email.category] ?? { label: email.category, className: 'bg-white/[0.05] text-white/40 border-white/[0.06]' }
  const initials = getInitials(email.sender_name, email.sender)
  const avatarColor = hashColor(email.sender)
  const isImportant = email.flagged
  const isActionable = email.category === 'needs_attention' || email.category === 'new_lead'

  return (
    <div
      className="rounded-xl border p-3.5 transition-colors"
      style={{
        background: isImportant ? 'rgba(212,160,23,0.05)' : 'var(--slate-750)',
        borderColor: isImportant ? 'rgba(150,119,5,0.25)' : 'var(--r-panel-border)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = isImportant ? 'rgba(150,119,5,0.4)' : 'rgba(255,255,255,0.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isImportant ? 'rgba(150,119,5,0.25)' : 'var(--r-panel-border)' }}
    >
      <div className="flex items-start gap-3">
        {/* Select checkbox */}
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={() => onToggleSelect(email.id)}
            className="mt-1.5 h-4 w-4 flex-shrink-0 accent-[#967705] cursor-pointer"
          />
        )}

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-black flex-shrink-0 mt-0.5"
          style={{ background: avatarColor }}
        >
          {initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white/90 truncate">
                {email.sender_name ?? email.sender}
              </p>
              <p className="text-[13px] text-white/65 truncate mt-0.5">{email.subject}</p>
            </div>
            <span className="text-[11px] text-white/35 flex-shrink-0 mt-0.5">{formatTime(email.received_at)}</span>
          </div>

          {email.preview && (
            <p className="text-[12px] text-white/40 mt-1.5 line-clamp-2">{email.preview}</p>
          )}

          {/* Tags row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {email.archived ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-green-500/15 text-green-400 border-green-500/25">
                Handled ✓
              </span>
            ) : (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${category.className}`}>
                {category.label}
              </span>
            )}
            {email.task_created && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[#967705]/15 text-[#f2ca50] border-[#967705]/25">
                Task created
              </span>
            )}
            {email.has_invoice && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-500/15 text-blue-400 border-blue-500/25">
                Invoice extracted
              </span>
            )}
          </div>

          {/* AI Summary (collapsible for flagged) */}
          {email.ai_summary && (
            <div className="mt-2">
              <button
                onClick={() => setSummaryOpen(v => !v)}
                className="flex items-center gap-1 text-[11px] text-[#f2ca50]/70 hover:text-[#f2ca50] transition-colors"
              >
                <ChevronDown size={12} className={`transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                AI Summary
              </button>
              {summaryOpen && (
                <p className="text-[12px] text-white/60 mt-1.5 leading-relaxed bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.05]">
                  {email.ai_summary}
                </p>
              )}
            </div>
          )}

          {/* Actions row */}
          <div className="mt-2 flex items-center gap-3">
            {/* Add task action */}
            {!email.task_created && isImportant && (
              <button
                onClick={() => onAddTask(`Follow up: ${email.subject}`, undefined)}
                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-[#f2ca50] transition-colors"
              >
                <Plus size={11} />
                Add to tasks
              </button>
            )}

            {/* Mark as handled */}
            {isActionable && !email.archived && (
              <button
                onClick={() => startArchiveTransition(() => onArchive(email.id))}
                disabled={archiving}
                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-green-400 transition-colors disabled:opacity-50"
              >
                <Check size={11} />
                {archiving ? 'Done…' : 'Mark handled'}
              </button>
            )}

            {/* Reclassify */}
            {onReclassify && (
              <button
                onClick={async () => {
                  setReclassifying(true)
                  await onReclassify(email.id)
                  setReclassifying(false)
                }}
                disabled={reclassifying}
                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-blue-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={11} className={reclassifying ? 'animate-spin' : ''} />
                {reclassifying ? 'Reclassifying…' : 'Reclassify'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
