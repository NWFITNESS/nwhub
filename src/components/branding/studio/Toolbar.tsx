'use client'

import { Layers, Images, Film, Download, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Review } from '../ReviewsPanel'

export type PostType = 'single' | 'carousel' | 'reel'
export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin'

const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

interface Props {
  postType: PostType
  onPostTypeChange: (t: PostType) => void
  selectedPlatforms: Set<SocialPlatform>
  onTogglePlatform: (p: SocialPlatform) => void
  onSaveToMedia: () => void
  saving: boolean
  saved: boolean
  hasContent: boolean
  review: Review | null
  onClearReview: () => void
  carouselCount: number
}

const POST_TYPES: { id: PostType; label: string; icon: React.ReactNode }[] = [
  { id: 'single', label: 'Single', icon: <Layers size={13} /> },
  { id: 'carousel', label: 'Carousel', icon: <Images size={13} /> },
  { id: 'reel', label: 'Reel', icon: <Film size={13} /> },
]

const PLATFORM_LABELS: { id: SocialPlatform; label: string }[] = [
  { id: 'instagram', label: 'IG' },
  { id: 'facebook', label: 'FB' },
  { id: 'linkedin', label: 'LI' },
]

export function Toolbar({
  postType, onPostTypeChange, selectedPlatforms, onTogglePlatform,
  onSaveToMedia, saving, saved, hasContent,
  review, onClearReview, carouselCount,
}: Props) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/[0.06] bg-nw-900 px-4 py-3">
      {/* Main toolbar row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Post type pills */}
        <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
          {POST_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => onPostTypeChange(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                postType === t.id
                  ? 'bg-[#967705]/20 text-[#c9a70a]'
                  : 'bg-nw-800 text-white/40 hover:text-white/70'
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === 'carousel' && carouselCount > 0 && (
                <span className="text-[9px] bg-[#967705]/30 px-1 rounded">{carouselCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Platform chips */}
        <div className="flex items-center gap-1.5">
          {PLATFORM_LABELS.map((p) => (
            <button
              key={p.id}
              onClick={() => onTogglePlatform(p.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                selectedPlatforms.has(p.id)
                  ? 'border-[#967705] bg-[#967705]/15 text-[#c9a70a]'
                  : 'border-white/[0.08] bg-nw-800 text-white/35 hover:text-white/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save to media */}
        {hasContent && postType === 'single' && (
          <Button variant="default" onClick={onSaveToMedia} loading={saving} className="gap-1.5 text-[11px] h-7 px-3">
            {saved ? <Check size={12} className="text-emerald-400" /> : <Download size={12} />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save to Media'}
          </Button>
        )}
      </div>

      {/* Review chip */}
      {review && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#967705]/10 border border-[#967705]/30 w-fit">
          <div className="flex gap-0.5">
            {Array.from({ length: review.rating }).map((_, i) => (
              <svg key={i} width={10} height={10} viewBox="0 0 20 20" fill="#c9a70a"><path d={STAR_PATH} /></svg>
            ))}
          </div>
          <p className="text-[11px] text-[#c9a70a] font-medium truncate max-w-[200px]">{review.author_name}</p>
          <button onClick={onClearReview} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}
