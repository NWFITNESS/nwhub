import type { KidsStats } from '@/lib/kids/types'
import { PageStatCard } from '@/components/ui/PageStatCard'

interface Props {
  stats: KidsStats
}

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export function StatsRow({ stats }: Props) {
  const conversionRate = stats.trials_total > 0
    ? Math.round((stats.trials_converted / stats.trials_total) * 100)
    : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Enrollment */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
        <PageStatCard label="Minis Enrolled" value={stats.minis_enrolled} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="6" r="3"/><path d="M4 14c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>} color="#f59e0b" />
        <PageStatCard label="Littles Enrolled" value={stats.littles_enrolled} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="6" r="3"/><path d="M4 14c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>} color="#3b82f6" />
        <PageStatCard label="Teens Enrolled" value={stats.teens_enrolled} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="6" r="3"/><path d="M4 14c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>} color="#8b5cf6" />
        <PageStatCard label="Block Total" value={stats.block_total} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 7h12" strokeLinecap="round"/></svg>} />
        <PageStatCard label="Drop-ins" value={stats.dropins_this_block} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 1v10M5 8l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13h12" strokeLinecap="round"/></svg>} color="#22c55e" />
        <PageStatCard label="Trials" value={stats.trials_total} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2" strokeLinecap="round"/></svg>} color="#C9A70A" />
        <PageStatCard label="Trial → Booked" value={stats.trials_total > 0 ? `${stats.trials_converted}/${stats.trials_total}` : '—'} sub={stats.trials_total > 0 ? `${conversionRate}% converted` : ''} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>} color="#22c55e" />
      </div>

      {/* Financials */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PageStatCard label="Gross Revenue" value={formatGbp(stats.gross_pence)} gold icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 1v14M4 5h8M4 9h8" strokeLinecap="round"/></svg>} />
        <PageStatCard label="Stripe Fees" value={`−${formatGbp(stats.stripe_fees_pence)}`} alert icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 7h14" strokeLinecap="round"/></svg>} />
        <PageStatCard label="Net Revenue" value={formatGbp(stats.net_pence)} color="#22c55e" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="1" width="14" height="14" rx="2"/></svg>} />
      </div>
    </div>
  )
}
