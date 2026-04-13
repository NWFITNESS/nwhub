'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { setTrialStatus, deleteTrial } from '@/lib/kids/actions'
import { CATEGORY_LABEL } from '@/lib/kids/constants'
import { TrialModal } from './TrialModal'
import type { BlockWithDetails, TrialRow, TrialStatus } from '@/lib/kids/types'

interface Props {
  trials: TrialRow[]
  blocks: BlockWithDetails[]
}

export function TrialsSection({ trials, blocks }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleStatusChange(trialId: string, status: TrialStatus, childName: string) {
    if (status === 'cancelled' && !window.confirm(`Cancel ${childName}'s trial?`)) return
    startTransition(async () => {
      try {
        await setTrialStatus(trialId, status)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  function handleDelete(trialId: string, childName: string) {
    if (!window.confirm(`Permanently delete ${childName}'s trial entry? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteTrial(trialId)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
        <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[11px]">
          <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">FREE TRIALS</span>
          <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
          <span className="text-[13px] font-medium text-nw-200">Trial bookings</span>
          <Button variant="gold" size="sm" onClick={() => setCreateOpen(true)} className="ml-auto">
            + New trial
          </Button>
        </div>

        {trials.length === 0 ? (
          <div className="px-[17px] py-12 text-center text-xs text-nw-500">
            No trial bookings yet. Click <span className="text-gold-300">+ New trial</span> to add one manually
            or share <span className="text-gold-300">/kids-teens/trial</span> with parents.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Child</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Cat.</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Parent</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Session</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Source</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Status</th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((t) => (
                  <tr key={t.id} className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-3 py-3 font-medium text-nw-100">{t.child_name}</td>
                    <td className="px-3 py-3 text-xs text-nw-400">{CATEGORY_LABEL[t.category]}</td>
                    <td className="px-3 py-3 text-xs text-nw-400">
                      {t.parent_name}
                      <div className="text-[10px] text-nw-500">{t.parent_email}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-nw-400">
                      {t.session_date
                        ? new Date(t.session_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                        : <span className="text-nw-600">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-nw-500">{t.source === 'admin' ? 'NWHub' : 'Website'}</td>
                    <td className="px-3 py-3"><StatusPill status={t.status} /></td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {t.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(t.id, 'attended', t.child_name)}
                              disabled={pending}
                              className="text-[11px] font-medium text-nw-400 hover:text-[#4ade80] disabled:opacity-50 transition-colors"
                              title="Mark attended"
                            >
                              Attended
                            </button>
                            <button
                              onClick={() => handleStatusChange(t.id, 'no_show', t.child_name)}
                              disabled={pending}
                              className="text-[11px] font-medium text-nw-400 hover:text-[#f59e0b] disabled:opacity-50 transition-colors"
                              title="Mark no-show"
                            >
                              No-show
                            </button>
                            <button
                              onClick={() => handleStatusChange(t.id, 'cancelled', t.child_name)}
                              disabled={pending}
                              className="text-[11px] font-medium text-nw-400 hover:text-[#f87171] disabled:opacity-50 transition-colors"
                              title="Cancel trial"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {t.status !== 'confirmed' && (
                          <button
                            onClick={() => handleDelete(t.id, t.child_name)}
                            disabled={pending}
                            className="text-[11px] font-medium text-nw-500 hover:text-[#f87171] disabled:opacity-50 transition-colors"
                            title="Delete entry"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TrialModal open={createOpen} onClose={() => setCreateOpen(false)} blocks={blocks} />
    </>
  )
}

function StatusPill({ status }: { status: TrialStatus }) {
  const map: Record<TrialStatus, { label: string; bg: string; fg: string }> = {
    confirmed: { label: 'Confirmed', bg: 'rgba(59,130,246,0.12)',  fg: '#60a5fa' },
    attended:  { label: 'Attended',  bg: 'rgba(74,222,128,0.12)',  fg: '#4ade80' },
    no_show:   { label: 'No-show',   bg: 'rgba(245,158,11,0.12)',  fg: '#f59e0b' },
    cancelled: { label: 'Cancelled', bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
  }
  const s = map[status]
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  )
}

