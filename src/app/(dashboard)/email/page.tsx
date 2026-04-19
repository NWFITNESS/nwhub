import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmailSubscribersTable } from '@/components/email/EmailSubscribersTable'
import { SyncContactsButton } from '@/components/email/SyncContactsButton'

export default async function EmailPage() {
  const supabase = createAdminClient()
  const [{ data: subscribers }, { count: total }, { count: contactsWithEmail }] = await Promise.all([
    supabase.from('email_subscribers').select('*').order('subscribed_at', { ascending: false }),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'subscribed'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).not('email', 'is', null),
  ])

  const unsyncedCount = (contactsWithEmail ?? 0) - (total ?? 0)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Marketing"
        title="Email"
        titleGold="Subscribers"
        description={`${total ?? 0} active subscribers`}
        actions={<SyncContactsButton unsyncedCount={unsyncedCount > 0 ? unsyncedCount : 0} />}
      />
      <EmailSubscribersTable initialSubscribers={subscribers ?? []} />
    </div>
  )
}
