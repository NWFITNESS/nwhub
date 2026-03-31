import { createAdminClient } from '@/lib/supabase/admin'
import { TodoPageClient } from './TodoPageClient'

export default async function TodoPage() {
  const supabase = createAdminClient()

  // Fetch initial data server-side
  const [todosResult, emailsResult, gmailStatusResult] = await Promise.all([
    supabase
      .from('todos')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('email_triage')
      .select('*')
      .order('received_at', { ascending: false }),
    supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'gmail_tokens')
      .single(),
  ])

  const todos = todosResult.data ?? []
  const emails = emailsResult.data ?? []

  let gmailConnected = false
  let gmailEmail: string | null = null
  if (gmailStatusResult.data?.value) {
    try {
      const tokens = JSON.parse(gmailStatusResult.data.value)
      gmailConnected = !!(tokens.access_token && tokens.refresh_token)
      gmailEmail = tokens.email ?? null
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col gap-4">
      <TodoPageClient
        initialTodos={todos}
        initialEmails={emails}
        gmailConnected={gmailConnected}
        gmailEmail={gmailEmail}
      />
    </div>
  )
}
