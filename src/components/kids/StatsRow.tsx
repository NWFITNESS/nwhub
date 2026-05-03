import type { KidsStats } from '@/lib/kids/types'

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

  const enrollment: { label: string; value: string }[] = [
    { label: 'Minis enrolled',      value: String(stats.minis_enrolled) },
    { label: 'Littles enrolled',    value: String(stats.littles_enrolled) },
    { label: 'Teens enrolled',      value: String(stats.teens_enrolled) },
    { label: 'Block total',         value: String(stats.block_total) },
    { label: 'Drop-ins',            value: String(stats.dropins_this_block) },
    { label: 'Trials',              value: String(stats.trials_total) },
    { label: 'Trial → Booked',      value: stats.trials_total > 0 ? `${stats.trials_converted}/${stats.trials_total} (${conversionRate}%)` : '—' },
  ]

  const financials: { label: string; value: string; color?: string }[] = [
    { label: 'Gross revenue',  value: formatGbp(stats.gross_pence) },
    { label: 'Stripe fees',   value: `−${formatGbp(stats.stripe_fees_pence)}`, color: '#f87171' },
    { label: 'Net revenue',   value: formatGbp(stats.net_pence), color: '#4ade80' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Enrollment */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
        {enrollment.map((it) => (
          <div
            key={it.label}
            className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 shadow-gold-sm"
            style={{ padding: 16 }}
          >
            <div className="font-brand text-[28px] font-bold leading-none tracking-[-0.5px] text-white">
              {it.value}
            </div>
            <div className="mt-2 text-[11px] font-bold uppercase tracking-[1.3px] text-nw-400">
              {it.label}
            </div>
          </div>
        ))}
      </div>

      {/* Financials */}
      <div className="grid grid-cols-3 gap-4">
        {financials.map((it) => (
          <div
            key={it.label}
            className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 shadow-gold-sm"
            style={{ padding: 16 }}
          >
            <div
              className="font-brand text-[24px] font-bold leading-none tracking-[-0.5px]"
              style={{ color: it.color ?? '#fff' }}
            >
              {it.value}
            </div>
            <div className="mt-2 text-[11px] font-bold uppercase tracking-[1.3px] text-nw-400">
              {it.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
