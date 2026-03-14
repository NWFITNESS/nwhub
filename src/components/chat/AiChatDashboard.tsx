'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  MessageSquare, CheckCircle, AlertCircle, Eye, Users, TrendingUp, Bot,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { ChatSettings, ChatSession } from '@/lib/types'

// ─── Inline helpers (avoid importing full Input/Field — same styles) ────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/25 mt-1">{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, type = 'text', placeholder }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#967705]/60 transition-colors"
    />
  )
}

function StatCard({ label, value, sub, icon: Icon }: {
  label: string; value: string | number; sub?: string; icon: React.ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-6 flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg bg-[#967705]/15 border border-[#967705]/20 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-[#c9a70a]" />
      </div>
      <div>
        <p className="text-xs text-white/35 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Conversation modal ─────────────────────────────────────────────────────
function ConversationModal({ session, onClose }: { session: ChatSession; onClose: () => void }) {
  return (
    <Modal open title="Conversation" onClose={onClose} width="lg">
      {session.lead_captured && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
          <CheckCircle size={14} />
          Lead captured — contact details saved
        </div>
      )}
      <p className="text-xs text-white/30 mb-4">
        Session started {format(new Date(session.created_at), 'dd MMM yyyy, HH:mm')}
        {session.ip_address && ` · ${session.ip_address}`}
      </p>
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {session.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#967705]/20 border border-[#967705]/30 text-white rounded-br-sm'
                  : 'bg-[#1e1e1e] border border-white/[0.08] text-white/85 rounded-bl-sm'
              }`}
            >
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              {msg.timestamp && (
                <p className="text-[10px] text-white/25 mt-1">
                  {format(new Date(msg.timestamp), 'HH:mm')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ─── Main dashboard ─────────────────────────────────────────────────────────
interface Props {
  initialSettings: ChatSettings
  initialSessions: ChatSession[]
}

export function AiChatDashboard({ initialSettings, initialSessions }: Props) {
  const [settings, setSettings] = useState<ChatSettings>(initialSettings)
  const [sessions] = useState<ChatSession[]>(initialSessions)
  const [activeTab, setActiveTab] = useState<'settings' | 'conversations'>('settings')
  const [saving, setSaving] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const totalSessions = sessions.length
  const leadsCount = sessions.filter((s) => s.lead_captured).length
  const conversionRate = totalSessions > 0 ? Math.round((leadsCount / totalSessions) * 100) : 0

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/chat/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    showToast(res.ok ? 'Settings saved' : 'Failed to save settings', res.ok)
  }

  return (
    <div className="space-y-6">
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

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1.5 rounded-xl bg-[#111] border border-white/[0.08] w-fit">
        {(['settings', 'conversations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-[#967705]/20 text-[#c9a70a] border border-[#967705]/30'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Settings tab ─────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-6 space-y-5 max-w-2xl">
          {/* Enable toggle */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
            <button
              onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.enabled ? 'bg-[#967705]' : 'bg-white/15'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${settings.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-white">{settings.enabled ? 'Widget enabled' : 'Widget disabled'}</p>
              <p className="text-xs text-white/35 mt-0.5">Controls whether the chat widget appears on the public site</p>
            </div>
          </div>

          <Field label="Anthropic API Key" hint="Leave unchanged (shown as ••••••••) to keep the existing saved key. Paste a new key to replace it.">
            <TextInput
              type="password"
              value={settings.api_key}
              onChange={(v) => setSettings((s) => ({ ...s, api_key: v }))}
              placeholder="sk-ant-api03-…"
            />
          </Field>

          <Field label="WhatsApp Number" hint="E.164 format e.g. +447700900123. Shown as a CTA link in the widget.">
            <TextInput
              type="tel"
              value={settings.whatsapp_number}
              onChange={(v) => setSettings((s) => ({ ...s, whatsapp_number: v }))}
              placeholder="+447700900123"
            />
          </Field>

          <Field label="System Prompt" hint="Instructions given to the AI. Defines its personality, knowledge, and how it handles leads.">
            <textarea
              value={settings.system_prompt}
              onChange={(e) => setSettings((s) => ({ ...s, system_prompt: e.target.value }))}
              rows={12}
              className="w-full px-3 py-2.5 rounded-lg bg-[#111] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#967705]/60 transition-colors resize-y font-mono leading-relaxed"
            />
          </Field>

          <div className="flex justify-end pt-2 border-t border-white/[0.08]">
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              Save settings
            </Button>
          </div>
        </div>
      )}

      {/* ── Conversations tab ─────────────────────────────────────────────── */}
      {activeTab === 'conversations' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Sessions" value={totalSessions} sub="all time" icon={MessageSquare} />
            <StatCard label="Leads Captured" value={leadsCount} sub="contacts saved" icon={Users} />
            <StatCard
              label="Conversion Rate"
              value={`${conversionRate}%`}
              sub={totalSessions > 0 ? `${leadsCount} of ${totalSessions}` : 'no data yet'}
              icon={TrendingUp}
            />
          </div>

          {/* Sessions table */}
          <div className="rounded-xl border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {['Started', 'Messages', 'Lead', 'IP Address', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-white/30">
                      <div className="flex flex-col items-center gap-3">
                        <Bot size={28} className="text-white/15" />
                        <p>No conversations yet. Enable the widget and share the blog to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : sessions.map((s) => (
                  <tr key={s.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white/60 text-xs">
                      {format(new Date(s.created_at), 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-center">{s.messages.length}</td>
                    <td className="px-4 py-3">
                      {s.lead_captured ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} /> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-white/25">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs font-mono">{s.ip_address ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conversation modal */}
      {selectedSession && (
        <ConversationModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  )
}
