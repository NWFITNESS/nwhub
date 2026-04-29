'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge, statusToBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Field } from '@/components/ui/Input'
import { ColumnToggle } from '@/components/ui/ColumnToggle'
import { useColumnVisibility } from '@/lib/use-column-visibility'
import { format } from 'date-fns'
import { Plus, Download } from 'lucide-react'
import type { EmailSubscriber } from '@/lib/types'

const COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'name', label: 'Name' },
  { key: 'tags', label: 'Tags' },
  { key: 'status', label: 'Status' },
  { key: 'subscribed', label: 'Subscribed' },
]

const inputCls = 'w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none'

interface Props {
  initialSubscribers: EmailSubscriber[]
}

export function EmailSubscribersTable({ initialSubscribers }: Props) {
  const supabase = createClient()
  const [subscribers, setSubscribers] = useState(initialSubscribers)
  const [filter, setFilter] = useState<'all' | 'subscribed' | 'unsubscribed'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newFirstName, setNewFirstName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const { visible, toggle } = useColumnVisibility('email-subscribers', COLUMNS.map((c) => c.key))

  // Edit modal state
  const [editing, setEditing] = useState<EmailSubscriber | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editStatus, setEditStatus] = useState<string>('subscribed')
  const [editSource, setEditSource] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const filtered = filter === 'all' ? subscribers : subscribers.filter((s) => s.status === filter)
  const visibleCols = COLUMNS.filter((c) => visible.has(c.key))
  const colSpan = visibleCols.length + 1

  function openEdit(s: EmailSubscriber) {
    setEditing(s)
    setEditEmail(s.email)
    setEditFirstName(s.first_name)
    setEditLastName(s.last_name)
    setEditTags(s.tags.join(', '))
    setEditStatus(s.status)
    setEditSource(s.source)
    setEditError('')
  }

  async function handleSaveEdit() {
    if (!editing) return
    setSaving(true)
    setEditError('')
    const tags = editTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    const { error } = await supabase.from('email_subscribers').update({
      email: editEmail.trim().toLowerCase(),
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      tags,
      status: editStatus,
      source: editSource.trim(),
    }).eq('id', editing.id)
    setSaving(false)
    if (error) { setEditError(error.message); return }
    setSubscribers(prev => prev.map(s => s.id === editing.id ? {
      ...s,
      email: editEmail.trim().toLowerCase(),
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      tags,
      status: editStatus as EmailSubscriber['status'],
      source: editSource.trim(),
    } : s))
    setEditing(null)
  }

  async function handleDelete() {
    if (!editing) return
    if (!window.confirm(`Delete ${editing.email}? This cannot be undone.`)) return
    const { error } = await supabase.from('email_subscribers').delete().eq('id', editing.id)
    if (error) { setEditError(error.message); return }
    setSubscribers(prev => prev.filter(s => s.id !== editing.id))
    setEditing(null)
  }

  async function handleAdd() {
    if (!newEmail.trim()) return
    setAdding(true)
    setAddError('')
    const { data, error } = await supabase.from('email_subscribers').insert({
      email: newEmail.trim(),
      first_name: newFirstName.trim(),
      source: 'admin',
    }).select().single()
    setAdding(false)
    if (error) { setAddError(error.message); return }
    setSubscribers((prev) => [data as EmailSubscriber, ...prev])
    setAddOpen(false)
    setNewEmail('')
    setNewFirstName('')
  }

  async function handleUnsubscribe(id: string) {
    await supabase.from('email_subscribers').update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    }).eq('id', id)
    setSubscribers((prev) => prev.map((s) => s.id === id ? { ...s, status: 'unsubscribed' as const } : s))
  }

  function exportCsv() {
    const csv = ['Email,First Name,Last Name,Tags,Status,Subscribed']
    subscribers.filter((s) => s.status === 'subscribed').forEach((s) => {
      csv.push(`${s.email},${s.first_name},${s.last_name},${s.tags.join(';')},${s.status},${s.subscribed_at}`)
    })
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex gap-1">
          {(['all', 'subscribed', 'unsubscribed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-[7px] px-2.5 py-1 text-[11px] font-semibold transition-colors capitalize ${filter === s ? 'bg-[rgba(212,160,23,0.15)] text-gold-300 border border-[rgba(212,160,23,0.3)]' : 'text-nw-400 hover:text-nw-200 border border-transparent'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="hidden md:flex gap-2">
            <ColumnToggle columns={COLUMNS} visible={visible} onToggle={toggle} />
            <Button variant="default" size="sm" onClick={exportCsv}><Download size={13} /> Export CSV</Button>
          </div>
          <Button variant="gold" size="sm" onClick={() => setAddOpen(true)}><Plus size={13} /> Add</Button>
        </div>
      </div>

      {/* Mobile card rows */}
      <div className="md:hidden flex flex-col">
        {filtered.length === 0 ? (
          <p className="text-center text-nw-500 py-12">No subscribers</p>
        ) : filtered.map(s => (
          <div key={s.id} className="border-b border-[rgba(255,255,255,0.05)] cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors" style={{ padding: 16 }} onClick={() => openEdit(s)}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-nw-200 font-medium" style={{ fontSize: 13 }}>{s.email}</p>
              <Badge variant={statusToBadge(s.status)}>{s.status}</Badge>
            </div>
            <p className="text-nw-400" style={{ fontSize: 12 }}>{[s.first_name, s.last_name].filter(Boolean).join(' ') || '—'}</p>
            {s.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {s.tags.map(t => <TagPill key={t} tag={t} />)}
              </div>
            )}
            <span className="text-nw-500" style={{ fontSize: 10 }}>{format(new Date(s.subscribed_at), 'dd MMM yyyy')}</span>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {visibleCols.map((col) => (
                <th key={col.key} className="border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">
                  {col.label}
                </th>
              ))}
              <th className="border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-nw-500">No subscribers</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-[rgba(255,255,255,0.04)] cursor-pointer" onClick={() => openEdit(s)}>
                  {visible.has('email') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 font-medium text-nw-200">{s.email}</td>}
                  {visible.has('name') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-400">{[s.first_name, s.last_name].filter(Boolean).join(' ') || '—'}</td>}
                  {visible.has('tags') && (
                    <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.tags.length > 0 ? s.tags.map(t => <TagPill key={t} tag={t} />) : <span className="text-nw-500 text-xs">—</span>}
                      </div>
                    </td>
                  )}
                  {visible.has('status') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3"><Badge variant={statusToBadge(s.status)}>{s.status}</Badge></td>}
                  {visible.has('subscribed') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-xs font-medium text-nw-400">{format(new Date(s.subscribed_at), 'dd MMM yyyy')}</td>}
                  <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {s.status === 'subscribed' && (
                      <Button variant="ghost" size="sm" onClick={() => handleUnsubscribe(s.id)}>Unsubscribe</Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Subscriber" width="sm">
        <div className="space-y-4">
          <Field label="Email *">
            <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" />
          </Field>
          <Field label="First Name">
            <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="Jane" />
          </Field>
          {addError && <p className="text-xs text-red-400">{addError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAdd} loading={adding}>Add Subscriber</Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Subscriber" width="lg">
        {editing && (
          <div style={{ padding: '0 4px' }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Email</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputCls}>
                  <option value="subscribed">Subscribed</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="bounced">Bounced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">First name</label>
                <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Last name</label>
                <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="block text-xs text-white/50 mb-1">Tags (comma-separated)</label>
              <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="kids-parents, newsletter" className={inputCls} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="block text-xs text-white/50 mb-1">Source</label>
              <input type="text" value={editSource} onChange={(e) => setEditSource(e.target.value)} className={inputCls} />
            </div>

            {editError && (
              <p className="text-xs text-red-400" style={{ marginTop: 12 }}>{editError}</p>
            )}

            <div className="flex items-center justify-between" style={{ marginTop: 20 }}>
              <button
                onClick={handleDelete}
                className="text-xs text-white/30 hover:text-red-400 transition-colors"
              >
                Delete subscriber
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-lg text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="rounded-lg bg-[#967705] text-sm font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ padding: '8px 20px' }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function TagPill({ tag }: { tag: string }) {
  const colours: Record<string, { bg: string; fg: string }> = {
    'kids-parents': { bg: '#fef3c7', fg: '#92400e' },
    'newsletter': { bg: '#dbeafe', fg: '#1e40af' },
    'hyrox-interest': { bg: '#fee2e2', fg: '#991b1b' },
  }
  const c = colours[tag] ?? { bg: '#f3f4f6', fg: '#374151' }
  return (
    <span
      className="rounded-full text-[10px] font-semibold"
      style={{ padding: '1px 7px', background: c.bg, color: c.fg }}
    >
      {tag}
    </span>
  )
}
