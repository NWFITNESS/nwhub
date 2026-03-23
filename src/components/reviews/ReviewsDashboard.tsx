'use client'

import { useState, useRef } from 'react'
import {
  Star, Send, RefreshCw, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Pause, Play, Zap, Users,
  MessageSquare, ThumbsUp, XCircle, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { format, formatDistanceToNow } from 'date-fns'
import type { ReviewRequest, ReviewSettings } from '@/lib/types'
import type { ContactRow } from '@/app/(dashboard)/reviews/page'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ContactStatus = 'waiting' | 'due' | 'sent' | 'followup_due' | 'complete' | 'review_detected' | 'opted_out'
type FilterTab = 'all' | 'due' | 'followup_due' | 'review_detected' | 'opted_out' | 'complete'

interface QueueContact extends ContactRow {
  request: ReviewRequest | null
}

// ---------------------------------------------------------------------------
// Status logic
// ---------------------------------------------------------------------------
function computeStatus(c: QueueContact, settings: ReviewSettings): ContactStatus {
  const r = c.request
  const daysSinceJoin = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000)
  if (r?.review_detected) return 'review_detected'
  if (r?.opted_out) return 'opted_out'
  if (r && r.messages_sent >= settings.max_messages) return 'complete'
  if (r && r.messages_sent >= 1) {
    const daysSinceLast = r.last_sent_at
      ? Math.floor((Date.now() - new Date(r.last_sent_at).getTime()) / 86400000)
      : 999
    return daysSinceLast >= settings.reminder_interval_days ? 'followup_due' : 'sent'
  }
  return daysSinceJoin >= settings.days_after_joining ? 'due' : 'waiting'
}

