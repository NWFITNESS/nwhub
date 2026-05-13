'use client'

import { useState, useCallback } from 'react'
import { Badge, statusToBadge } from '@/components/ui/Badge'
import { ColumnToggle } from '@/components/ui/ColumnToggle'
import { useColumnVisibility } from '@/lib/use-column-visibility'
import { EnquiryDetail } from './EnquiryDetail'
import { format } from 'date-fns'
import { Inbox } from 'lucide-react'
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
  selectedId?: string | null
}

export function EnquiriesClient({ initialEnquiries, selectedId }: Props) {
  const [enquiries, setEnquiries] = useState(initialEnquiries)
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('all')
  const [selected, setSelected] = useState<ContactEnquiry | null>(
    selectedId ? initialEnquiries.find(e => e.id === selectedId) ?? null : null
  )
  const { visible, toggle } = useColumnVisibility('enquiries', COLUMNS.map(c => c.key))

  const filtered = filter === 'all' ? enquiries : enquiries.filter(e => e.status === filter)

  const handleStatusChange = useCallback((id: string, status: ContactEnquiry['status']) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
  }, [])

  // Detail view
  if (selected) {
    return (
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-nw-750 overflow-hidden" style={{ minHeight: 500 }}>
        <EnquiryDetail
          enquiry={selected}
          onBack={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      </div>
    )
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map(s => {
            const count = s === 'all' ? enquiries.length : enquiries.filter(e => e.status === s).length
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
              {COLUMNS.filter(c => visible.has(c.key)).map(col => (
                <th key={col.key} className="border-b border-[rgba(255,255,255,0.07)] text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 16px' }}>
                  {col.label}
                </th>
              ))}
              <th className="border-b border-[rgba(255,255,255,0.07)]" style={{ padding: '10px 16px' }} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} style={{ padding: '48px 16px' }} className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={24} className="text-nw-600" />
                    <span className="text-nw-500 text-sm">No enquiries</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(e => (
                <tr
                  key={e.id}
                  className={`transition-colors hover:bg-[rgba(255,255,255,0.03)] cursor-pointer ${e.status === 'new' ? 'bg-[rgba(212,160,23,0.02)]' : ''}`}
                  onClick={() => setSelected(e)}
                >
                  {visible.has('name') && (
                    <td className="border-b border-[rgba(255,255,255,0.05)] font-medium text-nw-200" style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-2">
                        {e.status === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0" />}
                        {e.name}
                      </div>
                    </td>
                  )}
                  {visible.has('email') && <td className="border-b border-[rgba(255,255,255,0.05)] text-nw-400" style={{ padding: '12px 16px' }}>{e.email}</td>}
                  {visible.has('type') && <td className="border-b border-[rgba(255,255,255,0.05)] text-nw-400" style={{ padding: '12px 16px' }}>{e.enquiry_type}</td>}
                  {visible.has('status') && <td className="border-b border-[rgba(255,255,255,0.05)]" style={{ padding: '12px 16px' }}><Badge variant={statusToBadge(e.status)}>{e.status}</Badge></td>}
                  {visible.has('date') && <td className="border-b border-[rgba(255,255,255,0.05)] text-xs font-medium text-nw-400" style={{ padding: '12px 16px' }}>{format(new Date(e.created_at), 'dd MMM yyyy')}</td>}
                  <td className="border-b border-[rgba(255,255,255,0.05)] text-xs text-nw-500 truncate max-w-[200px]" style={{ padding: '12px 16px' }}>
                    {e.message?.slice(0, 60)}{e.message?.length > 60 ? '…' : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
