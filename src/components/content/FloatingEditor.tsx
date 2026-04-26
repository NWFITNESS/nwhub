'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, ChevronRight, Save, Pencil } from 'lucide-react'
import { ImageField } from '@/components/media/MediaPicker'

interface FloatingEditorProps {
  sectionKey: string
  content: Record<string, unknown>
  clientX: number
  clientY: number
  onContentChange: (content: Record<string, unknown>) => void
  onSaveDraft: () => void
  onClose: () => void
}

const INPUT_BASE =
  'w-full rounded-lg bg-[#0d0d0d] border border-white/[0.08] px-3 py-2.5 text-sm text-white ' +
  'placeholder:text-white/20 outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/20 transition-colors'

function isImageKey(key: string, value: string): boolean {
  const k = key.toLowerCase()
  if (
    k.includes('image') || k.includes('img') || k.includes('photo') ||
    k.includes('background') || k === 'bg' || k.startsWith('bg_') ||
    k.includes('thumbnail') || k.includes('avatar') ||
    k.endsWith('_url') || k.endsWith('_src')
  ) return true
  if (value && /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(value)) return true
  if (value && value.includes('/storage/v1/object/public/')) return true
  return false
}

function isFocalPointKey(key: string): boolean {
  return key === 'image_position'
}

function FocalPointPicker({ imageUrl, value, onChange }: {
  imageUrl: string
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)

  function parsePos(v: string): { x: number; y: number } {
    if (!v) return { x: 50, y: 50 }
    const parts = v.trim().split(/\s+/)
    const p = (s?: string) => s?.endsWith('%') ? parseFloat(s) : 50
    return { x: p(parts[0]), y: p(parts[1]) }
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    onChange(`${x}% ${y}%`)
  }

  const pos = parsePos(value)
  const displayLabel = value || 'center'

  return (
    <div>
      <FieldLabel label="Image Position" />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/[0.08] bg-[#0d0d0d] text-sm text-white/60 hover:border-[#967705]/60 transition-colors"
      >
        <span className="flex items-center gap-2">
          {/* Mini 3×3 grid indicator */}
          <div className="w-4 h-4 rounded bg-white/[0.08] relative flex-shrink-0 overflow-hidden">
            <div
              className="absolute w-2 h-2 rounded-full bg-[#c9a70a] -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            />
          </div>
          <span className="font-mono text-xs">{displayLabel}</span>
        </span>
        <span className="text-white/30 text-xs">{open ? 'close' : 'pick'}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-black/40">
          <p className="text-[10px] text-white/30 px-3 pt-2 pb-1">
            Click on the image to set the focal point
          </p>
          {imageUrl ? (
            <div
              className="relative cursor-crosshair mx-3 mb-3 rounded-lg overflow-hidden"
              style={{ height: 160 }}
              onClick={handleImageClick}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />
              {/* Focal point dot */}
              <div
                className="absolute w-5 h-5 rounded-full border-2 border-[#c9a70a] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 0 10px rgba(201,167,10,0.6)',
                }}
              />
            </div>
          ) : (
            <div className="px-3 pb-3">
              <p className="text-[10px] text-white/20 mb-2">No image set — enter position manually</p>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g. 50% 30%"
                className={INPUT_BASE + ' font-mono text-xs'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function isMultilineKey(key: string, value: string): boolean {
  if (value.length > 80) return true
  return ['subtext', 'desc', 'description', 'text', 'bio', 'excerpt', 'copy', 'a', 'note', 'message', 'address', 'body'].includes(key)
}

function FieldLabel({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/35 mb-1.5">
      {label.replace(/_/g, ' ')}
    </p>
  )
}

function StringField({ fieldKey, value, onChange, imageUrl }: {
  fieldKey: string
  value: string
  onChange: (v: string) => void
  imageUrl?: string
}) {
  if (isFocalPointKey(fieldKey)) {
    return <FocalPointPicker imageUrl={imageUrl ?? ''} value={value} onChange={onChange} />
  }
  if (fieldKey === 'layout') {
    return (
      <div>
        <FieldLabel label={fieldKey} />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_BASE}
          style={{ paddingLeft: 14, paddingRight: 14 }}
        >
          <option value="masonry">Masonry (3-column parallax)</option>
          <option value="grid">Grid (uniform tiles)</option>
          <option value="carousel">Carousel (one at a time with arrows)</option>
          <option value="filmstrip">Filmstrip (horizontal scroll)</option>
          <option value="spotlight">Spotlight (large image + thumbnails)</option>
        </select>
      </div>
    )
  }
  if (isImageKey(fieldKey, value)) {
    return (
      <div>
        <FieldLabel label={fieldKey} />
        <ImageField value={value} onChange={onChange} />
      </div>
    )
  }
  const multiline = isMultilineKey(fieldKey, value)
  return (
    <div>
      <FieldLabel label={fieldKey} />
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_BASE + ' resize-none leading-relaxed'}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_BASE}
        />
      )}
    </div>
  )
}

