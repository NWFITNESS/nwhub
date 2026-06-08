'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { saveBlock, setActiveBlock, deactivateBlock, deleteBlock } from '@/lib/kids/actions'
import { CATEGORY_LABEL, CATEGORY_TIME } from '@/lib/kids/constants'
import type { BlockWithDetails, KidsCategory } from '@/lib/kids/types'

interface Props {
  block: BlockWithDetails
  onOpenPricing: () => void
}

export function BlockSettingsPanel({ block, onOpenPricing }: Props) {
  const [name, setName] = useState(block.name)
  const [startDate, setStartDate] = useState(block.start_date)
  const [sessionCount, setSessionCount] = useState(block.session_count)
  const [isRecurring, setIsRecurring] = useState(block.is_recurring)
  const [isSpecial, setIsSpecial] = useState(block.is_special)
  const [tagline, setTagline] = useState(block.tagline ?? '')
  const [closesAt, setClosesAt] = useState(isoToLocalInput(block.closes_at))
  const [startTime, setStartTime] = useState(block.start_time ?? '')
  const [endTime, setEndTime] = useState(block.end_time ?? '')
  const [description, setDescription] = useState(block.description ?? '')
  const [pending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)

  // Sync local state when the block prop changes (e.g. after revalidatePath
  // re-fetches and the page re-renders with fresh data, OR when the user
  // switches between blocks via the roster tabs).
  useEffect(() => {
    setName(block.name)
    setStartDate(block.start_date)
    setSessionCount(block.session_count)
    setIsRecurring(block.is_recurring)
    setIsSpecial(block.is_special)
    setTagline(block.tagline ?? '')
    setClosesAt(isoToLocalInput(block.closes_at))
    setStartTime(block.start_time ?? '')
    setEndTime(block.end_time ?? '')
    setDescription(block.description ?? '')
  }, [block.id, block.name, block.start_date, block.session_count, block.is_recurring, block.is_special, block.tagline, block.closes_at, block.start_time, block.end_time, block.description])

  function handleSave() {
    startTransition(async () => {
      try {
        await saveBlock({
          id: block.id,
          name,
          start_date: startDate,
          session_count: sessionCount,
          is_recurring: isRecurring,
          is_special: isSpecial,
          tagline: isSpecial ? tagline : null,
          closes_at: isSpecial && closesAt ? new Date(closesAt).toISOString() : null,
          start_time: isSpecial ? startTime || null : null,
          end_time: isSpecial ? endTime || null : null,
          description: isSpecial ? description : null,
        })
        setSavedAt(Date.now())
        setTimeout(() => setSavedAt(null), 2500)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  function handleMakeActive() {
    startTransition(async () => {
      await setActiveBlock(block.id)
    })
  }

  function handleDeactivate() {
    if (!window.confirm(
      `Mark "${block.name}" as inactive? It will stay in your roster history but stop showing on the public website.`,
    )) return
    startTransition(async () => {
      try {
        await deactivateBlock(block.id)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  function handleDelete() {
    if (!window.confirm(
      `Permanently delete "${block.name}"? This removes the block, its sessions and its pricing. Refuses if any bookings exist.`,
    )) return
    startTransition(async () => {
      try {
        await deleteBlock(block.id)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] py-3.5" style={{ paddingLeft: 20, paddingRight: 20 }}>
        <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">
          BLOCK
        </span>
        <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
        <span className="text-[13px] font-medium text-nw-200">Settings</span>
        {block.is_special && (
          <span className="rounded-full border border-[#9b6bff]/40 bg-[#9b6bff]/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.8px] text-[#c4a6ff]">
            Ltd
          </span>
        )}
        {block.is_active ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-[rgba(212,160,23,0.15)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.8px] text-gold-300">
              Active
            </span>
            <button
              onClick={handleDeactivate}
              disabled={pending}
              className="text-[10px] font-medium text-nw-400 hover:text-[#ef4444] transition-colors disabled:opacity-50"
            >
              Deactivate
            </button>
          </div>
        ) : (
          <button
            onClick={handleMakeActive}
            disabled={pending}
            className="ml-auto text-[10px] font-medium text-nw-400 hover:text-gold-300 transition-colors"
          >
            Make active
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4" style={{ padding: 20 }}>
        <Field label="Block name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
          />
        </Field>

        <Field label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
          />
        </Field>

        <div className="flex items-end gap-3">
          <Field label="Sessions" className="flex-1">
            <input
              type="number"
              min={1}
              max={20}
              value={sessionCount}
              onChange={(e) => setSessionCount(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
            />
          </Field>
          <label className="flex items-center gap-2 pb-2.5 text-xs text-nw-300">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 accent-[#c9a70a]"
            />
            Weekly recurring
          </label>
        </div>

        {/* Limited-edition drop */}
        <div
          className="rounded-[8px] border"
          style={{
            padding: 12,
            borderColor: isSpecial ? 'rgba(155,107,255,0.35)' : 'rgba(255,255,255,0.07)',
            background: isSpecial ? 'rgba(155,107,255,0.06)' : 'transparent',
          }}
        >
          <label className="flex items-center gap-2 text-xs text-nw-200">
            <input
              type="checkbox"
              checked={isSpecial}
              onChange={(e) => setIsSpecial(e.target.checked)}
              className="h-4 w-4 accent-[#9b6bff]"
            />
            <span className="font-medium">Limited edition drop</span>
            <span className="text-[10px] text-nw-500">— shows as its own card on the website, alongside the normal block</span>
          </label>

          {isSpecial && (
            <div className="mt-3 flex flex-col gap-3">
              <Field label="Badge label">
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Summer · Ltd"
                  className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-[#9b6bff] focus:outline-none"
                />
              </Field>
              <Field label="Booking closes (optional — drives the countdown)">
                <input
                  type="datetime-local"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-[#9b6bff] focus:outline-none"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start time">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-[#9b6bff] focus:outline-none"
                  />
                </Field>
                <Field label="Finish time">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-[#9b6bff] focus:outline-none"
                  />
                </Field>
              </div>
              <Field label="Description — what's involved">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="e.g. Six weeks of strength &amp; conditioning built for teens — barbell technique, conditioning games and confidence work. All abilities welcome. Bring trainers, water and a positive attitude."
                  className="w-full resize-y rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-[#9b6bff] focus:outline-none"
                />
              </Field>
              <p className="text-[10px] leading-relaxed text-nw-500">
                A limited drop can be active at the same time as your normal block. Set the teens price under <strong className="text-nw-300">Capacity &amp; pricing</strong> — the website card shows the teens price for this drop.
              </p>
            </div>
          )}
        </div>

        {/* Fixed times reference */}
        <div className="mt-1 flex flex-col gap-1.5 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-nw-800/50" style={{ padding: 12 }}>
          <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">
            Fixed session times
          </span>
          {(['minis', 'littles', 'teens'] as KidsCategory[]).map((cat) => (
            <div key={cat} className="flex items-center justify-between text-xs">
              <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[10px] font-medium text-nw-200">
                {CATEGORY_LABEL[cat]}
              </span>
              <span className="text-nw-400">{CATEGORY_TIME[cat]}</span>
            </div>
          ))}
        </div>

        <div className="mt-1 flex flex-wrap gap-2">
          <Button variant="gold" size="md" onClick={handleSave} loading={pending} className="flex-1 min-w-[120px]">
            {savedAt ? 'Saved ✓' : 'Save block'}
          </Button>
          <Button variant="default" size="md" onClick={onOpenPricing}>
            Capacity &amp; pricing
          </Button>
          <Button variant="danger" size="md" onClick={handleDelete} disabled={pending}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Convert a stored ISO timestamp to the `YYYY-MM-DDTHH:mm` shape that a
 * <input type="datetime-local"> expects, in the admin's LOCAL wall-clock time.
 * Returns '' for null so the input renders empty.
 */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-[1.3px] text-nw-400">{label}</span>
      {children}
    </label>
  )
}
