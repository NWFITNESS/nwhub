'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, ArrowUpRight } from 'lucide-react'

export function XeroRevenueCard() {
  const [revenue, setRevenue] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/xero/revenue-cache')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setRevenue(data?.revenue ?? 0))
      .catch(() => setRevenue(0))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-xl p-3 @md/page:p-6 min-h-[110px] @md/page:min-h-[130px] flex flex-col justify-between hover:border-[rgba(212,160,23,0.22)] shadow-gold-sm hover:shadow-gold-md transition-all duration-200">
      {/* Top row */}
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] @md/page:text-xs font-semibold text-white/40 uppercase tracking-[0.08em] leading-tight">
          Monthly Revenue
        </p>
        <div
          className="w-7 h-7 @md/page:w-9 @md/page:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.15)' }}
        >
          <TrendingUp size={16} className="text-white/70" strokeWidth={1.75} />
        </div>
      </div>

      {/* Bottom: value */}
      <div>
        {loading ? (
          <div className="h-9 @md/page:h-12 w-28 rounded-md bg-white/[0.06] animate-pulse mt-1" />
        ) : (
          <p
            className="text-3xl @md/page:text-5xl font-bold text-[#F0F0F0]"
            style={{ fontFamily: 'League Spartan' }}
          >
            £{(revenue ?? 0).toLocaleString()}
          </p>
        )}
        {!loading && revenue !== null && revenue > 0 && (
          <p className="text-[10px] @md/page:text-xs text-white/40 mt-1 flex items-center gap-0.5">
            <ArrowUpRight size={10} className="text-green-500" />
            Xero P&L
          </p>
        )}
      </div>
    </div>
  )
}
