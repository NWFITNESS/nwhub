'use client'

import { useState } from 'react'
import { MobileAppBar } from './MobileAppBar'
import { MobileSearch } from './MobileSearch'
import { FilterChips } from './FilterChips'
import { CardRow } from './CardRow'
import { SectionHeader } from './SectionHeader'

interface Registration {
  id: string
  child_name?: string
  parent_name?: string
  parent_email?: string
  age_group?: string
  class_type?: string
  status?: string
  created_at: string
}

interface Props {
  registrations: Registration[]
}

const FILTERS = [
  { id: 'all',   label: 'All' },
  { id: 'kids',  label: 'Kids (3-10)' },
  { id: 'teens', label: 'Teens (10-18)' },
]

function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function MobileKidsList({ registrations }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = registrations.filter((r) => {
    const matchSearch = search === '' ||
      r.child_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.parent_name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ? true :
      filter === 'kids' ? r.age_group === 'kids' || r.class_type === 'kids' :
      filter === 'teens' ? r.age_group === 'teens' || r.class_type === 'teens' :
      true
    return matchSearch && matchFilter
  })

  const thisWeek = filtered.filter((r) => {
    const d = new Date(r.created_at)
    return d > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  })
  const older = filtered.filter((r) => !thisWeek.includes(r))

  return (
    <div className="lg:hidden flex flex-col bg-[#0f0f0f] min-h-[100dvh]">
      <MobileAppBar title="Classes" count={registrations.length} />
      <MobileSearch placeholder="Search name…" value={search} onChange={setSearch} />
      <FilterChips filters={FILTERS} active={filter} onChange={setFilter} />

      <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))]">
        {thisWeek.length > 0 && (
          <>
            <SectionHeader label="New this week" />
            {thisWeek.map((r) => (
              <CardRow
                key={r.id}
                initials={getInitials(r.child_name)}
                name={r.child_name ?? 'Unknown'}
                secondary={`Parent: ${r.parent_name ?? '—'}`}
                meta={r.class_type ?? r.age_group ?? ''}
                status="green"
                date={formatDate(r.created_at)}
                isNew
              />
            ))}
          </>
        )}

        {older.length > 0 && (
          <>
            <SectionHeader label="All registrations" />
            {older.map((r) => (
              <CardRow
                key={r.id}
                initials={getInitials(r.child_name)}
                name={r.child_name ?? 'Unknown'}
                secondary={`Parent: ${r.parent_name ?? '—'}`}
                meta={r.class_type ?? r.age_group ?? ''}
                status="green"
                date={formatDate(r.created_at)}
              />
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-[14px] text-[#555]">No registrations found</p>
          </div>
        )}
      </div>
    </div>
  )
}
