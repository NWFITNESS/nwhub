'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { StatsRow } from '@/components/kids/StatsRow'
import { BlockSettingsPanel } from '@/components/kids/BlockSettingsPanel'
import { SessionScheduler } from '@/components/kids/SessionScheduler'
import { RosterSection } from '@/components/kids/RosterSection'
import { DropInSection } from '@/components/kids/DropInSection'
import { TrialsSection } from '@/components/kids/TrialsSection'
import { DiscountsSection } from '@/components/kids/DiscountsSection'
import { BlockModal } from '@/components/kids/BlockModal'
import { CapacityPricingModal } from '@/components/kids/CapacityPricingModal'
import { searchChildren } from './search-action'
import type { BlockWithDetails, DropInRow, KidsDiscount, KidsStats, RosterRow, SearchResultRow, TrialRow } from '@/lib/kids/types'

interface Props {
  blocks: BlockWithDetails[]
  rosterByBlock: Record<string, RosterRow[]>
  recentDropIns: DropInRow[]
  trials: TrialRow[]
  discounts: KidsDiscount[]
  initialStats: KidsStats
  initialActiveBlockId: string | null
}

export function KidsPageClient({
  blocks,
  rosterByBlock,
  recentDropIns,
  trials,
  discounts,
  initialStats,
  initialActiveBlockId,
}: Props) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(initialActiveBlockId)
  const [newBlockOpen, setNewBlockOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)

  // The block currently selected in the roster tab — defaults to the active
  // (live) block but can be any block as the user clicks tabs.
  const selectedBlock = blocks.find((b) => b.id === activeBlockId) ?? blocks[0] ?? null

  async function handleSearch(query: string): Promise<SearchResultRow[]> {
    return searchChildren(query)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Admin Panel"
        title="Kids &"
        titleGold="Teens"
        description="Block bookings, drop-ins, roster and session management"
        actions={
          <>
            <Button variant="ghost" size="md">Export PDF</Button>
            <Button variant="gold" size="md" onClick={() => setNewBlockOpen(true)}>+ New block</Button>
          </>
        }
      />

      <StatsRow stats={initialStats} />

      {selectedBlock ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BlockSettingsPanel
              block={selectedBlock}
              onOpenPricing={() => setPricingOpen(true)}
            />
            <SessionScheduler block={selectedBlock} />
          </div>

          <RosterSection
            blocks={blocks}
            rosterByBlock={rosterByBlock}
            activeBlockId={selectedBlock.id}
            onActiveBlockChange={setActiveBlockId}
            onSearch={handleSearch}
          />
        </>
      ) : (
        <div className="rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 p-12 text-center text-sm text-nw-500">
          No blocks yet. Click <span className="text-gold-300">+ New block</span> to create your first one.
        </div>
      )}

      <DropInDivider />
      <DropInSection blocks={blocks} recentDropIns={recentDropIns} />

      <SectionDivider label="Free trials" />
      <TrialsSection trials={trials} blocks={blocks} />

      <SectionDivider label="Discounts" />
      <DiscountsSection discounts={discounts} />

      <BlockModal
        open={newBlockOpen}
        onClose={() => setNewBlockOpen(false)}
        onCreated={(id) => setActiveBlockId(id)}
      />
      {selectedBlock && (
        <CapacityPricingModal
          open={pricingOpen}
          onClose={() => setPricingOpen(false)}
          block={selectedBlock}
        />
      )}
    </div>
  )
}

function DropInDivider() {
  return <SectionDivider label="Drop-in bookings" />
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="h-px flex-1 bg-[rgba(255,255,255,0.07)]" />
      <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-nw-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-[rgba(255,255,255,0.07)]" />
    </div>
  )
}
