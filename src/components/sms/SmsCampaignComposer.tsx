'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Field } from '@/components/ui/Input'
import { Send, FlaskConical } from 'lucide-react'

export function SmsCampaignComposer() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [testOpen, setTestOpen] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const charCount = message.length

  // Load all unique tags from subscribers
  useEffect(() => {
    supabase.from('sms_subscribers').select('tags').eq('status', 'subscribed').then(({ data }) => {
      if (!data) return
      const tags = Array.from(new Set(data.flatMap((r) => r.tags ?? []))).sort()
      setAvailableTags(tags)
    })
  }, [])

  // Update recipient count whenever selected tags change
  useEffect(() => {
    async function countRecipients() {
      let q = supabase.from('sms_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'subscribed')
      if (selectedTags.length > 0) q = q.overlaps('tags', selectedTags)
      const { count } = await q
      setRecipientCount(count ?? 0)
    }
    countRecipients()
  }, [selectedTags])

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  async function handleTest() {
    if (!message) { setTestResult({ ok: false, msg: 'Write a message first' }); return }
    if (!testPhone.trim()) { setTestResult({ ok: false, msg: 'Enter a phone number' }); return }
    setTestSending(true)
    setTestResult(null)
    const res = await fetch('/api/sms/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone.trim(), message }),
    })
    setTestSending(false)
    if (res.ok) {
      setTestResult({ ok: true, msg: `Test sent to ${testPhone}` })
    } else {
      const d = await res.json()
      setTestResult({ ok: false, msg: d.error ?? 'Failed to send test' })
    }
  }

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
        segment_tags: selectedTags,
      }),
    })
    setSending(false)
    if (res.ok) { router.push('/sms/campaigns'); router.refresh() }
    else { const d = await res.json(); setError(d.error ?? 'Failed to send') }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">New WhatsApp Campaign</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setTestResult(null); setTestOpen(true) }}>
            <FlaskConical size={14} /> Send Test
          </Button>
          <Button variant="primary" size="sm" onClick={handleSend} loading={sending}>
            <Send size={14} /> Send Now
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
      )}

      <div className="space-y-4">
        <Field label="Campaign Name (internal)">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Promo" />
        </Field>

        {/* Audience selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-white/60">Audience</label>
            {recipientCount !== null && (
              <span className="text-xs text-white/40">
                {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="p-3 rounded-lg border border-white/[0.08] bg-[#161616] space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTags([])}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedTags.length === 0
                    ? 'bg-brand-gold text-black border-brand-gold'
                    : 'border-white/10 text-white/50 hover:border-white/30'
                }`}
              >
                All subscribers
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-brand-gold text-black border-brand-gold'
                      : 'border-white/10 text-white/50 hover:border-white/30'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-xs text-white/30">Sending to subscribers tagged: {selectedTags.join(', ')}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">
            Message
            <span className="ml-2 text-white/30">{charCount} / 4096</span>
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your WhatsApp message... Include your name and a way to opt out."
            className="min-h-[120px]"
          />
        </div>

        <div className="bg-[#161616] border border-white/[0.08] rounded-lg p-3 text-xs text-white/40 space-y-1">
          <p>• Always include opt-out instructions (e.g., "Reply STOP to unsubscribe")</p>
          <p>• Outbound messages to new contacts require a Meta-approved template</p>
          <p>• Supports up to 4096 characters per message</p>
        </div>
      </div>

      <Modal open={testOpen} onClose={() => setTestOpen(false)} title="Send Test Message" width="sm">
        <div className="space-y-4">
          <p className="text-sm text-white/50">Sends your current message to a single number with a <span className="text-white/70">[TEST]</span> prefix. Does not create a campaign record.</p>
          <Field label="Your Phone Number (E.164)">
            <Input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+447700000000"
            />
          </Field>
          <div className="p-3 rounded-lg bg-[#0e0e0e] border border-white/[0.06] text-xs text-white/40 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {message || <span className="italic">No message written yet</span>}
          </div>
          {testResult && (
            <p className={`text-xs ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>{testResult.msg}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setTestOpen(false)}>Close</Button>
            <Button variant="primary" size="sm" onClick={handleTest} loading={testSending}>
              <FlaskConical size={13} /> Send Test
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
