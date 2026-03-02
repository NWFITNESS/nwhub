import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmailSubscribersTable } from '@/components/email/EmailSubscribersTable'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default async function EmailPage() {
  const supabase = await createClient()
  const [{ data: subscribers }, { count: total }] = await Promise.all([
    supabase.from('email_subscribers').select('*').order('subscribed_at', { ascending: false }),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'subscribed'),
  ])

  return (
    <>
      <TopBar
        title="Email"
        actions={
          <Link href="/email/campaigns">
            <Button variant="secondary" size="sm">View Campaigns</Button>
          </Link>
        }
      />
      <main className="p-6">
        <PageHeader
          title="Email Subscribers"
          description={`${total ?? 0} active subscribers`}
          actions={
            <div className="flex gap-2">
              <Link href="/email/campaigns/new">
                <Button variant="primary" size="sm">New Campaign</Button>
              </Link>
              <Link href="/email/campaigns">
                <Button variant="secondary" size="sm">All Campaigns</Button>
              </Link>
            </div>
          }
        />
        <EmailSubscribersTable initialSubscribers={subscribers ?? []} />
      </main>
    </>
  )
}
