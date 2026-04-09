import { getAllBlocks, getRosterForBlock, getRecentDropIns, getStatsForBlock, getKidsTrials } from '@/lib/kids/queries'
import { KidsPageClient } from './KidsPageClient'
import type { RosterRow } from '@/lib/kids/types'

export default async function KidsPage() {
  const blocks = await getAllBlocks()
  const activeBlock = blocks.find((b) => b.is_active) ?? blocks[0] ?? null

  // Pre-fetch roster for every block so tab switching is instant
  const rosterEntries = await Promise.all(
    blocks.map(async (b) => [b.id, await getRosterForBlock(b.id)] as const),
  )
  const rosterByBlock: Record<string, RosterRow[]> = Object.fromEntries(rosterEntries)

  const [recentDropIns, trials] = await Promise.all([
    getRecentDropIns(10),
    getKidsTrials(),
  ])

  const stats = activeBlock
    ? await getStatsForBlock(activeBlock.id)
    : { minis_enrolled: 0, littles_enrolled: 0, teens_enrolled: 0, block_total: 0, dropins_this_block: 0 }

  return (
    <KidsPageClient
      blocks={blocks}
      rosterByBlock={rosterByBlock}
      recentDropIns={recentDropIns}
      trials={trials}
      initialStats={stats}
      initialActiveBlockId={activeBlock?.id ?? null}
    />
  )
}
