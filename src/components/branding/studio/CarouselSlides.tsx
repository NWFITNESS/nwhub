'use client'

import { useState } from 'react'
import { GripVertical, Plus, X } from 'lucide-react'
import { MediaPickerMultiModal } from '@/components/media/MediaPicker'

const CAROUSEL_MAX = 9 // min of IG 10, FB 10, LI 9

interface Props {
  images: string[]
  onImagesChange: (urls: string[]) => void
  activeSlide: number
  onActiveSlideChange: (i: number) => void
}

export function CarouselSlides({ images, onImagesChange, activeSlide, onActiveSlideChange }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">
          Slides {images.length}/{CAROUSEL_MAX}
        </p>
      </div>

      {/* Slide list */}
      {images.map((url, i) => (
        <div
          key={`${url}-${i}`}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (dragIdx === null || dragIdx === i) return
            const imgs = [...images]
            const [moved] = imgs.splice(dragIdx, 1)
            imgs.splice(i, 0, moved)
            onImagesChange(imgs)
            setDragIdx(null)
          }}
          onDragEnd={() => setDragIdx(null)}
          onClick={() => onActiveSlideChange(i)}
          className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all ${
            activeSlide === i
              ? 'border-[#967705] bg-[#967705]/10'
              : dragIdx === i
              ? 'border-[#967705]/50 opacity-60'
              : 'border-white/[0.07] bg-nw-750 hover:border-white/[0.14]'
          }`}
        >
          <GripVertical size={12} className="text-white/20 flex-shrink-0 cursor-grab active:cursor-grabbing" />
          <span className="text-[10px] text-white/30 font-mono w-3 flex-shrink-0">{i + 1}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-[52px] h-[52px] rounded object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/40 truncate">{url.split('/').pop()}</p>
            {activeSlide === i && <span className="text-[9px] text-[#c9a70a]">Active</span>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (images.length <= 2) return
              const next = images.filter((_, j) => j !== i)
              onImagesChange(next)
              if (activeSlide >= next.length) onActiveSlideChange(next.length - 1)
            }}
            className={`text-white/25 hover:text-red-400 transition-colors flex-shrink-0 p-0.5 ${images.length <= 2 ? 'opacity-30 pointer-events-none' : ''}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}

      {/* Add slides */}
      <button
        onClick={() => setShowPicker(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-white/[0.12] hover:border-[#967705]/50 bg-nw-750 hover:bg-[#967705]/5 transition-all text-white/40 hover:text-white/70"
      >
        <Plus size={13} />
        <span className="text-[11px] font-medium">
          {images.length === 0 ? 'Select images' : 'Add / change'}
        </span>
      </button>

      {images.length > 0 && images.length < 2 && (
        <p className="text-[10px] text-amber-400/70">Min 2 images for carousel</p>
      )}

      <p className="text-[9px] text-white/20">IG: max 10 · FB: max 10 · LI: max 9 · Drag to reorder</p>

      {showPicker && (
        <MediaPickerMultiModal
          selected={images}
          onDone={(urls) => { onImagesChange(urls); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
          max={CAROUSEL_MAX}
        />
      )}
    </div>
  )
}
