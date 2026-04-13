'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

export interface Review {
  author_name: string
  rating: number
  text: string
  time: number
  relative_time_description: string
  profile_photo_url: string
}

interface Props {
  activeReview: Review | null
  onSelectReview: (r: Review) => void
}

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i < rating ? '#c9a70a' : 'none'} stroke="#c9a70a" strokeWidth="1.5">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function ReviewCard({ review, isActive, onSelect }: { review: Review; isActive: boolean; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const truncated = review.text.length > 160
  const displayText = truncated && !expanded ? review.text.slice(0, 160) + '…' : review.text
  const initial = review.author_name[0]?.toUpperCase() ?? '?'

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-all ${
      isActive
        ? 'border-[#967705] bg-[#967705]/10'
        : 'border-white/[0.08] bg-nw-750 hover:border-white/[0.14]'
    }`}>
      <div className="flex items-start gap-2.5">
        {review.profile_photo_url ? (
          <img
            src={review.profile_photo_url}
            alt={review.author_name}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-nw-600 to-nw-700 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-brand font-bold text-nw-300">{initial}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-nw-200 truncate">{review.author_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRow rating={review.rating} />
            <span className="text-xs font-medium text-nw-400">{review.relative_time_description}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-nw-400 leading-relaxed">{displayText}</p>
        {truncated && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-1 text-[11px] text-white/35 hover:text-white/60 transition-colors"
          >
            {expanded ? <><ChevronUp size={11} /> Less</> : <><ChevronDown size={11} /> More</>}
          </button>
        )}
      </div>

      <button
        onClick={onSelect}
        className={`w-full rounded-[7px] border py-[5px] text-xs font-medium transition-colors ${
          isActive
            ? 'border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-gold-300'
            : 'border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-gold-300 hover:bg-[rgba(212,160,23,0.22)]'
        }`}
      >
        {isActive ? '✓ In editor' : 'Use this review'}
      </button>
    </div>
  )
}

const SORT_OPTIONS = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'highest', label: 'Highest Rated' },
  { id: 'lowest', label: 'Lowest Rated' },
]

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: '5', label: '5★' },
  { id: '4', label: '4★' },
  { id: '3-', label: '≤3★' },
]

export function ReviewsPanel({ activeReview, onSelectReview }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState('recent')
  const [filter, setFilter] = useState('all')

  const load = useCallback(async (showSyncing = false) => {
    if (showSyncing) setSyncing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/branding/reviews')
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to load reviews'); return }
      setReviews(data.reviews ?? [])
    } catch {
      setError('Failed to fetch reviews')
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const sorted = [...reviews].sort((a, b) => {
    if (sort === 'highest') return b.rating - a.rating
    if (sort === 'lowest') return a.rating - b.rating
    return b.time - a.time
  })

  const filtered = sorted.filter((r) => {
    if (filter === '5') return r.rating === 5
    if (filter === '4') return r.rating === 4
    if (filter === '3-') return r.rating <= 3
    return true
  })

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-white">Google Reviews</h2>
          <button
            onClick={() => load(true)}
            disabled={syncing}
            className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-[#c9a70a] transition-colors"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        </div>
        {avgRating && (
          <div className="flex items-center gap-2">
            <StarRow rating={Math.round(Number(avgRating))} size={12} />
            <span className="text-[12px] text-white/50">{avgRating} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex-shrink-0 space-y-2">
        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full bg-nw-750 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-[#967705]/50"
        >
          {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        {/* Filter chips */}
        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => setFilter(o.id)}
              className={`flex-1 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                filter === o.id
                  ? 'border-[#967705] bg-[#967705]/15 text-[#c9a70a]'
                  : 'border-white/[0.08] bg-nw-750 text-white/40 hover:text-white/70'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.08] bg-nw-750 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-4/5" />
            <Skeleton className="h-7 w-full rounded-lg" />
          </div>
        ))}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.map((r, i) => (
          <ReviewCard
            key={i}
            review={r}
            isActive={activeReview?.author_name === r.author_name && activeReview?.time === r.time}
            onSelect={() => onSelectReview(r)}
          />
        ))}

        {!loading && !error && reviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xs text-white/30">No reviews found.</p>
            <p className="text-xs text-white/20 mt-1">Add your Google Place ID in Settings.</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && reviews.length > 0 && (
          <p className="text-xs text-white/30 text-center py-8">No reviews match this filter.</p>
        )}
      </div>
    </div>
  )
}
