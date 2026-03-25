'use client'

import { EmailTriageCard } from '@/components/todo/EmailTriageCard'
import { TodoCard } from '@/components/todo/TodoCard'
import { useState } from 'react'

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

interface Email {
  id: string
  gmail_id: string
  from_email: string | null
  from_name: string | null
  subject: string
  snippet: string | null
  category: string
  requires_reply: boolean
  replied_at: string | null
  is_flagged: boolean
  ai_summary: string | null
  ai_suggested_action: string | null
  urgency: string
  todo_id: string | null
  received_at: string | null
}

interface TodoPageClientProps {
  initialTodos: Todo[]
  initialEmails: Email[]
  gmailConnected: boolean
  gmailEmail: string | null
}

export function TodoPageClient({
  initialTodos,
  initialEmails,
  gmailConnected,
  gmailEmail,
}: TodoPageClientProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)

  function handleTodoAdded(todo: { id: string; title: string; source: 'email' }) {
    setTodos((prev) => [
      {
        id: todo.id,
        title: todo.title,
        completed: false,
        priority: 'medium',
        source: 'email',
        tags: [],
      } as Todo,
      ...prev,
    ])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 flex-1 min-h-[calc(100vh-10rem)]">
      {/* Left: Email triage (3 cols) */}
      <div className="lg:col-span-3">
        <EmailTriageCard
          initialEmails={initialEmails}
          gmailConnected={gmailConnected}
          gmailEmail={gmailEmail}
          onTodoAdded={handleTodoAdded}
        />
      </div>

      {/* Right: Todo list (2 cols) */}
      <div className="lg:col-span-2">
        <TodoCard initialTodos={todos} />
      </div>
    </div>
  )
}
