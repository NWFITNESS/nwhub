'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'

interface Props {
  initialRecipient: string
  initialEnabled: boolean
}

export function DigestPreferences({ initialRecipient, initialEnabled }: Props) {
  const [recipient, setRecipient] = useState(initialRecipient)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await Promise.all([
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'digest_recipient', value: recipient }),
      }),
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'digest_enabled', value: String(enabled) }),
      }),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Card>
      <div className="flex flex-col gap-5">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-white/80">Daily digest email</p>
            <p className="text-[12px] text-white/35 mt-0.5">Sent every morning at 8am with processed emails and open tasks</p>
          </div>
          <button
            onClick={() => setEnabled(e => !e)}
            className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-[#967705]/60 border border-[#967705]/60' : 'bg-white/10 border border-white/10'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${enabled ? 'translate-x-5 bg-[#f2ca50]' : 'bg-white/30'}`} />
          </button>
        </div>

        {/* Recipient */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">
            Recipient email
          </label>
          <input
            type="email"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-[#d4af37]/40 transition-colors"
            placeholder="info@northernwarrior.co.uk"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 rounded-lg bg-[#967705]/20 border border-[#967705]/40 text-[#f2ca50] text-[13px] font-semibold hover:bg-[#967705]/30 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          {saved && <span className="text-[12px] text-green-400">Saved ✓</span>}
        </div>
      </div>
    </Card>
  )
}
