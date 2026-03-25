'use client'

import { useState } from 'react'
import { TaskItem } from './TaskItem'
import { Plus, CheckSquare } from 'lucide-react'

interface Task {
  id: string
  title: string
  notes: string | null
  due_date: string | null
  completed: boolean
  priority: string
  source: string
  email_id: string | null
  created_at: string
}

interface Props {
  tasks: Task[]
  onToggle: (id: string, completed: boolean) => void
  onAdd: (title: string, due_date?: string, priority?: string) => void
  onDelete: (id: string) => void
}

function groupTasks(tasks: Task[]) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setDate(todayEnd.getDate() + 1)
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7)

  const overdue: Task[] = []
  const today: Task[] = []
  const thisWeek: Task[] = []
  const later: Task[] = []
  const noDueDate: Task[] = []

  for (const t of tasks) {
    if (t.completed) continue
    if (!t.due_date) { noDueDate.push(t); continue }
    const d = new Date(t.due_date + 'T00:00:00')
    if (d < now) overdue.push(t)
    else if (d < todayEnd) today.push(t)
    else if (d < weekEnd) thisWeek.push(t)
    else later.push(t)
  }
  return { overdue, today, thisWeek, later: [...later, ...noDueDate] }
}

export function TaskBoard({ tasks, onToggle, onAdd, onDelete }: Props) {
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('')
  const [filter, setFilter] = useState<'active' | 'all' | 'done'>('active')
  const { overdue, today, thisWeek, later } = groupTasks(tasks)
  const doneTasks = tasks.filter(t => t.completed)

  function handleAdd() {
    if (!newTitle.trim()) return
    onAdd(newTitle.trim(), newDue || undefined)
    setNewTitle('')
    setNewDue('')
  }

  function Section({ label, items, accent }: { label: string; items: Task[]; accent?: string }) {
    if (items.length === 0) return null
    return (
      <div className="mb-4">
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${accent ?? 'text-white/35'}`}>{label}</p>
        <div className="space-y-1.5">
          {items.map(t => (
            <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <CheckSquare size={14} className="text-[#f2ca50]" />
          <span className="text-[13px] font-semibold text-white">Tasks</span>
          {overdue.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">{overdue.length} overdue</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {(['active', 'all', 'done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`text-[11px] px-2 py-0.5 rounded transition-colors capitalize ${filter === f ? 'text-[#f2ca50] bg-[#967705]/20' : 'text-white/40 hover:text-white/60'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Quick add */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a task…"
          className="flex-1 bg-transparent text-[13px] text-white placeholder-white/25 outline-none min-w-0"
        />
        <input
          type="date"
          value={newDue}
          onChange={e => setNewDue(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/50 outline-none"
        />
        <button
          onClick={handleAdd}
          className="w-7 h-7 rounded-lg bg-[#967705]/20 border border-[#967705]/40 text-[#f2ca50] flex items-center justify-center hover:bg-[#967705]/30 transition-colors flex-shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {filter === 'done' ? (
          <div className="space-y-1.5">
            {doneTasks.length === 0 ? (
              <p className="text-[13px] text-white/30 text-center py-8">No completed tasks</p>
            ) : doneTasks.map(t => (
              <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        ) : filter === 'all' ? (
          <>
            <Section label="Overdue" items={overdue} accent="text-red-400" />
            <Section label="Today" items={today} accent="text-orange-400" />
            <Section label="This Week" items={thisWeek} accent="text-[#f2ca50]" />
            <Section label="Later" items={later} />
            {doneTasks.slice(0, 5).map(t => <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />)}
          </>
        ) : (
          <>
            <Section label="Overdue" items={overdue} accent="text-red-400" />
            <Section label="Today" items={today} accent="text-orange-400" />
            <Section label="This Week" items={thisWeek} accent="text-[#f2ca50]" />
            <Section label="Later" items={later} />
            {overdue.length === 0 && today.length === 0 && thisWeek.length === 0 && later.length === 0 && (
              <p className="text-[13px] text-white/30 text-center py-8">All caught up</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
