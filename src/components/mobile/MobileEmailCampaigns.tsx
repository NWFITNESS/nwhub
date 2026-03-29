'use client'

import { useState } from 'react'
import { MobileAppBar } from './MobileAppBar'
import { FilterChips } from './FilterChips'
import { FAB } from './FAB'

interface Campaign {
  id: string
  name: string
  subject?: string
  status?: string
  sent_at?: string
  created_at: string
  stats?: { sent?: number; opened?: number }
}

interface Props {
  campaigns: Campaign[]
}

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'draft',     label: 'Draft' },
  { id: 'sent',      label: 'Sent' },
  { id: 'scheduled', label: 'Scheduled' },
]

function statusBadge(status?: string) {
  switch (status) {
    case 'sent':      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'draft':     return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    case 'scheduled': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    default:          return 'bg-white/[0.05] text-nw-400 border-white/[0.08]'
  }
}

export function MobileEmailCampaigns({ campaigns }: Props) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter)

  return (
    <div className="lg:hidden flex flex-col bg-nw-950 min-h-[100dvh]">
      <MobileAppBar title="Email Campaigns" />
      <FilterChips filters={FILTERS} active={filter} onChange={setFilter} />

      <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom)+60px)]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-[14px] text-nw-500">No campaigns found</p>
          </div>
        ) : (
          <div className="mx-3 mt-2 flex flex-col gap-2">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="bg-nw-900 rounded-xl border border-[rgba(255,255,255,0.09)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-medium text-nw-100 truncate">{c.name}</span>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(c.status)}`}>
                        {c.status ?? 'draft'}
                      </span>
                    </div>
                    {c.subject && (
                      <p className="text-[12px] text-nw-400 truncate">{c.subject}</p>
                    )}
                    {c.stats?.sent != null && (
                      <p className="text-[11px] text-nw-500 mt-0.5">
                        {c.stats.sent} sent · {c.stats.opened ?? 0} opened
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-nw-500 flex-shrink-0">
                    {new Date(c.sent_at ?? c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FAB label="New Email" onClick={() => { window.location.href = '/email/campaigns/new' }} />
    </div>
  )
}
