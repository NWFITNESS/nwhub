'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge, statusToBadge } from '@/components/ui/Badge'
import { format } from 'date-fns'
import { ArrowLeft, Send, User, Clock, Mail, Phone, Tag } from 'lucide-react'
import type { ContactEnquiry } from '@/lib/types'

interface Reply {
  id: string
  enquiry_id: string
  message: string
  sent_to: string
  created_at: string
}

interface Props {
  enquiry: ContactEnquiry
  onBack: () => void
  onStatusChange: (id: string, status: ContactEnquiry['status']) => void
}

export function EnquiryDetail({ enquiry, onBack, onStatusChange }: Props) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch replies
  useEffect(() => {
    fetch(`/api/enquiries/${enquiry.id}`)
      .then(r => r.ok ? r.json() : { replies: [] })
      .then(d => setReplies(d.replies ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [enquiry.id])

  // Auto-mark as read
  useEffect(() => {
    if (enquiry.status === 'new') {
      onStatusChange(enquiry.id, 'read')
      fetch(`/api/enquiries/${enquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      })
    }
  }, [enquiry.id, enquiry.status, onStatusChange])

  async function handleSendReply() {
    if (!replyText.trim()) return
    setSending(true)
    const res = await fetch('/api/enquiries/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enquiry_id: enquiry.id, message: replyText.trim() }),
    })
    if (res.ok) {
      const { reply } = await res.json()
      if (reply) setReplies(prev => [...prev, reply])
      setReplyText('')
      setSent(true)
      onStatusChange(enquiry.id, 'replied')
      setTimeout(() => setSent(false), 3000)
    }
    setSending(false)
  }

  const infoItems = [
    { icon: <Mail size={13} />, label: 'Email', value: enquiry.email, href: `mailto:${enquiry.email}` },
    { icon: <Phone size={13} />, label: 'Phone', value: enquiry.phone || '—' },
    { icon: <Tag size={13} />, label: 'Type', value: enquiry.enquiry_type },
    { icon: <Clock size={13} />, label: 'Received', value: format(new Date(enquiry.created_at), 'dd MMM yyyy · HH:mm') },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.07)]" style={{ padding: '16px 24px' }}>
        <button onClick={onBack} className="text-nw-400 hover:text-white transition-colors" aria-label="Back to enquiries">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white truncate">{enquiry.name}</h2>
            <Badge variant={statusToBadge(enquiry.status)}>{enquiry.status}</Badge>
          </div>
          <p className="text-xs text-nw-400 mt-0.5">{enquiry.enquiry_type} · {format(new Date(enquiry.created_at), 'dd MMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {(['new', 'read', 'replied'] as const).map(s => (
            <Button
              key={s}
              variant={enquiry.status === s ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                onStatusChange(enquiry.id, s)
                fetch(`/api/enquiries/${enquiry.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: s }),
                })
              }}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
        {/* Contact info strip */}
        <div className="flex flex-wrap gap-4 mb-6">
          {infoItems.map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span className="text-nw-500">{item.icon}</span>
              <span className="text-nw-400">{item.label}:</span>
              {item.href ? (
                <a href={item.href} className="text-gold-300 hover:text-gold-200 transition-colors">{item.value}</a>
              ) : (
                <span className="text-nw-200">{item.value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Conversation thread */}
        <div className="flex flex-col gap-4">
          {/* Original enquiry */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-nw-800" style={{ padding: 20 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[rgba(212,160,23,0.12)] border border-[rgba(212,160,23,0.2)]">
                <User size={13} className="text-gold-300" />
              </div>
              <div>
                <span className="text-sm font-medium text-nw-100">{enquiry.name}</span>
                <span className="text-xs text-nw-500 ml-2">{format(new Date(enquiry.created_at), 'dd MMM · HH:mm')}</span>
              </div>
            </div>
            <p className="text-[13px] text-nw-300 whitespace-pre-wrap leading-relaxed">{enquiry.message}</p>
          </div>

          {/* Replies */}
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-nw-500" style={{ padding: '8px 0' }}>
              <div className="h-3 w-3 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
              Loading replies...
            </div>
          ) : (
            replies.map(reply => (
              <div key={reply.id} className="rounded-xl border border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)]" style={{ padding: 20, marginLeft: 24 }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.2)]">
                    <Send size={11} className="text-blue-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-nw-100">You</span>
                    <span className="text-xs text-nw-500 ml-2">{format(new Date(reply.created_at), 'dd MMM · HH:mm')}</span>
                    <span className="text-xs text-nw-500 ml-2">→ {reply.sent_to}</span>
                  </div>
                </div>
                <p className="text-[13px] text-nw-300 whitespace-pre-wrap leading-relaxed">{reply.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply composer */}
      <div className="border-t border-[rgba(255,255,255,0.07)]" style={{ padding: 20 }}>
        {sent && (
          <div className="flex items-center gap-2 text-xs text-[#22c55e] mb-3 font-medium">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Reply sent to {enquiry.email}
          </div>
        )}
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={`Reply to ${enquiry.name.split(' ')[0]}...`}
            rows={3}
            className="flex-1 resize-none rounded-xl border border-[rgba(255,255,255,0.08)] bg-nw-800 text-[13px] text-nw-200 placeholder-nw-600 focus:border-[rgba(150,119,5,0.4)] focus:outline-none transition-colors"
            style={{ padding: '12px 16px' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendReply()
            }}
          />
          <div className="flex flex-col justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendReply}
              loading={sending}
              disabled={!replyText.trim()}
            >
              <Send size={13} /> Send
            </Button>
            <span className="text-[10px] text-nw-600 mt-1.5 text-center">⌘ Enter</span>
          </div>
        </div>
      </div>
    </div>
  )
}
