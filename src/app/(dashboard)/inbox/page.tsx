import { createAdminClient } from '@/lib/supabase/admin'
import { InboxClient } from './InboxClient'
import { TopBar } from '@/components/layout/TopBar'
import { MobileInbox } from '@/components/mobile/MobileInbox'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const supabase = createAdminClient()

  const [{ data: emails }, { data: tasks }, { data: gmailStatus }] = await Promise.all([
    supabase
      .from('email_classifications')
      .select('*')
      .eq('archived', false)
      .order('received_at', { ascending: false })
      .limit(100),
    supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'gmail_tokens')
      .single(),
  ])

  const gmailConnected = !!(gmailStatus?.value)

  return (
    <>
      {/* Mobile layout */}
      <MobileInbox
        emails={emails ?? []}
        tasks={tasks ?? []}
        gmailConnected={gmailConnected}
      />

      {/* Desktop layout */}
      <div className="hidden lg:block">
        <TopBar title="Inbox Intelligence" />
        <main className="page-pad flex flex-col gap-5 py-6 lg:py-8">
          <InboxClient
            initialEmails={emails ?? []}
            initialTasks={tasks ?? []}
            gmailConnected={gmailConnected}
          />
        </main>
      </div>
    </>
  )
}
