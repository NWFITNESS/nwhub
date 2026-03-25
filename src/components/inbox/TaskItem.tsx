'use client'

import { useState } from 'react'
import { Trash2, Mail } from 'lucide-react'

interface Task {
  id: string
  title: string
  due_date: string | null
  completed: boolean
  priority: string
  source: string
}

interface Props {
  task: Task
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

function dueBadge(due_date: string | null, completed: boolean): { label: string; className: string } | null {
  if (!due_date) return null
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const d = new Date(due_date + 'T00:00:00')
  const diff = Math.floor((d.getTime() - now.getTime()) / 86400000)
  if (completed) return null
  if (diff < 0) return { label: 'Overdue', className: 'bg-red-500/20 text-red-400 border-red-500/30' }
  if (diff === 0) return { label: 'Today', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
  if (diff <= 3) return { label: `${diff}d`, className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
  return { label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), className: 'bg-[#967705]/15 text-[#C9A70A] border-[#967705]/25' }
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-[#C9A70A]',
  low: 'bg-white/20',
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  const [hovered, setHovered] = useState(false)
  const badge = dueBadge(task.due_date, task.completed)

  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.03] group transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
          task.completed
            ? 'bg-[#C9A70A] border-[#C9A70A]'
            : 'border-white/20 hover:border-[#C9A70A]'
        }`}
      >
        {task.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-white/20'}`} />

      {/* Title */}
      <span className={`flex-1 text-[13px] min-w-0 truncate ${task.completed ? 'line-through text-white/30' : 'text-white/80'}`}>
        {task.title}
      </span>

      {/* Source tag */}
      {task.source === 'email' && (
        <Mail size={11} className="text-white/25 flex-shrink-0" />
      )}

      {/* Due badge */}
      {badge && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${badge.className}`}>
          {badge.label}
        </span>
      )}

      {/* Delete */}
      {hovered && (
        <button
          onClick={() => onDelete(task.id)}
          className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}
