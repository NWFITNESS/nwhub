'use client'

import { type RefObject } from 'react'
import { TEMPLATE_MAP, type Style, type TemplateRenderProps } from '../templates'
import type { PostRatio } from './RatioSelector'
import { FILTERS } from './FilterStrip'

interface Props {
  style: Style
  templateProps: TemplateRenderProps
  ratio: PostRatio
  filter: string
  fullResRef: RefObject<HTMLDivElement | null>
  carouselMode?: boolean
  carouselImages?: string[]
  activeSlide?: number
  onSlideChange?: (i: number) => void
}

export function Preview({
  style, templateProps, ratio, filter, fullResRef,
  carouselMode, carouselImages, activeSlide = 0, onSlideChange,
}: Props) {
  const TemplateComponent = TEMPLATE_MAP[style]
  const filterCss = FILTERS.find(f => f.id === filter)?.css

  // Calculate preview scaling to fit the available space
  const MAX_W = 560
  const MAX_H = 560
  const SCALE = Math.min(MAX_W / ratio.width, MAX_H / ratio.height)
  const previewW = ratio.width * SCALE
  const previewH = ratio.height * SCALE

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      {/* Carousel slide view */}
      {carouselMode && carouselImages && carouselImages.length > 0 ? (
        <div className="flex flex-col items-center gap-3">
          <div
            className="rounded-lg overflow-hidden border border-white/[0.06] bg-nw-950"
            style={{ width: Math.min(previewW, 420), height: Math.min(previewW, 420) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={carouselImages[activeSlide]}
              alt={`Slide ${activeSlide + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Navigation dots */}
          <div className="flex items-center gap-1.5">
            {carouselImages.map((_, i) => (
              <button
                key={i}
                onClick={() => onSlideChange?.(i)}
                className={`rounded-full transition-all ${
                  i === activeSlide
                    ? 'w-2.5 h-2.5 bg-[#c9a70a]'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Single post preview */
        <div className="flex flex-col items-center gap-3">
          <div
            className="rounded-lg overflow-hidden border border-white/[0.06] shadow-lg"
            style={{ width: previewW, height: previewH, position: 'relative', flexShrink: 0 }}
          >
            <div
              style={{
                transformOrigin: 'top left',
                transform: `scale(${SCALE})`,
                width: ratio.width,
                height: ratio.height,
                position: 'absolute',
                top: 0,
                left: 0,
                filter: filterCss && filterCss !== 'none' ? filterCss : undefined,
              }}
            >
              <TemplateComponent {...templateProps} />
            </div>
          </div>

          {/* Dimensions label */}
          <p className="text-[10px] text-white/25">
            {ratio.width} x {ratio.height} · {ratio.label} ({ratio.ratio})
          </p>
        </div>
      )}

      {/* Hidden full-res render for export */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: ratio.width, height: ratio.height, overflow: 'hidden', pointerEvents: 'none' }}>
        <div
          ref={fullResRef}
          style={{
            filter: filterCss && filterCss !== 'none' ? filterCss : undefined,
          }}
        >
          <TemplateComponent {...templateProps} />
        </div>
      </div>
    </div>
  )
}
