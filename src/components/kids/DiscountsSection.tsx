'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { saveDiscount, toggleDiscount, deleteDiscount } from '@/lib/kids/actions'
import { formatPence } from '@/lib/kids/constants'
import type { KidsDiscount, DiscountType } from '@/lib/kids/types'

interface Props {
  discounts: KidsDiscount[]
}

export function DiscountsSection({ discounts }: Props) {
  const [editing, setEditing] = useState<KidsDiscount | null>(null)
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleToggle(d: KidsDiscount) {
    startTransition(async () => {
      try {
        await toggleDiscount(d.id, !d.is_active)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  function handleDelete(d: KidsDiscount) {
    if (!window.confirm(`Delete discount "${d.code}"? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteDiscount(d.id)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
        <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] py-3.5" style={{ paddingLeft: 20, paddingRight: 20 }}>
          <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">DISCOUNTS</span>
          <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
          <span className="text-[13px] font-medium text-nw-200">Discount codes &amp; offers</span>
          <Button variant="gold" size="sm" onClick={() => setCreating(true)} className="ml-auto">
            + New discount
          </Button>
        </div>

        {discounts.length === 0 ? (
          <div className="py-12 text-center text-xs text-nw-500" style={{ paddingLeft: 20, paddingRight: 20 }}>
            No discounts yet. Click <span className="text-gold-300">+ New discount</span> to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Code</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Description</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Value</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Min kids</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Uses</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Status</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id} className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-3 py-3 font-medium text-nw-100">
                      <span className="font-mono text-xs">{d.code}</span>
                      {d.auto_apply && (
                        <span className="ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
                          AUTO
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-nw-400 max-w-[200px] truncate">{d.description}</td>
                    <td className="px-3 py-3 text-xs text-nw-300 font-medium">
                      {d.discount_type === 'percentage' ? `${d.value}%` : formatPence(d.value)}
                    </td>
                    <td className="px-3 py-3 text-xs text-nw-400">{d.min_children}</td>
                    <td className="px-3 py-3 text-xs text-nw-400">
                      {d.times_used}{d.max_uses != null ? ` / ${d.max_uses}` : ''}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleToggle(d)}
                        disabled={pending}
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold disabled:opacity-50 transition-colors"
                        style={{
                          background: d.is_active ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                          color: d.is_active ? '#4ade80' : '#f87171',
                        }}
                      >
                        {d.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(d)}
                          disabled={pending}
                          className="text-[11px] font-medium text-nw-400 hover:text-gold-300 disabled:opacity-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          disabled={pending}
                          className="text-[11px] font-medium text-nw-400 hover:text-[#f87171] disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(creating || editing) && (
        <DiscountModal
          discount={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
        />
      )}
    </>
  )
}

// ─── Inline modal for create/edit ─────────────────────────────────────────

function DiscountModal({ discount, onClose }: { discount: KidsDiscount | null; onClose: () => void }) {
  const isEdit = !!discount
  const [code, setCode] = useState(discount?.code ?? '')
  const [description, setDescription] = useState(discount?.description ?? '')
  const [discountType, setDiscountType] = useState<DiscountType>(discount?.discount_type ?? 'percentage')
  const [value, setValue] = useState(discount?.value ?? 10)
  const [isActive, setIsActive] = useState(discount?.is_active ?? true)
  const [validFrom, setValidFrom] = useState(discount?.valid_from?.slice(0, 10) ?? '')
  const [validUntil, setValidUntil] = useState(discount?.valid_until?.slice(0, 10) ?? '')
  const [maxUses, setMaxUses] = useState<string>(discount?.max_uses?.toString() ?? '')
  const [minChildren, setMinChildren] = useState(discount?.min_children ?? 1)
  const [autoApply, setAutoApply] = useState(discount?.auto_apply ?? false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        await saveDiscount({
          id: discount?.id,
          code,
          description,
          discount_type: discountType,
          value,
          is_active: isActive,
          valid_from: validFrom || null,
          valid_until: validUntil || null,
          max_uses: maxUses ? parseInt(maxUses, 10) : null,
          min_children: minChildren,
          auto_apply: autoApply,
        })
        onClose()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  const labelCls = 'text-[11px] font-semibold uppercase tracking-[1px] text-nw-500'
  const inputCls = 'w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-nw-800 px-3 py-2 text-sm text-nw-100 outline-none focus:border-gold-400/40'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750" style={{ padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-nw-100 mb-4">
          {isEdit ? 'Edit discount' : 'New discount'}
        </h3>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label className={labelCls}>Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20"
              className={inputCls}
            />
          </div>

          <div className="grid gap-1.5">
            <label className={labelCls}>Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Summer holiday 20% off"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className={labelCls}>Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className={inputCls}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount (pence)</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className={labelCls}>Value</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                min={1}
                max={discountType === 'percentage' ? 100 : undefined}
                className={inputCls}
              />
              <span className="text-[10px] text-nw-600">
                {discountType === 'percentage' ? `${value}% off` : `${formatPence(value)} off`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className={labelCls}>Valid from</label>
              <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputCls} />
            </div>
            <div className="grid gap-1.5">
              <label className={labelCls}>Valid until</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className={labelCls}>Max uses</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                min={1}
                className={inputCls}
              />
            </div>
            <div className="grid gap-1.5">
              <label className={labelCls}>Min children</label>
              <input
                type="number"
                value={minChildren}
                onChange={(e) => setMinChildren(Number(e.target.value))}
                min={1}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-nw-300">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[#967705]" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-nw-300">
              <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} className="h-4 w-4 accent-[#967705]" />
              Auto-apply (no code needed)
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="gold" size="sm" onClick={handleSave} disabled={pending}>
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create discount'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
