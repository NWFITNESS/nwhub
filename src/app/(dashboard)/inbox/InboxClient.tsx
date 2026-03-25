'use client'

import { useState } from 'react'
import { EmailPanel } from '@/components/inbox/EmailPanel'
import { TaskBoard } from '@/components/inbox/TaskBoard'
import { Zap, RefreshCw, Mail, AlertCircle, Send } from 'lucide-react'

interface Email {
  id: string
  gmail_message_id: string
  sender: string
  sender_name: string | null
  subject: string
  preview: string | null
  received_at: string | null
  category: string
  ai_summary: string | null
  flagged: boolean
  archived: boolean
  task_created: boolean
  task_id: string | null
}

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
  initialEmails: Email[]
  initialTasks: Task[]
  gmailConnected: boolean
}

export function InboxClient({ initialEmails, initialTasks, gmailConnected }: Props) {
  const [emails, setEmails] = useState<Email[]>(initialEmails)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [processing, setProcessing] = useState(false)
  const [bulkSorting, setBulkSorting] = useState(false)
  const [sendingDigest, setSendingDigest] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)

  const needsActionCount = emails.filter(e => e.flagged && !e.archived).length
  const totalCount = emails.length

  async function refreshEmails() {
    const res = await fetch('/api/inbox/emails')
    if (res.ok) setEmails(await res.json())
  }

  async function refreshTasks() {
    const res = await fetch('/api/tasks')
    if (res.ok) setTasks(await res.json())
  }

  async function handleProcess() {
    setProcessing(true)
    setLastResult(null)
    try {
      const res = await fetch('/api/inbox/process', { method: 'POST' })
      const data = await res.json()
      setLastResult(`Processed ${data.processed} emails, archived ${data.archived}, created ${data.tasks_created} tasks`)
      await refreshEmails()
      await refreshTasks()
    } finally {
      setProcessing(false)
    }
  }

  async function handleBulkSort() {
    setBulkSorting(true)
    setLastResult(null)

    // Poll progress while bulk sort runs in background
    const progressInterval = setInterval(async () => {
      const res = await fetch('/api/inbox/emails')
      if (res.ok) {
        const data = await res.json()
        setEmails(data)
      }
    }, 3000)

    try {
      const res = await fetch('/api/inbox/bulk-sort', { method: 'POST' })
      const data = await res.json()
      setLastResult(`Sorted ${data.processed} of ${data.total} emails, archived ${data.archived}, created ${data.tasks_created} tasks`)
      await refreshEmails()
      await refreshTasks()
    } finally {
      clearInterval(progressInterval)
      setBulkSorting(false)
    }
  }

  async function handleToggleTask(id: string, completed: boolean) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
  }

  async function handleAddTask(title: string, due_date?: string, priority?: string) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, due_date: due_date || null, priority: priority || 'medium' }),
    })
    if (res.ok) {
      const task = await res.json()
      setTasks(prev => [...prev, task])
    }
  }

  async function handleSendDigest() {
    setSendingDigest(true)
    setLastResult(null)
    try {
      const res = await fetch('/api/digest/send', { method: 'POST' })
      const data = await res.json()
      if (data.sent) setLastResult('Digest sent to info@northernwarrior.co.uk')
      else setLastResult(`Digest failed: ${data.error}`)
    } finally {
      setSendingDigest(false)
    }
  }

  async function handleDeleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="flex flex-col h-full bg-[#111110]">
      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#131312]">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-[15px] font-bold text-white tracking-tight">Inbox Intelligence</h1>
            <p className="text-[11px] text-white/40">AI-powered email processing</p>
          </div>
          {/* Status */}
          <div className="flex items-center gap-2 ml-2">
            <span className={`w-2 h-2 rounded-full ${gmailConnected ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[12px] text-white/50">{gmailConnected ? 'Gmail connected' : 'Not connected'}</span>
          </div>
          {/* Counts */}
          <div className="flex items-center gap-3 ml-2">
            <div className="flex items-center gap-1.5 text-[12px] text-white/50">
              <Mail size={12} />
              <span>{totalCount} emails</span>
            </div>
            {needsActionCount > 0 && (
              <div className="flex items-center gap-1.5 text-[12px] text-amber-400">
                <AlertCircle size={12} />
                <span>{needsActionCount} need action</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastResult && (
            <span className="text-[11px] text-white/40 max-w-xs truncate">{lastResult}</span>
          )}
          {!gmailConnected && (
            <a
              href="/api/gmail/connect"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#967705]/20 border border-[#967705]/40 text-[#f2ca50] text-[12px] font-semibold hover:bg-[#967705]/30 transition-colors"
            >
              Connect Gmail
            </a>
          )}
          <button
            onClick={handleProcess}
            disabled={processing || !gmailConnected}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/70 text-[12px] font-medium hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={13} className={processing ? 'animate-spin' : ''} />
            {processing ? 'Processing…' : 'Process New'}
          </button>
          <button
            onClick={handleBulkSort}
            disabled={bulkSorting || !gmailConnected}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#967705]/20 border border-[#967705]/40 text-[#f2ca50] text-[12px] font-semibold hover:bg-[#967705]/30 disabled:opacity-40 transition-colors"
          >
            <Zap size={13} className={bulkSorting ? 'animate-pulse' : ''} />
            {bulkSorting ? 'Sorting…' : 'Run Full Sort'}
          </button>
          <button
            onClick={handleSendDigest}
            disabled={sendingDigest}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/50 text-[12px] font-medium hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
          >
            <Send size={13} className={sendingDigest ? 'animate-pulse' : ''} />
            {sendingDigest ? 'Sending…' : 'Test Digest'}
          </button>
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left 55% — emails */}
        <div className="flex flex-col border-r border-white/[0.06]" style={{ width: '55%', minWidth: 0 }}>
          <EmailPanel
            emails={emails}
            onAddTask={handleAddTask}
            onRefresh={refreshEmails}
          />
        </div>
        {/* Right 45% — tasks */}
        <div className="flex flex-col" style={{ width: '45%', minWidth: 0 }}>
          <TaskBoard
            tasks={tasks}
            onToggle={handleToggleTask}
            onAdd={handleAddTask}
            onDelete={handleDeleteTask}
          />
        </div>
      </div>
    </div>
  )
}
