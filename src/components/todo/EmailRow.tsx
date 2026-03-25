'use client'

import { useState } from 'react'
import { Flag, CheckCheck, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, parseISO } from 'date-fns'

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

interface EmailRowProps {
  email: Email
  onUpdate: (id: string, updates: Partial<Email>) => Promise<void>
  onAddTodo: (email: Email) => Promise<void>
}

const CATEGORY_STYLES: Record<string, string> = {
  PRIORITY: 'bg-red-500/15 text-red-400',
  NEEDS_REPLY: 'bg-amber-500/15 text-amber-400',
  MEMBER: 'bg-blue-500/15 text-blue-400',
  FINANCIAL: 'bg-purple-500/15 text-purple-400',
  SUPPLIER: 'bg-slate-500/15 text-slate-400',
  INFO: 'bg-white/[0.05] text-white/40',
  JUNK: 'bg-white/[0.05] text-white/30',
}

const URGENCY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-green-500',
}

/** Generate a stable colour from a string for sender avatars */
function avatarColor(str: string): string {
  const colours = [
    'bg-blue-600', 'bg-purple-600', 'bg-teal-600', 'bg-rose-600',
    'bg-orange-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-green-700',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colours[Math.abs(hash) % colours.length]
}

function initials(name: string | null, email: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  return (email?.[0] ?? '?').toUpperCase()
}

export function EmailRow({ email, onUpdate, onAddTodo }: EmailRowProps) {
  const [hovered, setHovered] = useState(false)
  const [loadingReply, setLoadingReply] = useState(false)
  const [loadingFlag, setLoadingFlag] = useState(false)
  const [loadingTodo, setLoadingTodo] = useState(false)

  const senderLabel = email.from_name || email.from_email || 'Unknown'
  const avatarInitials = initials(email.from_name, email.from_email)
  const avatarClass = avatarColor(email.from_email ?? email.from_name ?? '')

  const timeAgo = email.received_at
    ? formatDistanceToNow(parseISO(email.received_at), { addSuffix: true })
    : ''

  async function handleMarkReplied() {
    setLoadingReply(true)
    try {
      await onUpdate(email.id, { replied_at: new Date().toISOString(), requires_reply: false } as Partial<Email>)
    } finally {
      setLoadingReply(false)
    }
  }

  async function handleToggleFlag() {
    setLoadingFlag(true)
    try {
      await onUpdate(email.id, { is_flagged: !email.is_flagged })
    } finally {
      setLoadingFlag(false)
    }
  }

  async function handleAddTodo() {
    setLoadingTodo(true)
    try {
      await onAddTodo(email)
    } finally {
      setLoadingTodo(false)
    }
  }

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors cursor-default',
        'border-white/[0.05] bg-[#1a1a1a] hover:border-white/10 hover:bg-[#1e1e1e]'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div className={cn('w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white', avatarClass)}>
        {avatarInitials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white/80 truncate">{senderLabel}</p>
            {email.from_email && email.from_name && (
              <p className="text-[10px] text-white/30 truncate">{email.from_email}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Urgency dot */}
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', URGENCY_DOT[email.urgency] ?? 'bg-white/20')} />
            {/* Category badge */}
            <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide', CATEGORY_STYLES[email.category])}>
              {email.category.replace('_', ' ')}
            </span>
            {/* Replied badge */}
            {email.replied_at && (
              <span className="text-[9px] text-green-500/70">Replied</span>
            )}
            {/* Flagged */}
            {email.is_flagged && (
              <Flag size={10} className="text-[#C9A70A]" />
            )}
          </div>
        </div>

        <p className="text-[12px] font-medium text-white/70 truncate mt-0.5">{email.subject}</p>
        {email.ai_summary && (
          <p className="text-[11px] text-white/35 truncate mt-0.5">{email.ai_summary}</p>
        )}

        {/* Time + actions */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-white/25">{timeAgo}</span>

          {/* Hover actions */}
          <div className={cn('flex items-center gap-1 transition-opacity', hovered ? 'opacity-100' : 'opacity-0')}>
            {!email.todo_id && (
              <button
                onClick={handleAddTodo}
                disabled={loadingTodo}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white/40 hover:text-[#C9A70A] hover:bg-[#C9A70A]/10 transition-colors"
              >
                <Plus size={10} />
                Add to To-Do
              </button>
            )}
            {email.requires_reply && !email.replied_at && (
              <button
                onClick={handleMarkReplied}
                disabled={loadingReply}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white/40 hover:text-green-400 hover:bg-green-400/10 transition-colors"
              >
                <CheckCheck size={10} />
                Mark Replied
              </button>
            )}
            <button
              onClick={handleToggleFlag}
              disabled={loadingFlag}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors',
                email.is_flagged
                  ? 'text-[#C9A70A] hover:text-white/40 hover:bg-white/5'
                  : 'text-white/40 hover:text-[#C9A70A] hover:bg-[#C9A70A]/10'
              )}
            >
              <Flag size={10} />
              {email.is_flagged ? 'Unflag' : 'Flag'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
