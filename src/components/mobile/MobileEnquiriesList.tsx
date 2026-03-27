'use client'

import { useState } from 'react'
import { MobileAppBar } from './MobileAppBar'
import { MobileSearch } from './MobileSearch'
import { FilterChips } from './FilterChips'
import { CardRow } from './CardRow'
import { SectionHeader } from './SectionHeader'

interface Enquiry {
  id: string
  name: string
  email?: string
  enquiry_type?: string
  status?: string
  message?: string
  created_at: string
  source?: string
}

interface Props {
  enquiries: Enquiry[]
}

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'new',     label: 'New' },
  { id: 'read',    label: 'Read' },
  { id: 'replied', label: 'Replied' },
]

type StatusColor = 'green' | 'amber' | 'red' | 'blue' | 'gray'

function getStatusColor(status?: string): StatusColor {
  switch (status) {
    case 'new':     return 'amber'
    case 'read':    return 'blue'
    case 'replied': return 'green'
    default: return 'amber'
  }
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function MobileEnquiriesList({ enquiries }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = enquiries.filter((e) => {
    const matchSearch = search === '' ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true : e.status === filter
    return matchSearch && matchFilter
  })

  const newOnes = filtered.filter((e) => e.status === 'new')
  const contacted = filtered.filter((e) => e.status === 'read')
  const rest = filtered.filter((e) => e.status !== 'new' && e.status !== 'read')

  return (
    <div className="lg:hidden flex flex-col bg-[#0f0f0f] min-h-[100dvh]">
      <MobileAppBar title="Enquiries" count={enquiries.filter(e => e.status === 'new').length} />
      <MobileSearch placeholder="Search…" value={search} onChange={setSearch} />
      <FilterChips filters={FILTERS} active={filter} onChange={setFilter} />

      <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))]">
        {newOnes.length > 0 && (
          <>
            <SectionHeader label="New" />
            {newOnes.map((e) => (
              <CardRow
                key={e.id}
                initials={getInitials(e.name)}
                name={e.name}
                secondary={e.email ?? e.enquiry_type ?? ''}
                meta={e.source ?? ''}
                status={getStatusColor(e.status)}
                date={formatDate(e.created_at)}
                isNew
              />
            ))}
          </>
        )}

        {contacted.length > 0 && (
          <>
            <SectionHeader label="Read" />
            {contacted.map((e) => (
              <CardRow
                key={e.id}
                initials={getInitials(e.name)}
                name={e.name}
                secondary={e.email ?? e.enquiry_type ?? ''}
                meta={e.source ?? ''}
                status={getStatusColor(e.status)}
                date={formatDate(e.created_at)}
              />
            ))}
          </>
        )}

        {rest.length > 0 && (
          <>
            <SectionHeader label="Other" />
            {rest.map((e) => (
              <CardRow
                key={e.id}
                initials={getInitials(e.name)}
                name={e.name}
                secondary={e.email ?? e.enquiry_type ?? ''}
                meta={e.source ?? ''}
                status={getStatusColor(e.status)}
                date={formatDate(e.created_at)}
              />
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-[14px] text-[#555]">No enquiries found</p>
          </div>
        )}
      </div>
    </div>
  )
}
