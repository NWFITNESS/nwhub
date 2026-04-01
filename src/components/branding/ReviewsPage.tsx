'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import type { Review } from './ReviewsPanel'

const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i < rating ? '#c9a70a' : 'none'} stroke="#c9a70a" strokeWidth="1.5">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  )
}

const SORT_OPTIONS = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'highest', label: 'Highest Rated' },
  { id: 'lowest', label: 'Lowest Rated' },
]

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: '5', label: '5 Stars' },
  { id: '4', label: '4 Stars' },
  { id: '3-', label: '3 & Below' },
]

export function ReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState('recent')
  const [filter, setFilter] = useState('all')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

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

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0
  const ratingBreakdown = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: reviews.filter(r => r.rating === n).length,
    pct: reviews.length ? (reviews.filter(r => r.rating === n).length / reviews.length) * 100 : 0,
  }))

  const exportCsv = () => {
    const headers = ['Author', 'Rating', 'Text', 'Date']
    const rows = reviews.map(r => [
      r.author_name,
      String(r.rating),
      `"${r.text.replace(/"/g, '""')}"`,
      new Date(r.time * 1000).toISOString().split('T')[0],
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `google-reviews-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
        {/* Average */}
        <div className="rounded-xl border border-white/[0.08] bg-nw-800 p-6 flex flex-col items-center justify-center gap-2">
          <p className="text-4xl font-brand font-bold text-white">{avgRating.toFixed(1)}</p>
          <StarRow rating={Math.round(avgRating)} size={20} />
          <p className="text-xs text-white/40">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Breakdown */}
        <div className="rounded-xl border border-white/[0.08] bg-nw-800 p-6 space-y-2">
          {ratingBreakdown.map(({ stars, count, pct }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-xs text-white/50 w-6 text-right">{stars}</span>
              <svg width={14} height={14} viewBox="0 0 20 20" fill="#c9a70a"><path d={STAR_PATH} /></svg>
              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-[#c9a70a] rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] text-white/40 w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-nw-800 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-[#967705]/50"
        >
          {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => setFilter(o.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filter === o.id
                  ? 'border-[#967705] bg-[#967705]/15 text-[#c9a70a]'
                  : 'border-white/[0.08] bg-nw-800 text-white/40 hover:text-white/70'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => load(true)}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-nw-800 text-xs text-white/50 hover:text-[#c9a70a] transition-colors"
        >
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync'}
        </button>

        <button
          onClick={exportCsv}
          disabled={reviews.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-nw-800 text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          <Download size={12} />
          Export CSV
        </button>
      </div>

      {/* Reviews grid */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.08] bg-nw-800 p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r, i) => {
            const isExpanded = expandedIds.has(i)
            const truncated = r.text.length > 200
            const displayText = truncated && !isExpanded ? r.text.slice(0, 200) + '...' : r.text
            const initial = r.author_name[0]?.toUpperCase() ?? '?'

            return (
              <div key={i} className="rounded-xl border border-white/[0.08] bg-nw-800 p-5 flex flex-col gap-3 hover:border-white/[0.14] transition-all">
                <div className="flex items-start gap-3">
                  {r.profile_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.profile_photo_url} alt={r.author_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nw-600 to-nw-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-brand font-bold text-nw-300">{initial}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-nw-200 truncate">{r.author_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRow rating={r.rating} size={13} />
                      <span className="text-[11px] text-nw-500">{r.relative_time_description}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-nw-400 leading-relaxed flex-1">{displayText}</p>
                {truncated && (
                  <button
                    onClick={() => setExpandedIds(prev => {
                      const next = new Set(prev)
                      next.has(i) ? next.delete(i) : next.add(i)
                      return next
                    })}
                    className="flex items-center gap-1 text-[11px] text-white/35 hover:text-white/60 transition-colors self-start"
                  >
                    {isExpanded ? <><ChevronUp size={11} /> Less</> : <><ChevronDown size={11} /> More</>}
                  </button>
                )}

                <Button
                  variant="primary"
                  onClick={() => router.push(`/branding?review=${r.time}`)}
                  className="w-full text-xs gap-1.5"
                >
                  Create Post
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-white/30">No reviews found.</p>
          <p className="text-xs text-white/20 mt-1">Add your Google Place ID in Settings.</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && reviews.length > 0 && (
        <p className="text-sm text-white/30 text-center py-12">No reviews match this filter.</p>
      )}
    </div>
  )
}
