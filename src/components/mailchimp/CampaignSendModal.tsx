'use client'

import { useState, useEffect } from 'react'
import { X, Send, Clock, Mail, User, AtSign, CheckCircle, AlertCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  html: string
  title: string
  previewText: string
}

interface Segment {
  id: string
  label: string
  count: number
  emails: string[]
}

type Step = 'details' | 'preview' | 'send'

export function CampaignSendModal({ open, onClose, html, title, previewText }: Props) {
  const [step, setStep] = useState<Step>('details')
  const [campaignName, setCampaignName] = useState(title)
  const [subject, setSubject] = useState(title)
  const [preview, setPreview] = useState(previewText)
  const [fromName, setFromName] = useState('Northern Warrior')
  const [fromEmail, setFromEmail] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('08:00')

  // Segments
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [loadingSegments, setLoadingSegments] = useState(false)

  const [sending, setSending] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load settings + segments on open
  useEffect(() => {
    if (!open) return
    fetch('/api/mailchimp/settings')
      .then(r => r.json())
      .then(d => {
        if (d.from_name) setFromName(d.from_name)
        if (d.from_email) setFromEmail(d.from_email)
        if (d.reply_to) setReplyTo(d.reply_to)
      })
      .catch(() => {})

    setLoadingSegments(true)
    fetch('/api/contacts/segments')
      .then(r => r.json())
      .then((data: Segment[]) => setSegments(data))
      .catch(() => {})
      .finally(() => setLoadingSegments(false))
  }, [open])

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('details')
      setCampaignName(title)
      setSubject(title)
      setPreview(previewText)
      setCampaignId(null)
      setSelectedSegment('all')
      setError('')
      setSuccess('')
    }
  }, [open, title, previewText])

  const activeSegment = segments.find(s => s.id === selectedSegment)

  async function createDraft(): Promise<string | null> {
    if (campaignId) return campaignId
    setError('')
    const segEmails = selectedSegment !== 'all' && activeSegment ? activeSegment.emails : undefined
    const res = await fetch('/api/mailchimp/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject, title: campaignName, preview_text: preview,
        from_name: fromName, from_email: fromEmail, reply_to: replyTo || fromEmail,
        html,
        segment_emails: segEmails,
      }),
    })
    const text = await res.text()
    if (!text) { setError('Empty response from server'); return null }
    try {
      const data = JSON.parse(text)
      if (!res.ok) { setError(data.error ?? 'Failed to create draft'); return null }
      setCampaignId(data.campaign_id)
      return data.campaign_id
    } catch { setError('Invalid response'); return null }
  }

  async function handleSaveDraft() {
    setSavingDraft(true); setError(''); setSuccess('')
    const id = await createDraft()
    setSavingDraft(false)
    if (id) setSuccess('Draft saved to Mailchimp! You can send it later from the Email Campaigns page.')
  }

  async function handleTestSend() {
    if (!testEmail) { setError('Enter a test email address'); return }
    setSendingTest(true); setError('')
    const id = await createDraft()
    if (!id) { setSendingTest(false); return }
    const res = await fetch('/api/mailchimp/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: id, test_emails: [testEmail] }),
    })
    setSendingTest(false)
    if (res.ok) setSuccess('Test email sent!')
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Test send failed') }
  }

  async function handleSendNow() {
    setSending(true); setError(''); setSuccess('')
    const id = await createDraft()
    if (!id) { setSending(false); return }
    const res = await fetch('/api/mailchimp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: id, subject, title: campaignName, html }),
    })
    setSending(false)
    if (res.ok) { setSuccess('Campaign sent! Check Email Campaigns for stats.'); setTimeout(onClose, 2000) }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Send failed') }
  }

  async function handleSchedule() {
    if (!scheduleDate) { setError('Pick a date'); return }
    setScheduling(true); setError(''); setSuccess('')

    // Save as Mailchimp draft
    const id = await createDraft()
    if (!id) { setScheduling(false); return }

    const scheduledTime = `${scheduleDate}T${scheduleTime}:00`
    const scheduledISO = new Date(scheduledTime).toISOString()
    const friendlyDate = new Date(scheduledTime).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

    // Create a to-do task as a reminder
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `📧 Send campaign: ${campaignName}`,
        notes: `Mailchimp draft ID: ${id}\nSubject: ${subject}\nScheduled for: ${friendlyDate}\n\nGo to Email Campaigns → find this draft → Send Now`,
        due_date: scheduleDate,
        priority: 'high',
        source: 'campaign_schedule',
      }),
    })

    // Save scheduled campaign reminder for the popup
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'scheduled_campaigns',
        value: [{ campaign_id: id, name: campaignName, subject, scheduled_for: scheduledISO, created_at: new Date().toISOString() }],
      }),
    })

    setScheduling(false)
    setSuccess(`Draft saved & reminder set for ${friendlyDate}! You'll see a popup + to-do when it's time to send.`)
  }

  if (!open) return null

  const steps: { id: Step; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'preview', label: 'Preview' },
    { id: 'send', label: 'Send' },
  ]

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />

      <div className="fixed inset-4 z-50 flex items-center justify-center md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[620px] md:max-h-[88vh]">
        <div className="w-full max-h-full overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.11)] bg-nw-900 shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] px-5 py-3.5 flex-shrink-0">
            <div>
              <p className="text-nw-200 font-medium" style={{ fontSize: 15 }}>Send Campaign</p>
              <p className="text-nw-500" style={{ fontSize: 11 }}>via Mailchimp · {activeSegment ? `${activeSegment.count} recipients` : 'loading...'}</p>
            </div>
            <button onClick={onClose} className="text-nw-500 hover:text-nw-300 transition-colors"><X size={18} /></button>
          </div>

          {/* Step tabs */}
          <div className="flex border-b border-[rgba(255,255,255,0.07)] px-5 flex-shrink-0">
            {steps.map(s => (
              <button key={s.id} onClick={() => setStep(s.id)}
                className={`-mb-px border-b-2 px-4 py-2.5 font-medium transition-colors ${step === s.id ? 'border-gold-400 text-gold-300' : 'border-transparent text-nw-400 hover:text-nw-200'}`}
                style={{ fontSize: 13 }}
              >{s.label}</button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-red-400" style={{ fontSize: 12 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.08)] px-3 py-2 text-[#4ade80]" style={{ fontSize: 12 }}>
                <CheckCircle size={14} /> {success}
              </div>
            )}

            {/* DETAILS */}
            {step === 'details' && (
              <div className="flex flex-col gap-4">
                <Field label="Campaign Name">
                  <input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. March Newsletter" className={inputCls} />
                </Field>
                <Field label="Subject Line">
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What subscribers see in their inbox" className={inputCls} />
                </Field>
                <Field label="Preview Text">
                  <input value={preview} onChange={e => setPreview(e.target.value)} placeholder="Short preview shown after subject" className={inputCls} />
                </Field>

                <div className="h-px bg-[rgba(255,255,255,0.07)]" />

                {/* Audience picker */}
                <Field label="Audience">
                  {loadingSegments ? (
                    <p className="text-nw-500" style={{ fontSize: 12 }}>Loading segments...</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {segments.map(seg => (
                        <button
                          key={seg.id}
                          onClick={() => setSelectedSegment(seg.id)}
                          className={`flex items-center gap-3 rounded-[8px] border p-3 text-left transition-all ${
                            selectedSegment === seg.id
                              ? 'border-[rgba(212,160,23,0.3)] bg-[rgba(212,160,23,0.08)]'
                              : 'border-[rgba(255,255,255,0.09)] bg-nw-800 hover:border-[rgba(255,255,255,0.14)]'
                          }`}
                        >
                          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[7px] ${
                            selectedSegment === seg.id
                              ? 'bg-[rgba(212,160,23,0.12)] text-gold-400'
                              : 'bg-[rgba(255,255,255,0.04)] text-nw-400'
                          }`}>
                            <Users size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${selectedSegment === seg.id ? 'text-gold-300' : 'text-nw-200'}`} style={{ fontSize: 13 }}>{seg.label}</p>
                            <p className="text-nw-500" style={{ fontSize: 11 }}>{seg.count} contact{seg.count !== 1 ? 's' : ''} with email</p>
                          </div>
                          {selectedSegment === seg.id && <CheckCircle size={16} className="text-gold-400 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </Field>

                <div className="h-px bg-[rgba(255,255,255,0.07)]" />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="From Name">
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-nw-500" />
                      <input value={fromName} onChange={e => setFromName(e.target.value)} className={inputCls + ' pl-9'} />
                    </div>
                  </Field>
                  <Field label="Reply-To Email">
                    <div className="relative">
                      <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-nw-500" />
                      <input value={replyTo || fromEmail} onChange={e => setReplyTo(e.target.value)} placeholder="info@northernwarrior.co.uk" className={inputCls + ' pl-9'} />
                    </div>
                  </Field>
                </div>

                <div className="flex justify-end mt-2">
                  <Button variant="gold" size="sm" onClick={() => setStep('preview')}>Next: Preview →</Button>
                </div>
              </div>
            )}

            {/* PREVIEW */}
            {step === 'preview' && (
              <div className="flex flex-col gap-4">
                <p className="text-nw-500" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Inbox Preview</p>
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-800 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold-500 font-brand font-bold text-nw-950" style={{ fontSize: 12 }}>NW</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-nw-200 font-medium" style={{ fontSize: 13 }}>{fromName || 'Northern Warrior'}</span>
                        <span className="text-nw-500" style={{ fontSize: 10 }}>now</span>
                      </div>
                      <p className="text-nw-200 font-medium truncate" style={{ fontSize: 13 }}>{subject || 'Subject line'}</p>
                      <p className="text-nw-400 truncate" style={{ fontSize: 12 }}>{preview || 'Preview text...'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-nw-500" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Email Content</p>
                  <span className="text-nw-500 flex items-center gap-1" style={{ fontSize: 10 }}>
                    <Users size={10} /> Sending to: {activeSegment?.label ?? 'All'} ({activeSegment?.count ?? 0})
                  </span>
                </div>
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.11)] overflow-hidden bg-white" style={{ maxHeight: 400 }}>
                  <iframe srcDoc={html} className="w-full border-0" style={{ height: 380 }} title="Email Preview" sandbox="allow-same-origin" />
                </div>

                <div className="flex justify-between mt-2">
                  <Button variant="default" size="sm" onClick={() => setStep('details')}>← Back</Button>
                  <Button variant="gold" size="sm" onClick={() => setStep('send')}>Next: Send →</Button>
                </div>
              </div>
            )}

            {/* SEND */}
            {step === 'send' && (
              <div className="flex flex-col gap-4">
                {/* Summary */}
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-4 flex items-center gap-3">
                  <Users size={16} className="text-gold-400 flex-shrink-0" />
                  <div>
                    <p className="text-nw-200 font-medium" style={{ fontSize: 13 }}>Sending to: {activeSegment?.label ?? 'All Contacts'}</p>
                    <p className="text-nw-500" style={{ fontSize: 11 }}>{activeSegment?.count ?? 0} recipients · Subject: {subject}</p>
                  </div>
                </div>

                {/* Test send */}
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-4">
                  <p className="text-nw-200 font-medium mb-3" style={{ fontSize: 13 }}>Test Send</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-nw-500" />
                      <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com" className={inputCls + ' pl-9'} />
                    </div>
                    <Button variant="default" size="sm" onClick={handleTestSend} loading={sendingTest}>
                      <Send size={12} /> Test
                    </Button>
                  </div>
                </div>

                {/* Schedule */}
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-4">
                  <p className="text-nw-200 font-medium mb-1" style={{ fontSize: 13 }}>Schedule for Later</p>
                  <p className="text-nw-500 mb-3" style={{ fontSize: 11 }}>Saves draft + creates a to-do reminder. You&apos;ll get a popup when it&apos;s time to send.</p>
                  <div className="flex gap-2 mb-3">
                    <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className={inputCls + ' flex-1'} />
                    <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className={inputCls} style={{ width: 120 }} />
                  </div>
                  <Button variant="default" size="sm" onClick={handleSchedule} loading={scheduling} className="w-full">
                    <Clock size={12} /> Schedule Campaign
                  </Button>
                </div>

                {/* Save draft */}
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-4">
                  <p className="text-nw-200 font-medium mb-2" style={{ fontSize: 13 }}>Save as Draft</p>
                  <p className="text-nw-500 mb-3" style={{ fontSize: 11 }}>Save to Mailchimp without sending. You can send it later.</p>
                  <Button variant="default" size="sm" onClick={handleSaveDraft} loading={savingDraft} className="w-full">
                    <CheckCircle size={12} /> Save Draft
                  </Button>
                </div>

                {/* Send now */}
                <div className="rounded-[10px] border border-[rgba(212,160,23,0.2)] bg-[rgba(212,160,23,0.05)] p-4">
                  <p className="text-nw-200 font-medium mb-2" style={{ fontSize: 13 }}>Send Now</p>
                  <p className="text-nw-500 mb-3" style={{ fontSize: 11 }}>Send to {activeSegment?.count ?? 0} {activeSegment?.label?.toLowerCase() ?? 'contacts'} immediately.</p>
                  <Button variant="gold" size="sm" onClick={handleSendNow} loading={sending} className="w-full">
                    <Send size={12} /> Send Campaign Now
                  </Button>
                </div>

                <div className="flex justify-start">
                  <Button variant="default" size="sm" onClick={() => setStep('preview')}>← Back</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-nw-500 mb-1.5" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'h-9 w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 text-nw-200 placeholder:text-nw-500 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750 text-[13px]'
