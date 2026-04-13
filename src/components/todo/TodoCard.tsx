'use client'

import { useState, useMemo } from 'react'
import { isPast, isToday, parseISO } from 'date-fns'
import { TodoItem } from './TodoItem'
import { TodoQuickAdd } from './TodoQuickAdd'
import { CheckSquare2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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

type Filter = 'all' | 'active' | 'done' | 'overdue'

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'done', label: 'Done' },
  { key: 'overdue', label: 'Overdue' },
]

const PRIORITY_WEIGHT: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

interface TodoCardProps {
  initialTodos: Todo[]
}

export function TodoCard({ initialTodos }: TodoCardProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [filter, setFilter] = useState<Filter>('active')

  const filtered = useMemo(() => {
    let list = [...todos]

    if (filter === 'active') list = list.filter((t) => !t.completed)
    else if (filter === 'done') list = list.filter((t) => t.completed)
    else if (filter === 'overdue') {
      list = list.filter(
        (t) => !t.completed && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
      )
    }

    // Sort: overdue first, then by due_date asc, then by priority
    list.sort((a, b) => {
      const aOverdue = a.due_date && isPast(parseISO(a.due_date)) && !isToday(parseISO(a.due_date))
      const bOverdue = b.due_date && isPast(parseISO(b.due_date)) && !isToday(parseISO(b.due_date))
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1

      if (a.due_date && b.due_date) {
        const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        if (diff !== 0) return diff
      } else if (a.due_date) return -1
      else if (b.due_date) return 1

      return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
    })

    return list
  }, [todos, filter])

  const overdueCount = todos.filter(
    (t) => !t.completed && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
  ).length

  async function handleAdd(data: { title: string; due_date?: string; priority: 'low' | 'medium' | 'high' | 'urgent' }) {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, source: 'manual' }),
    })
    if (res.ok) {
      const todo = await res.json()
      setTodos((prev) => [todo, ...prev])
    }
  }

  async function handleUpdate(id: string, updates: Partial<Todo>) {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated = await res.json()
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)))
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setTodos((prev) => prev.filter((t) => t.id !== id))
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/[0.06]" style={{ paddingLeft: 18, paddingRight: 18, paddingTop: 18, paddingBottom: 12 }}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium mb-0.5">Tasks</p>
            <h2
              className="text-xl font-bold text-[#C9A70A]"
              style={{ fontFamily: 'var(--font-rajdhani, Rajdhani), system-ui, sans-serif' }}
            >
              To Do
            </h2>
          </div>
          <CheckSquare2 size={20} className="text-[#C9A70A]/40 mt-1" />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1">
          {FILTER_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-medium transition-all',
                filter === key
                  ? 'bg-[#C9A70A]/20 text-[#C9A70A] border border-[#C9A70A]/30'
                  : 'text-white/40 hover:text-white/60 border border-transparent'
              )}
            >
              {label}
              {key === 'overdue' && overdueCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[9px] px-1 py-px rounded-full">
                  {overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add */}
      <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12 }}>
        <TodoQuickAdd onAdd={handleAdd} />
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto space-y-1.5" style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <CheckSquare2 size={28} className="text-white/10" />
            <p className="text-[13px] text-white/25">
              {filter === 'done' ? 'No completed tasks' : filter === 'overdue' ? 'Nothing overdue' : 'No tasks yet'}
            </p>
          </div>
        ) : (
          filtered.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
