'use client'

import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  CheckCircle2, Circle, ChevronLeft, Send, Clock, X, Pencil,
  Users, Mail, Type, Palette, Settings2, Smartphone, Eye, AlertCircle, CheckCircle,
} from 'lucide-react'
import type { MailchimpSettings } from '@/lib/types'

const EmailEditor = dynamic(() => import('react-email-editor'), { ssr: false })

interface UnlayerEditor {
  loadDesign(design: object): void
  exportHtml(callback: (data: { html: string; design: object }) => void): void
}
interface EditorRefShape { editor: UnlayerEditor | null }

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

interface EmailTemplate { id: string; name: string; design_json: object; created_at: string }
interface MailchimpAudience { id: string; name: string; member_count: number }

interface Props {
  settings: MailchimpSettings
  campaign?: MailchimpCampaign | null
  designJson?: object | null
}

// ─── Inline helpers ──────────────────────────────────────────────────────────

function inp(extra = '') {
  return `w-full px-3.5 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/[0.08] text-sm text-[#F0F0F0] placeholder:text-white/20 focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors ${extra}`
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <button
        type="button"
        onClick={onChange}
        className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-all ${
          checked ? 'bg-[#967705]/30 border-[#967705]/60' : 'bg-white/[0.04] border-white/[0.12] group-hover:border-white/25'
        }`}
      >
        {checked && <CheckCircle2 size={11} className="text-[#C9A70A]" />}
      </button>
      <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">{label}</span>
    </label>
  )
}

// Step indicator circle
function StepDot({ n, complete, active }: { n: number; complete: boolean; active: boolean }) {
  if (complete) {
    return (
      <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 size={14} className="text-green-400" />
      </div>
    )
  }
  if (active) {
    return (
      <div className="w-7 h-7 rounded-full bg-[#967705]/15 border border-[#967705]/60 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-[#C9A70A]">{n}</span>
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.15] flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-white/25">{n}</span>
    </div>
  )
}

// Collapsed summary row
function SummaryText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-white/45 truncate">{children}</p>
}

// Phone inbox mockup for subject preview
function PhonePreview({ fromName, subject, previewText }: { fromName: string; subject: string; previewText: string }) {
  return (
    <div className="flex-shrink-0 w-52">
      <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.1em] mb-2.5 text-center">Inbox preview</p>
      {/* Phone shell */}
      <div className="relative mx-auto w-48 rounded-[24px] bg-[#111] border border-white/[0.1] overflow-hidden shadow-xl">
        {/* Status bar */}
        <div className="bg-[#0a0a0a] px-4 pt-3 pb-2 flex justify-between items-center">
          <span className="text-[10px] text-white/30">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-1.5 rounded-sm bg-white/20" />
            <div className="w-1 h-1.5 rounded-sm bg-white/20" />
          </div>
        </div>
        {/* Header bar */}
        <div className="bg-[#141414] px-3 py-2 border-b border-white/[0.06]">
          <p className="text-[11px] font-semibold text-white/70 text-center">Inbox</p>
        </div>
        {/* Email row */}
        <div className="bg-[#1a1a1a] px-3 py-3 border-b border-white/[0.06]">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-[#967705]/30 border border-[#967705]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[8px] font-bold text-[#C9A70A]">NW</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <p className="text-[10px] font-semibold text-[#F0F0F0] truncate">
                  {fromName || 'Northern Warrior'}
                </p>
                <p className="text-[9px] text-white/25 flex-shrink-0 ml-1">Now</p>
              </div>
              <p className="text-[10px] font-semibold text-white/80 truncate">
                {subject || 'Your subject line'}
              </p>
              <p className="text-[9px] text-white/35 truncate mt-0.5">
                {previewText || 'Preview text appears here…'}
              </p>
            </div>
          </div>
        </div>
        {/* Dimmed rows below to simulate inbox */}
        {[0.15, 0.08].map((op, i) => (
          <div key={i} className="px-3 py-3 border-b border-white/[0.04]">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-white/[0.05] flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-1.5 rounded bg-white/[0.08] w-3/4" />
                <div className="h-1.5 rounded bg-white/[0.05] w-full" />
                <div className="h-1.5 rounded bg-white/[0.04] w-2/3" />
              </div>
            </div>
          </div>
        ))}
        {/* Home indicator */}
        <div className="bg-[#111] py-2 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  )
}

// ─── Step card wrapper ────────────────────────────────────────────────────────

interface StepCardProps {
  n: number
  title: string
  icon: React.ReactNode
  complete: boolean
  active: boolean
  action?: React.ReactNode   // top-right action when collapsed+complete
  summary?: React.ReactNode  // shown when collapsed+complete
  onOpen: () => void
  children: React.ReactNode
}

function StepCard({ n, title, icon, complete, active, action, summary, onOpen, children }: StepCardProps) {
  const borderCls = complete && !active
    ? 'border-green-500/20'
    : active
    ? 'border-[#967705]/40'
    : 'border-white/[0.07]'

  const bgCls = active ? 'bg-[#161616]' : 'bg-white/[0.03]'

  return (
    <div className={`rounded-xl border ${borderCls} ${bgCls} transition-all duration-300`}>
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={onOpen}
        disabled={active}
        className="w-full flex items-center justify-between px-6 py-4 text-left disabled:cursor-default"
      >
        <div className="flex items-center gap-3">
          <StepDot n={n} complete={complete} active={active} />
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold transition-colors ${active ? 'text-[#F0F0F0]' : complete ? 'text-[#F0F0F0]' : 'text-white/30'}`}>
              {title}
            </span>
            {!active && !complete && (
              <span className="hidden">{icon}</span>
            )}
          </div>
        </div>
        {complete && !active && action && (
          <div className="flex-shrink-0">{action}</div>
        )}
      </button>

      {/* Collapsed summary */}
      {complete && !active && summary && (
        <div className="px-6 pb-4 -mt-1 pl-[4.25rem]">
          {summary}
        </div>
      )}

      {/* Expanded content */}
      {active && (
        <div className="px-6 pb-6">
          <div className="h-px bg-white/[0.06] mb-5" />
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

const PHASES = [
  { label: 'Setup', steps: [1, 2, 3] },
  { label: 'Design', steps: [4] },
  { label: 'Review & Send', steps: [5] },
]

function ProgressBar({ completedSteps }: { completedSteps: Set<number> }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {PHASES.map((phase, i) => {
        const done = phase.steps.every(s => completedSteps.has(s))
        const partial = phase.steps.some(s => completedSteps.has(s))
        const isLast = i === PHASES.length - 1
        return (
          <div key={phase.label} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-2 h-2 rounded-full transition-colors ${done ? 'bg-green-400' : partial ? 'bg-[#C9A70A]' : 'bg-white/[0.12]'}`} />
              <span className={`text-xs font-medium transition-colors ${done ? 'text-green-400' : partial ? 'text-[#C9A70A]' : 'text-white/25'}`}>
                {phase.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 mx-3 h-px bg-white/[0.08]">
                <div
                  className="h-full bg-gradient-to-r from-[#967705] to-transparent transition-all duration-500"
                  style={{ width: done ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CampaignBuilder({ settings, campaign, designJson }: Props) {
  const router = useRouter()

  // Campaign meta
  const [campaignTitle, setCampaignTitle] = useState(campaign?.settings?.title ?? 'Untitled Campaign')
  const [editingTitle, setEditingTitle] = useState(false)
  const [campaignId, setCampaignId] = useState<string | undefined>(campaign?.id)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Step state
  const senderReady = !!(settings.from_name && settings.from_email)
  const [activeStep, setActiveStep] = useState<number | null>(senderReady ? 2 : 1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(senderReady ? [1] : [])
  )

  // Step 1 — Sender
  const [fromName, setFromName] = useState(settings.from_name ?? 'Northern Warrior')
  const [fromEmail, setFromEmail] = useState(settings.from_email ?? 'info@northernwarrior.co.uk')

  // Step 2 — Recipients
  const [audiences, setAudiences] = useState<MailchimpAudience[]>([])
  const [audiencesLoading, setAudiencesLoading] = useState(false)
  const [selectedAudienceId, setSelectedAudienceId] = useState(settings.audience_id ?? '')
  const [skipUnengaged, setSkipUnengaged] = useState(false)

  // Step 3 — Subject
  const [subject, setSubject] = useState(campaign?.settings?.subject_line ?? '')
  const [previewText, setPreviewText] = useState(campaign?.settings?.preview_text ?? '')

  // Step 4 — Design
  const [showDesignEditor, setShowDesignEditor] = useState(false)
  const [exportedHtml, setExportedHtml] = useState('')
  const [exportedDesign, setExportedDesign] = useState<object | null>(null)
  const [designSaved, setDesignSaved] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [pendingTemplate, setPendingTemplate] = useState<object | null>(designJson ?? null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [templateTab, setTemplateTab] = useState<'yours' | 'basic'>('yours')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateNameInput, setTemplateNameInput] = useState('')
  const [showTemplateSave, setShowTemplateSave] = useState(false)
  const editorRef = useRef<EditorRefShape>(null) as React.MutableRefObject<any>
  const [editorReady, setEditorReady] = useState(false)
  const [editorHeight, setEditorHeight] = useState(0)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Step 5 — Additional Settings
  const [personalize, setPersonalize] = useState(false)
  const [customReply, setCustomReply] = useState(false)
  const [replyTo, setReplyTo] = useState(campaign?.settings?.reply_to ?? settings.reply_to ?? '')
  const [gaTracking, setGaTracking] = useState(false)
  const [attachment, setAttachment] = useState(false)
  const [customUnsub, setCustomUnsub] = useState(false)

  // Review / send modals
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop')
  const [testEmail, setTestEmail] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [sending, setSending] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  function completeStep(n: number, nextStep?: number | null) {
    setCompletedSteps(prev => { const s = new Set(prev); s.add(n); return s })
    setActiveStep(nextStep !== undefined ? nextStep : n + 1)
  }

  function openStep(n: number) {
    if (completedSteps.has(n) || n === activeStep) setActiveStep(n)
  }

  // Load audiences + templates on mount
  useEffect(() => {
    setAudiencesLoading(true)
    fetch('/api/mailchimp/audiences')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAudiences(d) })
      .catch(() => {})
      .finally(() => setAudiencesLoading(false))

    fetch('/api/mailchimp/templates')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTemplates(d) })
      .catch(() => {})
  }, [])

  // Measure overlay height for Unlayer
  useLayoutEffect(() => {
    if (!showDesignEditor) return
    const measure = () => setEditorHeight(window.innerHeight - 64)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [showDesignEditor])

  const onEditorReady = useCallback(() => {
    setEditorReady(true)
    const design = pendingTemplate ?? exportedDesign ?? designJson
    if (design && editorRef.current?.editor) {
      editorRef.current.editor.loadDesign(design)
    }
  }, [pendingTemplate, exportedDesign, designJson])

  // Save draft to Mailchimp
  async function saveDraft(silent = false): Promise<boolean> {
    return new Promise(resolve => {
      const unlayer = editorRef.current?.editor ?? null
      if (!unlayer) { if (!silent) showToast('Editor not ready', false); resolve(false); return }

      unlayer.exportHtml(async ({ html, design }: { html: string; design: object }) => {
        setSavingDraft(true)
        try {
          const res = await fetch('/api/mailchimp/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaign_id: campaignId,
              title: campaignTitle,
              subject,
              preview_text: previewText,
              from_name: fromName,
              from_email: fromEmail,
              reply_to: customReply ? replyTo : '',
              html,
              design_json: design,
            }),
          })
          const data = await res.json()
          if (!res.ok) { showToast(data.error ?? 'Failed to save', false); resolve(false); return }
          if (data.campaign_id) setCampaignId(data.campaign_id)
          setExportedHtml(html)
          setExportedDesign(design)
          if (!silent) showToast('Draft saved')
          resolve(true)
        } catch { showToast('Failed to save draft', false); resolve(false) }
        finally { setSavingDraft(false) }
      })
    })
  }

  async function handleSaveDesign() {
    const saved = await saveDraft(true)
    if (saved) {
      setDesignSaved(true)
      setShowDesignEditor(false)
      completeStep(4)
    } else {
      showToast('Failed to save design', false)
    }
  }

  async function saveAsTemplate() {
    if (!templateNameInput.trim()) return
    const unlayer = editorRef.current?.editor ?? null
    if (!unlayer) { showToast('Editor not ready', false); return }
    setSavingTemplate(true)
    unlayer.exportHtml(async ({ design }: { design: object }) => {
      try {
        const res = await fetch('/api/mailchimp/templates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: templateNameInput.trim(), design_json: design }),
        })
        if (!res.ok) { showToast('Failed to save template', false); return }
        const saved = await res.json()
        setTemplates(t => [...t, saved])
        setShowTemplateSave(false)
        setTemplateNameInput('')
        showToast('Template saved!')
      } catch { showToast('Failed to save template', false) }
      finally { setSavingTemplate(false) }
    })
  }

  async function handleSendTest() {
    if (!campaignId) { showToast('Save design first', false); return }
    if (!testEmail.trim()) { showToast('Enter a test email address', false); return }
    setSendingTest(true)
    try {
      const res = await fetch('/api/mailchimp/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, test_emails: [testEmail.trim()] }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Test send failed', false); return }
      showToast('Test email sent!')
    } finally { setSendingTest(false) }
  }

  async function handleSend(scheduled = false) {
    if (!campaignId) { showToast('Save design first', false); return }
    if (scheduled && !scheduleTime) { showToast('Pick a date/time', false); return }
    setSending(true)
    try {
      const body: Record<string, unknown> = { campaign_id: campaignId }
      if (scheduled) body.scheduled_time = new Date(scheduleTime).toISOString()
      const res = await fetch('/api/mailchimp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Send failed', false); return }
      router.push('/mailchimp?sent=1')
    } finally { setSending(false) }
  }

  // Guard
  if (!settings.api_key || !settings.audience_id) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center p-8">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <Mail size={20} className="text-white/20" />
        </div>
        <p className="text-sm font-medium text-white/40">Mailchimp not configured</p>
        <p className="text-xs text-white/20 max-w-[220px]">Add your API key and select an audience before creating campaigns.</p>
        <button onClick={() => router.push('/mailchimp')}
          className="mt-1 px-4 py-2 text-xs font-semibold text-[#C9A70A] border border-[#967705]/30 rounded-lg hover:bg-[#967705]/10 transition-colors">
          Go to Mailchimp Settings
        </button>
      </div>
    )
  }

  const selectedAudience = audiences.find(a => a.id === selectedAudienceId)
  const recipientCount = selectedAudience?.member_count ?? 0

  const canReadyToSend = completedSteps.has(1) && completedSteps.has(2) && completedSteps.has(3) && completedSteps.has(4)

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#080808]">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium ${
          toast.ok ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Unlayer fullscreen overlay ── */}
      {showDesignEditor && (
        <div ref={overlayRef} className="fixed inset-0 z-50 bg-[#080808] flex flex-col">
          {/* Overlay toolbar */}
          <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/[0.08] bg-[#0d0d0d]">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowDesignEditor(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 border border-white/[0.08] bg-white/[0.03] hover:text-white hover:border-white/20 transition-all">
                <X size={13} /> Close
              </button>
              <span className="text-sm font-semibold text-[#F0F0F0]">{campaignTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTemplateSave(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/50 text-xs hover:text-white/80 hover:border-white/20 transition-colors">
                Save as Template
              </button>
              <button onClick={handleSaveDesign} disabled={savingDraft}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_20px_rgba(201,167,10,0.25)]">
                {savingDraft ? 'Saving…' : 'Save Design'}
              </button>
            </div>
          </div>
          {/* Unlayer */}
          <div className="flex-1">
            {editorHeight > 0 ? (
              <EmailEditor
                ref={editorRef}
                onReady={onEditorReady}
                style={{ height: editorHeight }}
                options={{ displayMode: 'email', appearance: { theme: 'dark', panels: { tools: { dock: 'left' } } } }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/30 text-sm">Loading editor…</div>
            )}
          </div>
        </div>
      )}

      {/* ── Save as Template modal ── */}
      {showTemplateSave && (
        <div className="fixed inset-0 z-[55] bg-black/60 flex items-center justify-center p-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111] p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F0F0F0]">Save as Template</h3>
              <button onClick={() => setShowTemplateSave(false)} className="text-white/30 hover:text-white/60 transition-colors"><X size={16} /></button>
            </div>
            <input type="text" value={templateNameInput} onChange={e => setTemplateNameInput(e.target.value)}
              placeholder="Template name…" className={inp()} onKeyDown={e => { if (e.key === 'Enter') saveAsTemplate() }} autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setShowTemplateSave(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/[0.1] text-white/50 text-sm hover:text-white/70 transition-colors">Cancel</button>
              <button onClick={saveAsTemplate} disabled={savingTemplate || !templateNameInput.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#967705]/20 border border-[#967705]/30 text-[#C9A70A] text-sm font-medium hover:bg-[#967705]/30 transition-colors disabled:opacity-50">
                {savingTemplate ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview & Test modal ── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111] w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-[#F0F0F0]">Preview & Test</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-white/30 hover:text-white/60 transition-colors"><X size={16} /></button>
            </div>
            <div className="flex flex-1 gap-6 p-6 overflow-auto min-h-0">
              {/* Email preview */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1a1a1a] border border-white/[0.06] w-fit">
                  {(['desktop', 'mobile'] as const).map(d => (
                    <button key={d} onClick={() => setDevicePreview(d)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${devicePreview === d ? 'bg-[#967705]/20 text-[#C9A70A] border border-[#967705]/30' : 'text-white/40 hover:text-white/60'}`}>
                      {d === 'desktop' ? '🖥' : '📱'} {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden flex justify-center p-4">
                  <iframe
                    srcDoc={exportedHtml || '<p style="color:#999;text-align:center;padding:40px;font-family:sans-serif;font-size:14px">No design saved yet.</p>'}
                    style={{ width: devicePreview === 'desktop' ? '600px' : '375px', height: '500px', border: 'none', background: '#fff', borderRadius: '4px', transition: 'width 0.25s ease', flexShrink: 0 }}
                    title="Email Preview" sandbox="allow-same-origin"
                  />
                </div>
              </div>
              {/* Test send panel */}
              <div className="w-56 flex-shrink-0 space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Send Test Email</p>
                  <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                    placeholder="your@email.com" className={inp()} />
                  <button onClick={handleSendTest} disabled={sendingTest || !campaignId}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 border border-white/[0.1] bg-white/[0.03] hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all disabled:opacity-40">
                    {sendingTest ? 'Sending…' : 'Send Test'}
                  </button>
                  {!campaignId && <p className="text-xs text-white/25">Save your design first.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule modal ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111] w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F0F0F0]">Schedule Campaign</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-white/30 hover:text-white/60 transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Send date & time</label>
              <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className={inp()} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/[0.1] text-white/50 text-sm hover:text-white/70 transition-colors">Cancel</button>
              <button onClick={() => { setShowScheduleModal(false); handleSend(true) }}
                disabled={sending || !campaignId || !scheduleTime}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_20px_rgba(201,167,10,0.25)]">
                <Clock size={14} />
                {sending ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0d0d0d]/95 backdrop-blur-sm">
        <div className="max-w-[720px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: back + campaign name */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/mailchimp')}
              className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors flex-shrink-0">
              <ChevronLeft size={16} />
            </button>

            {editingTitle ? (
              <input
                autoFocus
                value={campaignTitle}
                onChange={e => setCampaignTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false) }}
                className="bg-transparent border-b border-[#967705]/60 text-sm font-semibold text-[#F0F0F0] focus:outline-none pb-0.5 min-w-0"
              />
            ) : (
              <button onClick={() => setEditingTitle(true)} className="flex items-center gap-1.5 group min-w-0">
                <span className="text-sm font-semibold text-[#F0F0F0] truncate">{campaignTitle}</span>
                <Pencil size={11} className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
              </button>
            )}

            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
              Draft
            </span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowPreviewModal(true)}
              disabled={!exportedHtml}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/50 border border-white/[0.08] bg-white/[0.03] hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all disabled:opacity-30"
            >
              <Eye size={14} />
              Preview & Test
            </button>
            <button
              onClick={() => { if (!canReadyToSend) { showToast('Complete all steps first', false); return } setShowScheduleModal(true) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(201,167,10,0.25)]"
            >
              <Clock size={14} />
              Schedule
            </button>
          </div>
        </div>
      </div>

      {/* ── Centered content ── */}
      <div className="max-w-[720px] mx-auto px-6 py-8">
        <ProgressBar completedSteps={completedSteps} />

        <div className="flex flex-col gap-3">

          {/* ── Card 1: Sender ── */}
          <StepCard
            n={1} title="Sender"
            icon={<Mail size={14} />}
            complete={completedSteps.has(1)}
            active={activeStep === 1}
            onOpen={() => openStep(1)}
            action={
              <button onClick={() => openStep(1)} className="text-xs text-[#C9A70A] hover:text-[#967705] transition-colors font-medium">
                Edit sender
              </button>
            }
            summary={
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#F0F0F0] font-medium">{fromName}</span>
                <span className="text-white/25">·</span>
                <span className="text-sm text-white/45">{fromEmail}</span>
              </div>
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-white/40">The name and email address your recipients will see.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">From name</label>
                  <input type="text" value={fromName} onChange={e => setFromName(e.target.value)} className={inp()} placeholder="Northern Warrior" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">From email</label>
                  <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} className={inp()} placeholder="info@northernwarrior.co.uk" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                {completedSteps.has(1) && (
                  <button onClick={() => setActiveStep(null)} className="px-4 py-2 rounded-lg border border-white/[0.08] text-white/40 text-sm hover:text-white/60 hover:border-white/20 transition-all">
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => completeStep(1)}
                  disabled={!fromName.trim() || !fromEmail.trim()}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-40 shadow-[0_0_14px_rgba(201,167,10,0.2)]"
                >
                  Save
                </button>
              </div>
            </div>
          </StepCard>

          {/* ── Card 2: Recipients ── */}
          <StepCard
            n={2} title="Recipients"
            icon={<Users size={14} />}
            complete={completedSteps.has(2)}
            active={activeStep === 2}
            onOpen={() => openStep(2)}
            action={
              <button onClick={() => openStep(2)} className="text-xs text-[#C9A70A] hover:text-[#967705] transition-colors font-medium">
                Manage recipients
              </button>
            }
            summary={
              selectedAudience ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#F0F0F0] font-medium">{selectedAudience.name}</span>
                  <span className="text-white/25">·</span>
                  <span className="text-sm text-white/45">{selectedAudience.member_count.toLocaleString()} recipients</span>
                </div>
              ) : <SummaryText>No audience selected</SummaryText>
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-white/40">The people who will receive this campaign.</p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Send to</label>
                {audiencesLoading ? (
                  <div className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
                ) : audiences.length === 0 ? (
                  <p className="text-sm text-white/30 py-2">No Mailchimp audiences found. Check your API key in settings.</p>
                ) : (
                  <select
                    value={selectedAudienceId}
                    onChange={e => setSelectedAudienceId(e.target.value)}
                    className={inp()}
                  >
                    <option value="">Select audience…</option>
                    {audiences.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.member_count.toLocaleString()} members)</option>
                    ))}
                  </select>
                )}
              </div>

              <Checkbox checked={skipUnengaged} onChange={() => setSkipUnengaged(v => !v)} label="Don't send to unengaged contacts" />

              {selectedAudience && (
                <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[#111] border border-white/[0.06]">
                  <span className="text-sm font-semibold text-[#F0F0F0]">{recipientCount.toLocaleString()} recipients</span>
                  <span className="text-white/20">·</span>
                  <span className="text-xs text-white/35">from {selectedAudience.name}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                {completedSteps.has(2) && (
                  <button onClick={() => setActiveStep(null)} className="px-4 py-2 rounded-lg border border-white/[0.08] text-white/40 text-sm hover:text-white/60 transition-all">Cancel</button>
                )}
                <button
                  onClick={() => completeStep(2)}
                  disabled={!selectedAudienceId}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-40 shadow-[0_0_14px_rgba(201,167,10,0.2)]"
                >
                  Save
                </button>
              </div>
            </div>
          </StepCard>

          {/* ── Card 3: Subject ── */}
          <StepCard
            n={3} title="Subject"
            icon={<Type size={14} />}
            complete={completedSteps.has(3)}
            active={activeStep === 3}
            onOpen={() => openStep(3)}
            action={
              <button onClick={() => openStep(3)} className="text-xs text-[#C9A70A] hover:text-[#967705] transition-colors font-medium">
                Edit subject
              </button>
            }
            summary={
              subject ? <SummaryText>{subject}</SummaryText> : <SummaryText>No subject line set</SummaryText>
            }
          >
            <div className="space-y-5">
              <p className="text-sm text-white/40">Add a subject line and preview text for your campaign.</p>
              <div className="flex gap-6">
                {/* Inputs */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Subject line</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="What's your email about?"
                      className={inp()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Preview text</label>
                    <input
                      type="text"
                      value={previewText}
                      onChange={e => setPreviewText(e.target.value)}
                      placeholder="Snippet shown after the subject line…"
                      className={inp()}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    {completedSteps.has(3) && (
                      <button onClick={() => setActiveStep(null)} className="px-4 py-2 rounded-lg border border-white/[0.08] text-white/40 text-sm hover:text-white/60 transition-all">Cancel</button>
                    )}
                    <button
                      onClick={() => completeStep(3)}
                      disabled={!subject.trim()}
                      className="px-4 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-40 shadow-[0_0_14px_rgba(201,167,10,0.2)]"
                    >
                      Save
                    </button>
                  </div>
                </div>
                {/* Phone preview */}
                <PhonePreview fromName={fromName} subject={subject} previewText={previewText} />
              </div>
            </div>
          </StepCard>

          {/* ── Card 4: Design ── */}
          <StepCard
            n={4} title="Design"
            icon={<Palette size={14} />}
            complete={completedSteps.has(4)}
            active={activeStep === 4}
            onOpen={() => openStep(4)}
            action={
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowDesignEditor(true); }} className="text-xs text-[#C9A70A] hover:text-[#967705] transition-colors font-medium">
                  Edit design
                </button>
              </div>
            }
            summary={
              exportedHtml ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-10 rounded overflow-hidden border border-white/[0.08] bg-white flex-shrink-0">
                    <iframe
                      srcDoc={exportedHtml}
                      style={{ width: '600px', height: '800px', border: 'none', transform: 'scale(0.093)', transformOrigin: 'top left', pointerEvents: 'none' }}
                      sandbox="allow-same-origin"
                    />
                  </div>
                  <span className="text-sm text-white/45">Email design saved</span>
                </div>
              ) : <SummaryText>No design yet</SummaryText>
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-white/40">Create your email content using the drag-and-drop editor.</p>

              {/* Template picker */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Start from a saved template</p>
                  <div className="flex gap-2 flex-wrap">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setPendingTemplate(t.design_json)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                          pendingTemplate === t.design_json
                            ? 'border-[#967705]/50 bg-[#967705]/10 text-[#C9A70A]'
                            : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/70'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                    {pendingTemplate && (
                      <button onClick={() => setPendingTemplate(null)}
                        className="px-3 py-2 rounded-lg border border-white/[0.06] text-white/25 text-sm hover:text-white/40 transition-colors flex items-center gap-1">
                        <X size={12} /> Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDesignEditor(true)}
                className="w-full flex items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed border-white/[0.08] text-white/30 hover:border-[#967705]/40 hover:text-[#C9A70A] transition-all group"
              >
                <Palette size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">
                  {exportedHtml ? 'Open email editor' : 'Start designing'}
                </span>
              </button>
            </div>
          </StepCard>

          {/* ── Card 5: Additional Settings ── */}
          <StepCard
            n={5} title="Additional Settings"
            icon={<Settings2 size={14} />}
            complete={completedSteps.has(5)}
            active={activeStep === 5}
            onOpen={() => setActiveStep(activeStep === 5 ? null : 5)}
            action={
              <button onClick={() => setActiveStep(5)} className="text-xs text-white/40 hover:text-white/60 transition-colors">
                Expand
              </button>
            }
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Personalisation</p>
                <Checkbox checked={personalize} onChange={() => setPersonalize(v => !v)} label="Personalise the Send To field" />
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="space-y-3">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Sending & Tracking</p>
                <Checkbox checked={customReply} onChange={() => setCustomReply(v => !v)} label="Use a different Reply-to address" />
                {customReply && (
                  <input type="email" value={replyTo} onChange={e => setReplyTo(e.target.value)}
                    placeholder="reply@northernwarrior.co.uk" className={inp('ml-6')} />
                )}
                <Checkbox checked={gaTracking} onChange={() => setGaTracking(v => !v)} label="Activate Google Analytics tracking" />
                <Checkbox checked={attachment} onChange={() => setAttachment(v => !v)} label="Add an attachment" />
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="space-y-3">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Subscription</p>
                <Checkbox checked={customUnsub} onChange={() => setCustomUnsub(v => !v)} label="Use a custom unsubscribe page" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setActiveStep(null)} className="px-4 py-2 rounded-lg border border-white/[0.08] text-white/40 text-sm hover:text-white/60 transition-all">Cancel</button>
                <button onClick={() => completeStep(5, null)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity shadow-[0_0_14px_rgba(201,167,10,0.2)]">
                  Save
                </button>
              </div>
            </div>
          </StepCard>

        </div>

        {/* ── Send row ── */}
        {canReadyToSend && (
          <div className="mt-6 flex items-center justify-between px-6 py-5 rounded-xl border border-[#967705]/25 bg-[#967705]/5">
            <div>
              <p className="text-sm font-semibold text-[#F0F0F0]">Ready to send</p>
              <p className="text-xs text-white/35 mt-0.5">All steps complete — send now or schedule for later</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 border border-white/[0.1] bg-white/[0.03] hover:text-white hover:border-white/20 transition-all">
                <Clock size={14} />
                Schedule
              </button>
              <button onClick={() => handleSend(false)} disabled={sending || !campaignId}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_20px_rgba(201,167,10,0.25)]">
                <Send size={14} />
                {sending ? 'Sending…' : 'Send Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
