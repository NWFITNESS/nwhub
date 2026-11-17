'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface DarkSelectOption { value: string; label: string }

// A custom dropdown with guaranteed dark bg / light text (native <select> option
// styling is unreliable across browsers — this renders our own list).
export function DarkSelect({ value, onChange, options, placeholder = 'Select…', style }: {
  value: string
  onChange: (v: string) => void
  options: DarkSelectOption[]
  placeholder?: string
  style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer', textAlign: 'left',
        padding: '11px 12px', fontSize: 15, width: '100%', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)', color: '#edf3fb',
        ...style,
      }}>
        <span style={{ color: selected ? '#edf3fb' : '#8296b4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} color="#8296b4" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 80,
          background: '#121820', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10,
          maxHeight: 260, overflowY: 'auto', boxShadow: '0 14px 34px rgba(0,0,0,0.55)', padding: 4,
        }}>
          {options.map(o => {
            const sel = o.value === value
            return (
              <button
                type="button" key={o.value || '__none'} onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 14, cursor: 'pointer',
                  border: 'none', borderRadius: 7, background: sel ? 'rgba(212,160,23,0.16)' : 'transparent', color: sel ? '#f5d775' : '#dce5f0',
                }}
                onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >{o.label}</button>
            )
          })}
        </div>
      )}
    </div>
  )
}
