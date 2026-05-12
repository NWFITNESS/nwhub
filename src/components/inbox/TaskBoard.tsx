'use client'

import { useState } from 'react'
import { TaskItem } from './TaskItem'
import { Plus, CheckSquare, Square, CheckCheck, Trash2, X } from 'lucide-react'

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
  onBulkComplete: (ids: string[]) => Promise<void>
  onBulkDelete: (ids: string[]) => Promise<void>
}

function groupTasks(tasks: Task[]) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setDate(todayEnd.getDate() + 1)
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7)

  const overdue: Task[] = [], today: Task[] = [], thisWeek: Task[] = [], later: Task[] = [], noDueDate: Task[] = []

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

export function TaskBoard({ tasks, onToggle, onAdd, onDelete, onBulkComplete, onBulkDelete }: Props) {
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('')
  const [filter, setFilter] = useState<'active' | 'all' | 'done'>('active')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const { overdue, today, thisWeek, later } = groupTasks(tasks)
  const doneTasks = tasks.filter(t => t.completed)

  // All visible task IDs in current view (for select-all)
  const visibleActiveTasks: Task[] = [...overdue, ...today, ...thisWeek, ...later]
  const visibleTasks = filter === 'done' ? doneTasks : filter === 'all' ? [...visibleActiveTasks, ...doneTasks] : visibleActiveTasks
  const allSelected = visibleTasks.length > 0 && visibleTasks.every(t => selectedIds.has(t.id))
  const someSelected = selectedIds.size > 0

  function toggleSelectMode() {
    setSelectMode(v => !v)
    setSelectedIds(new Set())
  }

  function toggleId(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleTasks.map(t => t.id)))
    }
  }

  async function handleBulkComplete() {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      await onBulkComplete(Array.from(selectedIds))
      setSelectedIds(new Set())
      setSelectMode(false)
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      await onBulkDelete(Array.from(selectedIds))
      setSelectedIds(new Set())
      setSelectMode(false)
    } finally {
      setBulkLoading(false)
    }
  }

  function handleAdd() {
    if (!newTitle.trim()) return
    onAdd(newTitle.trim(), newDue || undefined)
    setNewTitle('')
    setNewDue('')
  }

  const Section = ({ label, items, accent }: { label: string; items: Task[]; accent?: string }) => {
    if (items.length === 0) return null
    return (
      <div className="mb-4">
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${accent ?? 'text-white/30'}`}>{label}</p>
        <div className="space-y-1">
          {items.map(t => (
            <TaskItem
              key={t.id}
              task={t}
              onToggle={onToggle}
              onDelete={onDelete}
              selectable={selectMode}
              selected={selectedIds.has(t.id)}
              onSelect={toggleId}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="border-b border-white/[0.06]" style={{ paddingLeft: 18, paddingRight: 18, paddingTop: 18, paddingBottom: 16 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[#d4af37]/70 uppercase tracking-[0.2em]">
              To Do
            </p>
            {overdue.length > 0 && (
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-red-400">
                {overdue.length} overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Filter tabs */}
            {!selectMode && (['active', 'all', 'done'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors capitalize ${
                  filter === f
                    ? 'bg-[#967705]/20 border border-[#967705]/40 text-[#c9a70a]'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {f}
              </button>
            ))}

            {/* Select mode toggle */}
            <button
              onClick={toggleSelectMode}
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all ml-1 ${
                selectMode
                  ? 'bg-gold-600/15 border-gold-600/40 text-gold-300'
                  : 'border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/20'
              }`}
            >
              {selectMode ? <CheckSquare size={12} /> : <Square size={12} />}
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          </div>
        </div>

        {/* Select-all bar — shown only in select mode */}
        {selectMode && (
          <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-white/[0.06]">
            <button
              onClick={toggleSelectAll}
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                allSelected
                  ? 'bg-gold-500 border-gold-500'
                  : someSelected
                  ? 'bg-gold-500/30 border-gold-500/60'
                  : 'border-white/25 hover:border-gold-500/60'
              }`}
            >
              {allSelected && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {!allSelected && someSelected && (
                <div className="w-2 h-0.5 bg-gold-400 rounded-full" />
              )}
            </button>
            <span className="text-[11px] text-white/40">
              {someSelected ? `${selectedIds.size} selected` : 'Select all'}
            </span>
          </div>
        )}
      </div>

      {/* Quick add — hidden in select mode */}
      {!selectMode && (
        <div className="flex items-center gap-2 border-b border-white/[0.06]" style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Add a task…"
            className="flex-1 bg-transparent text-[13px] text-white placeholder-white/20 outline-none min-w-0"
          />
          <input
            type="date"
            value={newDue}
            onChange={e => setNewDue(e.target.value)}
            className="bg-[#1c1b1b] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white/50 outline-none focus:border-[#d4af37]/40"
          />
          <button
            onClick={handleAdd}
            className="w-7 h-7 rounded-lg bg-[#967705]/20 border border-[#967705]/40 text-[#c9a70a] flex items-center justify-center hover:bg-[#967705]/30 transition-colors flex-shrink-0"
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      {/* Task list */}
      <div style={{ padding: 16 }}>
        {filter === 'done' && !selectMode ? (
          <div className="space-y-1">
            {doneTasks.length === 0 ? (
              <p className="text-[13px] text-white/25 text-center py-10">No completed tasks</p>
            ) : doneTasks.map(t => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={onToggle}
                onDelete={onDelete}
                selectable={selectMode}
                selected={selectedIds.has(t.id)}
                onSelect={toggleId}
              />
            ))}
          </div>
        ) : (
          <>
            <Section label="Overdue" items={overdue} accent="text-red-400" />
            <Section label="Today" items={today} accent="text-orange-400" />
            <Section label="This Week" items={thisWeek} accent="text-[#c9a70a]" />
            <Section label="Later" items={later} />
            {!selectMode && filter === 'active' && overdue.length === 0 && today.length === 0 && thisWeek.length === 0 && later.length === 0 && (
              <p className="text-[13px] text-white/25 text-center py-10">All caught up ✓</p>
            )}
            {!selectMode && filter === 'all' && doneTasks.slice(0, 5).map(t => (
              <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
            ))}
            {selectMode && filter === 'all' && doneTasks.map(t => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={onToggle}
                onDelete={onDelete}
                selectable
                selected={selectedIds.has(t.id)}
                onSelect={toggleId}
              />
            ))}
          </>
        )}
      </div>

      {/* Bulk action bar — floats inside the panel when items are selected */}
      {selectMode && someSelected && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-nw-800 border border-gold-600/20 shadow-lg" style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}>
          <span className="text-[12px] font-semibold text-gold-300 flex-1">
            {selectedIds.size} task{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkComplete}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-gold-600/20 border border-gold-600/40 text-gold-300 hover:bg-gold-600/30 transition-all disabled:opacity-50"
          >
            <CheckCheck size={12} />
            Mark done
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <Trash2 size={12} />
            Delete
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="w-6 h-6 flex items-center justify-center rounded-md text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
