import { createAdminClient } from '@/lib/supabase/admin'
import { TopBar } from '@/components/layout/TopBar'
import { CampaignBuilder } from '@/components/mailchimp/CampaignBuilder'
import { mc } from '@/lib/mailchimp'
import type { MailchimpSettings } from '@/lib/types'

const DEFAULTS: MailchimpSettings = {
  api_key: '',
  audience_id: '',
  from_name: 'Northern Warrior',
  from_email: 'info@northernwarrior.co.uk',
  reply_to: '',
}

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: settingsData }, { data: designsData }] = await Promise.all([
    supabase.from('global_settings').select('value').eq('key', 'mailchimp_settings').single(),
    supabase.from('global_settings').select('value').eq('key', 'mailchimp_designs').single(),
  ])

  const settings: MailchimpSettings = settingsData?.value
    ? { ...DEFAULTS, ...(settingsData.value as Partial<MailchimpSettings>) }
    : { ...DEFAULTS }

  const designsMap = (designsData?.value ?? {}) as Record<string, object>
  const designJson = designsMap[id] ?? null

  let campaign = null
  if (settings.api_key) {
    const res = await mc(settings.api_key, `/campaigns/${id}`)
    if (res.ok) campaign = await res.json()
  }

  return (
    <>
      <TopBar title="Edit Campaign" />
      <CampaignBuilder settings={settings} campaign={campaign} designJson={designJson} />
    </>
  )
}
