'use client'

import { useState } from 'react'
import { EmailPanel } from '@/components/inbox/EmailPanel'
import { TaskBoard } from '@/components/inbox/TaskBoard'
import { InboxStats } from '@/components/inbox/InboxStats'
import { EmailDetailDrawer } from '@/components/inbox/EmailDetailDrawer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Card'
import { RefreshCw, Send, Mail, CheckSquare, Settings2 } from 'lucide-react'
import { RuleBuilder } from '@/components/inbox/RuleBuilder'
import { archiveEmail, bulkArchiveEmails } from '@/app/actions/inbox'

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
  has_invoice?: boolean
  rule_matched_id?: string | null
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

type Tab = 'emails' | 'tasks' | 'rules'

const TAB_CONFIG: { key: Tab; label: string; icon: typeof Mail }[] = [
  { key: 'emails', label: 'Emails', icon: Mail },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'rules', label: 'Rules', icon: Settings2 },
]

export function InboxClient({ initialEmails, initialTasks, gmailConnected }: Props) {
  const [emails, setEmails] = useState<Email[]>(initialEmails)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [processing, setProcessing] = useState(false)
  const [sendingDigest, setSendingDigest] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('emails')
  const [emailFilter, setEmailFilter] = useState<string | undefined>(undefined)
  const [drawerEmail, setDrawerEmail] = useState<Email | null>(null)

  const needsActionCount = emails.filter(e => e.flagged && !e.archived).length
  const openTaskCount = tasks.filter(t => !t.completed).length

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

  async function handleArchive(emailId: string) {
    try {
      await archiveEmail(emailId)
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, archived: true } : e))
    } catch (e) {
      alert((e as Error).message)
    }
  }

  async function handleBulkArchive(emailIds: string[]) {
    try {
      await bulkArchiveEmails(emailIds)
      const idSet = new Set(emailIds)
      setEmails(prev => prev.map(e => idSet.has(e.id) ? { ...e, archived: true } : e))
    } catch (e) {
      alert((e as Error).message)
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

  async function handleReclassify(emailId: string) {
    try {
      const res = await fetch('/api/inbox/reclassify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_id: emailId }),
      })
      if (res.ok) {
        const data = await res.json()
        setLastResult(`Reclassified: ${data.old_category} → ${data.new_category}`)
        const emailsRes = await fetch('/api/inbox/emails')
        if (emailsRes.ok) setEmails(await emailsRes.json())
      }
    } catch { /* ignore */ }
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

  async function handleBulkComplete(ids: string[]) {
    await Promise.all(ids.map(id =>
      fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
    ))
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, completed: true } : t))
  }

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map(id => fetch(`/api/tasks/${id}`, { method: 'DELETE' })))
    setTasks(prev => prev.filter(t => !ids.includes(t.id)))
  }

  function handleStatClick(targetTab: string, filter?: string) {
    if (targetTab === 'tasks') { setTab('tasks'); return }
    setTab('emails')
    setEmailFilter(filter)
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Comms"
        title="Inbox Intelligence"
        description={`${emails.length} emails processed${needsActionCount > 0 ? ` · ${needsActionCount} need action` : ''}`}
        actions={
          <>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-nw-800 border border-[rgba(255,255,255,0.07)]">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${gmailConnected ? 'bg-green-400 animate-pulse' : 'bg-nw-600'}`} />
                <span className="text-xs font-medium text-nw-400 whitespace-nowrap">
                  {gmailConnected ? 'Gmail' : 'Gmail off'}
                </span>
              </div>
            </div>

            <a href="/api/gmail/connect">
              <Button variant={gmailConnected ? 'ghost' : 'secondary'} size="sm">
                {gmailConnected ? 'Reconnect Gmail' : 'Connect Gmail'}
              </Button>
            </a>

            <Button variant="secondary" size="sm" onClick={handleProcess} loading={processing} disabled={!gmailConnected}>
              <RefreshCw size={13} /> Process New
            </Button>

            <Button
              variant="ghost" size="sm" loading={processing} disabled={!gmailConnected}
              onClick={async () => {
                setProcessing(true); setLastResult(null)
                try {
                  const res = await fetch('/api/inbox/process?force=true&lookback=7d', { method: 'POST' })
                  const data = await res.json()
                  setLastResult(`Processed ${data.processed} · ${data.tasks_created} tasks · ${data.archived} archived (7-day lookback)`)
                  refreshEmails()
                } finally { setProcessing(false) }
              }}
            >
              Process Older (7d)
            </Button>

            <Button variant="ghost" size="sm" onClick={handleSendDigest} loading={sendingDigest}>
              <Send size={13} /> Test Digest
            </Button>
          </>
        }
      />

      {lastResult && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{lastResult}</p>
      )}

      {/* Stats strip */}
      <InboxStats emails={emails} tasks={tasks} onStatClick={handleStatClick} />

      {/* Tab bar */}
      <div className="flex items-center gap-1.5 border-b border-[rgba(255,255,255,0.07)]" style={{ paddingBottom: 0 }}>
        {TAB_CONFIG.map(t => {
          const active = tab === t.key
          const count = t.key === 'emails' ? needsActionCount : t.key === 'tasks' ? openTaskCount : undefined
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); if (t.key === 'emails') setEmailFilter(undefined) }}
              className={`flex items-center gap-2 border-b-2 transition-colors ${
                active
                  ? 'border-[#C9A70A] text-[#C9A70A]'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
              style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600 }}
            >
              <t.icon size={15} />
              {t.label}
              {count !== undefined && count > 0 && (
                <span
                  className="rounded-full"
                  style={{
                    padding: '1px 7px', fontSize: 11, fontWeight: 700,
                    background: active ? 'rgba(201,167,10,0.15)' : 'rgba(255,255,255,0.06)',
                    color: active ? '#C9A70A' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content — full width */}
      {tab === 'emails' && (
        <Panel className="flex flex-col">
          <EmailPanel
            emails={emails}
            onAddTask={handleAddTask}
            onArchive={handleArchive}
            onBulkArchive={handleBulkArchive}
            onRefresh={refreshEmails}
            onReclassify={handleReclassify}
            onEmailClick={setDrawerEmail}
            initialFilter={emailFilter}
          />
        </Panel>
      )}

      {tab === 'tasks' && (
        <Panel className="flex flex-col">
          <TaskBoard
            tasks={tasks}
            onToggle={handleToggleTask}
            onAdd={handleAddTask}
            onDelete={handleDeleteTask}
            onBulkComplete={handleBulkComplete}
            onBulkDelete={handleBulkDelete}
          />
        </Panel>
      )}

      {tab === 'rules' && (
        <RuleBuilder />
      )}

      {/* Email detail drawer */}
      <EmailDetailDrawer
        email={drawerEmail}
        onClose={() => setDrawerEmail(null)}
        onAddTask={(title) => handleAddTask(title)}
        onArchive={handleArchive}
        onReclassify={handleReclassify}
      />
    </div>
  )
}