function ArrayField({ fieldKey, items, onChange }: {
  fieldKey: string
  items: unknown[]
  onChange: (v: unknown[]) => void
}) {
  const [expanded, setExpanded] = useState(true)

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
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left mb-1.5 group"
      >
        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
          expanded ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-white/[0.06] text-white/30'
        }`}>
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </div>
        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/35 group-hover:text-white/55 transition-colors">
          {fieldKey.replace(/_/g, ' ')}{' '}
          <span className="text-white/20 normal-case font-normal">({items.length} items)</span>
        </span>
      </button>

      {expanded && (
        <div className="space-y-2.5 pl-3 border-l border-[#967705]/20 ml-1.5 mt-2">
          {items.map((item, i) => {
            if (typeof item === 'string') {
              return (
                <div key={i} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.06]">
                  <FieldLabel label={String(i + 1)} />
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateItemString(i, e.target.value)}
                    className={INPUT_BASE}
                  />
                </div>
              )
            }
            if (item && typeof item === 'object' && !Array.isArray(item)) {
              const obj = item as Record<string, unknown>
              const stringKeys = Object.keys(obj).filter((k) => typeof obj[k] === 'string' || Array.isArray(obj[k]))
              if (stringKeys.length === 0) return null
              return (
                <div key={i} className="bg-white/[0.03] rounded-lg border border-white/[0.06] space-y-3" style={{ padding: 12 }}>
                  <p className="text-[10px] font-semibold text-[#967705]/60 uppercase tracking-widest">
                    Item {i + 1}
                  </p>
                  {stringKeys.map((k) => {
                    const val = obj[k]
                    const displayVal = Array.isArray(val) ? val.join(', ') : String(val ?? '')
                    return (
                      <StringField
                        key={k}
                        fieldKey={k}
                        value={displayVal}
                        onChange={(v) => updateItemField(i, k, v)}
                        imageUrl={isFocalPointKey(k) ? (obj['image_url'] as string | undefined) ?? '' : undefined}
                      />
                    )
                  })}
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

export function FloatingEditor({
  sectionKey,
  content,
  clientX,
  clientY,
  onContentChange,
  onSaveDraft,
  onClose,
}: FloatingEditorProps) {
  const [local, setLocal] = useState<Record<string, unknown>>(content)
  const boxRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: clientY, left: clientX })
  const [saved, setSaved] = useState(false)

  // Re-init when section changes
  useEffect(() => { setLocal(content) }, [sectionKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Position near click, clamped inside viewport
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const W = box.offsetWidth || 320
    const H = box.offsetHeight || 480
    const vw = window.innerWidth
    const vh = window.innerHeight
    const left = clientX - W - 16 > 8 ? clientX - W - 16 : Math.min(clientX + 16, vw - W - 8)
    const top = Math.min(Math.max(clientY - 60, 8), vh - H - 8)
    setPos({ top, left })
  }, [clientX, clientY, sectionKey])

  // Close on outside click
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

  function handleSave() {
    onSaveDraft()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const label = sectionKey.replace(/_/g, ' ')
  const fieldCount = Object.values(local).filter((v) => v !== null && v !== undefined).length

  const box = (
    <div
      ref={boxRef}
      className="fixed z-50 w-96 rounded-2xl overflow-hidden"
      style={{
        top: pos.top,
        left: pos.left,
        background: 'linear-gradient(180deg, #1c1c1c 0%, #131313 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(150,119,5,0.08)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Gold top accent bar */}
      <div
        className="h-[2px] w-full flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, transparent 0%, #967705 25%, #c9a70a 50%, #967705 75%, transparent 100%)' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between py-3.5 border-b border-white/[0.07]" style={{ paddingLeft: 16, paddingRight: 16 }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(150,119,5,0.15)', border: '1px solid rgba(150,119,5,0.25)' }}>
            <Pencil size={12} className="text-[#c9a70a]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase leading-none mb-0.5"
              style={{ color: 'rgba(201,167,10,0.7)' }}>
              Editing
            </p>
            <p className="text-white font-semibold text-sm capitalize truncate leading-none">{label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded-md bg-white/[0.05] text-white/25">
            {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4 max-h-[70vh] overflow-y-auto editor-scroll-container" style={{ padding: 16 }}>
        {Object.entries(local).map(([key, value]) => {
          if (value === null || value === undefined) return null

          if (typeof value === 'string') {
            return (
              <StringField
                key={key}
                fieldKey={key}
                value={value}
                onChange={(v) => updateField(key, v)}
                imageUrl={isFocalPointKey(key) ? (local['image_url'] as string | undefined) ?? '' : undefined}
              />
            )
          }
          if (typeof value === 'number') {
            return (
              <div key={key}>
                <FieldLabel label={key} />
                <input
                  type="number"
                  value={value}
                  onChange={(e) => updateField(key, Number(e.target.value))}
                  className={INPUT_BASE}
                />
              </div>
            )
          }
          if (typeof value === 'boolean') {
            return (
              <label
                key={key}
                htmlFor={`fe-${key}`}
                className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5 border border-white/[0.06] cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  id={`fe-${key}`}
                  checked={value}
                  onChange={(e) => updateField(key, e.target.checked)}
                  className="w-4 h-4 accent-[#967705] rounded"
                />
                <span className="text-sm text-white/60 capitalize">{key.replace(/_/g, ' ')}</span>
              </label>
            )
          }
          if (Array.isArray(value)) {
            return (
              <ArrayField
                key={key}
                fieldKey={key}
                items={value}
                onChange={(v) => updateField(key, v)}
              />
            )
          }
          return null
        })}

        {Object.keys(local).length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-white/20">No editable fields</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="py-3.5 border-t border-white/[0.07]" style={{ background: 'rgba(0,0,0,0.25)', paddingLeft: 16, paddingRight: 16 }}>
        <button
          type="button"
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300"
          style={saved ? {
            background: 'rgba(34,197,94,0.12)',
            color: '#22c55e',
            border: '1px solid rgba(34,197,94,0.25)',
          } : {
            background: 'linear-gradient(135deg, #967705 0%, #c9a70a 100%)',
            color: '#000',
            border: '1px solid rgba(201,167,10,0.3)',
            boxShadow: '0 4px 16px rgba(150,119,5,0.3)',
          }}
        >
          {saved ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Draft Saved
            </>
          ) : (
            <>
              <Save size={14} />
              Save Draft
            </>
          )}
        </button>
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null
  return createPortal(box, document.body)
}
