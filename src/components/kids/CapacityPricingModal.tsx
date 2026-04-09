'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { saveBlockPricing } from '@/lib/kids/actions'
import { CATEGORY_LABEL } from '@/lib/kids/constants'
import type { BlockWithDetails, KidsCategory } from '@/lib/kids/types'

interface Props {
  open: boolean
  onClose: () => void
  block: BlockWithDetails
}

export function CapacityPricingModal({ open, onClose, block }: Props) {
  const initial: Record<KidsCategory, { capacity: number; price: number; stripe_price_id: string }> = {
    minis:   { capacity: 12, price: 45, stripe_price_id: '' },
    littles: { capacity: 12, price: 45, stripe_price_id: '' },
    teens:   { capacity: 12, price: 50, stripe_price_id: '' },
  }
  for (const p of block.pricing) {
    initial[p.category] = {
      capacity: p.capacity,
      price: p.price_pence / 100,
      stripe_price_id: p.stripe_price_id ?? '',
    }
  }

  const [rows, setRows] = useState(initial)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      try {
        await saveBlockPricing(
          block.id,
          (['minis', 'littles', 'teens'] as KidsCategory[]).map((cat) => ({
            category: cat,
            capacity: rows[cat].capacity,
            price_pence: Math.round(rows[cat].price * 100),
            stripe_price_id: rows[cat].stripe_price_id || null,
          })),
        )
        onClose()
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Capacity & pricing" width="lg">
      <div className="flex flex-col gap-3">
        {(['minis', 'littles', 'teens'] as KidsCategory[]).map((cat) => (
          <div key={cat} className="rounded-[8px] border border-[rgba(255,255,255,0.07)] p-3">
            <div className="mb-2 text-xs font-medium text-nw-200">{CATEGORY_LABEL[cat]}</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[9px] font-semibold uppercase tracking-[1.1px] text-nw-500">Capacity</span>
                <input
                  type="number"
                  min={1}
                  value={rows[cat].capacity}
                  onChange={(e) => setRows({ ...rows, [cat]: { ...rows[cat], capacity: Number(e.target.value) } })}
                  className="rounded-[6px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-2 py-1 text-xs text-nw-100"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[9px] font-semibold uppercase tracking-[1.1px] text-nw-500">Price (£)</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={rows[cat].price}
                  onChange={(e) => setRows({ ...rows, [cat]: { ...rows[cat], price: Number(e.target.value) } })}
                  className="rounded-[6px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-2 py-1 text-xs text-nw-100"
                />
              </label>
            </div>
            <label className="mt-2 flex flex-col gap-1">
              <span className="text-[9px] font-semibold uppercase tracking-[1.1px] text-nw-500">Stripe price ID (optional)</span>
              <input
                type="text"
                value={rows[cat].stripe_price_id}
                onChange={(e) => setRows({ ...rows, [cat]: { ...rows[cat], stripe_price_id: e.target.value } })}
                placeholder="price_..."
                className="rounded-[6px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-2 py-1 text-xs font-mono text-nw-100"
              />
            </label>
          </div>
        ))}

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="gold" size="md" onClick={handleSave} loading={pending}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}
