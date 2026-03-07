'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, RefreshCw, ExternalLink, PenSquare, Users, Mail, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import type { MailchimpSettings, MailchimpAudience, MailchimpAudienceStats, MailchimpCampaignRow, MailchimpCampaignStatus } from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inputCls(extra = '') {
  return `w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#967705]/60 transition-colors ${extra}`
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-5 flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg bg-[#967705]/15 border border-[#967705]/25 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-[#c9a70a]" />
      </div>
      <div>
        <p className="text-xs text-white/35 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function statusBadgeCls(status: string) {
  switch (status) {
    case 'sent':      return 'bg-green-500/15 text-green-400 border-green-500/30'
    case 'sending':   return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case 'scheduled': return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    case 'draft':     return 'bg-white/8 text-white/50 border-white/15'
    case 'paused':    return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    default:          return 'bg-white/5 text-white/40 border-white/10'
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type StatusFilter = 'all' | MailchimpCampaignStatus

interface Props {
  initialSettings: MailchimpSettings
  initialStats: { audience: MailchimpAudienceStats } | null
}

export function MailchimpDashboard({ initialSettings, initialStats }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'settings' | 'audience' | 'campaigns'>('settings')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Settings
  const [settings, setSettings] = useState<MailchimpSettings>(initialSettings)
  const [audiences, setAudiences] = useState<MailchimpAudience[]>([])
  const [loadingAudiences, setLoadingAudiences] = useState(false)
  const [saving, setSaving] = useState(false)

  // Audience
  const [stats] = useState(initialStats)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null)

  // Campaigns
  const [campaigns, setCampaigns] = useState<MailchimpCampaignRow[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Show sent banner if redirected from wizard
  useEffect(() => {
    if (searchParams.get('sent') === '1') {
      showToast('Campaign sent successfully!')
      setActiveTab('campaigns')
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

  // Load campaigns when tab is activated
  function handleTabChange(tab: 'settings' | 'audience' | 'campaigns') {
    setActiveTab(tab)
    if (tab === 'campaigns' && campaigns.length === 0) loadCampaigns()
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
    { id: 'draft', label: 'Draft' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'sent', label: 'Sent' },
  ]

  const tabs: Array<{ id: 'settings' | 'audience' | 'campaigns'; label: string }> = [
    { id: 'settings', label: 'Settings' },
    { id: 'audience', label: 'Audience' },
    { id: 'campaigns', label: 'Campaigns' },
  ]

  return (
    <div className="space-y-6">
      {/* Toast */}
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#111] border border-white/[0.06] w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-[#967705]/20 text-[#c9a70a] border border-[#967705]/30'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Settings tab ── */}
      {activeTab === 'settings' && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-6 space-y-5 max-w-lg">
          <h2 className="text-sm font-semibold text-white/70">Mailchimp Configuration</h2>

          <Field label="API Key">
            <input
              type="password"
              value={settings.api_key}
              onChange={(e) => setSettings((s) => ({ ...s, api_key: e.target.value }))}
              placeholder="••••••••-xx"
              className={inputCls()}
            />
          </Field>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Field label="Audience">
                <select
                  value={settings.audience_id}
                  onChange={(e) => setSettings((s) => ({ ...s, audience_id: e.target.value }))}
                  className={inputCls()}
                >
                  <option value="">— select audience —</option>
                  {audiences.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.member_count.toLocaleString()} members)
                    </option>
                  ))}
                  {audiences.length === 0 && settings.audience_id && (
                    <option value={settings.audience_id}>{settings.audience_id}</option>
                  )}
                </select>
              </Field>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadAudiences}
              disabled={loadingAudiences}
              className="flex-shrink-0 mb-0"
            >
              {loadingAudiences ? 'Loading…' : 'Load Audiences'}
            </Button>
          </div>

          <Field label="From Name">
            <input
              type="text"
              value={settings.from_name}
              onChange={(e) => setSettings((s) => ({ ...s, from_name: e.target.value }))}
              placeholder="Northern Warrior"
              className={inputCls()}
            />
          </Field>

          <Field label="From Email">
            <input
              type="email"
              value={settings.from_email}
              onChange={(e) => setSettings((s) => ({ ...s, from_email: e.target.value }))}
              placeholder="info@northernwarrior.co.uk"
              className={inputCls()}
            />
          </Field>

          <Field label="Reply-To Email">
            <input
              type="email"
              value={settings.reply_to}
              onChange={(e) => setSettings((s) => ({ ...s, reply_to: e.target.value }))}
              placeholder="hello@example.com"
              className={inputCls()}
            />
          </Field>

          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
      )}

      {/* ── Audience tab ── */}
      {activeTab === 'audience' && (
        <div className="space-y-6">
          {stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Members" value={stats.audience.member_count.toLocaleString()} icon={Users} />
              <StatCard label="Open Rate" value={`${(stats.audience.open_rate * 100).toFixed(1)}%`} icon={Mail} />
              <StatCard label="Click Rate" value={`${(stats.audience.click_rate * 100).toFixed(1)}%`} icon={BarChart2} />
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-8 text-center text-white/30 text-sm">
              Configure your Mailchimp settings first to see audience stats.
            </div>
          )}

          {syncResult && (
            <div className="rounded-lg border border-[#967705]/30 bg-[#967705]/10 px-4 py-3 text-sm text-[#c9a70a]">
              Sync complete: {syncResult.synced} synced, {syncResult.failed} failed
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <><RefreshCw size={14} className="animate-spin" /> Syncing…</>
              ) : (
                'Sync to Mailchimp'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Campaigns tab ── */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            {/* Status filter tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-[#111] border border-white/[0.06]">
              {statusFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === f.id
                      ? 'bg-[#967705]/20 text-[#c9a70a] border border-[#967705]/30'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={loadCampaigns} disabled={loadingCampaigns}>
                <RefreshCw size={13} className={loadingCampaigns ? 'animate-spin' : ''} />
                {loadingCampaigns ? 'Loading…' : 'Refresh'}
              </Button>
              <Button size="sm" onClick={() => router.push('/mailchimp/create')}>
                + Create Campaign
              </Button>
            </div>
          </div>

          {/* Campaign list */}
          {filteredCampaigns.length > 0 ? (
            <div className="rounded-xl border border-white/[0.08] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-xs text-white/35 font-medium">Title</th>
                    <th className="px-4 py-3 text-left text-xs text-white/35 font-medium">Status</th>
                    <th className="px-4 py-3 text-right text-xs text-white/35 font-medium">Sent</th>
                    <th className="px-4 py-3 text-right text-xs text-white/35 font-medium">Open Rate</th>
                    <th className="px-4 py-3 text-right text-xs text-white/35 font-medium">Click Rate</th>
                    <th className="px-4 py-3 text-right text-xs text-white/35 font-medium">Date</th>
                    <th className="px-4 py-3 text-right text-xs text-white/35 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white/80 max-w-[180px] truncate">
                        {c.settings.title || c.settings.subject_line}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusBadgeCls(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white/60">{c.emails_sent > 0 ? c.emails_sent.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-right text-white/60">
                        {c.opens ? `${(c.opens.open_rate * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-white/60">
                        {c.clicks ? `${(c.clicks.click_rate * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-white/40 text-xs">
                        {c.send_time ? format(new Date(c.send_time), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.status === 'draft' && (
                          <button
                            onClick={() => router.push(`/mailchimp/edit/${c.id}`)}
                            className="inline-flex items-center gap-1 text-xs text-[#c9a70a]/70 hover:text-[#c9a70a] transition-colors"
                          >
                            <PenSquare size={12} /> Edit
                          </button>
                        )}
                        {(c.status === 'sent' || c.status === 'sending') && (
                          <a
                            href={`https://us1.admin.mailchimp.com/reports/summary?id=${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                          >
                            <ExternalLink size={12} /> Report
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-8 text-center text-white/30 text-sm">
              {loadingCampaigns ? 'Loading campaigns…' : campaigns.length === 0 ? 'No campaigns yet. Create your first one!' : `No ${statusFilter} campaigns.`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
