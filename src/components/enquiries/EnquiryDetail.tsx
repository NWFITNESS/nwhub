'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import {
  ArrowLeft, Send, Mail, Phone, Tag, Clock, CheckCheck,
  Eye, CircleDot, Copy, Check,
} from 'lucide-react'
import type { ContactEnquiry } from '@/lib/types'

interface Reply {
  id: string
  enquiry_id: string
  message: string
  sent_to: string
  created_at: string
}

const STATUS_STYLES = {
  new:     { bg: 'rgba(201,167,10,0.08)', border: 'rgba(201,167,10,0.2)', color: '#c9a70a', icon: CircleDot, label: 'New' },
  read:    { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', icon: Eye, label: 'Read' },
  replied: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', icon: CheckCheck, label: 'Replied' },
} as const

interface Props {
  enquiry: ContactEnquiry
  onBack: () => void
  onStatusChange: (id: string, status: ContactEnquiry['status']) => void
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function EnquiryDetail({ enquiry, onBack, onStatusChange }: Props) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/enquiries/${enquiry.id}`)
      .then(r => r.ok ? r.json() : { replies: [] })
      .then(d => { setReplies(d.replies ?? []); setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [enquiry.id])

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
      setTimeout(() => { setSent(false); threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 300)
    }
    setSending(false)
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function updateStatus(status: ContactEnquiry['status']) {
    onStatusChange(enquiry.id, status)
    fetch(`/api/enquiries/${enquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  const st = STATUS_STYLES[enquiry.status]

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 560 }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4 border-b border-[rgba(255,255,255,0.06)]"
        style={{ padding: '18px 28px', background: 'rgba(255,255,255,0.01)' }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-nw-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all"
          aria-label="Back to enquiries"
        >
          <ArrowLeft size={15} />
        </button>

        {/* Avatar + name */}
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(201,167,10,0.1)', border: '1px solid rgba(201,167,10,0.2)', color: '#c9a70a' }}
        >
          {getInitials(enquiry.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold text-white truncate">{enquiry.name}</h2>
          <p className="text-xs text-nw-500 mt-0.5">{enquiry.email}</p>
        </div>

        {/* Status toggle */}
        <div className="flex items-center rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden">
          {(Object.entries(STATUS_STYLES) as [ContactEnquiry['status'], typeof STATUS_STYLES['new']][]).map(([key, cfg]) => {
            const Icon = cfg.icon
            const isActive = enquiry.status === key
            return (
              <button
                key={key}
                onClick={() => updateStatus(key)}
                className="flex items-center gap-1.5 text-[11px] font-semibold transition-all"
                style={{
                  padding: '6px 12px',
                  background: isActive ? cfg.bg : 'transparent',
                  color: isActive ? cfg.color : 'rgba(255,255,255,0.3)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Icon size={12} />
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Body (two-column: thread + sidebar) ─────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thread column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto" style={{ padding: '24px 28px' }}>
            {/* Timeline connector */}
            <div className="relative">
              <div
                className="absolute left-[19px] top-12 bottom-0"
                style={{ width: 1, background: 'rgba(255,255,255,0.05)' }}
              />

              {/* Original enquiry */}
              <div className="relative flex gap-4 mb-6">
                <div
                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold z-10"
                  style={{ background: 'rgba(201,167,10,0.1)', border: '1px solid rgba(201,167,10,0.2)', color: '#c9a70a' }}
                >
                  {getInitials(enquiry.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-white">{enquiry.name}</span>
                    <span className="text-[11px] text-nw-600">{format(new Date(enquiry.created_at), 'dd MMM yyyy · HH:mm')}</span>
                  </div>
                  <div
                    className="rounded-xl border border-[rgba(255,255,255,0.06)]"
                    style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)' }}
                  >
                    <p className="text-[13px] text-nw-200 whitespace-pre-wrap leading-[1.75]">{enquiry.message}</p>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {loading ? (
                <div className="flex items-center gap-3 ml-14 text-xs text-nw-500" style={{ padding: '12px 0' }}>
                  <div className="h-4 w-4 rounded-full border-2 border-[rgba(201,167,10,0.4)] border-t-transparent animate-spin" />
                  Loading conversation...
                </div>
              ) : (
                replies.map(reply => (
                  <div key={reply.id} className="relative flex gap-4 mb-6">
                    <div
                      className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl z-10"
                      style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
                    >
                      <Send size={14} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-white">You</span>
                        <span className="text-[11px] text-nw-600">→ {reply.sent_to}</span>
                        <span className="text-[11px] text-nw-600">{format(new Date(reply.created_at), 'dd MMM yyyy · HH:mm')}</span>
                      </div>
                      <div
                        className="rounded-xl border border-[rgba(59,130,246,0.1)]"
                        style={{ padding: '16px 20px', background: 'rgba(59,130,246,0.03)' }}
                      >
                        <p className="text-[13px] text-nw-200 whitespace-pre-wrap leading-[1.75]">{reply.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={threadEndRef} />
            </div>
          </div>

          {/* ── Composer ──────────────────────────────────────────────────────── */}
          <div
            className="border-t border-[rgba(255,255,255,0.06)]"
            style={{ padding: '20px 28px', background: 'rgba(255,255,255,0.01)' }}
          >
            {sent && (
              <div
                className="flex items-center gap-2 text-xs font-medium rounded-lg mb-3"
                style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}
              >
                <CheckCheck size={14} />
                Reply sent successfully to {enquiry.email}
              </div>
            )}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Write a reply to ${enquiry.name.split(' ')[0]}...`}
                rows={3}
                className="w-full resize-none rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[13px] text-nw-200 placeholder-nw-600 focus:border-[rgba(150,119,5,0.35)] focus:bg-[rgba(255,255,255,0.03)] focus:outline-none transition-all leading-relaxed"
                style={{ padding: '14px 18px', paddingBottom: 44 }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendReply()
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-[10px] text-nw-600 mr-1">
                  {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendReply}
                  loading={sending}
                  disabled={!replyText.trim()}
                >
                  <Send size={12} /> Send Reply
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
        <div
          className="w-[260px] flex-shrink-0 border-l border-[rgba(255,255,255,0.06)] overflow-y-auto hidden xl:block"
          style={{ padding: '24px 20px', background: 'rgba(255,255,255,0.01)' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[1.4px] text-nw-600">Contact Details</span>

          <div className="flex flex-col gap-4 mt-4">
            {/* Email */}
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-nw-500 uppercase tracking-wider mb-1.5">
                <Mail size={11} /> Email
              </div>
              <div className="flex items-center gap-1.5 group">
                <a href={`mailto:${enquiry.email}`} className="text-xs text-gold-300 hover:text-gold-200 transition-colors truncate">{enquiry.email}</a>
                <button
                  onClick={() => copyToClipboard(enquiry.email, 'email')}
                  className="opacity-0 group-hover:opacity-100 text-nw-600 hover:text-white transition-all"
                  aria-label="Copy email"
                >
                  {copied === 'email' ? <Check size={11} className="text-[#22c55e]" /> : <Copy size={11} />}
                </button>
              </div>
            </div>

            {/* Phone */}
            {enquiry.phone && (
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-nw-500 uppercase tracking-wider mb-1.5">
                  <Phone size={11} /> Phone
                </div>
                <div className="flex items-center gap-1.5 group">
                  <a href={`tel:${enquiry.phone}`} className="text-xs text-nw-200 hover:text-white transition-colors">{enquiry.phone}</a>
                  <button
                    onClick={() => copyToClipboard(enquiry.phone, 'phone')}
                    className="opacity-0 group-hover:opacity-100 text-nw-600 hover:text-white transition-all"
                    aria-label="Copy phone"
                  >
                    {copied === 'phone' ? <Check size={11} className="text-[#22c55e]" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            )}

            {/* Type */}
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-nw-500 uppercase tracking-wider mb-1.5">
                <Tag size={11} /> Enquiry Type
              </div>
              <span className="text-xs text-nw-200">{enquiry.enquiry_type}</span>
            </div>

            {/* Received */}
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-nw-500 uppercase tracking-wider mb-1.5">
                <Clock size={11} /> Received
              </div>
              <span className="text-xs text-nw-200">{format(new Date(enquiry.created_at), 'dd MMM yyyy')}</span>
              <span className="text-xs text-nw-500 ml-1">{format(new Date(enquiry.created_at), 'HH:mm')}</span>
            </div>

            {/* Status */}
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-nw-500 uppercase tracking-wider mb-2">
                Current Status
              </div>
              <div
                className="flex items-center gap-2 rounded-lg text-xs font-semibold capitalize"
                style={{ padding: '8px 12px', background: st.bg, border: `1px solid ${st.border}`, color: st.color }}
              >
                <st.icon size={13} />
                {st.label}
              </div>
            </div>

            {/* Replies count */}
            {!loading && replies.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-nw-500 uppercase tracking-wider mb-1.5">
                  <Send size={11} /> Replies Sent
                </div>
                <span className="text-xs text-nw-200">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
