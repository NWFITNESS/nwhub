'use client'

import { useState, useMemo, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { setTrialStatus, deleteTrial } from '@/lib/kids/actions'
import { CATEGORY_LABEL } from '@/lib/kids/constants'
import { TrialModal } from './TrialModal'
import type { BlockWithDetails, TrialRow, TrialStatus } from '@/lib/kids/types'

type TrialFilter = 'all' | 'pending' | 'converted'

interface Props {
  trials: TrialRow[]
  blocks: BlockWithDetails[]
}

export function TrialsSection({ trials, blocks }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [filter, setFilter] = useState<TrialFilter>('all')
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    if (filter === 'all') return trials
    if (filter === 'converted') return trials.filter((t) => t.converted)
    // 'pending' = attended or confirmed but NOT converted
    return trials.filter((t) => !t.converted && (t.status === 'attended' || t.status === 'confirmed'))
  }, [trials, filter])

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
        <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(255,255,255,0.07)] py-3.5" style={{ paddingLeft: 20, paddingRight: 20 }}>
          <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">FREE TRIALS</span>
          <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
          <span className="text-[13px] font-medium text-nw-200">Trial bookings</span>
          <div className="flex gap-1.5 ml-4">
            {(['all', 'pending', 'converted'] as TrialFilter[]).map((f) => {
              const labels: Record<TrialFilter, string> = { all: 'All', pending: 'Not yet booked', converted: 'Converted' }
              const isActive = filter === f
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors"
                  style={{
                    background: isActive ? 'rgba(201,167,10,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#C9A70A' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {labels[f]}
                </button>
              )
            })}
          </div>
          <Button variant="gold" size="sm" onClick={() => setCreateOpen(true)} className="ml-auto">
            + New trial
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-nw-500" style={{ paddingLeft: 20, paddingRight: 20 }}>
            {filter === 'all'
              ? <>No trial bookings yet. Click <span className="text-gold-300">+ New trial</span> to add one manually or share <span className="text-gold-300">/kids-teens/trial</span> with parents.</>
              : filter === 'pending'
                ? 'No pending trials — everyone has converted or was cancelled.'
                : 'No converted trials yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                  <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Child</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Cat.</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Parent</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Session</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Source</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Status</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Conversion</th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="font-medium text-nw-100" style={{ padding: '12px 12px' }}>{t.child_name}</td>
                    <td className="text-xs text-nw-400" style={{ padding: '12px 12px' }}>{CATEGORY_LABEL[t.category]}</td>
                    <td className="text-xs text-nw-400" style={{ padding: '12px 12px' }}>
                      {t.parent_name}
                      <div className="text-[10px] text-nw-500">{t.parent_email}</div>
                    </td>
                    <td className="text-xs text-nw-400" style={{ padding: '12px 12px' }}>
                      {t.session_date
                        ? new Date(t.session_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                        : <span className="text-nw-600">—</span>}
                    </td>
                    <td className="text-xs text-nw-500" style={{ padding: '12px 12px' }}>{t.source === 'admin' ? 'NWHub' : 'Website'}</td>
                    <td style={{ padding: '12px 12px' }}><StatusPill status={t.status} /></td>
                    <td style={{ padding: '12px 12px' }}><ConversionPill converted={t.converted} status={t.status} /></td>
                    <td className="text-right" style={{ padding: '12px 12px' }}>
                      <div className="flex justify-end gap-2">
                        {t.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(t.id, 'attended', t.child_name)}
                              disabled={pending}
                              className="text-[11px] font-medium text-nw-400 hover:text-[#22c55e] disabled:opacity-50 transition-colors"
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
                              className="text-[11px] font-medium text-nw-400 hover:text-[#ef4444] disabled:opacity-50 transition-colors"
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
                            className="text-[11px] font-medium text-nw-500 hover:text-[#ef4444] disabled:opacity-50 transition-colors"
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
    confirmed: { label: 'Confirmed', bg: 'rgba(59,130,246,0.12)',  fg: '#3b82f6' },
    attended:  { label: 'Attended',  bg: 'rgba(74,222,128,0.12)',  fg: '#22c55e' },
    no_show:   { label: 'No-show',   bg: 'rgba(245,158,11,0.12)',  fg: '#f59e0b' },
    cancelled: { label: 'Cancelled', bg: 'rgba(248,113,113,0.12)', fg: '#ef4444' },
  }
  const s = map[status]
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  )
}

function ConversionPill({ converted, status }: { converted: boolean; status: TrialStatus }) {
  if (status === 'cancelled' || status === 'no_show') {
    return <span className="text-[10px] text-nw-600">—</span>
  }
  if (converted) {
    return (
      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(74,222,128,0.12)', color: '#22c55e' }}>
        Booked
      </span>
    )
  }
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
      Not yet
    </span>
  )
}

