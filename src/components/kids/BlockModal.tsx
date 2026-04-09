'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { saveBlock, saveBlockPricing } from '@/lib/kids/actions'
import { CATEGORY_LABEL } from '@/lib/kids/constants'
import type { KidsCategory } from '@/lib/kids/types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (blockId: string) => void
}

export function BlockModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7) // next Saturday
    return d.toISOString().slice(0, 10)
  })
  const [sessionCount, setSessionCount] = useState(6)
  const [isRecurring, setIsRecurring] = useState(true)
  const [pricing, setPricing] = useState<Record<KidsCategory, { capacity: number; price: number }>>({
    minis:   { capacity: 12, price: 45 },
    littles: { capacity: 12, price: 45 },
    teens:   { capacity: 12, price: 50 },
  })
  const [pending, startTransition] = useTransition()

  function handleCreate() {
    if (!name.trim()) {
      alert('Block name is required')
      return
    }
    startTransition(async () => {
      try {
        const { id } = await saveBlock({
          name: name.trim(),
          start_date: startDate,
          session_count: sessionCount,
          is_recurring: isRecurring,
        })
        await saveBlockPricing(id, (['minis', 'littles', 'teens'] as KidsCategory[]).map((cat) => ({
          category: cat,
          capacity: pricing[cat].capacity,
          price_pence: Math.round(pricing[cat].price * 100),
        })))
        onCreated?.(id)
        onClose()
        // Reset
        setName('')
        setSessionCount(6)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="New block" width="lg">
      <div className="flex flex-col gap-4">
        <Field label="Block name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Block 5 — Summer 2026"
            className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
            />
          </Field>
          <Field label="Sessions">
            <input
              type="number"
              min={1}
              max={20}
              value={sessionCount}
              onChange={(e) => setSessionCount(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-xs text-nw-300">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 accent-[#d4a017]"
          />
          Weekly recurring
        </label>

        <div className="mt-2 rounded-[8px] border border-[rgba(255,255,255,0.07)] p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">
            Capacity & pricing
          </div>
          <div className="flex flex-col gap-2">
            {(['minis', 'littles', 'teens'] as KidsCategory[]).map((cat) => (
              <div key={cat} className="grid grid-cols-[1fr_90px_90px] items-center gap-2">
                <span className="text-xs text-nw-200">{CATEGORY_LABEL[cat]}</span>
                <input
                  type="number"
                  min={1}
                  value={pricing[cat].capacity}
                  onChange={(e) => setPricing({ ...pricing, [cat]: { ...pricing[cat], capacity: Number(e.target.value) } })}
                  className="rounded-[6px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-2 py-1 text-xs text-nw-100"
                  placeholder="cap"
                />
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-nw-500">£</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={pricing[cat].price}
                    onChange={(e) => setPricing({ ...pricing, [cat]: { ...pricing[cat], price: Number(e.target.value) } })}
                    className="w-full rounded-[6px] border border-[rgba(255,255,255,0.09)] bg-nw-800 pl-5 pr-2 py-1 text-xs text-nw-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="gold" size="md" onClick={handleCreate} loading={pending}>Create block</Button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">{label}</span>
      {children}
    </label>
  )
}
