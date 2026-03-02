'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { format } from 'date-fns'
import type { KidsRegistration } from '@/lib/types'

interface Props {
  initialRegistrations: KidsRegistration[]
}

export function KidsTable({ initialRegistrations }: Props) {
  const [selected, setSelected] = useState<KidsRegistration | null>(null)

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              {['Parent', 'Email', 'Children', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialRegistrations.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30">No registrations yet</td></tr>
            ) : (
              initialRegistrations.map((reg) => (
                <tr
                  key={reg.id}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelected(reg)}
                >
                  <td className="px-4 py-3 font-medium text-white">{reg.parent.name}</td>
                  <td className="px-4 py-3 text-white/60">{reg.parent.email}</td>
                  <td className="px-4 py-3 text-white/60">
                    {Array.isArray(reg.children) ? reg.children.length : 0} child{Array.isArray(reg.children) && reg.children.length !== 1 ? 'ren' : ''}
                  </td>
                  <td className="px-4 py-3"><Badge variant="active">{reg.status}</Badge></td>
                  <td className="px-4 py-3 text-white/40 text-xs">{format(new Date(reg.created_at), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(reg) }}>View</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Registration Details" width="xl">
          <div className="space-y-5 text-sm">
            <div>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Parent / Guardian</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-white/40 text-xs">Name</p><p className="text-white">{selected.parent.name}</p></div>
                <div><p className="text-white/40 text-xs">Email</p><p className="text-[#c9a70a]">{selected.parent.email}</p></div>
                <div><p className="text-white/40 text-xs">Phone</p><p className="text-white">{selected.parent.phone}</p></div>
                {selected.parent.address && <div><p className="text-white/40 text-xs">Address</p><p className="text-white">{selected.parent.address}</p></div>}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Emergency Contact</h4>
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-white/40 text-xs">Name</p><p className="text-white">{selected.emergency.name}</p></div>
                <div><p className="text-white/40 text-xs">Phone</p><p className="text-white">{selected.emergency.phone}</p></div>
                <div><p className="text-white/40 text-xs">Relationship</p><p className="text-white">{selected.emergency.relationship}</p></div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Children ({Array.isArray(selected.children) ? selected.children.length : 0})</h4>
              <div className="space-y-2">
                {Array.isArray(selected.children) && selected.children.map((child, i) => (
                  <div key={i} className="bg-[#111] rounded-lg p-3 grid grid-cols-3 gap-2">
                    <div><p className="text-white/40 text-xs">Name</p><p className="text-white">{child.name}</p></div>
                    <div><p className="text-white/40 text-xs">DOB</p><p className="text-white">{child.dob}</p></div>
                    <div><p className="text-white/40 text-xs">Group</p><p className="text-white">{child.group}</p></div>
                    {child.medical && <div className="col-span-3"><p className="text-white/40 text-xs">Medical Notes</p><p className="text-white">{child.medical}</p></div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4 pt-2 border-t border-white/10">
              <label className="flex items-center gap-2 text-xs text-white/50">
                <span className={`w-4 h-4 rounded border ${selected.first_aid_consent ? 'bg-green-500 border-green-500' : 'border-white/20'}`} />
                First Aid Consent
              </label>
              <label className="flex items-center gap-2 text-xs text-white/50">
                <span className={`w-4 h-4 rounded border ${selected.waiver_accepted ? 'bg-green-500 border-green-500' : 'border-white/20'}`} />
                Waiver Accepted
              </label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
