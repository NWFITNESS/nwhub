'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CheckCircle, AlertCircle, RefreshCw, ExternalLink, Users, Mail, BarChart2,
  Plus, Trash2, FileText, ArrowRight, Settings, ChevronDown, ChevronUp, Save,
} from 'lucide-react'
import { format } from 'date-fns'
import type { MailchimpSettings, MailchimpAudience, MailchimpAudienceStats, MailchimpCampaignRow, MailchimpCampaignStatus } from '@/lib/types'

interface EmailTemplate {
  id: string
  name: string
  design_json: object
  created_at: string
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function inputCls(extra = '') {
  return `w-full px-3 py-2.5 rounded-xl bg-[#111] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#967705]/60 focus:bg-[#111] transition-colors ${extra}`
}

function SectionHeader({
  title,
  count,
  action,
}: {
  title: string
  count?: number
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-[#c9a70a] to-[#967705]/40" />
        <h2 className="text-sm font-bold text-white uppercase tracking-[0.12em]">{title}</h2>
        {count !== undefined && (
          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30 text-xs font-medium">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ElementType
}) {
  return (
    <div className="relative rounded-2xl border border-white/[0.07] bg-[#0d0d0d] group transition-all duration-300 hover:border-[#967705]/30" style={{ minHeight: 120 }}>
      {/* Decorative layer — isolated so it never clips content */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#967705]/40 to-transparent" />
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#967705]/6 rounded-full blur-3xl group-hover:bg-[#967705]/12 transition-all duration-500" />
      </div>
      {/* Content — generous padding keeps everything well inside rounded corners */}
      <div className="relative p-6">
        <div className="w-10 h-10 rounded-xl bg-[#967705]/12 border border-[#967705]/20 flex items-center justify-center mb-6">
          <Icon size={18} className="text-[#c9a70a]" />
        </div>
        <p className="text-[2.75rem] font-black text-white tracking-tight leading-none mb-2">{value}</p>
        <p className="text-xs text-white/30 uppercase tracking-widest font-medium">{label}</p>
      </div>
    </div>
  )
}

function statusColors(status: string) {
  switch (status) {
    case 'sent':      return { strip: 'bg-green-500',   badge: 'bg-green-500/12 text-green-400 border-green-500/25' }
    case 'sending':   return { strip: 'bg-blue-500',    badge: 'bg-blue-500/12 text-blue-400 border-blue-500/25' }
    case 'scheduled': return { strip: 'bg-purple-500',  badge: 'bg-purple-500/12 text-purple-400 border-purple-500/25' }
    case 'draft':     return { strip: 'bg-[#967705]/60', badge: 'bg-[#967705]/10 text-[#c9a70a]/80 border-[#967705]/25' }
    case 'paused':    return { strip: 'bg-yellow-500',  badge: 'bg-yellow-500/12 text-yellow-400 border-yellow-500/25' }
    default:          return { strip: 'bg-white/10',    badge: 'bg-white/5 text-white/40 border-white/10' }
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type StatusFilter = 'all' | MailchimpCampaignStatus

interface Props {
  initialSettings: MailchimpSettings
  initialStats: { audience: MailchimpAudienceStats } | null
}

export function MailchimpDashboard({ initialSettings, initialStats }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Settings
  const [settings, setSettings] = useState<MailchimpSettings>(initialSettings)
  const [audiences, setAudiences] = useState<MailchimpAudience[]>([])
  const [loadingAudiences, setLoadingAudiences] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const isConfigured = !!initialSettings.api_key && !!settings.audience_id

  // Audience
  const [stats] = useState(initialStats)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null)

  // Campaigns
  const [campaigns, setCampaigns] = useState<MailchimpCampaignRow[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadCampaigns()
    loadTemplates()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (searchParams.get('sent') === '1') {
      showToast('Campaign sent successfully!')
    }
  }, [searchParams])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function loadCampaigns() {
    setLoadingCampaigns(true)
    try {
      const res = await fetch('/api/mailchimp/campaigns')
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed to load campaigns', false); return }
      setCampaigns(data)
    } finally {
      setLoadingCampaigns(false)
    }
  }

  async function loadTemplates() {
    setLoadingTemplates(true)
    try {
      const res = await fetch('/api/mailchimp/templates')
      const data = await res.json()
      if (res.ok) setTemplates(data)
    } finally {
      setLoadingTemplates(false)
    }
  }

  async function deleteTemplate(id: string) {
    const res = await fetch(`/api/mailchimp/templates?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTemplates((t) => t.filter((x) => x.id !== id))
      showToast('Template deleted')
    } else {
      showToast('Failed to delete template', false)
    }
  }

  async function handleLoadAudiences() {
    setLoadingAudiences(true)
    try {
      const res = await fetch('/api/mailchimp/audiences')
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed to load audiences', false); return }
      setAudiences(data)
      if (data.length === 0) showToast('No audiences found', false)
    } finally {
      setLoadingAudiences(false)
    }
  }

  async function handleSaveSettings() {
    setSaving(true)
    const res = await fetch('/api/mailchimp/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    showToast(res.ok ? 'Settings saved' : 'Failed to save settings', res.ok)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch('/api/mailchimp/sync', { method: 'POST' })
    const data = await res.json()
    setSyncing(false)
    if (!res.ok) { showToast(data.error ?? 'Sync failed', false); return }
    setSyncResult(data)
    showToast(`${data.synced} synced, ${data.failed} failed`)
  }

  const filteredCampaigns = statusFilter === 'all'
    ? campaigns
    : campaigns.filter((c) => c.status === statusFilter)

  const statusFilters: Array<{ id: StatusFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Drafts' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'sent', label: 'Sent' },
  ]

  return (
    <div className="space-y-10 pb-16">
      {/* ── Toast ── */}
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

      {/* ── Actions row ── */}
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <button
          onClick={handleSync}
          disabled={syncing || !isConfigured}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 text-sm font-medium hover:bg-white/[0.06] hover:text-white/80 hover:border-white/15 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
          title={!isConfigured ? 'Configure settings first' : undefined}
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync Subscribers'}
        </button>
        <button
          onClick={() => router.push('/mailchimp/create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(201,167,10,0.25)]"
        >
          <Plus size={15} />
          New Campaign
        </button>
      </div>

      {/* ── Not configured warning ── */}
      {!isConfigured && (
        <div className="relative rounded-2xl border border-yellow-500/25 bg-gradient-to-r from-yellow-500/[0.08] to-transparent p-6 pl-8 flex items-center gap-4">
          {/* Left accent strip — wrapped so it clips cleanly to the card's border-radius */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-yellow-500/60" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={16} className="text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-300">Mailchimp not configured</p>
            <p className="text-xs text-white/40 mt-0.5">
              {!initialSettings.api_key ? 'Add your API key in Settings below.' : 'Select and save an audience in Settings below.'}
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex-shrink-0 text-xs text-yellow-400 hover:text-yellow-300 font-medium underline underline-offset-2 transition-colors"
          >
            Open Settings
          </button>
        </div>
      )}

      {/* ── Sync result ── */}
      {syncResult && (
        <div className="rounded-xl border border-[#967705]/25 bg-[#967705]/8 px-5 py-3.5 flex items-center gap-3">
          <CheckCircle size={14} className="text-[#c9a70a]" />
          <p className="text-sm text-[#c9a70a]">
            Sync complete — <span className="font-semibold">{syncResult.synced}</span> synced,{' '}
            <span className="font-semibold">{syncResult.failed}</span> failed
          </p>
        </div>
      )}

      {/* ── Audience stats ── */}
      {stats && (
        <section>
          <SectionHeader title="Audience" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Members" value={stats.audience.member_count.toLocaleString()} icon={Users} />
            <StatCard label="Avg Open Rate" value={`${(stats.audience.open_rate * 100).toFixed(1)}%`} icon={Mail} />
            <StatCard label="Avg Click Rate" value={`${(stats.audience.click_rate * 100).toFixed(1)}%`} icon={BarChart2} />
          </div>
        </section>
      )}

      {/* ── Campaigns ── */}
      <section>
        <SectionHeader
          title="Campaigns"
          count={campaigns.length || undefined}
          action={
            <div className="flex items-center gap-2">
              {/* Status filter pills */}
              <div className="flex gap-1 p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                {statusFilters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      statusFilter === f.id
                        ? 'bg-[#967705]/20 text-[#c9a70a] border border-[#967705]/30 shadow-inner'
                        : 'text-white/35 hover:text-white/60'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={loadCampaigns}
                disabled={loadingCampaigns}
                className="p-1.5 rounded-lg text-white/25 hover:text-white/55 hover:bg-white/5 transition-all disabled:opacity-30"
              >
                <RefreshCw size={13} className={loadingCampaigns ? 'animate-spin' : ''} />
              </button>
            </div>
          }
        />

        {loadingCampaigns && campaigns.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-10 text-center text-white/20 text-sm">
            Loading campaigns…
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] p-10 text-center space-y-3">
            <p className="text-white/20 text-sm">
              {campaigns.length === 0 ? 'No campaigns yet' : `No ${statusFilter} campaigns`}
            </p>
            {campaigns.length === 0 && (
              <button
                onClick={() => router.push('/mailchimp/create')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#967705]/30 text-[#c9a70a] text-sm font-medium hover:bg-[#967705]/10 transition-colors"
              >
                <Plus size={13} /> Create your first campaign
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((c) => {
              const { strip, badge } = statusColors(c.status)
              const isDraft = c.status === 'draft'
              return (
                <div
                  key={c.id}
                  onClick={isDraft ? () => router.push(`/mailchimp/edit/${c.id}`) : undefined}
                  className={`group relative rounded-2xl border bg-[#0d0d0d] transition-all duration-200 ${
                    isDraft
                      ? 'border-[#967705]/20 hover:border-[#967705]/40 cursor-pointer hover:bg-[#0f0f0f]'
                      : 'border-white/[0.07] hover:border-white/[0.12]'
                  }`}
                >
                  {/* Status strip — clipped independently so it rounds with the card corners */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${strip}`} />
                  </div>

                  <div className="pl-7 pr-6 py-6 flex items-center gap-5">
                    {/* Left: title + subject + metrics */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badge}`}>
                          {c.status}
                        </span>
                        {c.send_time && (
                          <span className="text-xs text-white/25">
                            {format(new Date(c.send_time), 'dd MMM yyyy')}
                          </span>
                        )}
                      </div>

                      <p className="text-[15px] font-bold text-white leading-tight truncate">
                        {c.settings.title || c.settings.subject_line}
                      </p>
                      {c.settings.title && c.settings.subject_line && c.settings.title !== c.settings.subject_line && (
                        <p className="text-xs text-white/35 mt-0.5 truncate">{c.settings.subject_line}</p>
                      )}

                      {/* Sent metrics */}
                      {(c.status === 'sent' || c.status === 'sending') && (
                        <div className="flex items-center gap-5 mt-3">
                          {c.emails_sent > 0 && (
                            <span className="text-xs text-white/35">
                              <span className="text-white/60 font-semibold">{c.emails_sent.toLocaleString()}</span> sent
                            </span>
                          )}
                          {c.opens && (
                            <span className="text-xs text-white/35">
                              <span className="text-green-400 font-bold">{(c.opens.open_rate * 100).toFixed(1)}%</span> opens
                            </span>
                          )}
                          {c.clicks && (
                            <span className="text-xs text-white/35">
                              <span className="text-blue-400 font-bold">{(c.clicks.click_rate * 100).toFixed(1)}%</span> clicks
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: action */}
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                      {isDraft && (
                        <button
                          onClick={() => router.push(`/mailchimp/edit/${c.id}`)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#967705]/35 text-[#c9a70a] text-xs font-bold hover:bg-[#967705]/12 transition-all group-hover:border-[#967705]/55"
                        >
                          Continue <ArrowRight size={12} />
                        </button>
                      )}
                      {(c.status === 'sent' || c.status === 'sending') && (
                        <a
                          href={`https://us1.admin.mailchimp.com/reports/summary?id=${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] text-white/35 text-xs hover:text-white/60 hover:border-white/15 transition-all"
                        >
                          <ExternalLink size={12} /> Report
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Templates ── */}
      <section>
        <SectionHeader
          title="Templates"
          count={templates.length || undefined}
          action={
            <button
              onClick={loadTemplates}
              disabled={loadingTemplates}
              className="p-1.5 rounded-lg text-white/25 hover:text-white/55 hover:bg-white/5 transition-all disabled:opacity-30"
            >
              <RefreshCw size={13} className={loadingTemplates ? 'animate-spin' : ''} />
            </button>
          }
        />

        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] p-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-3">
              <FileText size={18} className="text-white/15" />
            </div>
            <p className="text-white/20 text-sm">No templates yet</p>
            <p className="text-white/12 text-xs">Save a design as a template from the campaign editor</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className="group relative rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-6 hover:border-[#967705]/25 transition-all duration-200"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent group-hover:via-[#967705]/30 transition-all" />

                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#967705]/10 border border-[#967705]/20 flex items-center justify-center">
                    <FileText size={15} className="text-[#c9a70a]/70" />
                  </div>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <p className="text-sm font-bold text-white mb-0.5 truncate">{t.name}</p>
                <p className="text-xs text-white/25 mb-4">{format(new Date(t.created_at), 'dd MMM yyyy')}</p>

                <button
                  onClick={() => router.push(`/mailchimp/create?template=${t.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#967705]/25 text-[#c9a70a]/80 text-xs font-semibold hover:bg-[#967705]/10 hover:border-[#967705]/40 hover:text-[#c9a70a] transition-all"
                >
                  <Plus size={12} /> Start Campaign
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Settings (collapsible) ── */}
      <section>
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="flex items-center gap-3 mb-5 group w-full text-left"
        >
          <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-white/20 to-white/5" />
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-[0.12em] group-hover:text-white/70 transition-colors">Settings</h2>
          <div className="ml-auto">
            {settingsOpen
              ? <ChevronUp size={14} className="text-white/25 group-hover:text-white/50 transition-colors" />
              : <ChevronDown size={14} className="text-white/25 group-hover:text-white/50 transition-colors" />
            }
          </div>
        </button>

        {settingsOpen && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* API Key */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-6 space-y-3">
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest">API Key</p>
                <input
                  type="password"
                  value={settings.api_key}
                  onChange={(e) => setSettings((s) => ({ ...s, api_key: e.target.value }))}
                  placeholder="••••••••-xx"
                  className={inputCls()}
                />
              </div>

              {/* Audience */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-6 space-y-3">
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest">Audience</p>
                <div className="flex gap-2">
                  <select
                    value={settings.audience_id}
                    onChange={(e) => setSettings((s) => ({ ...s, audience_id: e.target.value }))}
                    className={inputCls('flex-1')}
                  >
                    <option value="">— select —</option>
                    {audiences.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.member_count.toLocaleString()})
                      </option>
                    ))}
                    {audiences.length === 0 && settings.audience_id && (
                      <option value={settings.audience_id}>{settings.audience_id}</option>
                    )}
                  </select>
                  <button
                    onClick={handleLoadAudiences}
                    disabled={loadingAudiences}
                    className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/50 hover:text-white/70 hover:bg-white/[0.07] transition-all disabled:opacity-40 flex-shrink-0"
                  >
                    {loadingAudiences ? '…' : 'Load'}
                  </button>
                </div>
              </div>

              {/* Sender */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-6 space-y-3">
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest">Sender</p>
                <input
                  type="text"
                  value={settings.from_name}
                  onChange={(e) => setSettings((s) => ({ ...s, from_name: e.target.value }))}
                  placeholder="From Name"
                  className={inputCls()}
                />
                <input
                  type="email"
                  value={settings.from_email}
                  onChange={(e) => setSettings((s) => ({ ...s, from_email: e.target.value }))}
                  placeholder="From Email"
                  className={inputCls()}
                />
                <input
                  type="email"
                  value={settings.reply_to}
                  onChange={(e) => setSettings((s) => ({ ...s, reply_to: e.target.value }))}
                  placeholder="Reply-To Email"
                  className={inputCls()}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/70 text-sm font-semibold hover:bg-white/[0.09] hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
              >
                <Save size={14} />
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
