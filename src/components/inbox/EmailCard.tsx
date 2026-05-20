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
  onClick?: () => void
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

export function EmailCard({ email, onAddTask, onArchive, onReclassify, selected, onToggleSelect, onClick }: Props) {
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
      className={`rounded-xl border transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        padding: 16,
        background: isImportant ? 'rgba(212,160,23,0.05)' : 'var(--slate-750)',
        borderColor: isImportant ? 'rgba(150,119,5,0.25)' : 'var(--r-panel-border)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = isImportant ? 'rgba(150,119,5,0.4)' : 'rgba(255,255,255,0.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isImportant ? 'rgba(150,119,5,0.25)' : 'var(--r-panel-border)' }}
      onClick={e => { if (onClick && !(e.target as HTMLElement).closest('button, input, a')) onClick() }}
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
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-black flex-shrink-0 mt-0.5"
          style={{ background: avatarColor, fontSize: 12 }}
        >
          {initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-white truncate" style={{ fontSize: 15 }}>
                {email.sender_name ?? email.sender}
              </p>
              <p className="text-white/80 truncate mt-0.5" style={{ fontSize: 14 }}>{email.subject}</p>
            </div>
            <span className="text-white/45 flex-shrink-0 mt-0.5" style={{ fontSize: 12 }}>{formatTime(email.received_at)}</span>
          </div>

          {email.preview && (
            <p className="text-white/55 mt-1.5 line-clamp-2" style={{ fontSize: 13 }}>{email.preview}</p>
          )}

          {/* Tags row */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {email.archived ? (
              <span className="font-semibold rounded-full border bg-green-500/15 text-green-400 border-green-500/25" style={{ fontSize: 11, padding: '2px 10px' }}>
                Handled ✓
              </span>
            ) : (
              <span className={`font-semibold rounded-full border ${category.className}`} style={{ fontSize: 11, padding: '2px 10px' }}>
                {category.label}
              </span>
            )}
            {email.task_created && (
              <span className="font-semibold rounded-full border bg-[#967705]/15 text-[#c9a70a] border-[#967705]/25" style={{ fontSize: 11, padding: '2px 10px' }}>
                Task created
              </span>
            )}
            {email.has_invoice && (
              <span className="font-semibold rounded-full border bg-blue-500/15 text-blue-400 border-blue-500/25" style={{ fontSize: 11, padding: '2px 10px' }}>
                Invoice extracted
              </span>
            )}
          </div>

          {/* AI Summary — always visible for important emails, collapsible for others */}
          {email.ai_summary && isActionable && (
            <div className="mt-3 rounded-lg" style={{ padding: '10px 14px', background: 'rgba(201,167,10,0.05)', borderLeft: '3px solid rgba(201,167,10,0.4)', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              {email.ai_summary}
            </div>
          )}
          {email.ai_summary && !isActionable && (
            <div className="mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); setSummaryOpen(v => !v) }}
                className="flex items-center gap-1 text-[#c9a70a]/70 hover:text-[#c9a70a] transition-colors"
                style={{ fontSize: 12 }}
              >
                <ChevronDown size={12} className={`transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                AI Summary
              </button>
              {summaryOpen && (
                <p className="text-white/60 mt-1.5 leading-relaxed bg-white/[0.03] rounded-lg border border-white/[0.05]" style={{ fontSize: 13, padding: '8px 12px' }}>
                  {email.ai_summary}
                </p>
              )}
            </div>
          )}

          {/* Actions row */}
          <div className="mt-2.5 flex items-center gap-3">
            {!email.task_created && isImportant && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddTask(`Follow up: ${email.subject}`, undefined) }}
                className="flex items-center gap-1 text-white/55 hover:text-[#c9a70a] transition-colors"
                style={{ fontSize: 12 }}
              >
                <Plus size={12} />
                Add to tasks
              </button>
            )}

            {/* Mark as handled */}
            {isActionable && !email.archived && (
              <button
                onClick={(e) => { e.stopPropagation(); startArchiveTransition(() => onArchive(email.id)) }}
                disabled={archiving}
                className="flex items-center gap-1 text-white/55 hover:text-green-400 transition-colors disabled:opacity-50"
                style={{ fontSize: 12 }}
              >
                <Check size={12} />
                {archiving ? 'Done…' : 'Mark handled'}
              </button>
            )}

            {/* Reclassify */}
            {onReclassify && (
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  setReclassifying(true)
                  await onReclassify(email.id)
                  setReclassifying(false)
                }}
                disabled={reclassifying}
                className="flex items-center gap-1 text-white/55 hover:text-blue-400 transition-colors disabled:opacity-50"
                style={{ fontSize: 12 }}
              >
                <RefreshCw size={12} className={reclassifying ? 'animate-spin' : ''} />
                {reclassifying ? 'Reclassifying…' : 'Reclassify'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
