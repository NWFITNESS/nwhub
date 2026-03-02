'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge, statusToBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { format } from 'date-fns'
import type { ContactEnquiry } from '@/lib/types'

const STATUS_FILTERS = ['all', 'new', 'read', 'replied'] as const

interface Props {
  initialEnquiries: ContactEnquiry[]
}

export function ContactsTable({ initialEnquiries }: Props) {
  const supabase = createClient()
  const [enquiries, setEnquiries] = useState(initialEnquiries)
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('all')
  const [selected, setSelected] = useState<ContactEnquiry | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = filter === 'all' ? enquiries : enquiries.filter((e) => e.status === filter)

  async function updateStatus(id: string, status: ContactEnquiry['status']) {
    setUpdating(id)
    await supabase.from('contact_enquiries').update({ status }).eq('id', id)
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null)
    setUpdating(null)
  }

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-4">
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

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              {['Name', 'Email', 'Type', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30">No enquiries</td></tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelected(e)}
                >
                  <td className="px-4 py-3 font-medium text-white">{e.name}</td>
                  <td className="px-4 py-3 text-white/60">{e.email}</td>
                  <td className="px-4 py-3 text-white/50">{e.enquiry_type}</td>
                  <td className="px-4 py-3"><Badge variant={statusToBadge(e.status)}>{e.status}</Badge></td>
                  <td className="px-4 py-3 text-white/40 text-xs">{format(new Date(e.created_at), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3 text-right">
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

      {/* Detail modal */}
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
