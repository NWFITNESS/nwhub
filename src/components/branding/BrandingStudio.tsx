'use client'

import { useState } from 'react'
import { ReviewsPanel, type Review } from './ReviewsPanel'
import { PostEditorPanel } from './PostEditorPanel'

interface BrandingStudioProps {
  placeId: string
}

export function BrandingStudio({ placeId: _ }: BrandingStudioProps) {
  const [activeReview, setActiveReview] = useState<Review | null>(null)

  return (
    <div
      className="flex rounded-2xl border border-white/[0.07] overflow-hidden"
      style={{ height: 'calc(100vh - 13rem)', minHeight: 600 }}
    >
      {/* Left — Reviews */}
      <div className="w-[320px] flex-shrink-0 border-r border-white/[0.07] flex flex-col overflow-hidden">
        <ReviewsPanel activeReview={activeReview} onSelectReview={setActiveReview} />
      </div>

      {/* Right — Post Editor */}
      <div className="flex-1 overflow-y-auto bg-[#0d0d0d]">
        <PostEditorPanel review={activeReview} onClearReview={() => setActiveReview(null)} />
      </div>
    </div>
  )
}
