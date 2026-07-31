'use client'

import { useState, useCallback, useMemo } from 'react'
import { EnquiryDetail } from './EnquiryDetail'
import { formatDistanceToNowStrict } from 'date-fns'
import { Inbox, Search, CircleDot, Eye, CheckCheck, MessageSquare } from 'lucide-react'
import type { ContactEnquiry } from '@/lib/types'

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  all:     { label: 'All',     icon: Inbox,        color: 'rgba(255,255,255,0.4)' },
  new:     { label: 'New',     icon: CircleDot,    color: '#c9a70a' },
  read:    { label: 'Read',    icon: Eye,          color: '#3b82f6' },
  replied: { label: 'Replied', icon: CheckCheck,   color: '#22c55e' },
} as const

const TYPE_COLORS: Record<string, string> = {
  'New Starter':     '#c9a70a',
  'General Enquiry': '#3b82f6',
  'Membership':      '#22c55e',
  'HYROX':           '#ef4444',
  'Kids & Teens':    '#a855f7',
  'Timetable':       '#06b6d4',
  'Facilities':      '#f59e0b',
  'Other':           '#6b7280',
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(date: string) {
  try {
    return formatDistanceToNowStrict(new Date(date), { addSuffix: false })
      .replace(' seconds', 's').replace(' second', 's')
      .replace(' minutes', 'm').replace(' minute', 'm')
      .replace(' hours', 'h').replace(' hour', 'h')
      .replace(' days', 'd').replace(' day', 'd')
      .replace(' months', 'mo').replace(' month', 'mo')
      .replace(' years', 'y').replace(' year', 'y')
  } catch { return '' }
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialEnquiries: ContactEnquiry[]
  selectedId?: string | null
}

export function EnquiriesClient({ initialEnquiries, selectedId }: Props) {
  const [enquiries, setEnquiries] = useState(initialEnquiries)
  const [filter, setFilter] = useState<keyof typeof STATUS_CONFIG>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ContactEnquiry | null>(
    selectedId ? initialEnquiries.find(e => e.id === selectedId) ?? null : null
  )

  const filtered = useMemo(() => {
    let result = filter === 'all' ? enquiries : enquiries.filter(e => e.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.message?.toLowerCase().includes(q) ||
        e.enquiry_type.toLowerCase().includes(q)
      )
    }
    return result
  }, [enquiries, filter, search])

  const counts = useMemo(() => ({
    all: enquiries.length,
    new: enquiries.filter(e => e.status === 'new').length,
    read: enquiries.filter(e => e.status === 'read').length,
    replied: enquiries.filter(e => e.status === 'replied').length,
  }), [enquiries])

  const handleStatusChange = useCallback((id: string, status: ContactEnquiry['status']) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
  }, [])

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-nw-750 overflow-hidden" style={{ minHeight: 560 }}>
        <EnquiryDetail
          enquiry={selected}
          onBack={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(key => {
          const cfg = STATUS_CONFIG[key]
          const Icon = cfg.icon
          const isActive = filter === key
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="group relative rounded-xl border transition-all duration-200"
              style={{
                padding: '14px 16px',
                background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                borderColor: isActive ? 'rgba(201,167,10,0.25)' : 'rgba(255,255,255,0.06)',
                boxShadow: isActive ? '0 0 20px rgba(150,119,5,0.08)' : 'none',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                    style={{
                      background: `${cfg.color}15`,
                      border: `1px solid ${cfg.color}30`,
                    }}
                  >
                    <Icon size={13} style={{ color: cfg.color }} />
                  </div>
                  <span className="text-xs font-semibold text-nw-300">{cfg.label}</span>
                </div>
                <span
                  className="text-lg font-bold font-brand"
                  style={{ color: isActive ? cfg.color : 'rgba(255,255,255,0.5)' }}
                >
                  {counts[key]}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-nw-600" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search enquiries by name, email, or message..."
          className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-sm text-nw-200 placeholder-nw-600 focus:border-[rgba(150,119,5,0.3)] focus:bg-[rgba(255,255,255,0.03)] focus:outline-none transition-all"
          style={{ padding: '11px 16px 11px 40px' }}
        />
      </div>

      {/* Enquiry list */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3" style={{ padding: '64px 24px' }}>
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <MessageSquare size={22} className="text-nw-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-nw-400">No enquiries found</p>
              <p className="text-xs text-nw-600 mt-1">
                {search ? 'Try adjusting your search terms' : 'New enquiries will appear here'}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((e, i) => {
            const isNew = e.status === 'new'
            const typeColor = TYPE_COLORS[e.enquiry_type] ?? '#6b7280'
            return (
              <div
                key={e.id}
                onClick={() => setSelected(e)}
                className="group cursor-pointer transition-all duration-150"
                style={{
                  padding: '16px 20px',
                  background: isNew ? 'rgba(201,167,10,0.02)' : 'transparent',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
                onMouseEnter={ev => {
                  (ev.currentTarget as HTMLElement).style.background = isNew
                    ? 'rgba(201,167,10,0.05)'
                    : 'rgba(255,255,255,0.025)'
                }}
                onMouseLeave={ev => {
                  (ev.currentTarget as HTMLElement).style.background = isNew
                    ? 'rgba(201,167,10,0.02)'
                    : 'transparent'
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold"
                    style={{
                      background: isNew ? 'rgba(201,167,10,0.12)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isNew ? 'rgba(201,167,10,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      color: isNew ? '#c9a70a' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {getInitials(e.name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Unread dot */}
                      {isNew && (
                        <span className="w-2 h-2 rounded-full bg-[#c9a70a] flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(201,167,10,0.5)' }} />
                      )}
                      {/* Name */}
                      <span className={`text-sm ${isNew ? 'font-semibold text-white' : 'font-medium text-nw-200'}`}>
                        {e.name}
                      </span>
                      {/* Type pill */}
                      <span
                        className="text-[10px] font-semibold rounded-md"
                        style={{
                          padding: '1px 7px',
                          background: `${typeColor}12`,
                          color: typeColor,
                          border: `1px solid ${typeColor}25`,
                        }}
                      >
                        {e.enquiry_type}
                      </span>
                      {/* Status pill */}
                      <span
                        className="text-[10px] font-semibold capitalize rounded-md ml-auto flex-shrink-0"
                        style={{
                          padding: '1px 7px',
                          background: `${STATUS_CONFIG[e.status].color}12`,
                          color: STATUS_CONFIG[e.status].color,
                          border: `1px solid ${STATUS_CONFIG[e.status].color}25`,
                        }}
                      >
                        {e.status}
                      </span>
                      {/* Time */}
                      <span className="text-[11px] text-nw-600 flex-shrink-0 tabular-nums">
                        {timeAgo(e.created_at)}
                      </span>
                    </div>
                    {/* Message preview */}
                    <p className={`text-xs leading-relaxed truncate ${isNew ? 'text-nw-300' : 'text-nw-500'}`}>
                      {e.message || 'No message'}
                    </p>
                    {/* Email subtitle */}
                    <p className="text-[11px] text-nw-600 mt-1">{e.email}</p>
                  </div>

                  {/* Arrow on hover */}
                  <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity text-nw-600 group-hover:text-gold-500">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
