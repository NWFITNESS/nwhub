'use client'

import Link from 'next/link'
import { Mail, CheckSquare, UserPlus, AlertTriangle, Clock } from 'lucide-react'

interface Enquiry {
  id: string
  name: string
  email: string
  subject: string | null
  status: string
  created_at: string
}

interface Task {
  id: string
  title: string
  due_date: string | null
  completed: boolean
  priority: string
  source: string
  created_at: string
}

interface Props {
  enquiries: Enquiry[]
  tasks: Task[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type FeedItem = { type: 'enquiry'; data: Enquiry; at: string } | { type: 'task'; data: Task; at: string }

export function ActivityFeed({ enquiries, tasks }: Props) {
  // Merge enquiries and tasks into a single timeline, sorted by most recent
  const items: FeedItem[] = [
    ...enquiries.map(e => ({ type: 'enquiry' as const, data: e, at: e.created_at })),
    ...tasks.filter(t => !t.completed).map(t => ({ type: 'task' as const, data: t, at: t.created_at })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 12)

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center text-nw-500" style={{ padding: '40px 16px', fontSize: 13 }}>
        No recent activity
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {items.map((item, i) => {
        if (item.type === 'enquiry') {
          const e = item.data
          const isNew = e.status === 'new'
          return (
            <Link
              key={`e-${e.id}`}
              href="/enquiries"
              className="flex items-start gap-3 border-b border-[rgba(255,255,255,0.05)] no-underline transition-colors hover:bg-[rgba(255,255,255,0.02)]"
              style={{ padding: '12px 16px' }}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isNew ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isNew ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                {isNew ? <UserPlus size={14} style={{ color: '#4ade80' }} /> : <Mail size={14} className="text-nw-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-nw-200 truncate" style={{ fontSize: 13, fontWeight: 500 }}>
                  {e.name}
                </p>
                <p className="text-nw-500 truncate" style={{ fontSize: 12 }}>
                  {e.subject || 'New enquiry'}
                </p>
              </div>
              <span className="text-nw-600 flex-shrink-0" style={{ fontSize: 11 }}>{timeAgo(e.created_at)}</span>
            </Link>
          )
        }

        const t = item.data
        const isOverdue = t.due_date && new Date(t.due_date) < new Date()
        return (
          <div
            key={`t-${t.id}`}
            className="flex items-start gap-3 border-b border-[rgba(255,255,255,0.05)]"
            style={{ padding: '12px 16px' }}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(201,167,10,0.08)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(201,167,10,0.15)'}` }}>
              {isOverdue ? <AlertTriangle size={14} style={{ color: '#f87171' }} /> : <CheckSquare size={14} style={{ color: '#C9A70A' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-nw-200 truncate" style={{ fontSize: 13, fontWeight: 500 }}>
                {t.title}
              </p>
              <p className="text-nw-500" style={{ fontSize: 12 }}>
                {t.source === 'email' ? 'From inbox' : 'Task'}
                {t.due_date && ` · Due ${new Date(t.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
              </p>
            </div>
            <span className="text-nw-600 flex-shrink-0" style={{ fontSize: 11 }}>{timeAgo(t.created_at)}</span>
          </div>
        )
      })}
    </div>
  )
}
