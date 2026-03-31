'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CheckCircle, AlertCircle, RefreshCw, ExternalLink, Users, Mail, BarChart2,
  Plus, Trash2, FileText, ArrowRight, ChevronDown, ChevronUp, Save, Send,
} from 'lucide-react'
import { format } from 'date-fns'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/widgets/dashboard/StatCard'
import type { MailchimpSettings, MailchimpAudience, MailchimpAudienceStats, MailchimpCampaignRow, MailchimpCampaignStatus } from '@/lib/types'

interface EmailTemplate {
  id: string
  name: string
  design_json: object
  created_at: string
}

function inputCls(extra = '') {
  return `h-9 w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 text-[13px] text-nw-200 placeholder:text-nw-500 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750 ${extra}`
}

function statusBadgeVariant(status: string): 'sent' | 'draft' | 'gold' | 'active' | 'amber' | 'default' {
  switch (status) {
    case 'sent':      return 'sent'
    case 'sending':   return 'active'
    case 'scheduled': return 'gold'
    case 'draft':     return 'draft'
    case 'paused':    return 'amber'
    default:          return 'default'
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

  useEffect(() => { loadCampaigns(); loadTemplates() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get('sent') === '1') showToast('Campaign sent successfully!')
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
    } finally { setLoadingCampaigns(false) }
  }

  async function loadTemplates() {
    setLoadingTemplates(true)
    try {
      const res = await fetch('/api/mailchimp/templates')
      const data = await res.json()
      if (res.ok) setTemplates(data)
    } finally { setLoadingTemplates(false) }
  }

  async function deleteTemplate(id: string) {
    const res = await fetch(`/api/mailchimp/templates?id=${id}`, { method: 'DELETE' })
    if (res.ok) { setTemplates((t) => t.filter((x) => x.id !== id)); showToast('Template deleted') }
    else showToast('Failed to delete template', false)
  }

  async function handleLoadAudiences() {
    setLoadingAudiences(true)
    try {
      const res = await fetch('/api/mailchimp/audiences')
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed to load audiences', false); return }
      setAudiences(data)
      if (data.length === 0) showToast('No audiences found', false)
    } finally { setLoadingAudiences(false) }
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
    setSyncing(true); setSyncResult(null)
    const res = await fetch('/api/mailchimp/sync', { method: 'POST' })
    const data = await res.json()
    setSyncing(false)
    if (!res.ok) { showToast(data.error ?? 'Sync failed', false); return }
    setSyncResult(data)
    showToast(`${data.synced} synced, ${data.failed} failed`)
  }

  const filteredCampaigns = statusFilter === 'all' ? campaigns : campaigns.filter((c) => c.status === statusFilter)

  const statusFilters: Array<{ id: StatusFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Drafts' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'sent', label: 'Sent' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-[10px] border px-4 py-3 text-sm font-medium shadow-2xl ${
          toast.ok ? 'border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]' : 'border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.1)] text-red-400'
        }`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Not configured warning */}
      {!isConfigured && (
        <Panel>
          <div className="flex items-center gap-4 p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)]">
              <AlertCircle size={16} className="text-[#f59e0b]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#f59e0b]">Mailchimp not configured</p>
              <p className="text-[11px] text-nw-500 mt-0.5">
                {!initialSettings.api_key ? 'Add your API key in Settings below.' : 'Select and save an audience in Settings below.'}
              </p>
            </div>
            <button onClick={() => setSettingsOpen(true)} className="text-xs text-[#f59e0b] hover:text-gold-300 font-medium transition-colors flex-shrink-0">
              Open Settings
            </button>
          </div>
        </Panel>
      )}

      {/* Sync result */}
      {syncResult && (
        <Panel>
          <div className="flex items-center gap-3 px-4 py-3">
            <CheckCircle size={14} className="text-gold-300" />
            <p className="text-[13px] text-gold-300">
              Sync complete — <span className="font-semibold">{syncResult.synced}</span> synced, <span className="font-semibold">{syncResult.failed}</span> failed
            </p>
          </div>
        </Panel>
      )}

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-[10px] md:grid-cols-4">
          <StatCard label="Subscribers" value={stats.audience.member_count.toLocaleString()} icon={Users} iconBg="rgba(212,160,23,0.15)" />
          <StatCard label="Campaigns Sent" value={campaigns.filter(c => c.status === 'sent').length} icon={Send} iconBg="rgba(74,222,128,0.15)" />
          <StatCard label="Avg Open Rate" value={`${(stats.audience.open_rate * 100).toFixed(1)}%`} icon={Mail} iconBg="rgba(59,130,246,0.15)" />
          <StatCard label="Avg Click Rate" value={`${(stats.audience.click_rate * 100).toFixed(1)}%`} icon={BarChart2} iconBg="rgba(168,85,247,0.15)" />
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="default" size="sm" onClick={handleSync} disabled={syncing || !isConfigured}>
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync Subscribers'}
        </Button>
        <Button variant="gold" size="sm" onClick={() => router.push('/mailchimp/create')}>
          <Plus size={13} /> New Campaign
        </Button>
      </div>

      {/* Campaigns Panel */}
      <Panel>
        <PanelHeader eyebrow="Mailchimp" title="Campaigns" action={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {statusFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`rounded-[7px] px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    statusFilter === f.id
                      ? 'bg-[rgba(212,160,23,0.15)] text-gold-300 border border-[rgba(212,160,23,0.3)]'
                      : 'text-nw-400 hover:text-nw-200 border border-transparent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={loadCampaigns} disabled={loadingCampaigns} className="rounded-[7px] p-1.5 text-nw-500 hover:text-nw-300 hover:bg-[rgba(255,255,255,0.04)] transition-colors disabled:opacity-30">
              <RefreshCw size={12} className={loadingCampaigns ? 'animate-spin' : ''} />
            </button>
          </div>
        } />

        {loadingCampaigns && campaigns.length === 0 ? (
          <div className="flex items-center justify-center p-10 text-[13px] text-nw-500">Loading campaigns…</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <p className="text-[13px] text-nw-500">{campaigns.length === 0 ? 'No campaigns yet' : `No ${statusFilter} campaigns`}</p>
            {campaigns.length === 0 && (
              <Button variant="gold" size="sm" onClick={() => router.push('/mailchimp/create')}>
                <Plus size={13} /> Create your first campaign
              </Button>
            )}
          </div>
        ) : (
          <div>
            {filteredCampaigns.map((c) => {
              const isDraft = c.status === 'draft'
              return (
                <div
                  key={c.id}
                  onClick={isDraft ? () => router.push(`/mailchimp/edit/${c.id}`) : undefined}
                  className={`border-b border-[rgba(255,255,255,0.05)] px-[17px] py-4 transition-colors hover:bg-[rgba(255,255,255,0.03)] ${isDraft ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusBadgeVariant(c.status)}>{c.status}</Badge>
                    {c.send_time && (
                      <span className="text-[11px] text-nw-500">{format(new Date(c.send_time), 'dd MMM yyyy')}</span>
                    )}
                  </div>

                  <p className="text-[13px] font-medium text-nw-200 truncate">
                    {c.settings.title || c.settings.subject_line}
                  </p>
                  {c.settings.title && c.settings.subject_line && c.settings.title !== c.settings.subject_line && (
                    <p className="text-[11px] text-nw-500 truncate mt-0.5">{c.settings.subject_line}</p>
                  )}

                  {/* Sent metrics */}
                  {(c.status === 'sent' || c.status === 'sending') && (
                    <div className="flex items-center gap-4 mt-2 text-[11px]">
                      {c.emails_sent > 0 && (
                        <span className="text-nw-500">
                          <span className="font-medium text-nw-300">{c.emails_sent.toLocaleString()}</span> sent
                        </span>
                      )}
                      {c.opens ? (
                        <span className="text-nw-500">
                          <span className="font-bold text-[#4ade80]">{(c.opens.open_rate * 100).toFixed(1)}%</span>
                          {c.opens.unique_opens > 0 && <span className="text-nw-600 ml-1">({c.opens.unique_opens.toLocaleString()})</span>}
                          {' '}opens
                        </span>
                      ) : c.status === 'sent' ? (
                        <span className="text-nw-600 italic">stats updating…</span>
                      ) : null}
                      {c.clicks && (
                        <span className="text-nw-500">
                          <span className="font-bold text-gold-300">{(c.clicks.click_rate * 100).toFixed(1)}%</span>
                          {c.clicks.unique_clicks > 0 && <span className="text-nw-600 ml-1">({c.clicks.unique_clicks.toLocaleString()})</span>}
                          {' '}clicks
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {isDraft && (
                      <Button variant="gold" size="sm" onClick={() => router.push(`/mailchimp/edit/${c.id}`)}>
                        Continue <ArrowRight size={11} />
                      </Button>
                    )}
                    {(c.status === 'sent' || c.status === 'sending') && (
                      <a
                        href={`https://us1.admin.mailchimp.com/reports/summary?id=${c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink size={11} /> Report
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      {/* Templates Panel */}
      {templates.length > 0 && (
        <Panel>
          <PanelHeader eyebrow="Mailchimp" title="Templates" action={
            <button onClick={loadTemplates} disabled={loadingTemplates} className="rounded-[7px] p-1.5 text-nw-500 hover:text-nw-300 hover:bg-[rgba(255,255,255,0.04)] transition-colors disabled:opacity-30">
              <RefreshCw size={12} className={loadingTemplates ? 'animate-spin' : ''} />
            </button>
          } />
          <div className="grid grid-cols-2 gap-[1px] bg-[rgba(255,255,255,0.05)] md:grid-cols-3 lg:grid-cols-4">
            {templates.map((t) => (
              <div key={t.id} className="group flex flex-col gap-3 bg-nw-750 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)]">
                    <FileText size={15} className="text-gold-400" />
                  </div>
                  <button onClick={() => deleteTemplate(t.id)} className="rounded-[5px] p-1 text-nw-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-nw-200 truncate">{t.name}</p>
                  <p className="text-[11px] text-nw-500 mt-0.5">{format(new Date(t.created_at), 'dd MMM yyyy')}</p>
                </div>
                <Button variant="gold" size="sm" className="w-full" onClick={() => router.push(`/mailchimp/create?template=${t.id}`)}>
                  <Plus size={12} /> Start Campaign
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Settings (collapsible) */}
      <Panel>
        <button onClick={() => setSettingsOpen((v) => !v)} className="flex w-full items-center gap-2 px-[17px] py-[11px] text-left">
          <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">Mailchimp</span>
          <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
          <span className="text-[13px] font-medium text-nw-200">Settings</span>
          <div className="ml-auto">
            {settingsOpen ? <ChevronUp size={13} className="text-nw-500" /> : <ChevronDown size={13} className="text-nw-500" />}
          </div>
        </button>

        {settingsOpen && (
          <div className="border-t border-[rgba(255,255,255,0.07)] p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase tracking-[1px] text-nw-500">API Key</label>
                <input type="password" value={settings.api_key} onChange={(e) => setSettings((s) => ({ ...s, api_key: e.target.value }))} placeholder="••••••••-xx" className={inputCls()} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase tracking-[1px] text-nw-500">Audience</label>
                <div className="flex gap-2">
                  <select value={settings.audience_id} onChange={(e) => setSettings((s) => ({ ...s, audience_id: e.target.value }))} className={inputCls('flex-1')}>
                    <option value="">— select —</option>
                    {audiences.map((a) => (<option key={a.id} value={a.id}>{a.name} ({a.member_count.toLocaleString()})</option>))}
                    {audiences.length === 0 && settings.audience_id && (<option value={settings.audience_id}>{settings.audience_id}</option>)}
                  </select>
                  <Button variant="default" size="sm" onClick={handleLoadAudiences} disabled={loadingAudiences}>
                    {loadingAudiences ? '…' : 'Load'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase tracking-[1px] text-nw-500">Sender</label>
                <input type="text" value={settings.from_name} onChange={(e) => setSettings((s) => ({ ...s, from_name: e.target.value }))} placeholder="From Name" className={inputCls()} />
                <input type="email" value={settings.from_email} onChange={(e) => setSettings((s) => ({ ...s, from_email: e.target.value }))} placeholder="From Email" className={inputCls()} />
                <input type="email" value={settings.reply_to} onChange={(e) => setSettings((s) => ({ ...s, reply_to: e.target.value }))} placeholder="Reply-To Email" className={inputCls()} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="default" size="sm" onClick={handleSaveSettings} disabled={saving}>
                <Save size={13} /> {saving ? 'Saving…' : 'Save Settings'}
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  )
}
