import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { MailchimpDashboard } from '@/components/mailchimp/MailchimpDashboard'
import { mc } from '@/lib/mailchimp'
import type { MailchimpSettings, MailchimpAudienceStats } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Sparkles } from 'lucide-react'

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
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Content"
        title="Email"
        titleGold="Marketing"
        description="Manage your email audience, sync subscribers, and send campaigns"
        actions={
          <Link href="/mailchimp/create-ai">
            <Button variant="gold" size="sm">
              <Sparkles size={14} /> AI Email Creator
            </Button>
          </Link>
        }
      />
      <Suspense>
        <MailchimpDashboard initialSettings={initialSettings} initialStats={initialStats} />
      </Suspense>
    </div>
  )
}
