'use client'

import { useCallback, useRef, useState } from 'react'
import { Image as ImageIcon, X, Move } from 'lucide-react'
import { MediaPickerModal } from '@/components/media/MediaPicker'
import { FilterStrip } from './FilterStrip'

interface Props {
  imageUrl: string
  onImageChange: (url: string) => void
  imagePosition: { x: number; y: number }
  onPositionChange: (pos: { x: number; y: number }) => void
  overlayOpacity: number
  onOverlayChange: (v: number) => void
  filter: string
  onFilterChange: (id: string) => void
}

function FocalPointPicker({
  imageUrl, position, onChange,
}: {
  imageUrl: string
  position: { x: number; y: number }
  onChange: (pos: { x: number; y: number }) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))
      onChange({ x: Math.round(x), y: Math.round(y) })
    },
    [onChange],
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Move size={11} className="text-white/35" />
        <label className="text-[11px] text-white/40">Focal point</label>
        <span className="text-[10px] text-white/25 ml-auto">{position.x}%, {position.y}%</span>
      </div>
      <div
        ref={containerRef}
        onPointerDown={(e) => {
          setDragging(true)
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          updatePosition(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => dragging && updatePosition(e.clientX, e.clientY)}
        onPointerUp={() => setDragging(false)}
        className="relative w-full h-24 rounded-lg overflow-hidden border border-white/[0.1] cursor-crosshair select-none touch-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-[#c9a70a] shadow-[0_0_8px_rgba(201,167,10,0.6)]" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[#c9a70a]/60" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#c9a70a]/60" />
        </div>
      </div>
    </div>
  )
}

export function ImageControls({ imageUrl, onImageChange, imagePosition, onPositionChange, overlayOpacity, onOverlayChange, filter, onFilterChange }: Props) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <>
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-nw-750 border border-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/50 truncate">{imageUrl.split('/').pop()}</p>
              <button onClick={() => setShowPicker(true)} className="text-[11px] text-[#c9a70a] hover:text-[#967705] transition-colors mt-0.5">
                Change
              </button>
            </div>
            <button onClick={() => { onImageChange(''); onPositionChange({ x: 50, y: 50 }) }} className="text-white/30 hover:text-white/70 flex-shrink-0">
              <X size={14} />
            </button>
          </div>

          <FocalPointPicker imageUrl={imageUrl} position={imagePosition} onChange={onPositionChange} />

          {/* Overlay */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-white/40">Overlay</label>
              <span className="text-[11px] text-white/40">{overlayOpacity}%</span>
            </div>
            <input
              type="range" min={0} max={90} step={5}
              value={overlayOpacity}
              onChange={(e) => onOverlayChange(Number(e.target.value))}
              className="w-full accent-[#c9a70a]"
            />
          </div>

          {/* Filters */}
          <div>
            <label className="text-[11px] text-white/40 block mb-2">Filters</label>
            <FilterStrip imageUrl={imageUrl} selected={filter} onSelect={onFilterChange} />
          </div>
        </>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/[0.12] hover:border-[#967705]/50 bg-nw-750 hover:bg-[#967705]/5 transition-all text-white/40 hover:text-white/70"
        >
          <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
            <ImageIcon size={15} />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium">Pick from media</p>
            <p className="text-[10px] text-white/30 mt-0.5">Background photo for template</p>
          </div>
        </button>
      )}

      {showPicker && (
        <MediaPickerModal
          value={imageUrl}
          onSelect={(url) => { onImageChange(url); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
