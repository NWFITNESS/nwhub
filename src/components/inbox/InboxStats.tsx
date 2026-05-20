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

  // Compute from loaded data (instant, no API wait)
  const needsAction = emails.filter(e => e.category === 'needs_attention' && !e.archived).length
  const newLeads = emails.filter(e => e.category === 'new_lead' && !e.archived).length
  const autoArchived = emails.filter(e => e.archived).length
  const openTasks = tasks.filter(t => !t.completed).length
  const overdueTasks = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length

  // 7-day sparkline from API
  const daily = apiStats?.daily ?? []
  const maxDaily = Math.max(1, ...daily.map(d => d.total))

  const stats = [
    {
      label: 'Processed (7d)',
      value: apiStats?.totals.processed ?? emails.length,
      icon: Mail, color: '#C9A70A', bgColor: 'rgba(201,167,10,0.08)', borderColor: 'rgba(201,167,10,0.2)',
      onClick: () => onStatClick?.('emails', 'all'),
    },
    {
      label: 'Needs Action',
      value: needsAction,
      icon: AlertTriangle,
      color: needsAction > 0 ? '#ef4444' : '#666',
      bgColor: needsAction > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
      borderColor: needsAction > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
      onClick: () => onStatClick?.('emails', 'needs_attention'),
    },
    {
      label: 'New Leads',
      value: newLeads,
      icon: UserPlus,
      color: newLeads > 0 ? '#22c55e' : '#666',
      bgColor: newLeads > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
      borderColor: newLeads > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
      onClick: () => onStatClick?.('emails', 'new_lead'),
    },
    {
      label: 'Auto-Archived',
      value: autoArchived,
      icon: Archive, color: '#666', bgColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)',
      onClick: () => onStatClick?.('emails', 'archived'),
    },
    {
      label: 'Open Tasks',
      value: openTasks,
      icon: CheckSquare,
      color: overdueTasks > 0 ? '#f59e0b' : '#C9A70A',
      bgColor: overdueTasks > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(201,167,10,0.08)',
      borderColor: overdueTasks > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(201,167,10,0.2)',
      sub: overdueTasks > 0 ? `${overdueTasks} overdue` : undefined,
      onClick: () => onStatClick?.('tasks'),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(s => (
          <button
            key={s.label}
            onClick={s.onClick}
            className="flex flex-col rounded-xl border transition-all hover:brightness-110 cursor-pointer text-left"
            style={{ padding: '14px 16px', background: s.bgColor, borderColor: s.borderColor }}
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={14} style={{ color: s.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                {s.label}
              </span>
            </div>
            <span style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </span>
            {s.sub && (
              <span style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>{s.sub}</span>
            )}
          </button>
        ))}
      </div>

      {/* 7-day sparkline */}
      {daily.length > 0 && (
        <div className="flex items-end gap-1.5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]" style={{ padding: '12px 16px', height: 56 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginRight: 8, alignSelf: 'center', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            7d
          </span>
          {daily.map((d, i) => {
            const h = Math.max(4, (d.total / maxDaily) * 28)
            const isToday = i === daily.length - 1
            return (
              <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full rounded-sm transition-all"
                  style={{ height: h, background: isToday ? '#C9A70A' : 'rgba(201,167,10,0.35)', minWidth: 6, maxWidth: 32 }}
                  title={`${d.date}: ${d.total} emails`}
                />
                <span style={{ fontSize: 8, color: isToday ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>
                  {new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'narrow' })}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
