import { createAdminClient } from '@/lib/supabase/admin'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { MailchimpDashboard } from '@/components/mailchimp/MailchimpDashboard'
import { mc } from '@/lib/mailchimp'
import type { MailchimpSettings, MailchimpAudienceStats } from '@/lib/types'

const DEFAULTS: MailchimpSettings = {
  api_key: '',
  audience_id: '',
  from_name: '',
  from_email: 'info@northernwarrior.co.uk',
  reply_to: '',
}

export default async function MailchimpPage() {
  const supabase = createAdminClient()

  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const rawSettings = settingsData?.value
    ? { ...DEFAULTS, ...(settingsData.value as Partial<MailchimpSettings>) }
    : { ...DEFAULTS }

  const initialSettings: MailchimpSettings = {
    ...rawSettings,
    api_key: rawSettings.api_key ? '••••••••' : '',
  }

  let initialStats: { audience: MailchimpAudienceStats } | null = null

  if (rawSettings.api_key && rawSettings.audience_id) {
    try {
      const listRes = await mc(rawSettings.api_key, `/lists/${rawSettings.audience_id}`)
      if (listRes.ok) {
        const listJson = await listRes.json()
        initialStats = {
          audience: {
            member_count: listJson.stats?.member_count ?? 0,
            open_rate: listJson.stats?.open_rate ?? 0,
            click_rate: listJson.stats?.click_rate ?? 0,
          },
        }
      }
    } catch {
      // best-effort
    }
  }

  return (
    <>
      <TopBar title="Mailchimp" />
      <main className="flex flex-col gap-6 p-4 lg:p-8 min-h-[calc(100vh-5rem)]">
        <PageHeader title="Mailchimp" description="Manage your email audience, sync subscribers, and send campaigns" />
        <MailchimpDashboard initialSettings={initialSettings} initialStats={initialStats} />
      </main>
    </>
  )
}
