import { getAllBlocks, getRosterForBlock, getRecentDropIns, getStatsForBlock, getKidsTrials, getAllDiscounts } from '@/lib/kids/queries'
import { KidsPageClient } from './KidsPageClient'
import type { BlockWithDetails, DropInRow, KidsDiscount, KidsStats, RosterRow, TrialRow } from '@/lib/kids/types'

const EMPTY_STATS: KidsStats = {
  minis_enrolled: 0,
  littles_enrolled: 0,
  teens_enrolled: 0,
  block_total: 0,
  dropins_this_block: 0,
  trials_total: 0,
  trials_converted: 0,
  gross_pence: 0,
  stripe_fees_pence: 0,
  net_pence: 0,
}

// Generic safe-fetch wrapper. If a query throws, log it and return the
// fallback so the page can still render. Without this a single bad query
// crashes the entire server component render with the cryptic
// "Server Components render" digest error.
async function safe<T>(label: string, fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fetcher()
  } catch (e) {
    console.error(`[kids/page] ${label} failed:`, (e as Error).message, (e as Error).stack)
    return fallback
  }
}

export default async function KidsPage() {
  const blocks: BlockWithDetails[] = await safe('getAllBlocks', getAllBlocks, [])
  const activeBlock = blocks.find((b) => b.is_active) ?? blocks[0] ?? null

  // Pre-fetch roster for every block so tab switching is instant
  const rosterEntries = await Promise.all(
    blocks.map(
      async (b) =>
        [b.id, await safe(`getRosterForBlock(${b.id})`, () => getRosterForBlock(b.id), [] as RosterRow[])] as const,
    ),
  )
  const rosterByBlock: Record<string, RosterRow[]> = Object.fromEntries(rosterEntries)

  const [recentDropIns, trials, discounts] = await Promise.all([
    safe<DropInRow[]>('getRecentDropIns', () => getRecentDropIns(10), []),
    safe<TrialRow[]>('getKidsTrials', getKidsTrials, []),
    safe<KidsDiscount[]>('getAllDiscounts', getAllDiscounts, []),
  ])

  // Pre-fetch stats for every block so tab switching updates financials instantly
  const statsEntries = await Promise.all(
    blocks.map(
      async (b) =>
        [b.id, await safe(`getStatsForBlock(${b.id})`, () => getStatsForBlock(b.id), EMPTY_STATS)] as const,
    ),
  )
  const statsByBlock: Record<string, KidsStats> = Object.fromEntries(statsEntries)

  return (
    <KidsPageClient
      blocks={blocks}
      rosterByBlock={rosterByBlock}
      recentDropIns={recentDropIns}
      trials={trials}
      discounts={discounts}
      statsByBlock={statsByBlock}
      initialActiveBlockId={activeBlock?.id ?? null}
    />
  )
}
