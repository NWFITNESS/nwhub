'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field } from '@/components/ui/Input'
import { Send } from 'lucide-react'

export function CampaignBuilder() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [fromName, setFromName] = useState('Northern Warrior')
  const [fromEmail, setFromEmail] = useState('noreply@northernwarrior.co.uk')
  const [replyTo, setReplyTo] = useState('info@northernwarrior.co.uk')
  const [htmlContent, setHtmlContent] = useState('')
  const [segmentTags, setSegmentTags] = useState('')
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)

  async function handleSaveDraft() {
    setSaving(true)
    const res = await fetch('/api/email/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, preview_text: previewText, from_name: fromName, from_email: fromEmail, reply_to: replyTo, html_content: htmlContent, segment_tags: segmentTags.split(',').map((t) => t.trim()).filter(Boolean), status: 'draft' }),
    })
    setSaving(false)
    if (res.ok) { router.push('/email/campaigns'); router.refresh() }
    else { const d = await res.json(); setError(d.error ?? 'Failed to save') }
  }

  async function handleSend() {
    if (!name || !subject || !htmlContent) { setError('Name, subject and content are required'); return }
    setSending(true)
    setError('')
    const res = await fetch('/api/email/send-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, preview_text: previewText, from_name: fromName, from_email: fromEmail, reply_to: replyTo, html_content: htmlContent, segment_tags: segmentTags.split(',').map((t) => t.trim()).filter(Boolean) }),
    })
    setSending(false)
    if (res.ok) { router.push('/email/campaigns'); router.refresh() }
    else { const d = await res.json(); setError(d.error ?? 'Failed to send') }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">New Email Campaign</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreview(!preview)}>
            {preview ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSaveDraft} loading={saving}>
            Save Draft
          </Button>
          <Button variant="primary" size="sm" onClick={handleSend} loading={sending}>
            <Send size={14} /> Send Now
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Field label="Campaign Name (internal)">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="May Newsletter 2026" />
          </Field>
          <Field label="Subject Line">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your subject here..." />
          </Field>
          <Field label="Preview Text">
            <Input value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Short preview shown in inbox..." />
          </Field>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">HTML Content</label>
            {preview ? (
              <iframe
                srcDoc={htmlContent}
                className="w-full h-96 rounded-lg border border-white/10 bg-white"
                title="Email preview"
              />
            ) : (
              <Textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="font-mono text-xs min-h-[300px]"
                placeholder="<html><body>Your email HTML...</body></html>"
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Field label="From Name">
            <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
          </Field>
          <Field label="From Email">
            <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
          </Field>
          <Field label="Reply To">
            <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
          </Field>
          <Field label="Segment Tags (comma-separated)" >
            <Input value={segmentTags} onChange={(e) => setSegmentTags(e.target.value)} placeholder="all, or tag1, tag2" />
            <p className="text-xs text-white/30 mt-1">Leave empty to send to all subscribers</p>
          </Field>
          <div className="bg-[#161616] border border-white/[0.08] rounded-lg p-3">
            <p className="text-xs text-white/40 mb-1">Tips</p>
            <ul className="text-xs text-white/30 space-y-1">
              <li>• Verify your domain on Resend first</li>
              <li>• Always include an unsubscribe link</li>
              <li>• Test with a small segment first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
