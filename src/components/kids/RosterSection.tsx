'use client'

import { useMemo, useState, useRef, useEffect, useTransition } from 'react'
import { CATEGORY_BADGE, CATEGORY_LABEL, ageFromDob } from '@/lib/kids/constants'
import { refundBlockBooking, deletePendingBooking } from '@/lib/kids/actions'
import type { BlockWithDetails, KidsCategory, RosterRow, SearchResultRow } from '@/lib/kids/types'

interface Props {
  blocks: BlockWithDetails[]
  rosterByBlock: Record<string, RosterRow[]>
  activeBlockId: string
  onActiveBlockChange: (blockId: string) => void
  onSearch: (query: string) => Promise<SearchResultRow[]>
}

type CategoryFilter = 'all' | KidsCategory
type PaymentFilter = 'all' | 'paid' | 'pending'
type ConsentFilter = 'all' | 'allowed' | 'not_allowed'

export function RosterSection({ blocks, rosterByBlock, activeBlockId, onActiveBlockChange, onSearch }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultRow[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [catFilter, setCatFilter] = useState<CategoryFilter>('all')
  const [payFilter, setPayFilter] = useState<PaymentFilter>('all')
  const [consentFilter, setConsentFilter] = useState<ConsentFilter>('all')

  const filterBtnRef = useRef<HTMLButtonElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return
    function handler(e: MouseEvent) {
      if (
        filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      const results = await onSearch(searchQuery.trim())
      setSearchResults(results)
      setSearching(false)
    }, 250)
    return () => clearTimeout(t)
  }, [searchQuery, onSearch])

  const activeBlock = blocks.find((b) => b.id === activeBlockId)
  const rawRoster = rosterByBlock[activeBlockId] ?? []

  const filteredRoster = useMemo(() => {
    return rawRoster.filter((r) => {
      if (catFilter !== 'all' && r.category !== catFilter) return false
      if (payFilter === 'paid' && r.payment_status !== 'paid') return false
      if (payFilter === 'pending' && r.payment_status === 'paid') return false
      if (consentFilter === 'allowed' && !r.photo_consent) return false
      if (consentFilter === 'not_allowed' && r.photo_consent) return false
      return true
    })
  }, [rawRoster, catFilter, payFilter, consentFilter])

  const activeFilterCount = (catFilter !== 'all' ? 1 : 0) + (payFilter !== 'all' ? 1 : 0) + (consentFilter !== 'all' ? 1 : 0)

  function clearFilters() {
    setCatFilter('all')
    setPayFilter('all')
    setConsentFilter('all')
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750">
      {/* Block tabs */}
      <div className="flex border-b border-[rgba(255,255,255,0.07)] overflow-x-auto no-scrollbar">
        {blocks.length === 0 && (
          <div className="px-[17px] py-3 text-xs text-nw-500">No blocks yet</div>
        )}
        {blocks.map((b) => {
          const isActive = b.id === activeBlockId
          return (
            <button
              key={b.id}
              onClick={() => onActiveBlockChange(b.id)}
              className={`relative whitespace-nowrap px-[17px] py-3 text-[12px] font-medium transition-colors ${
                isActive ? 'text-gold-300' : 'text-nw-400 hover:text-nw-200'
              }`}
            >
              {b.name}
              {isActive && <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-gold-400" />}
            </button>
          )
        })}
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] px-[17px] py-3">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-nw-500"
            width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"
          >
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search child name…"
            className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 pl-9 pr-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
          />
        </div>
        <div className="relative">
          <button
            ref={filterBtnRef}
            onClick={() => setFilterOpen(!filterOpen)}
            className="relative inline-flex items-center gap-1.5 rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-xs text-nw-300 hover:text-nw-100 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
            </svg>
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[9px] font-bold text-nw-950">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div
              ref={filterPanelRef}
              className="absolute right-0 top-full mt-1 z-10 w-56 rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-nw-800 p-3 shadow-gold-md"
            >
              <FilterGroup label="Category" value={catFilter} onChange={(v) => setCatFilter(v as CategoryFilter)} options={[
                { v: 'all', label: 'All' },
                { v: 'minis', label: 'Minis' },
                { v: 'littles', label: 'Littles' },
                { v: 'teens', label: 'Teens' },
              ]} />
              <FilterGroup label="Payment" value={payFilter} onChange={(v) => setPayFilter(v as PaymentFilter)} options={[
                { v: 'all', label: 'All' },
                { v: 'paid', label: 'Paid' },
                { v: 'pending', label: 'Pending' },
              ]} />
              <FilterGroup label="Photo consent" value={consentFilter} onChange={(v) => setConsentFilter(v as ConsentFilter)} options={[
                { v: 'all', label: 'All' },
                { v: 'allowed', label: 'Allowed' },
                { v: 'not_allowed', label: 'Not allowed' },
              ]} />
              <button
                onClick={clearFilters}
                className="mt-2 w-full text-left text-[10px] font-medium uppercase tracking-[1px] text-nw-500 hover:text-gold-300 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Block info bar (only when not searching) */}
      {!searchResults && activeBlock && (
        <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] bg-nw-800/30 px-[17px] py-2 text-[11px] text-nw-500">
          <span>Starts {new Date(activeBlock.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>·</span>
          <span>{activeBlock.session_count} sessions</span>
          <span>·</span>
          <span>{rawRoster.length} enrolled</span>
          <span>·</span>
          {activeBlock.is_active
            ? <span className="text-gold-300">Active</span>
            : <span>Completed</span>}
        </div>
      )}

      {/* Search results panel OR roster table */}
      {searchResults ? (
        <div className="p-[17px]">
          {searching && <p className="text-xs text-nw-500">Searching…</p>}
          {!searching && searchResults.length === 0 && (
            <p className="text-xs text-nw-500">No children match &ldquo;{searchQuery}&rdquo;</p>
          )}
          {!searching && searchResults.length > 0 && (
            <div className="flex flex-col gap-2">
              {searchResults.map((r) => (
                <div key={r.child_id} className="flex flex-wrap items-center gap-2 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-nw-800 p-3">
                  <span className="text-sm font-medium text-nw-100">{r.child_name}</span>
                  <CategoryBadge category={r.category} />
                  <div className="ml-auto flex flex-wrap gap-1">
                    {r.block_tags.map((b) => (
                      <span key={b.block_id} className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[10px] text-nw-300">
                        {b.block_name}
                      </span>
                    ))}
                    {r.dropin_tags.map((d) => (
                      <span key={d.dropin_id} className="rounded-full bg-[rgba(255,107,80,0.12)] px-2 py-0.5 text-[10px] text-[#ff8a6e]">
                        Drop-in{d.session_date ? ` ${new Date(d.session_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <RosterTable rows={filteredRoster} totalRows={rawRoster.length} onClearFilters={clearFilters} />
      )}
    </div>
  )
}

function FilterGroup({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { v: string; label: string }[]
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-[1.1px] text-nw-500">{label}</div>
      <div className="flex flex-col gap-0.5">
        {options.map((o) => (
          <label key={o.v} className="flex cursor-pointer items-center gap-2 text-xs text-nw-300 hover:text-nw-100">
            <input
              type="radio"
              checked={value === o.v}
              onChange={() => onChange(o.v)}
              className="accent-[#d4a017]"
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function CategoryBadge({ category }: { category: KidsCategory }) {
  const c = CATEGORY_BADGE[category]
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {CATEGORY_LABEL[category]}
    </span>
  )
}

function CameraIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"
      style={{ opacity: active ? 1 : 0.2, color: active ? '#e8b933' : '#8296b4' }}
    >
      <path d="M3 6h3l1.5-2h5L14 6h3a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z" />
      <circle cx="10" cy="11" r="3" />
    </svg>
  )
}

function RosterTable({ rows, totalRows, onClearFilters }: { rows: RosterRow[]; totalRows: number; onClearFilters: () => void }) {
  const [pending, startTransition] = useTransition()

  function handleRefund(bookingId: string, childName: string) {
    if (!window.confirm(`Refund the block booking for ${childName}? This is a full Stripe refund. Note: if this booking was part of a multi-child checkout, all children on the same payment will be refunded.`)) return
    startTransition(async () => {
      try {
        await refundBlockBooking(bookingId)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  function handleDeletePending(bookingId: string, childName: string) {
    if (!window.confirm(`Delete the pending (unpaid) booking for ${childName}? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deletePendingBooking(bookingId)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-[17px] py-12">
        <p className="text-xs text-nw-500">
          {totalRows === 0 ? 'No bookings in this block yet' : 'No bookings match your filters'}
        </p>
        {totalRows > 0 && (
          <button onClick={onClearFilters} className="text-xs text-gold-300 hover:text-gold-200 transition-colors">
            Clear filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.05)]">
            <th className="w-10 px-3 py-2.5" />
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Child</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Category</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Age</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Parent</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Payment</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Photo</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Waiver</th>
            <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.booking_id} className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <td className="px-3 py-3 text-center"><CameraIcon active={r.photo_consent} /></td>
              <td className="px-3 py-3 font-medium text-nw-100">{r.child_name}</td>
              <td className="px-3 py-3"><CategoryBadge category={r.category} /></td>
              <td className="px-3 py-3 text-xs text-nw-400">{r.date_of_birth ? `${ageFromDob(r.date_of_birth)}y` : '—'}</td>
              <td className="px-3 py-3 text-xs text-nw-400">{r.parent_name}</td>
              <td className="px-3 py-3">
                {r.payment_status === 'paid' ? (
                  <span className="rounded-full bg-[rgba(74,222,128,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#4ade80]">Paid</span>
                ) : r.payment_status === 'refunded' ? (
                  <span className="rounded-full bg-[rgba(248,113,113,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#f87171]">Refunded</span>
                ) : (
                  <span className="rounded-full bg-[rgba(245,158,11,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#f59e0b]">Pending</span>
                )}
              </td>
              <td className="px-3 py-3 text-[12px]">{r.photo_consent ? <span className="text-[#4ade80]">✓ Yes</span> : <span className="text-[#f87171]">✗ No</span>}</td>
              <td className="px-3 py-3 text-[12px]">{r.waiver_signed ? <span className="text-[#4ade80]">✓</span> : <span className="text-[#f87171]">✗</span>}</td>
              <td className="px-3 py-3 text-right flex items-center justify-end gap-2">
                {r.payment_status === 'paid' && (
                  <button
                    onClick={() => handleRefund(r.booking_id, r.child_name)}
                    disabled={pending}
                    className="text-[11px] font-medium text-nw-400 hover:text-[#f87171] disabled:opacity-50 transition-colors"
                  >
                    Refund
                  </button>
                )}
                {r.payment_status === 'pending' && (
                  <button
                    onClick={() => handleDeletePending(r.booking_id, r.child_name)}
                    disabled={pending}
                    className="text-[11px] font-medium text-nw-400 hover:text-[#f87171] disabled:opacity-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
