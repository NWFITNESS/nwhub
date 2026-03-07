'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Send, Clock, Monitor, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { MailchimpSettings } from '@/lib/types'

// Unlayer editor — loaded client-side only (~700 KB deferred)
const EmailEditor = dynamic(() => import('react-email-editor'), { ssr: false })

// Minimal interface for the Unlayer editor instance
interface UnlayerEditor {
  loadDesign(design: object): void
  exportHtml(callback: (data: { html: string; design: object }) => void): void
}
interface EditorRefShape {
  editor: UnlayerEditor | null
}

interface MailchimpCampaign {
  id: string
  settings: {
    subject_line: string
    title: string
    preview_text?: string
    from_name?: string
    reply_to?: string
  }
}

interface Props {
  settings: MailchimpSettings
  campaign?: MailchimpCampaign | null
  designJson?: object | null
}

interface SetupState {
  title: string
  subject: string
  preview_text: string
  from_name: string
  from_email: string
  reply_to: string
}

function inputCls(extra = '') {
  return `w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#967705]/60 transition-colors ${extra}`
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function CampaignBuilder({ settings, campaign, designJson }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [campaignId, setCampaignId] = useState<string | undefined>(campaign?.id)
  const [exportedHtml, setExportedHtml] = useState('')
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop')
  const [testEmail, setTestEmail] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  // Cast to any because next/dynamic strips forwardRef types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<EditorRefShape>(null) as React.MutableRefObject<any>

  const [setup, setSetup] = useState<SetupState>({
    title: campaign?.settings?.title ?? '',
    subject: campaign?.settings?.subject_line ?? '',
    preview_text: campaign?.settings?.preview_text ?? '',
    from_name: campaign?.settings?.from_name ?? settings.from_name ?? 'Northern Warrior',
    from_email: settings.from_email ?? 'info@northernwarrior.co.uk',
    reply_to: campaign?.settings?.reply_to ?? settings.reply_to ?? '',
  })

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const onEditorReady = useCallback(() => {
    if (designJson && editorRef.current?.editor) {
      editorRef.current.editor.loadDesign(designJson)
    }
  }, [designJson])

  async function saveDraft(silent = false): Promise<boolean> {
    return new Promise((resolve) => {
      const unlayer: UnlayerEditor | null = editorRef.current?.editor ?? null
      if (!unlayer) {
        if (!silent) showToast('Editor not ready', false)
        resolve(false)
        return
      }
      unlayer.exportHtml(async ({ html, design }) => {
        setSavingDraft(true)
        try {
          const res = await fetch('/api/mailchimp/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaign_id: campaignId,
              ...setup,
              html,
              design_json: design,
            }),
          })
          const data = await res.json()
          if (!res.ok) {
            showToast(data.error ?? 'Failed to save draft', false)
            resolve(false)
            return
          }
          if (data.campaign_id) setCampaignId(data.campaign_id)
          setExportedHtml(html)
          if (!silent) showToast('Draft saved')
          resolve(true)
        } catch {
          showToast('Failed to save draft', false)
          resolve(false)
        } finally {
          setSavingDraft(false)
        }
      })
    })
  }

  async function goToReview() {
    const saved = await saveDraft(true)
    if (saved) setStep(3)
  }

  async function handleSendTest() {
    if (!campaignId) { showToast('Save draft first', false); return }
    if (!testEmail.trim()) { showToast('Enter a test email address', false); return }
    setSendingTest(true)
    try {
      const res = await fetch('/api/mailchimp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, test_emails: [testEmail.trim()] }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Test send failed', false); return }
      showToast('Test email sent!')
    } finally {
      setSendingTest(false)
    }
  }

  async function handleSend(scheduled = false) {
    if (!campaignId) { showToast('Save draft first', false); return }
    if (scheduled && !scheduleTime) { showToast('Pick a schedule date/time', false); return }
    setSending(true)
    try {
      const body: Record<string, unknown> = { campaign_id: campaignId }
      if (scheduled) body.scheduled_time = new Date(scheduleTime).toISOString()
      const res = await fetch('/api/mailchimp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Send failed', false); return }
      router.push('/mailchimp?sent=1')
    } finally {
      setSending(false)
    }
  }

  const canAdvanceStep1 = setup.subject.trim().length > 0 && setup.from_email.trim().length > 0

  const stepMeta = [
    { n: 1, label: 'Setup' },
    { n: 2, label: 'Design' },
    { n: 3, label: 'Review & Send' },
  ]

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium ${
          toast.ok
            ? 'bg-green-500/15 border-green-500/30 text-green-400'
            : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Stepper header */}
      <div className="sticky top-16 z-10 bg-[#0a0a0a] border-b px-6 py-4" style={{ borderBottomColor: 'rgba(150,119,5,0.15)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Steps */}
          <div className="flex items-center">
            {stepMeta.map(({ n, label }, i) => (
              <div key={n} className="flex items-center">
                {i > 0 && (
                  <div className={`w-10 h-px mx-1 ${step > i ? 'bg-[#967705]' : 'bg-white/15'}`} />
                )}
                <button
                  onClick={() => { if (n < step) setStep(n) }}
                  disabled={n >= step}
                  className="flex items-center gap-2 disabled:cursor-default"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    step === n
                      ? 'bg-[#967705]/20 border-[#967705] text-[#c9a70a]'
                      : step > n
                      ? 'bg-[#967705]/10 border-[#967705]/40 text-[#c9a70a]/60 cursor-pointer'
                      : 'bg-white/5 border-white/15 text-white/30'
                  }`}>
                    {n}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block transition-colors ${
                    step === n ? 'text-[#c9a70a]' : step > n ? 'text-white/45' : 'text-white/25'
                  }`}>
                    {label}
                  </span>
                </button>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {step > 1 && (
              <Button variant="secondary" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={14} /> Back
              </Button>
            )}
            {step === 1 && (
              <Button size="sm" onClick={() => setStep(2)} disabled={!canAdvanceStep1}>
                Continue <ArrowRight size={14} />
              </Button>
            )}
            {step === 2 && (
              <>
                <Button variant="secondary" size="sm" onClick={() => saveDraft(false)} disabled={savingDraft}>
                  {savingDraft ? 'Saving…' : 'Save Draft'}
                </Button>
                <Button size="sm" onClick={goToReview} disabled={savingDraft}>
                  Continue <ArrowRight size={14} />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 1: Setup ── */}
      {step === 1 && (
        <div className="flex-1 flex items-start justify-center p-6">
          <div className="w-full max-w-2xl space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Campaign Setup</h2>
              <p className="text-sm text-white/40">Configure the details for your campaign</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-6 space-y-5">
              <FormField label="Campaign Name (internal)">
                <input
                  type="text"
                  value={setup.title}
                  onChange={(e) => setSetup((s) => ({ ...s, title: e.target.value }))}
                  placeholder="E.g. March Newsletter 2026"
                  className={inputCls()}
                />
              </FormField>
              <FormField label="Subject Line *">
                <input
                  type="text"
                  value={setup.subject}
                  onChange={(e) => setSetup((s) => ({ ...s, subject: e.target.value }))}
                  placeholder="What's your email about?"
                  className={inputCls()}
                />
              </FormField>
              <FormField label="Preview Text">
                <input
                  type="text"
                  value={setup.preview_text}
                  onChange={(e) => setSetup((s) => ({ ...s, preview_text: e.target.value }))}
                  placeholder="Snippet shown in inbox after subject line"
                  className={inputCls()}
                />
              </FormField>
              <FormField label="From Name">
                <input
                  type="text"
                  value={setup.from_name}
                  onChange={(e) => setSetup((s) => ({ ...s, from_name: e.target.value }))}
                  placeholder="Northern Warrior"
                  className={inputCls()}
                />
              </FormField>
              <FormField label="From Email *">
                <input
                  type="email"
                  value={setup.from_email}
                  onChange={(e) => setSetup((s) => ({ ...s, from_email: e.target.value }))}
                  placeholder="info@northernwarrior.co.uk"
                  className={inputCls()}
                />
              </FormField>
              <FormField label="Reply-To Email">
                <input
                  type="email"
                  value={setup.reply_to}
                  onChange={(e) => setSetup((s) => ({ ...s, reply_to: e.target.value }))}
                  placeholder="info@northernwarrior.co.uk"
                  className={inputCls()}
                />
              </FormField>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canAdvanceStep1}>
                Continue to Design <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Design (Unlayer) ── */}
      {step === 2 && (
        <div className="flex-1" style={{ height: 'calc(100vh - 64px - 65px)' }}>
          <EmailEditor
            ref={editorRef}
            onReady={onEditorReady}
            style={{ height: '100%', minHeight: 0 }}
            options={{
              displayMode: 'email',
              appearance: {
                theme: 'dark',
                panels: { tools: { dock: 'left' } },
              },
            }}
          />
        </div>
      )}

      {/* ── Step 3: Review & Send ── */}
      {step === 3 && (
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto flex gap-6 items-start">
            {/* Preview pane */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/70">Email Preview</h3>
                <div className="flex gap-1 p-1 rounded-lg bg-[#111] border border-white/[0.06]">
                  {([
                    { id: 'desktop' as const, icon: Monitor, label: 'Desktop' },
                    { id: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
                  ] as const).map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setDevicePreview(id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        devicePreview === id
                          ? 'bg-[#967705]/20 text-[#c9a70a] border border-[#967705]/30'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#111] overflow-hidden">
                <div className="flex justify-center p-4 overflow-auto">
                  <iframe
                    srcDoc={exportedHtml || '<p style="color:#999;text-align:center;padding:40px;font-family:sans-serif;font-size:14px">No content yet — go back to Design to build your email.</p>'}
                    style={{
                      width: devicePreview === 'desktop' ? '600px' : '375px',
                      height: '600px',
                      border: 'none',
                      background: '#fff',
                      borderRadius: '4px',
                      transition: 'width 0.25s ease',
                      flexShrink: 0,
                    }}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>

            {/* Action panel */}
            <div className="w-72 space-y-4 flex-shrink-0">
              {/* Test email */}
              <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white/70">Send Test Email</h3>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputCls()}
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleSendTest}
                  disabled={sendingTest || !campaignId}
                >
                  {sendingTest ? 'Sending…' : 'Send Test'}
                </Button>
                {!campaignId && (
                  <p className="text-xs text-white/30">Go back to Design and Save Draft first.</p>
                )}
              </div>

              {/* Send now */}
              <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white/70">Send Campaign</h3>
                <Button
                  className="w-full"
                  onClick={() => handleSend(false)}
                  disabled={sending || !campaignId}
                >
                  <Send size={14} />
                  {sending ? 'Sending…' : 'Send Now'}
                </Button>
              </div>

              {/* Schedule */}
              <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white/70">Schedule Send</h3>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className={inputCls()}
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => handleSend(true)}
                  disabled={sending || !campaignId || !scheduleTime}
                >
                  <Clock size={14} />
                  {sending ? 'Scheduling…' : 'Schedule Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
