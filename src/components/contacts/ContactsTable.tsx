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
                className={`rounded-[7px] px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                  filter === s
                    ? 'bg-[rgba(212,160,23,0.15)] text-gold-300 border border-[rgba(212,160,23,0.3)]'
                    : 'text-nw-400 hover:text-nw-200 border border-transparent'
                }`}
              >
                {s} <span className="ml-1 opacity-60">({count})</span>
              </button>
            )
          })}
        </div>
        <ColumnToggle columns={COLUMNS} visible={visible} onToggle={toggle} />
      </div>

      <div className="w-full overflow-x-auto">
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
              <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-nw-500">No enquiries</td></tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  className="transition-colors hover:bg-[rgba(255,255,255,0.03)] cursor-pointer"
                  onClick={() => setSelected(e)}
                >
                  {visible.has('name') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 font-medium text-nw-200">{e.name}</td>}
                  {visible.has('email') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-400">{e.email}</td>}
                  {visible.has('type') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-400">{e.enquiry_type}</td>}
                  {visible.has('status') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3"><Badge variant={statusToBadge(e.status)}>{e.status}</Badge></td>}
                  {visible.has('date') && <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-xs font-medium text-nw-400">{format(new Date(e.created_at), 'dd MMM yyyy')}</td>}
                  <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-right">
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
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <p className="text-xs font-medium text-nw-400 mb-1">Email</p>
                <a href={`mailto:${selected.email}`} className="text-gold-300">{selected.email}</a>
              </div>
              <div>
                <p className="text-xs font-medium text-nw-400 mb-1">Phone</p>
                <p className="text-nw-200">{selected.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-nw-400 mb-1">Type</p>
                <p className="text-nw-200">{selected.enquiry_type}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-nw-400 mb-1">Date</p>
                <p className="text-nw-200">{format(new Date(selected.created_at), 'dd MMM yyyy HH:mm')}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-nw-400 mb-2">Message</p>
              <p className="text-[13px] text-nw-300 rounded-[7px] bg-nw-800 p-3 whitespace-pre-wrap">{selected.message}</p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-[rgba(255,255,255,0.07)]">
              <span className="text-xs text-nw-500 mr-2">Mark as:</span>
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
