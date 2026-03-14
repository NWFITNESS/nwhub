import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { SmsSubscribersTable } from '@/components/sms/SmsSubscribersTable'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default async function SmsPage() {
  const supabase = await createClient()
  const [{ data: subscribers }, { count: total }] = await Promise.all([
    supabase.from('sms_subscribers').select('*').order('subscribed_at', { ascending: false }),
    supabase.from('sms_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'subscribed'),
  ])

  return (
    <>
      <TopBar title="WhatsApp" actions={<Link href="/sms/campaigns"><Button variant="secondary" size="sm">Campaigns</Button></Link>} />
      <main style={{ paddingLeft: '48px', paddingRight: '48px' }} className="flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader
          title="WhatsApp Subscribers"
          description={`${total ?? 0} active subscribers`}
          actions={<Link href="/sms/campaigns/new"><Button variant="primary" size="sm">New WhatsApp Campaign</Button></Link>}
        />
        <SmsSubscribersTable initialSubscribers={subscribers ?? []} />
      </main>
    </>
  )
}
