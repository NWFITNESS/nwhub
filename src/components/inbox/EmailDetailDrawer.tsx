'use client'

import { X, Plus, Check, RefreshCw, Archive, Tag, Clock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
  rule_matched_id?: string | null
}

interface Props {
  email: Email | null
  onClose: () => void
  onAddTask: (title: string) => void
  onArchive: (emailId: string) => void
  onReclassify?: (emailId: string) => void
  ruleName?: string | null
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  needs_attention: { label: 'Needs Attention', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  new_lead: { label: 'New Lead', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  newsletter: { label: 'Newsletter', color: '#a1a1aa', bg: 'rgba(161,161,170,0.08)' },
  receipt_notification: { label: 'Receipt', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  spam: { label: 'Spam', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function EmailDetailDrawer({ email, onClose, onAddTask, onArchive, onReclassify, ruleName }: Props) {
  if (!email) return null

  const cat = CATEGORY_LABELS[email.category] ?? { label: email.category, color: '#a1a1aa', bg: 'rgba(255,255,255,0.04)' }
  const initials = (email.sender_name || email.sender).slice(0, 2).toUpperCase()

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[520px] overflow-y-auto border-l border-[rgba(255,255,255,0.08)] bg-nw-900"
        style={{ animation: 'nwhub-sheet-up 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.07)]" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Email Detail</span>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }} className="flex flex-col gap-5">
          {/* Sender + time */}
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 44, height: 44, background: 'rgba(201,167,10,0.15)', border: '1px solid rgba(201,167,10,0.25)', fontSize: 14, fontWeight: 700, color: '#C9A70A' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                {email.sender_name || email.sender}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{email.sender}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                <Clock size={11} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
                {timeAgo(email.received_at)}
                {email.received_at && ` · ${new Date(email.received_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>

          {/* Subject */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Subject</p>
            <p style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
              {email.subject}
            </p>
          </div>

          {/* Category + rule */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border"
              style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, color: cat.color, background: cat.bg, borderColor: cat.color + '30' }}
            >
              {cat.label}
            </span>
            {email.flagged && (
              <span className="rounded-full border" style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.25)' }}>
                Flagged
              </span>
            )}
            {email.task_created && (
              <span className="rounded-full border" style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#C9A70A', background: 'rgba(201,167,10,0.1)', borderColor: 'rgba(201,167,10,0.25)' }}>
                Task created
              </span>
            )}
            {email.has_invoice && (
              <span className="rounded-full border" style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.25)' }}>
                <FileText size={10} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
                Invoice
              </span>
            )}
          </div>

          {/* Matched rule */}
          {ruleName && (
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]" style={{ padding: '10px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Matched Rule</p>
              <p className="flex items-center gap-2" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                <Tag size={12} className="text-[#C9A70A]" />
                {ruleName}
              </p>
            </div>
          )}

          {/* AI Summary */}
          {email.ai_summary && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>AI Summary</p>
              <div
                className="rounded-lg"
                style={{ padding: '12px 16px', background: 'rgba(201,167,10,0.05)', borderLeft: '3px solid rgba(201,167,10,0.4)', fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}
              >
                {email.ai_summary}
              </div>
            </div>
          )}

          {/* Email preview */}
          {email.preview && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Preview</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {email.preview}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-[rgba(255,255,255,0.07)]" style={{ paddingTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Actions</p>
            <div className="flex flex-wrap gap-2">
              {!email.task_created && (email.category === 'needs_attention' || email.category === 'new_lead') && (
                <Button variant="default" size="sm" onClick={() => onAddTask(email.subject)}>
                  <Plus size={13} /> Create Task
                </Button>
              )}
              {!email.archived && (
                <Button variant="default" size="sm" onClick={() => { onArchive(email.id); onClose() }}>
                  <Archive size={13} /> Archive
                </Button>
              )}
              {onReclassify && (
                <Button variant="default" size="sm" onClick={() => { onReclassify(email.id); onClose() }}>
                  <RefreshCw size={13} /> Reclassify
                </Button>
              )}
              {email.archived && (
                <span style={{ fontSize: 12, color: 'rgba(74,222,128,0.8)', fontWeight: 600, padding: '6px 0' }}>
                  <Check size={13} className="inline mr-1" /> Handled
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
