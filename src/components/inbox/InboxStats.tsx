'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, UserPlus, Archive, CheckSquare, Mail } from 'lucide-react'

interface DailyStats {
  date: string
  total: number
  needs_attention: number
  new_lead: number
  spam: number
  archived: number
}

interface StatsData {
  daily: DailyStats[]
  totals: {
    processed: number
    needs_attention: number
    new_lead: number
    archived: number
    spam: number
  }
}

interface Props {
  emails: Array<{ category: string; archived: boolean; flagged: boolean }>
  tasks: Array<{ completed: boolean; due_date?: string | null }>
  onStatClick?: (tab: string, filter?: string) => void
}

export function InboxStats({ emails, tasks, onStatClick }: Props) {
  const [apiStats, setApiStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetch('/api/inbox/stats')
      .then(r => r.ok ? r.json() : null)
      .then(setApiStats)
      .catch(() => {})
  }, [])

  const needsAction = emails.filter(e => e.category === 'needs_attention' && !e.archived).length
  const newLeads = emails.filter(e => e.category === 'new_lead' && !e.archived).length
  const autoArchived = emails.filter(e => e.archived).length
  const openTasks = tasks.filter(t => !t.completed).length
  const overdueTasks = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length

  const daily = apiStats?.daily ?? []
  const maxDaily = Math.max(1, ...daily.map(d => d.total))
  const weekTotal = daily.reduce((a, d) => a + d.total, 0)

  const stats = [
    {
      label: 'Processed (7d)',
      value: apiStats?.totals.processed ?? emails.length,
      icon: Mail, accent: 'gold' as const,
      onClick: () => onStatClick?.('emails', 'all'),
    },
    {
      label: 'Needs Action',
      value: needsAction,
      icon: AlertTriangle,
      accent: (needsAction > 0 ? 'red' : 'muted') as const,
      onClick: () => onStatClick?.('emails', 'needs_attention'),
    },
    {
      label: 'New Leads',
      value: newLeads,
      icon: UserPlus,
      accent: (newLeads > 0 ? 'green' : 'muted') as const,
      onClick: () => onStatClick?.('emails', 'new_lead'),
    },
    {
      label: 'Auto-Archived',
      value: autoArchived,
      icon: Archive,
      accent: 'muted' as const,
      onClick: () => onStatClick?.('emails', 'archived'),
    },
    {
      label: 'Open Tasks',
      value: openTasks,
      icon: CheckSquare,
      accent: (overdueTasks > 0 ? 'amber' : 'gold') as const,
      sub: overdueTasks > 0 ? `${overdueTasks} overdue` : undefined,
      onClick: () => onStatClick?.('tasks'),
    },
  ]

  // Theme-safe accent colours (work in both dark and light mode)
  const accents = {
    gold:  { icon: '#C9A70A', value: '#C9A70A', bg: 'rgba(201,167,10,0.08)', border: 'rgba(201,167,10,0.2)' },
    red:   { icon: '#ef4444', value: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
    green: { icon: '#22c55e', value: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
    amber: { icon: '#f59e0b', value: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    muted: { icon: '#888', value: '#888', bg: 'rgba(128,128,128,0.06)', border: 'rgba(128,128,128,0.15)' },
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(s => {
          const a = accents[s.accent]
          return (
            <button
              key={s.label}
              onClick={s.onClick}
              className="flex flex-col rounded-xl border transition-all hover:brightness-110 cursor-pointer text-left"
              style={{ padding: '14px 16px', background: a.bg, borderColor: a.border }}
            >
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={14} style={{ color: a.icon }} />
                {/* Use nw-500 class so light mode CSS overrides work */}
                <span className="text-nw-500" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {s.label}
                </span>
              </div>
              <span style={{ fontSize: 26, fontWeight: 700, color: a.value, lineHeight: 1 }}>
                {s.value}
              </span>
              {s.sub && (
                <span style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>{s.sub}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 7-day activity bar — shows daily breakdown with category colours */}
      {daily.length > 0 && (
        <div className="rounded-xl border border-nw-700 bg-nw-800" style={{ padding: '14px 18px' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-nw-500" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Last 7 Days
            </span>
            <span className="text-nw-400" style={{ fontSize: 12 }}>
              {weekTotal} emails processed
            </span>
          </div>
          <div className="flex items-end gap-2" style={{ height: 48 }}>
            {daily.map((d, i) => {
              const pct = d.total / maxDaily
              const h = Math.max(6, pct * 44)
              const isToday = i === daily.length - 1
              const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })
              return (
                <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1" title={`${dayLabel}: ${d.total} emails (${d.needs_attention} action, ${d.new_lead} leads)`}>
                  {/* Stacked bar */}
                  <div className="w-full flex flex-col justify-end rounded-md overflow-hidden" style={{ height: h, minWidth: 8 }}>
                    {d.needs_attention > 0 && (
                      <div style={{ height: Math.max(3, (d.needs_attention / d.total) * h), background: '#ef4444' }} />
                    )}
                    {d.new_lead > 0 && (
                      <div style={{ height: Math.max(3, (d.new_lead / d.total) * h), background: '#22c55e' }} />
                    )}
                    <div style={{ flex: 1, background: isToday ? '#C9A70A' : 'rgba(201,167,10,0.3)' }} />
                  </div>
                  {/* Day label */}
                  <span className={isToday ? 'text-nw-300' : 'text-nw-600'} style={{ fontSize: 10, fontWeight: isToday ? 600 : 400 }}>
                    {isToday ? 'Today' : dayLabel}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 border-t border-nw-700" style={{ paddingTop: 8 }}>
            <span className="flex items-center gap-1.5 text-nw-500" style={{ fontSize: 10 }}>
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#C9A70A' }} /> Other
            </span>
            <span className="flex items-center gap-1.5 text-nw-500" style={{ fontSize: 10 }}>
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#ef4444' }} /> Needs Action
            </span>
            <span className="flex items-center gap-1.5 text-nw-500" style={{ fontSize: 10 }}>
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#22c55e' }} /> New Leads
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
