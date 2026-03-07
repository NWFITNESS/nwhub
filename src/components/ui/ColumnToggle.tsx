'use client'

import { useState, useRef, useEffect } from 'react'
import { Columns3, Check } from 'lucide-react'

interface ColDef {
  key: string
  label: string
}

interface ColumnToggleProps {
  columns: ColDef[]
  visible: Set<string>
  onToggle: (key: string) => void
}

export function ColumnToggle({ columns, visible, onToggle }: ColumnToggleProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors border border-white/10"
      >
        <Columns3 size={13} />
        Columns
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-[#161616] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[160px]">
          {columns.map((col) => {
            const isVisible = visible.has(col.key)
            return (
              <button
                key={col.key}
                onClick={() => onToggle(col.key)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white/[0.04] transition-colors"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isVisible ? 'bg-[#967705] border-[#967705]' : 'border-white/20'
                  }`}
                >
                  {isVisible && <Check size={10} className="text-black" />}
                </span>
                <span className={isVisible ? 'text-white' : 'text-white/40'}>{col.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
