'use client'

import { useState, useRef } from 'react'
import { Star, Send, RefreshCw, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import type { ReviewRequest, ReviewSettings } from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getStatusLabel(r: ReviewRequest, maxMessages: number): string {
  if (r.opted_out) return 'Opted out'
  if (r.review_detected) return 'Review detected'
  if (r.messages_sent >= maxMessages) return 'Max reached'
  return 'Awaiting review'
}

function getStatusClass(r: ReviewRequest, maxMessages: number): string {
  if (r.opted_out) return 'bg-red-500/15 text-red-400 border-red-500/30'
  if (r.review_detected) return 'bg-green-500/15 text-green-400 border-green-500/30'
  if (r.messages_sent >= maxMessages) return 'bg-white/5 text-white/40 border-white/10'
  return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-5">
      <p className="text-xs text-white/35 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/25 mt-1">{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#967705]/60 transition-colors"
    />
  )
}

function NumberInput({ value, onChange, min = 0, max = 99 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm text-white focus:outline-none focus:border-[#967705]/60 transition-colors"
    />
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface Props {
  initialRequests: ReviewRequest[]
  initialSettings: ReviewSettings
}

type CheckResult = {
  rating: number
  total_reviews: number
  new_detected: number
  current_rating: number
} | null

export function ReviewsDashboard({ initialRequests, initialSettings }: Props) {
  const [requests, setRequests]   = useState<ReviewRequest[]>(initialRequests)
  const [settings, setSettings]   = useState<ReviewSettings>(initialSettings)
  const [settingsOpen, setSettingsOpen] = useState(!initialSettings.google_place_id)

  const [running, setRunning]     = useState(false)
  const [checking, setChecking]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [runResult, setRunResult] = useState<{ new_requests: number; reminders: number } | null>(null)
  const [checkResult, setCheckResult] = useState<CheckResult>(null)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  // Stats
  const sent       = requests.filter((r) => r.messages_sent > 0).length
  const detected   = requests.filter((r) => r.review_detected).length
  const optedOut   = requests.filter((r) => r.opted_out).length
  const conversion = sent > 0 ? Math.round((detected / sent) * 100) : 0

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleRun() {
    setRunning(true); setRunResult(null)
    const res  = await fetch('/api/reviews/run', { method: 'POST' })
    const data = await res.json()
    setRunning(false)
    if (!res.ok) { showToast(data.error ?? 'Run failed', false); return }
    setRunResult(data)
    showToast(`${data.new_requests} requests sent, ${data.reminders} reminders`)
    const fresh = await fetch('/api/reviews/requests').then((r) => r.json())
    if (Array.isArray(fresh)) setRequests(fresh)
  }

  async function handleCheck() {
    setChecking(true); setCheckResult(null)
    const res  = await fetch('/api/reviews/check')
    const data = await res.json()
    setChecking(false)
    if (!res.ok) { showToast(data.error ?? 'Check failed', false); return }
    setCheckResult(data)
    showToast(`${data.new_detected} new review${data.new_detected !== 1 ? 's' : ''} detected`)
    const fresh = await fetch('/api/reviews/requests').then((r) => r.json())
    if (Array.isArray(fresh)) setRequests(fresh)
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

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${
          toast.ok
            ? 'bg-green-500/15 border-green-500/30 text-green-400'
            : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Requests Sent"    value={sent}       sub="initial + reminders" />
        <StatCard label="Reviews Detected" value={detected}   sub="confirmed via Google" />
        <StatCard label="Conversion Rate"  value={`${conversion}%`} sub={sent > 0 ? `${detected} of ${sent}` : 'no data yet'} />
        <StatCard label="Opted Out"        value={optedOut}   sub="STOP replies" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg border border-white/[0.08] bg-[#0f0f0f]">
          <button
            onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.enabled ? 'bg-[#967705]' : 'bg-white/15'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${settings.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-sm text-white/60">{settings.enabled ? 'Automation on' : 'Automation off'}</span>
        </div>

        <Button variant="primary" size="sm" onClick={handleRun} loading={running} disabled={!settings.enabled}>
          <Send size={14} />Run Now
        </Button>
        <Button variant="secondary" size="sm" onClick={handleCheck} loading={checking}>
          <RefreshCw size={14} />Check Google Reviews
        </Button>
        <button
          onClick={() => { setSettingsOpen((o) => !o); setTimeout(() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50) }}
          className="ml-auto flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Settings {settingsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Run result */}
      {runResult && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
          <CheckCircle size={15} />
          {runResult.new_requests} new request{runResult.new_requests !== 1 ? 's' : ''} sent · {runResult.reminders} reminder{runResult.reminders !== 1 ? 's' : ''} sent
        </div>
      )}

      {/* Check result */}
      {checkResult && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-white/[0.08] bg-[#0f0f0f]">
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} size={16} className={s <= Math.round(checkResult.rating) ? 'text-[#c9a70a] fill-[#c9a70a]' : 'text-white/15'} />
            ))}
          </div>
          <span className="text-white font-semibold">{checkResult.rating?.toFixed(1)}</span>
          <span className="text-white/40 text-sm">({checkResult.total_reviews} reviews)</span>
          {checkResult.new_detected > 0 && (
            <span className="ml-auto text-xs text-green-400">{checkResult.new_detected} new review{checkResult.new_detected !== 1 ? 's' : ''} detected</span>
          )}
        </div>
      )}

      {/* Requests table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              {['Contact', 'Phone', 'Messages Sent', 'Last Sent', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30">No review requests sent yet. Configure settings and click Run Now.</td></tr>
            ) : requests.map((r) => {
              const c = r.contact
              return (
                <tr key={r.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{c ? `${c.first_name} ${c.last_name}` : '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs font-mono">{r.phone_number}</td>
                  <td className="px-4 py-3 text-white/60 text-center">{r.messages_sent}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {r.last_sent_at ? format(new Date(r.last_sent_at), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(r, settings.max_messages)}`}>
                      {getStatusLabel(r, settings.max_messages)}
                    </span>
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div ref={settingsRef} className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white">Automation Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Google Place ID" hint="Find in Google Maps URL or Place details">
              <TextInput value={settings.google_place_id} onChange={(v) => setSettings((s) => ({ ...s, google_place_id: v }))} placeholder="ChIJxxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Review Link" hint="Passed as {{2}} in Content Templates">
              <TextInput value={settings.review_link} onChange={(v) => setSettings((s) => ({ ...s, review_link: v }))} placeholder="https://g.page/r/..." />
            </Field>
            <Field label="First Message Content SID" hint="From Twilio Console → Content Templates">
              <TextInput value={settings.first_content_sid} onChange={(v) => setSettings((s) => ({ ...s, first_content_sid: v }))} placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Reminder Content SID" hint="From Twilio Console → Content Templates">
              <TextInput value={settings.reminder_content_sid} onChange={(v) => setSettings((s) => ({ ...s, reminder_content_sid: v }))} placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Days after joining before first request">
              <NumberInput value={settings.days_after_joining} onChange={(v) => setSettings((s) => ({ ...s, days_after_joining: v }))} min={1} />
            </Field>
            <Field label="Reminder interval (days)">
              <NumberInput value={settings.reminder_interval_days} onChange={(v) => setSettings((s) => ({ ...s, reminder_interval_days: v }))} min={1} />
            </Field>
            <Field label="Max messages per contact" hint="Total cap including initial + reminders (max 2)">
              <NumberInput value={settings.max_messages} onChange={(v) => setSettings((s) => ({ ...s, max_messages: v }))} min={1} max={2} />
            </Field>
          </div>

          <div className="flex justify-end pt-2 border-t border-white/[0.08]">
            <Button variant="primary" size="sm" onClick={handleSaveSettings} loading={saving}>
              Save settings
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
