'use client'

import { useState } from 'react'
import { ReviewsPanel, type Review } from './ReviewsPanel'
import { PostEditorPanel } from './PostEditorPanel'

interface BrandingStudioProps {
  placeId: string
}

export function BrandingStudio({ placeId: _ }: BrandingStudioProps) {
  const [activeReview, setActiveReview] = useState<Review | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  return (
    <>
      {/* Desktop: side-by-side split */}
      <div
        className="hidden md:flex overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750"
        style={{ height: 'calc(100vh - 13rem)', minHeight: 600 }}
      >
        <div className="w-[30%] flex-shrink-0 border-r border-[rgba(255,255,255,0.07)] flex flex-col overflow-hidden">
          <ReviewsPanel activeReview={activeReview} onSelectReview={setActiveReview} />
        </div>
        <div className="w-[70%] overflow-y-auto bg-nw-900">
          <PostEditorPanel review={activeReview} onClearReview={() => setActiveReview(null)} />
        </div>
      </div>

      {/* Mobile: tabbed view */}
      <div className="md:hidden flex flex-col gap-3">
        <div className="flex rounded-[8px] bg-nw-800 border border-[rgba(255,255,255,0.09)] p-1 gap-1">
          <button
            onClick={() => setShowEditor(false)}
            className={`flex-1 rounded-[6px] py-2 text-[13px] font-medium transition-colors ${!showEditor ? 'bg-[rgba(212,160,23,0.15)] text-gold-300' : 'text-nw-400'}`}
          >
            Reviews
          </button>
          <button
            onClick={() => setShowEditor(true)}
            className={`flex-1 rounded-[6px] py-2 text-[13px] font-medium transition-colors ${showEditor ? 'bg-[rgba(212,160,23,0.15)] text-gold-300' : 'text-nw-400'}`}
          >
            Post Editor
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
          {showEditor ? (
            <PostEditorPanel review={activeReview} onClearReview={() => setActiveReview(null)} />
          ) : (
            <ReviewsPanel activeReview={activeReview} onSelectReview={(r) => { setActiveReview(r); setShowEditor(true) }} />
          )}
        </div>
      </div>
    </>
  )
}