const STATUS_CONFIG: Record<ContactStatus, { label: string; className: string }> = {
  waiting:         { label: 'Pending',          className: 'bg-white/[0.05] text-white/30 border-white/[0.08]' },
  due:             { label: 'Due',              className: 'bg-[#967705]/15 text-[#C9A70A] border-[#967705]/25' },
  sent:            { label: 'Sent',             className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  followup_due:    { label: 'Follow Up Due',    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  complete:        { label: 'Complete',         className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  review_detected: { label: 'Review Detected',  className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  opted_out:       { label: 'Opted Out',        className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatCard({
  label, value, sub, icon: Icon, iconBg,
}: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; iconBg: string
}) {
  return (
    <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={18} className="text-white/70" />
        </div>
      </div>
      <div>
        <p className="text-5xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'League Spartan' }}>{value}</p>
        {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/40 uppercase tracking-[0.1em] mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/25 mt-1">{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors"
    />
  )
}

function NumberInput({ value, onChange, min = 0, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      className="w-full px-3.5 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors"
    />
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface Props {
  initialRequests: ReviewRequest[]
  initialSettings: ReviewSettings
  initialContacts: ContactRow[]
}

export function ReviewsDashboard({ initialRequests, initialSettings, initialContacts }: Props) {
  const [requests, setRequests]   = useState<ReviewRequest[]>(initialRequests)
  const [settings, setSettings]   = useState<ReviewSettings>(initialSettings)
  const [settingsOpen, setSettingsOpen] = useState(!initialSettings.google_place_id)
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [running, setRunning]     = useState(false)
  const [checking, setChecking]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [checkResult, setCheckResult] = useState<{ rating: number; total_reviews: number; new_detected: number } | null>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  // Build the full member queue by merging contacts + requests
  const buildQueue = (reqs: ReviewRequest[]): QueueContact[] => {
    const map = Object.fromEntries(reqs.map((r) => [r.contact_id, r]))
    return initialContacts.map((c) => ({ ...c, request: map[c.id] ?? null }))
  }
  const [queue, setQueue] = useState<QueueContact[]>(() => buildQueue(initialRequests))

  // Stats
  const totalSent     = requests.filter((r) => r.messages_sent >= 1).length
  const followUpsSent = requests.filter((r) => r.messages_sent >= 2).length
  const detected      = requests.filter((r) => r.review_detected).length
  const optedOut      = requests.filter((r) => r.opted_out).length

  const tabCounts: Record<FilterTab, number> = {
    all:             queue.length,
    due:             queue.filter((c) => computeStatus(c, settings) === 'due').length,
    followup_due:    queue.filter((c) => computeStatus(c, settings) === 'followup_due').length,
    review_detected: queue.filter((c) => computeStatus(c, settings) === 'review_detected').length,
    opted_out:       queue.filter((c) => computeStatus(c, settings) === 'opted_out').length,
    complete:        queue.filter((c) => computeStatus(c, settings) === 'complete').length,
  }

  const filteredQueue = queue.filter((c) =>
    filterTab === 'all' ? true : computeStatus(c, settings) === filterTab
  )

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSend(contact: QueueContact) {
    setSendingId(contact.id)
    const res = await fetch('/api/reviews/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: contact.id, phone: contact.phone, firstName: contact.first_name }),
    })
    setSendingId(null)
    if (res.ok) {
      const { type } = await res.json()
      const newCount = (contact.request?.messages_sent ?? 0) + 1
      const updatedRequest: ReviewRequest = {
        id: contact.request?.id ?? '',
        contact_id: contact.id,
        phone_number: contact.phone,
        messages_sent: newCount,
        last_sent_at: new Date().toISOString(),
        review_detected: contact.request?.review_detected ?? false,
        opted_out: false,
        created_at: contact.request?.created_at ?? new Date().toISOString(),
      }
      setQueue((prev) => prev.map((c) =>
        c.id !== contact.id ? c : { ...c, request: updatedRequest }
      ))
      setRequests((prev) => {
        const exists = prev.find((r) => r.contact_id === contact.id)
        return exists
          ? prev.map((r) => r.contact_id === contact.id ? updatedRequest : r)
          : [...prev, updatedRequest]
      })
      showToast(`${type === 'followup' ? 'Follow-up' : 'Review request'} sent to ${contact.first_name}`)
    } else {
      const d = await res.json()
      showToast(d.error ?? 'Failed to send', false)
    }
  }

  async function handleRunNow() {
    setRunning(true)
    const res = await fetch('/api/reviews/automation', { method: 'POST' })
    const data = await res.json()
    setRunning(false)
    if (!res.ok) { showToast(data.error ?? 'Run failed', false); return }
    const errPart = data.errors > 0 ? `, ${data.errors} failed` : ''
    showToast(`${data.sent} sent, ${data.skipped} skipped${errPart}`, data.errors === 0)
    const fresh = await fetch('/api/reviews/requests').then((r) => r.json())
    if (Array.isArray(fresh)) {
      setRequests(fresh)
      setQueue(buildQueue(fresh))
    }
  }

  async function handleCheck() {
    setChecking(true)
    const res = await fetch('/api/reviews/check')
    const data = await res.json()
    setChecking(false)
    if (!res.ok) { showToast(data.error ?? 'Check failed', false); return }
    setCheckResult(data)
    showToast(`${data.new_detected} new review${data.new_detected !== 1 ? 's' : ''} detected`)
    const fresh = await fetch('/api/reviews/requests').then((r) => r.json())
    if (Array.isArray(fresh)) {
      setRequests(fresh)
      setQueue(buildQueue(fresh))
    }
  }

  async function handleSaveSettings() {
    setSaving(true)
    const res = await fetch('/api/reviews/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    showToast(res.ok ? 'Settings saved' : 'Failed to save settings', res.ok)
  }

  const TAB_LABELS: Record<FilterTab, string> = {
    all: 'All', due: 'Due', followup_due: 'Follow Up Due',
    review_detected: 'Review Detected', opted_out: 'Opted Out', complete: 'Complete',
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${
          toast.ok ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div>
        <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">NORTHERN WARRIOR HUB</p>
        <h1 className="text-3xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'League Spartan' }}>Google Reviews</h1>
        <p className="text-sm text-white/40 mt-1">Automated review requests — tracks every member from join to review</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard label="Requests Sent"    value={totalSent}     sub="initial messages"    icon={MessageSquare} iconBg="rgba(201,167,10,0.15)" />
        <StatCard label="Follow Ups Sent"  value={followUpsSent} sub="second messages"      icon={Send}          iconBg="rgba(59,130,246,0.15)" />
        <StatCard label="Reviews Detected" value={detected}      sub="confirmed via Google" icon={ThumbsUp}      iconBg="rgba(34,197,94,0.15)" />
        <StatCard label="Opted Out"        value={optedOut}      sub="replied STOP"         icon={XCircle}       iconBg="rgba(239,68,68,0.15)" />
      </div>

      {/* Automation status card */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${settings.enabled ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white/20'}`} />
              <div>
                <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-0.5">AUTOMATION STATUS</p>
                <p className="text-sm font-semibold text-[#F0F0F0]">
                  {settings.enabled ? 'Active — runs daily at 10am' : 'Paused'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 ml-5">
              {[
                { day: settings.days_after_joining, label: 'Initial review request sent automatically', color: 'gold' },
                { day: settings.days_after_joining + settings.reminder_interval_days, label: 'Follow up if no review detected', color: 'amber' },
              ].map(({ day, label, color }) => (
                <div key={day} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    color === 'gold' ? 'bg-[#967705]/20 border border-[#967705]/30' : 'bg-amber-500/10 border border-amber-500/20'
                  }`}>
                    <span className={`text-[10px] font-bold ${color === 'gold' ? 'text-[#C9A70A]' : 'text-amber-400'}`}>{day}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#F0F0F0]">Day {day}</p>
                    <p className="text-xs text-white/40">{label}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 ml-0">
                <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={12} className="text-white/30" />
                </div>
                <p className="text-xs text-white/30">Max {settings.max_messages} messages per member — then stops forever</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 min-w-[220px]">
            {checkResult && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-white/[0.06] mb-1">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={11} className={s <= Math.round(checkResult.rating) ? 'text-[#C9A70A] fill-[#C9A70A]' : 'text-white/15'} />
                  ))}
                </div>
                <span className="text-sm font-bold text-white">{checkResult.rating?.toFixed(1)}</span>
                <span className="text-white/30 text-xs">({checkResult.total_reviews} reviews)</span>
                {checkResult.new_detected > 0 && (
                  <span className="ml-auto text-xs text-green-400">+{checkResult.new_detected} new</span>
                )}
              </div>
            )}

            <Button variant="secondary" size="sm" onClick={handleCheck} loading={checking}>
              <RefreshCw size={13} /> Check Google Reviews
            </Button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newEnabled = !settings.enabled
                  setSettings((s) => ({ ...s, enabled: newEnabled }))
                  fetch('/api/reviews/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...settings, enabled: newEnabled }),
                  })
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-white/[0.1] bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200"
              >
                {settings.enabled ? <Pause size={12} /> : <Play size={12} />}
                {settings.enabled ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={handleRunNow}
                disabled={running}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(201,167,10,0.25)] disabled:opacity-50"
              >
                <Zap size={13} />
                {running ? '...' : 'Run Now'}
              </button>
            </div>

            <button
              onClick={() => { setSettingsOpen((o) => !o); setTimeout(() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50) }}
              className="flex items-center justify-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors pt-1"
            >
              Configure settings {settingsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* Member queue */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-0.5">MEMBER QUEUE</p>
            <h3 className="text-white font-semibold">Review Pipeline</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-white/30" />
            <span className="text-xs text-white/30">{queue.length} active members with phones</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex overflow-x-auto border-b border-white/[0.06] px-2">
          {(Object.entries(TAB_LABELS) as [FilterTab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${
                filterTab === tab ? 'border-[#C9A70A] text-[#C9A70A]' : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {label}
              {tabCounts[tab] > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  filterTab === tab ? 'bg-[#967705]/20 text-[#C9A70A]' : 'bg-white/[0.06] text-white/30'
                }`}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Member', 'Joined', 'Days Since Join', 'Messages Sent', 'Last Sent', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-white/30 uppercase tracking-[0.1em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <Clock size={20} className="text-white/20" />
                      </div>
                      <p className="text-sm font-medium text-white/40">No members in this category</p>
                      <p className="text-xs text-white/20 text-center max-w-[240px]">
                        {filterTab === 'due'
                          ? `Members appear here ${settings.days_after_joining} days after joining`
                          : 'Check back after the next automation run'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((contact) => {
                  const status = computeStatus(contact, settings)
                  const { label, className } = STATUS_CONFIG[status]
                  const daysSinceJoin = Math.floor((Date.now() - new Date(contact.created_at).getTime()) / 86400000)
                  const isSending = sendingId === contact.id
                  return (
                    <tr key={contact.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-[#F0F0F0]">
                          {contact.first_name} {contact.last_name ?? ''}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs text-white/40 whitespace-nowrap">
                        {format(new Date(contact.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="px-5 py-4 text-xs text-white/50">
                        {daysSinceJoin}d
                      </td>
                      <td className="px-5 py-4 text-xs text-white/50 text-center">
                        {contact.request?.messages_sent ?? 0} / {settings.max_messages}
                      </td>
                      <td className="px-5 py-4 text-xs text-white/40 whitespace-nowrap">
                        {contact.request?.last_sent_at
                          ? formatDistanceToNow(new Date(contact.request.last_sent_at), { addSuffix: true })
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
                          {status === 'review_detected' && <CheckCircle size={10} />}
                          {label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {status === 'due' && (
                          <button
                            onClick={() => handleSend(contact)}
                            disabled={isSending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-50 ml-auto"
                          >
                            <Send size={11} />
                            {isSending ? '...' : 'Send Now'}
                          </button>
                        )}
                        {status === 'followup_due' && (
                          <button
                            onClick={() => handleSend(contact)}
                            disabled={isSending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all disabled:opacity-50 ml-auto"
                          >
                            <Send size={11} />
                            {isSending ? '...' : 'Send Follow Up'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div ref={settingsRef} className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div>
              <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-0.5">CONFIGURATION</p>
              <h3 className="text-white font-semibold">Automation Settings</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Google Place ID" hint="Find in Google Maps URL — starts with ChIJ">
              <TextInput value={settings.google_place_id} onChange={(v) => setSettings((s) => ({ ...s, google_place_id: v }))} placeholder="ChIJxxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Review Link" hint="Direct link sent to members in the WhatsApp message">
              <TextInput value={settings.review_link} onChange={(v) => setSettings((s) => ({ ...s, review_link: v }))} placeholder="https://g.page/r/..." />
            </Field>
            <Field label="First Message Template SID" hint="Twilio Content Template — {{1}} = name, {{2}} = review link">
              <TextInput value={settings.first_content_sid} onChange={(v) => setSettings((s) => ({ ...s, first_content_sid: v }))} placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Follow Up Template SID" hint="Twilio Content Template — same variables as first">
              <TextInput value={settings.reminder_content_sid} onChange={(v) => setSettings((s) => ({ ...s, reminder_content_sid: v }))} placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Days after joining — first request">
              <NumberInput value={settings.days_after_joining} onChange={(v) => setSettings((s) => ({ ...s, days_after_joining: v }))} min={1} />
            </Field>
            <Field label="Follow up interval (days)">
              <NumberInput value={settings.reminder_interval_days} onChange={(v) => setSettings((s) => ({ ...s, reminder_interval_days: v }))} min={1} />
            </Field>
            <Field label="Max messages per member" hint="Hard cap — 2 recommended">
              <NumberInput value={settings.max_messages} onChange={(v) => setSettings((s) => ({ ...s, max_messages: v }))} min={1} max={2} />
            </Field>
          </div>

          <div className="flex justify-end pt-2 border-t border-white/[0.06]">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(201,167,10,0.25)] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
