'use client'

import { useEffect, useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_LABEL, CATEGORY_TIME, CATEGORY_BADGE, ageFromDob } from '@/lib/kids/constants'
import { markAttendance, batchMarkAttendance, fetchRegisterData } from '@/lib/kids/actions'
import type { AttendanceStatus, BlockWithDetails, KidsCategory, KidsSession, RegisterRow } from '@/lib/kids/types'

interface Props {
  blocks: BlockWithDetails[]
  initialBlockId: string | null
}

const CATEGORIES: KidsCategory[] = ['minis', 'littles', 'teens']

export default function RegisterPageClient({ blocks, initialBlockId }: Props) {
  const router = useRouter()
  const [activeBlockId, setActiveBlockId] = useState(initialBlockId)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<KidsCategory>('minis')
  const [register, setRegister] = useState<Record<KidsCategory, RegisterRow[]>>({ minis: [], littles: [], teens: [] })
  const [loadingRegister, setLoadingRegister] = useState(false)
  const [pending, startTransition] = useTransition()

  const activeBlock = blocks.find((b) => b.id === activeBlockId) ?? null
  const sessions = activeBlock?.sessions.filter((s) => !s.is_break).sort((a, b) => a.session_number - b.session_number) ?? []

  // Auto-select closest session to today
  useEffect(() => {
    if (!sessions.length) return
    const today = new Date().toISOString().slice(0, 10)
    const closest = sessions.reduce((best, s) => {
      const diff = Math.abs(new Date(s.session_date).getTime() - new Date(today).getTime())
      const bestDiff = Math.abs(new Date(best.session_date).getTime() - new Date(today).getTime())
      return diff < bestDiff ? s : best
    }, sessions[0])
    setSelectedSessionId(closest.id)
  }, [activeBlockId])

  // Fetch register data when session changes
  const fetchRegister = useCallback(async () => {
    if (!selectedSessionId || !activeBlockId) return
    setLoadingRegister(true)
    try {
      const data = await fetchRegisterData(selectedSessionId, activeBlockId)
      setRegister(data)
    } catch {
      // fetch failed
    }
    setLoadingRegister(false)
  }, [selectedSessionId, activeBlockId])

  useEffect(() => { fetchRegister() }, [fetchRegister])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRegister()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchRegister])

  const currentRows = register[selectedCategory] ?? []
  const presentCount = currentRows.filter((r) => r.status === 'present' || r.status === 'late').length

  function handleToggle(row: RegisterRow) {
    const nextStatus: AttendanceStatus = row.status === 'present' ? 'absent' : row.status === 'late' ? 'absent' : 'present'
    startTransition(async () => {
      await markAttendance({
        session_id: selectedSessionId!,
        child_id: row.child_id,
        booking_type: row.booking_type,
        booking_id: row.booking_id,
        status: nextStatus,
      })
      await fetchRegister()
    })
  }

  function handleMarkLate(row: RegisterRow) {
    startTransition(async () => {
      await markAttendance({
        session_id: selectedSessionId!,
        child_id: row.child_id,
        booking_type: row.booking_type,
        booking_id: row.booking_id,
        status: 'late',
      })
      await fetchRegister()
    })
  }

  function handleMarkAllPresent() {
    if (!selectedSessionId) return
    const unmarked = currentRows.filter((r) => r.status !== 'present')
    if (!unmarked.length) return
    startTransition(async () => {
      await batchMarkAttendance({
        session_id: selectedSessionId,
        marks: unmarked.map((r) => ({
          child_id: r.child_id,
          booking_type: r.booking_type,
          booking_id: r.booking_id,
          status: 'present',
        })),
      })
      await fetchRegister()
    })
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '24px 28px 0' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#967705]">Kids & Teens</p>
        <h1 className="text-2xl font-bold text-white" style={{ marginTop: 4 }}>Session Register</h1>

        {/* Block selector (if multiple blocks) */}
        {blocks.length > 1 && (
          <div className="flex gap-2" style={{ marginTop: 16 }}>
            {blocks.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBlockId(b.id)}
                className={`rounded-lg text-xs font-medium transition-colors ${
                  b.id === activeBlockId
                    ? 'bg-[#967705] text-black'
                    : 'bg-[rgba(255,255,255,0.06)] text-white/60 hover:text-white/90'
                }`}
                style={{ padding: '6px 14px' }}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {!activeBlock ? (
        <div style={{ padding: '48px 28px' }} className="text-center text-sm text-white/40">
          No blocks found. Create one from the Kids dashboard.
        </div>
      ) : (
        <>
          {/* Session tabs */}
          <div className="flex gap-2 overflow-x-auto" style={{ padding: '20px 28px 0' }}>
            {sessions.map((s) => {
              const date = new Date(s.session_date)
              const label = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
              const isSelected = s.id === selectedSessionId
              const isPast = date < new Date(new Date().toDateString())
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`flex-shrink-0 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-white text-black'
                      : isPast
                        ? 'bg-[rgba(255,255,255,0.04)] text-white/30 hover:text-white/50'
                        : 'bg-[rgba(255,255,255,0.06)] text-white/60 hover:text-white/90'
                  }`}
                  style={{ padding: '8px 14px' }}
                >
                  <div>{label}</div>
                  <div className="text-[10px] opacity-60">Wk {s.session_number}</div>
                </button>
              )
            })}
          </div>

          {/* Category tabs */}
          <div className="flex gap-2" style={{ padding: '16px 28px 0' }}>
            {CATEGORIES.map((cat) => {
              const count = (register[cat] ?? []).length
              const isSelected = cat === selectedCategory
              const badge = CATEGORY_BADGE[cat]
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg text-xs font-semibold transition-all ${
                    isSelected ? 'ring-1 ring-white/30' : 'hover:opacity-100'
                  }`}
                  style={{
                    padding: '8px 16px',
                    background: badge.bg,
                    color: badge.fg,
                    opacity: isSelected ? 1 : 0.55,
                  }}
                >
                  {CATEGORY_LABEL[cat]} · {CATEGORY_TIME[cat]}
                  {count > 0 && (
                    <span className="ml-2 rounded-full text-[10px] font-bold" style={{ padding: '1px 6px', background: 'rgba(0,0,0,0.15)' }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Summary bar + actions */}
          <div className="flex items-center justify-between" style={{ padding: '16px 28px' }}>
            <div className="text-sm text-white/50">
              {selectedSession && (
                <span>
                  {new Date(selectedSession.session_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {' — '}
                </span>
              )}
              <span className="font-semibold text-white">{presentCount}</span> / {currentRows.length} present
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchRegister()}
                disabled={loadingRegister}
                className="rounded-lg bg-[rgba(255,255,255,0.06)] text-xs font-medium text-white/60 hover:text-white/90 transition-colors disabled:opacity-40"
                style={{ padding: '6px 12px' }}
              >
                {loadingRegister ? 'Refreshing…' : 'Refresh'}
              </button>
              <button
                onClick={handleMarkAllPresent}
                disabled={pending || !currentRows.length}
                className="rounded-lg bg-[rgba(74,222,128,0.12)] text-xs font-semibold text-[#22c55e] hover:bg-[rgba(74,222,128,0.2)] transition-colors disabled:opacity-40"
                style={{ padding: '6px 14px' }}
              >
                Mark all present
              </button>
            </div>
          </div>

          {/* Attendance list */}
          <div style={{ padding: '0 28px 28px' }}>
            <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
              {loadingRegister && !currentRows.length ? (
                <div className="text-center text-sm text-white/30" style={{ padding: '48px 20px' }}>
                  Loading register…
                </div>
              ) : currentRows.length === 0 ? (
                <div className="text-center text-sm text-white/30" style={{ padding: '48px 20px' }}>
                  No children booked for this session in {CATEGORY_LABEL[selectedCategory]}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 16px' }}>Child</th>
                      <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 16px' }}>Age</th>
                      <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 16px' }}>Type</th>
                      <th className="text-right text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 16px' }}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row) => (
                      <tr
                        key={`${row.child_id}-${row.booking_type}-${row.booking_id}`}
                        className="border-b border-[rgba(255,255,255,0.04)] last:border-0 transition-colors"
                        style={{ background: row.status === 'present' ? 'rgba(74,222,128,0.04)' : row.status === 'late' ? 'rgba(245,158,11,0.04)' : undefined }}
                      >
                        <td className="font-medium text-nw-100" style={{ padding: '12px 16px' }}>
                          {row.child_name}
                        </td>
                        <td className="text-xs text-nw-400" style={{ padding: '12px 16px' }}>
                          {row.date_of_birth ? `${ageFromDob(row.date_of_birth)}y` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <BookingTypeBadge type={row.booking_type} />
                        </td>
                        <td className="text-right" style={{ padding: '8px 16px' }}>
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => handleToggle(row)}
                              disabled={pending}
                              className={`rounded-md text-[11px] font-semibold transition-all ${
                                row.status === 'present'
                                  ? 'bg-[#22c55e] text-black'
                                  : 'bg-[rgba(255,255,255,0.06)] text-white/40 hover:text-white/70'
                              }`}
                              style={{ padding: '5px 12px' }}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleMarkLate(row)}
                              disabled={pending}
                              className={`rounded-md text-[11px] font-semibold transition-all ${
                                row.status === 'late'
                                  ? 'bg-[#f59e0b] text-black'
                                  : 'bg-[rgba(255,255,255,0.06)] text-white/40 hover:text-white/70'
                              }`}
                              style={{ padding: '5px 10px' }}
                            >
                              Late
                            </button>
                            {(row.status === 'present' || row.status === 'late') && (
                              <button
                                onClick={() => {
                                  startTransition(async () => {
                                    await markAttendance({
                                      session_id: selectedSessionId!,
                                      child_id: row.child_id,
                                      booking_type: row.booking_type,
                                      booking_id: row.booking_id,
                                      status: 'absent',
                                    })
                                    await fetchRegister()
                                  })
                                }}
                                disabled={pending}
                                className="rounded-md bg-[rgba(255,255,255,0.06)] text-[11px] font-medium text-white/30 hover:text-[#ef4444] transition-colors"
                                style={{ padding: '5px 8px' }}
                              >
                                ✗
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function BookingTypeBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    block: { bg: 'rgba(150,119,5,0.15)', color: '#c9a70a', label: 'Block' },
    dropin: { bg: 'rgba(255,107,80,0.12)', color: '#ff8a6e', label: 'Drop-in' },
    trial: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', label: 'Trial' },
  }
  const s = styles[type] ?? styles.block
  return (
    <span
      className="rounded-full text-[10px] font-semibold"
      style={{ padding: '2px 8px', background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}
