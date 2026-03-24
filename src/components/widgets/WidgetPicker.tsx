'use client'

import { Modal } from '@/components/ui/Modal'
import type { WidgetDef } from './useWidgetLayout'

interface WidgetPickerProps {
  open: boolean
  onClose: () => void
  allWidgets: WidgetDef[]
  visibleIds: string[]
  onAdd: (id: string) => void
  onRemove: (id: string) => void
}

const CATEGORY_LABELS: Record<WidgetDef['category'], string> = {
  kpi: 'KPI Cards',
  chart: 'Charts',
  table: 'Tables',
  misc: 'Misc',
}

export function WidgetPicker({ open, onClose, allWidgets, visibleIds, onAdd, onRemove }: WidgetPickerProps) {
  const categories = (['kpi', 'chart', 'table', 'misc'] as const).filter(
    (cat) => allWidgets.some((w) => w.category === cat),
  )

  return (
    <Modal open={open} onClose={onClose} title="Manage Widgets" width="md">
      <div className="space-y-5">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="text-[10px] font-semibold text-[#967705] uppercase tracking-[0.15em] mb-2">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="space-y-1.5">
              {allWidgets
                .filter((w) => w.category === cat)
                .map((w) => {
                  const active = visibleIds.includes(w.id)
                  return (
                    <div
                      key={w.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors"
                    >
                      <span className="text-sm text-white/70">{w.name}</span>
                      <button
                        onClick={() => active ? onRemove(w.id) : onAdd(w.id)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 border ${
                          active
                            ? 'bg-[#967705]/20 text-[#C9A70A] border-[#967705]/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                            : 'bg-white/[0.04] text-white/40 border-white/[0.08] hover:bg-[#967705]/10 hover:text-[#C9A70A] hover:border-[#967705]/30'
                        }`}
                      >
                        {active ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
