'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field } from '@/components/ui/Input'
import { Send, Check } from 'lucide-react'

interface Segment {
  id: string
  label: string
  count: number
  category: string
  tags?: string[]
  emails?: string[]
}

export function CampaignBuilder() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [fromName, setFromName] = useState('Northern Warrior')
  const [fromEmail, setFromEmail] = useState('noreply@northernwarrior.co.uk')
  const [replyTo, setReplyTo] = useState('info@northernwarrior.co.uk')
  const [htmlContent, setHtmlContent] = useState('')
  const [selectedSegments, setSelectedSegments] = useState<string[]>([])
  const [customTags, setCustomTags] = useState('')
  const [segments, setSegments] = useState<Segment[]>([])
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    fetch('/api/contacts/segments')
      .then(r => r.json())
      .then(data => setSegments(data))
      .catch(() => {})
  }, [])

  function getSegmentTags(): string[] {
    const tags = new Set<string>()
    for (const id of selectedSegments) {
      const seg = segments.find(s => s.id === id)
      if (seg?.tags?.length) {
        for (const t of seg.tags) tags.add(t)
      } else {
        tags.add(id)
      }
    }
    if (customTags.trim()) {
      for (const t of customTags.split(',').map(s => s.trim()).filter(Boolean)) {
        tags.add(t)
      }
    }
    return [...tags]
  }

  function getSegmentEmails(): string[] {
    const emails = new Set<string>()
    for (const id of selectedSegments) {
      const seg = segments.find(s => s.id === id)
      if (seg?.emails?.length) {
        for (const e of seg.emails) if (e) emails.add(e.toLowerCase())
      }
    }
    return [...emails]
  }

  function toggleSegment(id: string) {
    setSelectedSegments(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  async function handleSaveDraft() {
    setSaving(true)
    const res = await fetch('/api/email/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, preview_text: previewText, from_name: fromName, from_email: fromEmail, reply_to: replyTo, html_content: htmlContent, segment_tags: getSegmentTags(), status: 'draft' }),
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
      body: JSON.stringify({ name, subject, preview_text: previewText, from_name: fromName, from_email: fromEmail, reply_to: replyTo, html_content: htmlContent, segment_tags: getSegmentTags(), segment_emails: getSegmentEmails() }),
    })
    setSending(false)
    if (res.ok) { router.push('/email/campaigns'); router.refresh() }
    else { const d = await res.json(); setError(d.error ?? 'Failed to send') }
  }

  const grouped = {
    core: segments.filter(s => s.category === 'core'),
    membership: segments.filter(s => s.category === 'membership'),
    source: segments.filter(s => s.category === 'source'),
    tags: segments.filter(s => s.category === 'tags'),
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
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

          {/* Segment selector */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">Target Audience</label>
            <div className="border border-white/[0.08] rounded-lg overflow-hidden">
              {Object.entries(grouped).map(([category, segs]) => segs.length > 0 && (
                <div key={category}>
                  <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-white/30" style={{ padding: '8px 12px 4px' }}>
                    {category === 'core' ? 'Core' : category === 'membership' ? 'Membership' : category === 'source' ? 'Source' : 'Tags'}
                  </div>
                  {segs.map(seg => {
                    const selected = selectedSegments.includes(seg.id)
                    return (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => toggleSegment(seg.id)}
                        className={`w-full flex items-center gap-2 text-left text-sm transition-colors ${selected ? 'bg-[#967705]/15 text-white' : 'text-white/60 hover:bg-white/[0.04]'}`}
                        style={{ padding: '8px 12px' }}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? 'border-[#C9A70A] bg-[#967705]' : 'border-white/20'}`}>
                          {selected && <Check size={10} className="text-black" />}
                        </div>
                        <span className="flex-1">{seg.label}</span>
                        <span className="text-xs text-white/30">{seg.count}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            {selectedSegments.length === 0 && (
              <p className="text-xs text-white/30 mt-1.5">No segments selected — will send to all subscribers</p>
            )}
            {selectedSegments.length > 0 && (
              <p className="text-xs text-[#C9A70A]/70 mt-1.5">
                Targeting: {selectedSegments.map(id => segments.find(s => s.id === id)?.label).filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          <Field label="Additional Tags (optional, comma-separated)">
            <Input value={customTags} onChange={(e) => setCustomTags(e.target.value)} placeholder="custom-tag-1, custom-tag-2" />
          </Field>

          <div className="bg-[#161616] border border-white/[0.08] rounded-lg" style={{ padding: 12 }}>
            <p className="text-xs text-white/40 mb-1">Tips</p>
            <ul className="text-xs text-white/30 space-y-1">
              <li>• Select &quot;Kids &amp; Teens Parents&quot; to email parents only</li>
              <li>• Select &quot;Members&quot; for adult members only</li>
              <li>• Always include an unsubscribe link</li>
              <li>• Test with a small segment first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
