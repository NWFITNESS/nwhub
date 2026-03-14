'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, ChevronRight } from 'lucide-react'

interface FloatingEditorProps {
  sectionKey: string
  content: Record<string, unknown>
  /** Viewport X of the click that opened this editor */
  clientX: number
  /** Viewport Y of the click that opened this editor */
  clientY: number
  onContentChange: (content: Record<string, unknown>) => void
  onSaveDraft: () => void
  onClose: () => void
}

const INPUT_BASE =
  'w-full rounded-lg bg-[#111] border border-white/10 px-3 py-2 text-xs text-white ' +
  'outline-none focus:border-[#967705]/60 transition-colors'

function isMultilineKey(key: string, value: string): boolean {
  if (value.length > 80) return true
  return ['subtext', 'desc', 'description', 'text', 'bio', 'excerpt', 'copy', 'a', 'note', 'message'].includes(key)
}

function StringField({ fieldKey, value, onChange }: { fieldKey: string; value: string; onChange: (v: string) => void }) {
  const multiline = isMultilineKey(fieldKey, value)
  return (
    <div>
      <div className="text-[10px] tracking-widest text-white/40 uppercase mb-1.5">{fieldKey.replace(/_/g, ' ')}</div>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT_BASE + ' resize-none'} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={INPUT_BASE} />
      )}
    </div>
  )
}

function ArrayField({ fieldKey, items, onChange }: { fieldKey: string; items: unknown[]; onChange: (v: unknown[]) => void }) {
  const [expanded, setExpanded] = useState(false)

  function updateItemString(i: number, val: string) {
    onChange(items.map((item, idx) => (idx === i ? val : item)))
  }

  function updateItemField(i: number, key: string, val: string) {
    onChange(items.map((item, idx) => {
      if (idx !== i) return item
      return { ...(item as Record<string, unknown>), [key]: val }
    }))
  }

  return (
    <div>
      <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 w-full text-left mb-1">
        {expanded
          ? <ChevronDown size={10} className="text-white/40 shrink-0" />
          : <ChevronRight size={10} className="text-white/40 shrink-0" />}
        <span className="text-[10px] tracking-widest text-white/40 uppercase">
          {fieldKey.replace(/_/g, ' ')} ({items.length})
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 pl-3 border-l border-white/[0.08] ml-1">
          {items.map((item, i) => {
            if (typeof item === 'string') {
              return <StringField key={i} fieldKey={`${i + 1}`} value={item} onChange={(v) => updateItemString(i, v)} />
            }
            if (item && typeof item === 'object' && !Array.isArray(item)) {
              const obj = item as Record<string, unknown>
              const stringKeys = Object.keys(obj).filter((k) => typeof obj[k] === 'string')
              if (stringKeys.length === 0) return null
              return (
                <div key={i} className="space-y-2.5">
                  <div className="text-[9px] tracking-widest text-white/25 uppercase">— {i + 1}</div>
                  {stringKeys.map((k) => (
                    <StringField key={k} fieldKey={k} value={obj[k] as string} onChange={(v) => updateItemField(i, k, v)} />
                  ))}
                </div>
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

export function FloatingEditor({ sectionKey, content, clientX, clientY, onContentChange, onSaveDraft, onClose }: FloatingEditorProps) {
  const [local, setLocal] = useState<Record<string, unknown>>(content)
  const boxRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: clientY, left: clientX })

  // Re-init fields when section changes
  useEffect(() => { setLocal(content) }, [sectionKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Position the box near the click, keeping inside viewport
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const W = box.offsetWidth || 288
    const H = box.offsetHeight || 400
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Prefer left of click; fall back to right
    const left = clientX - W - 16 > 8 ? clientX - W - 16 : Math.min(clientX + 16, vw - W - 8)
    const top = Math.min(Math.max(clientY - 60, 8), vh - H - 8)
    setPos({ top, left })
  }, [clientX, clientY, sectionKey])

  // Dismiss on outside mousedown
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function updateField(key: string, value: unknown) {
    const next = { ...local, [key]: value }
    setLocal(next)
    onContentChange(next)
  }

  const label = sectionKey.replace(/_/g, ' ')

  const box = (
    <div
      ref={boxRef}
      className="fixed z-50 w-72 rounded-2xl border border-white/[0.12] bg-[#1a1a1a] shadow-2xl shadow-black/70 overflow-hidden"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <span className="text-xs font-semibold text-white capitalize">{label}</span>
        <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors rounded p-0.5">
          <X size={14} />
        </button>
      </div>

      {/* Fields */}
      <div className="p-4 space-y-4 max-h-[460px] overflow-y-auto">
        {Object.entries(local).map(([key, value]) => {
          if (value === null || value === undefined) return null

          if (typeof value === 'string') {
            return <StringField key={key} fieldKey={key} value={value} onChange={(v) => updateField(key, v)} />
          }
          if (typeof value === 'number') {
            return (
              <div key={key}>
                <div className="text-[10px] tracking-widest text-white/40 uppercase mb-1.5">{key.replace(/_/g, ' ')}</div>
                <input type="number" value={value} onChange={(e) => updateField(key, Number(e.target.value))} className={INPUT_BASE} />
              </div>
            )
          }
          if (typeof value === 'boolean') {
            return (
              <div key={key} className="flex items-center gap-2">
                <input type="checkbox" id={`fe-${key}`} checked={value} onChange={(e) => updateField(key, e.target.checked)} className="accent-[#967705]" />
                <label htmlFor={`fe-${key}`} className="text-xs text-white/70 capitalize">{key.replace(/_/g, ' ')}</label>
              </div>
            )
          }
          if (Array.isArray(value)) {
            return <ArrayField key={key} fieldKey={key} items={value} onChange={(v) => updateField(key, v)} />
          }
          return null
        })}

        {Object.keys(local).length === 0 && (
          <p className="text-xs text-white/30 text-center py-3">No editable fields.</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={onSaveDraft}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 hover:border-[#967705]/50 hover:bg-[#967705]/[0.08] px-3 py-2 text-xs text-white/60 hover:text-white transition-colors"
        >
          Save Draft
        </button>
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null
  return createPortal(box, document.body)
}
