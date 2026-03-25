'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isPast, isToday, differenceInDays, parseISO } from 'date-fns'

interface Todo {
  id: string
  title: string
  notes?: string | null
  completed: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string | null
  source: 'manual' | 'email'
  email_subject?: string | null
  email_from?: string | null
  tags: string[]
}

interface TodoItemProps {
  todo: Todo
  onUpdate: (id: string, updates: Partial<Todo>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function dueDateBadgeStyle(dueDate: string | null | undefined): string | null {
  if (!dueDate) return null
  const date = parseISO(dueDate)
  if (isPast(date) && !isToday(date)) {
    return 'bg-red-500/20 text-red-400 border border-red-500/30'
  }
  if (isToday(date)) {
    return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
  }
  const diff = differenceInDays(date, new Date())
  if (diff <= 3) {
    return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  }
  return 'bg-[#967705]/15 text-[#C9A70A] border border-[#967705]/25'
}

const priorityDot: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-[#C9A70A]',
  low: 'bg-white/20',
}

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [hovered, setHovered] = useState(false)

  const badgeStyle = dueDateBadgeStyle(todo.due_date)

  async function handleToggle() {
    await onUpdate(todo.id, { completed: !todo.completed })
  }

  async function handleSaveTitle() {
    if (editTitle.trim() && editTitle !== todo.title) {
      await onUpdate(todo.id, { title: editTitle.trim() })
    }
    setEditing(false)
  }

  return (
    <div
      className={cn(
        'group flex flex-col gap-1 px-3 py-2.5 rounded-lg border transition-colors duration-150',
        todo.completed
          ? 'border-white/[0.04] bg-white/[0.02] opacity-60'
          : 'border-white/[0.06] bg-[#1a1a1a] hover:border-white/10'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-2.5">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={cn(
            'mt-0.5 flex-shrink-0 w-4.5 h-4.5 rounded border transition-all duration-200 flex items-center justify-center',
            todo.completed
              ? 'bg-[#C9A70A] border-[#C9A70A]'
              : 'border-white/20 hover:border-[#C9A70A]/60'
          )}
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {todo.completed && <Check size={10} className="text-black" strokeWidth={3} />}
        </button>

        {/* Priority dot */}
        <div className={cn('mt-1.5 w-2 h-2 rounded-full flex-shrink-0', priorityDot[todo.priority])} />

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle()
                if (e.key === 'Escape') { setEditTitle(todo.title); setEditing(false) }
              }}
              className="w-full bg-transparent text-[13px] text-white outline-none border-b border-[#C9A70A]/50 pb-0.5"
            />
          ) : (
            <span
              className={cn(
                'text-[13px] cursor-pointer leading-snug',
                todo.completed ? 'line-through text-white/30' : 'text-white/85'
              )}
              onClick={() => !todo.completed && setEditing(true)}
            >
              {todo.title}
            </span>
          )}

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-1.5 mt-1">
            {badgeStyle && todo.due_date && (
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', badgeStyle)}>
                {isToday(parseISO(todo.due_date))
                  ? 'Today'
                  : isPast(parseISO(todo.due_date))
                  ? `Overdue · ${format(parseISO(todo.due_date), 'd MMM')}`
                  : format(parseISO(todo.due_date), 'd MMM')}
              </span>
            )}

            {todo.source === 'email' && todo.email_subject && (
              <span className="flex items-center gap-1 text-[10px] text-white/30 max-w-[160px] truncate">
                <Mail size={9} />
                {todo.email_subject}
              </span>
            )}
          </div>
        </div>

        {/* Actions (hover) */}
        <div className={cn('flex items-center gap-1 flex-shrink-0 transition-opacity', hovered ? 'opacity-100' : 'opacity-0')}>
          {todo.notes && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
              aria-label="Toggle notes"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded text-white/30 hover:text-[#C9A70A] transition-colors"
            aria-label="Edit task"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1 rounded text-white/30 hover:text-red-400 transition-colors"
            aria-label="Delete task"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Notes */}
      {expanded && todo.notes && (
        <div className="ml-[calc(0.625rem+0.5rem+0.625rem)] text-[12px] text-white/40 leading-relaxed">
          {todo.notes}
        </div>
      )}
    </div>
  )
}
