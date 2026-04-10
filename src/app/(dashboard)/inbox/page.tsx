import { createAdminClient } from '@/lib/supabase/admin'
import { InboxClient } from './InboxClient'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const supabase = createAdminClient()

  const [{ data: emails }, { data: tasks }, { data: gmailStatus }, { data: outlookStatus }] = await Promise.all([
    supabase
      .from('email_classifications')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(200),
    supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'gmail_tokens')
      .single(),
    supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'outlook_tokens')
      .single(),
  ])

  const gmailConnected = !!(gmailStatus?.value)
  const outlookConnected = !!(outlookStatus?.value)

  return (
    <InboxClient
      initialEmails={emails ?? []}
      initialTasks={tasks ?? []}
      gmailConnected={gmailConnected}
      outlookConnected={outlookConnected}
    />
  )
}
