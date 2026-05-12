'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'

interface Props {
  initialRecipient: string
  initialEnabled: boolean
  initialSendHour: number
  initialProcessInterval: number
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00 UTC (${String((i + 1) % 24).padStart(2, '0')}:00 BST)`,
}))

const INTERVALS = [
  { value: 5,  label: 'Every 5 minutes' },
  { value: 10, label: 'Every 10 minutes' },
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' },
  { value: 60, label: 'Every hour' },
]

const selectClass = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#d4af37]/40 transition-colors appearance-none'

export function DigestPreferences({ initialRecipient, initialEnabled, initialSendHour, initialProcessInterval }: Props) {
  const [recipient, setRecipient] = useState(initialRecipient)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [sendHour, setSendHour] = useState(initialSendHour)
  const [processInterval, setProcessInterval] = useState(initialProcessInterval)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await Promise.all([
      fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'digest_recipient', value: recipient }) }),
      fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'digest_enabled', value: String(enabled) }) }),
      fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'digest_send_hour', value: String(sendHour) }) }),
      fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'inbox_process_interval', value: String(processInterval) }) }),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Card>
      <div className="flex flex-col gap-6">

        {/* Digest toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-white/80">Daily digest email</p>
            <p className="text-[12px] text-white/35 mt-0.5">Summarises processed emails and open tasks each morning</p>
          </div>
          <button
            onClick={() => setEnabled(e => !e)}
            className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-[#967705]/60 border border-[#967705]/60' : 'bg-white/10 border border-white/10'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${enabled ? 'translate-x-5 bg-[#c9a70a]' : 'bg-white/30'}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Recipient */}
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">Recipient email</label>
            <input
              type="email"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className={selectClass}
              placeholder="info@northernwarrior.co.uk"
            />
          </div>

          {/* Send time */}
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">Send time</label>
            <select
              value={sendHour}
              onChange={e => setSendHour(Number(e.target.value))}
              className={selectClass}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff40' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              {HOURS.map(h => (
                <option key={h.value} value={h.value} style={{ background: '#1a1a19' }}>{h.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Inbox refresh interval */}
        <div>
          <p className="text-[13px] font-semibold text-white/80 mb-1">Inbox refresh interval</p>
          <p className="text-[12px] text-white/35 mb-3">How often the cron auto-processes new Gmail emails (Vercel cron fires every 5 min — longer intervals are throttled in the route)</p>
          <select
            value={processInterval}
            onChange={e => setProcessInterval(Number(e.target.value))}
            className={selectClass}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff40' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
          >
            {INTERVALS.map(i => (
              <option key={i.value} value={i.value} style={{ background: '#1a1a19' }}>{i.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 rounded-lg bg-[#967705]/20 border border-[#967705]/40 text-[#c9a70a] text-[13px] font-semibold hover:bg-[#967705]/30 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          {saved && <span className="text-[12px] text-green-400">Saved ✓</span>}
        </div>

      </div>
    </Card>
  )
}
