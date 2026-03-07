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
import { Plus } from 'lucide-react'
import type { WhatsAppSubscriber } from '@/lib/types'

const COLUMNS = [
  { key: 'phone', label: 'Phone' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'subscribed', label: 'Subscribed' },
]

interface Props {
  initialSubscribers: WhatsAppSubscriber[]
}

export function SmsSubscribersTable({ initialSubscribers }: Props) {
  const supabase = createClient()
  const [subscribers, setSubscribers] = useState(initialSubscribers)
  const [addOpen, setAddOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const { visible, toggle } = useColumnVisibility('sms-subscribers', COLUMNS.map((c) => c.key))

  const visibleCols = COLUMNS.filter((c) => visible.has(c.key))
  const colSpan = visibleCols.length + 1

  async function handleAdd() {
    if (!newPhone.trim()) return
    setAdding(true)
    setAddError('')
    const { data, error } = await supabase.from('sms_subscribers').insert({
      phone: newPhone.trim(),
      first_name: newName.trim(),
    }).select().single()
    setAdding(false)
    if (error) { setAddError(error.message); return }
    setSubscribers((prev) => [data as WhatsAppSubscriber, ...prev])
    setAddOpen(false)
    setNewPhone('')
    setNewName('')
  }

  async function handleUnsubscribe(id: string) {
    await supabase.from('sms_subscribers').update({ status: 'unsubscribed' }).eq('id', id)
    setSubscribers((prev) => prev.map((s) => s.id === id ? { ...s, status: 'unsubscribed' as const } : s))
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <ColumnToggle columns={COLUMNS} visible={visible} onToggle={toggle} />
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}><Plus size={13} /> Add Subscriber</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              {visibleCols.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider" />
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-white/30">No WhatsApp subscribers yet</td></tr>
            ) : (
              subscribers.map((s) => (
                <tr key={s.id} className="border-b border-white/[0.04] last:border-0">
                  {visible.has('phone') && <td className="px-4 py-3 text-white">{s.phone}</td>}
                  {visible.has('name') && <td className="px-4 py-3 text-white/60">{s.first_name || '—'}</td>}
                  {visible.has('status') && <td className="px-4 py-3"><Badge variant={statusToBadge(s.status)}>{s.status}</Badge></td>}
                  {visible.has('subscribed') && <td className="px-4 py-3 text-white/40 text-xs">{format(new Date(s.subscribed_at), 'dd MMM yyyy')}</td>}
                  <td className="px-4 py-3 text-right">
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add WhatsApp Subscriber" width="sm">
        <div className="space-y-4">
          <Field label="Phone Number * (E.164 format)">
            <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+447700000000" />
          </Field>
          <Field label="First Name">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane" />
          </Field>
          {addError && <p className="text-xs text-red-400">{addError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAdd} loading={adding}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
