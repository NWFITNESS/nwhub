'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, RefreshCw, Save } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Audience {
  id: string
  name: string
  member_count: number
}

interface Props {
  initialConnected: boolean
  initialError: string | null
  apiKeySource: 'env' | 'database' | 'none'
  initialAudienceId: string
  initialAudienceName: string | null
  initialMemberCount: number | null
  initialFromName: string
  initialFromEmail: string
  initialReplyTo: string
}

export function MailchimpConnectionPanel({
  initialConnected,
  initialError,
  apiKeySource,
  initialAudienceId,
  initialAudienceName,
  initialMemberCount,
  initialFromName,
  initialFromEmail,
  initialReplyTo,
}: Props) {
  const router = useRouter()
  const [audiences, setAudiences] = useState<Audience[] | null>(null)
  const [loadingAudiences, setLoadingAudiences] = useState(false)
  const [audienceId, setAudienceId] = useState(initialAudienceId)
  const [fromName, setFromName] = useState(initialFromName)
  const [fromEmail, setFromEmail] = useState(initialFromEmail)
  const [replyTo, setReplyTo] = useState(initialReplyTo)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function loadAudiences() {
    setLoadingAudiences(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/mailchimp/audiences')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to load audiences')
      }
      const data: Audience[] = await res.json()
      setAudiences(data)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to load audiences')
    } finally {
      setLoadingAudiences(false)
    }
  }

  async function saveSettings() {
    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/mailchimp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: '••••••••', // sentinel: keep existing
          audience_id: audienceId,
          from_name: fromName,
          from_email: fromEmail,
          reply_to: replyTo || fromEmail,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to save')
      }
      setSavedAt(Date.now())
      router.refresh()
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const statusColor = initialConnected ? '#4ade80' : '#ef4444'
  const statusLabel = initialConnected ? 'Connected' : 'Not connected'

  return (
    <Panel>
      <PanelHeader eyebrow="Integration" title="Mailchimp Connection" />
      <div className="p-4 flex flex-col gap-4">
        {/* Status row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {initialConnected ? (
              <CheckCircle2 size={16} style={{ color: statusColor }} />
            ) : (
              <AlertCircle size={16} style={{ color: statusColor }} />
            )}
            <span style={{ color: statusColor, fontSize: 13, fontWeight: 600 }}>{statusLabel}</span>
            <span className="text-nw-500" style={{ fontSize: 11 }}>
              · API key from {apiKeySource === 'env' ? 'environment variable' : apiKeySource === 'database' ? 'database' : 'not set'}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => router.refresh()}>
            <RefreshCw size={13} /> Retest
          </Button>
        </div>

        {initialError && (
          <div className="rounded border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-3 py-2" style={{ fontSize: 12, color: '#ef4444' }}>
            {initialError}
          </div>
        )}

        {/* Current audience */}
        {initialConnected && initialAudienceId && initialAudienceName && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Audience" value={initialAudienceName} />
            <Field label="Members" value={initialMemberCount?.toLocaleString() ?? '—'} />
            <Field label="From" value={`${initialFromName || '—'} <${initialFromEmail || '—'}>`} />
          </div>
        )}

        {/* No audience selected — show picker */}
        {initialConnected && !initialAudienceId && (
          <div className="rounded border border-[rgba(201,167,10,0.3)] bg-[rgba(201,167,10,0.05)] px-3 py-3" style={{ fontSize: 12 }}>
            <p className="text-nw-300 mb-3">
              Mailchimp is connected but no audience is selected. Pick an audience to start sending campaigns.
            </p>
            {audiences === null ? (
              <Button variant="gold" size="sm" onClick={loadAudiences} loading={loadingAudiences}>
                Load audiences
              </Button>
            ) : (
              <AudiencePicker
                audiences={audiences}
                selectedId={audienceId}
                onSelect={setAudienceId}
                fromName={fromName}
                fromEmail={fromEmail}
                replyTo={replyTo}
                onFromName={setFromName}
                onFromEmail={setFromEmail}
                onReplyTo={setReplyTo}
                onSave={saveSettings}
                saving={saving}
              />
            )}
          </div>
        )}

        {savedAt && (
          <div className="text-[#4ade80]" style={{ fontSize: 12 }}>
            ✓ Settings saved
          </div>
        )}

        {errorMsg && (
          <div className="text-[#ef4444]" style={{ fontSize: 12 }}>
            {errorMsg}
          </div>
        )}
      </div>
    </Panel>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-nw-900 border border-[rgba(255,255,255,0.05)] px-3 py-2">
      <div className="text-nw-500" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div className="text-nw-100 mt-0.5 truncate" style={{ fontSize: 13 }}>{value}</div>
    </div>
  )
}

function AudiencePicker({
  audiences,
  selectedId,
  onSelect,
  fromName,
  fromEmail,
  replyTo,
  onFromName,
  onFromEmail,
  onReplyTo,
  onSave,
  saving,
}: {
  audiences: Audience[]
  selectedId: string
  onSelect: (id: string) => void
  fromName: string
  fromEmail: string
  replyTo: string
  onFromName: (v: string) => void
  onFromEmail: (v: string) => void
  onReplyTo: (v: string) => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="bg-nw-900 border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-nw-100"
        style={{ fontSize: 13 }}
      >
        <option value="">— Select an audience —</option>
        {audiences.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.member_count.toLocaleString()} members)
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="From name"
          value={fromName}
          onChange={(e) => onFromName(e.target.value)}
          className="bg-nw-900 border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-nw-100"
          style={{ fontSize: 13 }}
        />
        <input
          type="email"
          placeholder="From email"
          value={fromEmail}
          onChange={(e) => onFromEmail(e.target.value)}
          className="bg-nw-900 border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-nw-100"
          style={{ fontSize: 13 }}
        />
        <input
          type="email"
          placeholder="Reply-to (optional)"
          value={replyTo}
          onChange={(e) => onReplyTo(e.target.value)}
          className="bg-nw-900 border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-nw-100"
          style={{ fontSize: 13 }}
        />
      </div>

      <div>
        <Button variant="gold" size="sm" onClick={onSave} loading={saving} disabled={!selectedId}>
          <Save size={13} /> Save
        </Button>
      </div>
    </div>
  )
}
