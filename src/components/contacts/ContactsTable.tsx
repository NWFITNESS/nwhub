'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge, statusToBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ColumnToggle } from '@/components/ui/ColumnToggle'
import { useColumnVisibility } from '@/lib/use-column-visibility'
import { format } from 'date-fns'
import type { ContactEnquiry } from '@/lib/types'

const STATUS_FILTERS = ['all', 'new', 'read', 'replied'] as const

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
]

interface Props {
  initialEnquiries: ContactEnquiry[]
}

export function ContactsTable({ initialEnquiries }: Props) {
  const supabase = createClient()
  const [enquiries, setEnquiries] = useState(initialEnquiries)
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('all')
  const [selected, setSelected] = useState<ContactEnquiry | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const { visible, toggle } = useColumnVisibility('contacts', COLUMNS.map((c) => c.key))

  const filtered = filter === 'all' ? enquiries : enquiries.filter((e) => e.status === filter)
  const visibleCols = COLUMNS.filter((c) => visible.has(c.key))
  const colSpan = visibleCols.length + 1 // +1 for actions

  async function updateStatus(id: string, status: ContactEnquiry['status']) {
    setUpdating(id)
    await supabase.from('contact_enquiries').update({ status }).eq('id', id)
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null)
    setUpdating(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((s) => {
            const count = s === 'all' ? enquiries.length : enquiries.filter((e) => e.status === s).length
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  filter === s
                    ? 'bg-[#967705]/20 text-[#c9a70a]'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {s} <span className="ml-1 opacity-60">({count})</span>
              </button>
            )
          })}
        </div>
        <ColumnToggle columns={COLUMNS} visible={visible} onToggle={toggle} />
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
            {filtered.length === 0 ? (
              <tr><td colSpan={colSpan} className="px-6 py-12 text-center text-white/30">No enquiries</td></tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelected(e)}
                >
                  {visible.has('name') && <td className="px-6 py-4 font-medium text-white">{e.name}</td>}
                  {visible.has('email') && <td className="px-6 py-4 text-white/60">{e.email}</td>}
                  {visible.has('type') && <td className="px-6 py-4 text-white/50">{e.enquiry_type}</td>}
                  {visible.has('status') && <td className="px-6 py-4"><Badge variant={statusToBadge(e.status)}>{e.status}</Badge></td>}
                  {visible.has('date') && <td className="px-6 py-4 text-white/40 text-xs">{format(new Date(e.created_at), 'dd MMM yyyy')}</td>}
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); setSelected(e) }}>
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={`Enquiry — ${selected.name}`} width="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/40 text-xs mb-1">Email</p>
                <a href={`mailto:${selected.email}`} className="text-[#c9a70a]">{selected.email}</a>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Phone</p>
                <p className="text-white">{selected.phone || '—'}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Type</p>
                <p className="text-white">{selected.enquiry_type}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Date</p>
                <p className="text-white">{format(new Date(selected.created_at), 'dd MMM yyyy HH:mm')}</p>
              </div>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-2">Message</p>
              <p className="text-sm text-white/80 bg-[#111] rounded-lg p-3 whitespace-pre-wrap">{selected.message}</p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <span className="text-xs text-white/40 mr-2">Mark as:</span>
              {(['new', 'read', 'replied'] as const).map((s) => (
                <Button
                  key={s}
                  variant={selected.status === s ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => updateStatus(selected.id, s)}
                  loading={updating === selected.id}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
              <a href={`mailto:${selected.email}`} className="ml-auto">
                <Button variant="secondary" size="sm">Reply via Email</Button>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
