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
      {/* Left — Reviews (30%) */}
      <div className="w-[30%] flex-shrink-0 border-r border-white/[0.07] flex flex-col overflow-hidden">
        <ReviewsPanel activeReview={activeReview} onSelectReview={setActiveReview} />
      </div>

      {/* Right — Post Editor (70%) */}
      <div className="w-[70%] overflow-y-auto bg-nw-900">
        <PostEditorPanel review={activeReview} onClearReview={() => setActiveReview(null)} />
      </div>
    </div>
  )
}
