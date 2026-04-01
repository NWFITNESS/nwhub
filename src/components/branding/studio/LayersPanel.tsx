'use client'

import { Layers, Image as ImageIcon, Type } from 'lucide-react'
import type { PostType } from './Toolbar'
import { CarouselSlides } from './CarouselSlides'

interface Props {
  postType: PostType
  headline: string
  subheadline: string
  imageUrl: string
  // Carousel
  carouselImages: string[]
  onCarouselImagesChange: (urls: string[]) => void
  activeSlide: number
  onActiveSlideChange: (i: number) => void
}

export function LayersPanel({
  postType, headline, subheadline, imageUrl,
  carouselImages, onCarouselImagesChange, activeSlide, onActiveSlideChange,
}: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">
          {postType === 'carousel' ? 'Slides' : 'Layers'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {postType === 'carousel' ? (
          <CarouselSlides
            images={carouselImages}
            onImagesChange={onCarouselImagesChange}
            activeSlide={activeSlide}
            onActiveSlideChange={onActiveSlideChange}
          />
        ) : (
          <>
            {/* Layers list for single post */}
            <div className="space-y-1">
              {/* Headline layer */}
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${
                headline ? 'border-white/[0.1] bg-nw-750' : 'border-white/[0.05] bg-nw-800 opacity-40'
              }`}>
                <Type size={13} className="text-[#c9a70a] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/70 font-medium truncate">{headline || 'Headline'}</p>
                  <p className="text-[9px] text-white/30">Text layer</p>
                </div>
              </div>

              {/* Subheadline layer */}
              {subheadline && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/[0.1] bg-nw-750">
                  <Type size={13} className="text-white/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/70 font-medium truncate">{subheadline}</p>
                    <p className="text-[9px] text-white/30">Subheadline</p>
                  </div>
                </div>
              )}

              {/* Image layer */}
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${
                imageUrl ? 'border-white/[0.1] bg-nw-750' : 'border-white/[0.05] bg-nw-800 opacity-40'
              }`}>
                <ImageIcon size={13} className="text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/70 font-medium truncate">
                    {imageUrl ? imageUrl.split('/').pop() : 'No image'}
                  </p>
                  <p className="text-[9px] text-white/30">Background</p>
                </div>
              </div>

              {/* Logo layer (always present) */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/[0.05] bg-nw-800 opacity-60">
                <Layers size={13} className="text-white/30 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/50 font-medium">Brand watermark</p>
                  <p className="text-[9px] text-white/20">Template</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
