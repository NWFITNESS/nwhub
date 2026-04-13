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
  { key: 'status', label: 'Status' },
  { key: 'subscribed', label: 'Subscribed' },
]

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

  const filtered = filter === 'all' ? subscribers : subscribers.filter((s) => s.status === filter)
  const visibleCols = COLUMNS.filter((c) => visible.has(c.key))
  const colSpan = visibleCols.length + 1

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
          <div key={s.id} className="border-b border-[rgba(255,255,255,0.05)] p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-nw-200 font-medium" style={{ fontSize: 13 }}>{s.email}</p>
              <Badge variant={statusToBadge(s.status)}>{s.status}</Badge>
            </div>
            <p className="text-nw-400" style={{ fontSize: 12 }}>{[s.first_name, s.last_name].filter(Boolean).join(' ') || '—'}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-nw-500" style={{ fontSize: 10 }}>{format(new Date(s.subscribed_at), 'dd MMM yyyy')}</span>
              {s.status === 'subscribed' && (
                <Button variant="ghost" size="sm" onClick={() => handleUnsubscribe(s.id)}>Unsubscribe</Button>
              )}
            </div>
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
                <tr key={s.id} className="transition-colors hover:bg-[rgba(255,255,255,0.03)]">
                  {visible.has('email') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 font-medium text-nw-200">{s.email}</td>}
                  {visible.has('name') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-400">{[s.first_name, s.last_name].filter(Boolean).join(' ') || '—'}</td>}
                  {visible.has('status') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3"><Badge variant={statusToBadge(s.status)}>{s.status}</Badge></td>}
                  {visible.has('subscribed') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-xs font-medium text-nw-400">{format(new Date(s.subscribed_at), 'dd MMM yyyy')}</td>}
                  <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-right">
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
    </div>
  )
}
