'use client'

import { useState } from 'react'
import { EmailPanel } from '@/components/inbox/EmailPanel'
import { TaskBoard } from '@/components/inbox/TaskBoard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Card'
import { Zap, RefreshCw, Send } from 'lucide-react'

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
      const res = await fetch('/api/inbox/process?force=true', { method: 'POST' })
      const data = await res.json()
      setLastResult(`Processed ${data.processed} emails · archived ${data.archived} · ${data.tasks_created} tasks created`)
      await refreshEmails()
      await refreshTasks()
    } finally {
      setProcessing(false)
    }
  }

  async function handleBulkSort() {
    setBulkSorting(true)
    setLastResult(null)
    const progressInterval = setInterval(async () => {
      const res = await fetch('/api/inbox/emails')
      if (res.ok) setEmails(await res.json())
    }, 3000)
    try {
      const res = await fetch('/api/inbox/bulk-sort', { method: 'POST' })
      const data = await res.json()
      const errSuffix = data.errors?.length ? ` · Errors: ${data.errors[0]}` : ''
      setLastResult(`Sorted ${data.processed} of ${data.total} emails · archived ${data.archived} · ${data.tasks_created} tasks created${errSuffix}`)
      await refreshEmails()
      await refreshTasks()
    } finally {
      clearInterval(progressInterval)
      setBulkSorting(false)
    }
  }

  async function handleSendDigest() {
    setSendingDigest(true)
    setLastResult(null)
    try {
      const res = await fetch('/api/digest/send?force=true', { method: 'POST' })
      const data = await res.json()
      setLastResult(data.sent ? 'Digest sent ✓' : `Digest failed: ${data.error ?? data.reason}`)
    } finally {
      setSendingDigest(false)
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

  async function handleDeleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Comms"
        title="Inbox Intelligence"
        description={`${totalCount} emails processed${needsActionCount > 0 ? ` · ${needsActionCount} need action` : ''}`}
        actions={
          <>
            {/* Gmail status pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-nw-800 border border-[rgba(255,255,255,0.07)]">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${gmailConnected ? 'bg-green-400 animate-pulse' : 'bg-nw-600'}`} />
              <span className="text-[11px] text-nw-500 whitespace-nowrap">
                {gmailConnected ? 'Gmail live' : 'Not connected'}
              </span>
            </div>

            {!gmailConnected && (
              <a href="/api/gmail/connect">
                <Button variant="primary" size="sm">Connect Gmail</Button>
              </a>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleProcess}
              loading={processing}
              disabled={!gmailConnected}
            >
              <RefreshCw size={13} />
              Process New
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkSort}
              loading={bulkSorting}
              disabled={!gmailConnected}
            >
              <Zap size={13} />
              {bulkSorting ? 'Sorting…' : 'Run Full Sort'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendDigest}
              loading={sendingDigest}
            >
              <Send size={13} />
              Test Digest
            </Button>
          </>
        }
      />

      {lastResult && (
        <p className="text-[12px] text-nw-500">{lastResult}</p>
      )}

      {/* Two-panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <Panel className="flex flex-col">
            <EmailPanel
              emails={emails}
              onAddTask={handleAddTask}
              onRefresh={refreshEmails}
            />
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <Panel className="flex flex-col">
            <TaskBoard
              tasks={tasks}
              onToggle={handleToggleTask}
              onAdd={handleAddTask}
              onDelete={handleDeleteTask}
            />
          </Panel>
        </div>
      </div>
    </div>
  )
}
