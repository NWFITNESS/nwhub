'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TodoQuickAddProps {
  onAdd: (data: {
    title: string
    due_date?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }) => Promise<void>
}

export function TodoQuickAdd({ onAdd }: TodoQuickAddProps) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    const trimmed = title.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      await onAdd({ title: trimmed, due_date: dueDate || undefined, priority })
      setTitle('')
      setDueDate('')
      setPriority('medium')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-[#1a1a1a] rounded-lg border border-white/[0.06]">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="Add a task…"
        className="flex-1 bg-transparent text-[13px] text-white placeholder-white/25 outline-none"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="bg-transparent text-[11px] text-white/40 outline-none cursor-pointer w-28"
        style={{ colorScheme: 'dark' }}
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as typeof priority)}
        className="bg-transparent text-[11px] text-white/40 outline-none cursor-pointer"
        style={{ colorScheme: 'dark' }}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <button
        onClick={handleAdd}
        disabled={loading || !title.trim()}
        className={cn(
          'flex items-center justify-center w-6 h-6 rounded-md transition-all',
          title.trim()
            ? 'bg-[#C9A70A] text-black hover:bg-[#d4af37]'
            : 'bg-white/5 text-white/20 cursor-not-allowed'
        )}
        aria-label="Add task"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
