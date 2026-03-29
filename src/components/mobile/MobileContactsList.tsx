'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileAppBar } from './MobileAppBar'
import { MobileSearch } from './MobileSearch'
import { FilterChips } from './FilterChips'
import { CardRow } from './CardRow'
import { SectionHeader } from './SectionHeader'
import { FAB } from './FAB'
import type { Contact } from '@/lib/types'

interface Props {
  contacts: Contact[]
  title: string
}

const FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'active',   label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'lead',     label: 'Lead' },
]

function getInitials(c: Contact) {
  return `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase() || '?'
}

function getFullName(c: Contact) {
  return `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Unknown'
}

function getStatusColor(c: Contact): 'green' | 'amber' | 'gray' {
  if (c.status === 'member' || c.status === 'active') return 'green'
  if (c.groups.includes('lead')) return 'amber'
  return 'gray'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function MobileContactsList({ contacts, title }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  const filtered = contacts.filter((c) => {
    const name = getFullName(c)
    const matchSearch = search === '' ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ? true :
      filter === 'active' ? (c.status === 'member' || c.status === 'active') :
      filter === 'inactive' ? (c.status === 'inactive' || c.status === 'cancelled') :
      filter === 'lead' ? c.groups.includes('lead') :
      true
    return matchSearch && matchFilter
  })

  const recent = filtered.filter((c) => {
    const d = new Date(c.created_at)
    return d > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  })
  const older = filtered.filter((c) => !recent.includes(c))

  return (
    <div className="lg:hidden flex flex-col bg-nw-950 min-h-[100dvh]">
      <MobileAppBar title={title} count={contacts.length} />
      <MobileSearch placeholder="Search name or email…" value={search} onChange={setSearch} />
      <FilterChips filters={FILTERS} active={filter} onChange={setFilter} />

      <div className="flex-1 overflow-y-auto">
        {recent.length > 0 && (
          <>
            <SectionHeader label="New this week" />
            {recent.map((c) => (
              <CardRow
                key={c.id}
                initials={getInitials(c)}
                name={getFullName(c)}
                secondary={c.email ?? ''}
                meta={c.programme ?? ''}
                status={getStatusColor(c)}
                date={formatDate(c.created_at)}
                isNew
                onClick={() => router.push('/contacts')}
              />
            ))}
          </>
        )}

        {older.length > 0 && (
          <>
            <SectionHeader label="All contacts" />
            {older.map((c) => (
              <CardRow
                key={c.id}
                initials={getInitials(c)}
                name={getFullName(c)}
                secondary={c.email ?? ''}
                meta={c.programme ?? ''}
                status={getStatusColor(c)}
                date={formatDate(c.created_at)}
                onClick={() => router.push('/contacts')}
              />
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-[14px] text-nw-500">No contacts found</p>
          </div>
        )}

        <div className="h-[calc(56px+env(safe-area-inset-bottom)+60px)]" />
      </div>

      <FAB label={`Add ${title === 'Leads' ? 'Lead' : 'Contact'}`} onClick={() => {}} />
    </div>
  )
}
