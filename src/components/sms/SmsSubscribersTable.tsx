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
import { Plus, X } from 'lucide-react'
import type { WhatsAppSubscriber } from '@/lib/types'

const COLUMNS = [
  { key: 'phone', label: 'Phone' },
  { key: 'name', label: 'Name' },
  { key: 'tags', label: 'Tags' },
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
  const [newTagInput, setNewTagInput] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const { visible, toggle } = useColumnVisibility('sms-subscribers', COLUMNS.map((c) => c.key))

  // Collect all unique tags from existing subscribers for the filter bar
  const allTags = Array.from(new Set(subscribers.flatMap((s) => s.tags ?? []))).sort()
  const [filterTag, setFilterTag] = useState<string | null>(null)

  const displayed = filterTag ? subscribers.filter((s) => s.tags?.includes(filterTag)) : subscribers
  const visibleCols = COLUMNS.filter((c) => visible.has(c.key))
  const colSpan = visibleCols.length + 1

  function addTag() {
    const t = newTagInput.trim()
    if (t && !newTags.includes(t)) setNewTags((prev) => [...prev, t])
    setNewTagInput('')
  }

  async function handleAdd() {
    if (!newPhone.trim()) return
    setAdding(true)
    setAddError('')
    const { data, error } = await supabase.from('sms_subscribers').insert({
      phone: newPhone.trim(),
      first_name: newName.trim(),
      tags: newTags,
    }).select().single()
    setAdding(false)
    if (error) { setAddError(error.message); return }
    setSubscribers((prev) => [data as WhatsAppSubscriber, ...prev])
    setAddOpen(false)
    setNewPhone('')
    setNewName('')
    setNewTags([])
  }

  async function handleUnsubscribe(id: string) {
    await supabase.from('sms_subscribers').update({ status: 'unsubscribed' }).eq('id', id)
    setSubscribers((prev) => prev.map((s) => s.id === id ? { ...s, status: 'unsubscribed' as const } : s))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        {/* Tag filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-white/40">Filter:</span>
          <button
            onClick={() => setFilterTag(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterTag === null
                ? 'bg-brand-gold text-black border-brand-gold'
                : 'border-white/10 text-white/50 hover:border-white/30'
            }`}
          >
            All ({subscribers.filter((s) => s.status === 'subscribed').length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterTag === tag
                  ? 'bg-brand-gold text-black border-brand-gold'
                  : 'border-white/10 text-white/50 hover:border-white/30'
              }`}
            >
              {tag} ({subscribers.filter((s) => s.tags?.includes(tag) && s.status === 'subscribed').length})
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <ColumnToggle columns={COLUMNS} visible={visible} onToggle={toggle} />
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}><Plus size={13} /> Add Subscriber</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              {visibleCols.map((col) => (
                <th key={col.key} className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider" />
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr><td colSpan={colSpan} className="px-6 py-12 text-center text-white/30">No subscribers{filterTag ? ` tagged "${filterTag}"` : ''}</td></tr>
            ) : (
              displayed.map((s) => (
                <tr key={s.id} className="border-b border-white/[0.04] last:border-0">
                  {visible.has('phone') && <td className="px-6 py-4 text-white">{s.phone}</td>}
                  {visible.has('name') && <td className="px-6 py-4 text-white/60">{s.first_name || '—'}</td>}
                  {visible.has('tags') && (
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(s.tags ?? []).length === 0
                          ? <span className="text-white/20 text-xs">—</span>
                          : s.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60 text-xs">{t}</span>
                          ))
                        }
                      </div>
                    </td>
                  )}
                  {visible.has('status') && <td className="px-6 py-4"><Badge variant={statusToBadge(s.status)}>{s.status}</Badge></td>}
                  {visible.has('subscribed') && <td className="px-6 py-4 text-white/40 text-xs">{format(new Date(s.subscribed_at), 'dd MMM yyyy')}</td>}
                  <td className="px-6 py-4 text-right">
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
          <Field label="Tags">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="e.g. members, hyrox"
                />
                <Button variant="secondary" size="sm" onClick={addTag}>Add</Button>
              </div>
              {newTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {newTags.map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.08] text-white/70 text-xs">
                      {t}
                      <button onClick={() => setNewTags((prev) => prev.filter((x) => x !== t))}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
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
