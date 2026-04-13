'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { setSessionBreak } from '@/lib/kids/actions'
import type { BlockWithDetails } from '@/lib/kids/types'

interface Props {
  block: BlockWithDetails
}

export function SessionScheduler({ block }: Props) {
  const [adding, setAdding] = useState(false)
  const [pickedSessionId, setPickedSessionId] = useState<string>('')
  const [breakLabel, setBreakLabel] = useState('')
  const [pending, startTransition] = useTransition()

  const sessions = [...block.sessions].sort((a, b) => a.session_number - b.session_number)
  const nonBreakSessions = sessions.filter((s) => !s.is_break)

  function fmt(date: string) {
    return new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function handleMarkBreak() {
    if (!pickedSessionId) return
    startTransition(async () => {
      try {
        await setSessionBreak(pickedSessionId, true, breakLabel.trim() || null)
        setAdding(false)
        setPickedSessionId('')
        setBreakLabel('')
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  function handleUnmark(sessionId: string) {
    startTransition(async () => {
      try {
        await setSessionBreak(sessionId, false, null)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] py-3.5" style={{ paddingLeft: 20, paddingRight: 20 }}>
        <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">SESSIONS</span>
        <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
        <span className="text-[13px] font-medium text-nw-200">Session dates</span>
        <button
          onClick={() => setAdding(!adding)}
          className="ml-auto inline-flex items-center gap-1 rounded-[6px] border border-[rgba(255,107,80,0.4)] bg-[rgba(255,107,80,0.08)] px-2.5 py-1 text-[11px] font-medium text-[#ff8a6e] hover:bg-[rgba(255,107,80,0.14)] transition-colors"
        >
          {adding ? 'Cancel' : '+ Add break'}
        </button>
      </div>

      <div style={{ padding: 20 }}>
        <div className="flex flex-wrap gap-2">
          {sessions.map((s) =>
            s.is_break ? (
              <div
                key={s.id}
                className="inline-flex items-center gap-2 rounded-[8px] border border-[rgba(255,107,80,0.4)] bg-[#FAECE7]/10 px-3 py-1.5 text-xs"
              >
                <span className="text-[#ff8a6e]">⏸</span>
                <span className="text-nw-100">{fmt(s.session_date)}</span>
                {s.break_label && <span className="text-nw-400">· {s.break_label}</span>}
                <button
                  onClick={() => handleUnmark(s.id)}
                  className="ml-1 text-nw-400 hover:text-white transition-colors"
                  title="Unmark break"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                key={s.id}
                className="inline-flex items-center gap-2 rounded-[8px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-1.5 text-xs text-nw-200"
              >
                <span>{fmt(s.session_date)}</span>
                <span className="text-nw-500">· Session {s.session_number}</span>
              </div>
            ),
          )}
        </div>

        {/* Inline add-break panel */}
        {adding && (
          <div className="mt-4 rounded-[8px] border border-[rgba(255,107,80,0.3)] bg-[rgba(255,107,80,0.04)]" style={{ padding: 12 }}>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[9px] font-semibold uppercase tracking-[1.1px] text-nw-400">Session</span>
                <select
                  value={pickedSessionId}
                  onChange={(e) => setPickedSessionId(e.target.value)}
                  className="rounded-[6px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-2 py-1.5 text-xs text-nw-100"
                >
                  <option value="">Pick a session…</option>
                  {nonBreakSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {fmt(s.session_date)} · Session {s.session_number}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[9px] font-semibold uppercase tracking-[1.1px] text-nw-400">Break label (optional)</span>
                <input
                  type="text"
                  value={breakLabel}
                  onChange={(e) => setBreakLabel(e.target.value)}
                  placeholder="e.g. Half term"
                  className="rounded-[6px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-2 py-1.5 text-xs text-nw-100"
                />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-nw-500">
                Break sessions appear on the website as no session and don&apos;t count toward the block total parents see.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                <button
                  onClick={handleMarkBreak}
                  disabled={!pickedSessionId || pending}
                  className="rounded-[6px] border border-[rgba(255,107,80,0.5)] bg-[rgba(255,107,80,0.18)] px-3 py-1.5 text-xs font-medium text-[#ff8a6e] hover:bg-[rgba(255,107,80,0.28)] disabled:opacity-50 transition-colors"
                >
                  Mark break
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
