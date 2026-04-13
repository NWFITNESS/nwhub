import type { KidsStats } from '@/lib/kids/types'

interface Props {
  stats: KidsStats
}

export function StatsRow({ stats }: Props) {
  const items: { label: string; value: number }[] = [
    { label: 'Minis enrolled',     value: stats.minis_enrolled },
    { label: 'Littles enrolled',   value: stats.littles_enrolled },
    { label: 'Teens enrolled',     value: stats.teens_enrolled },
    { label: 'Block total',        value: stats.block_total },
    { label: 'Drop-ins this block', value: stats.dropins_this_block },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 p-5 shadow-gold-sm"
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
  )
}
