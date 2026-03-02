'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field } from '@/components/ui/Input'
import { Send } from 'lucide-react'

const SMS_LIMIT = 160

export function SmsCampaignComposer() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [segmentTags, setSegmentTags] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const charCount = message.length
  const smsCount = Math.ceil(charCount / SMS_LIMIT) || 1
  const isMultiSms = charCount > SMS_LIMIT

  async function handleSend() {
    if (!name || !message) { setError('Name and message are required'); return }
    setSending(true)
    setError('')
    const res = await fetch('/api/sms/send-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        message,
        segment_tags: segmentTags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    })
    setSending(false)
    if (res.ok) { router.push('/sms/campaigns'); router.refresh() }
    else { const d = await res.json(); setError(d.error ?? 'Failed to send') }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">New SMS Campaign</h2>
        <Button variant="primary" size="sm" onClick={handleSend} loading={sending}>
          <Send size={14} /> Send Now
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
      )}

      <div className="space-y-4">
        <Field label="Campaign Name (internal)">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Promo SMS" />
        </Field>
        <Field label="Segment Tags">
          <Input value={segmentTags} onChange={(e) => setSegmentTags(e.target.value)} placeholder="Leave empty to send to all" />
        </Field>
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">
            Message
            <span className={`ml-2 ${isMultiSms ? 'text-yellow-400' : 'text-white/30'}`}>
              {charCount}/{SMS_LIMIT} chars
              {isMultiSms && ` (${smsCount} SMS)`}
            </span>
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your SMS message... Include your name and a way to opt out."
            className="min-h-[120px]"
          />
          {isMultiSms && (
            <p className="text-xs text-yellow-400 mt-1">
              ⚠️ Message exceeds 160 characters — will be sent as {smsCount} SMS messages, increasing cost.
            </p>
          )}
        </div>
        <div className="bg-[#161616] border border-white/[0.08] rounded-lg p-3 text-xs text-white/40 space-y-1">
          <p>• Twilio UK number must be purchased before sending</p>
          <p>• Trial accounts can only send to verified numbers</p>
          <p>• Always include opt-out instructions (e.g., "Reply STOP to unsubscribe")</p>
        </div>
      </div>
    </div>
  )
}
