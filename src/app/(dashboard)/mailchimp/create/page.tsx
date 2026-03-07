import { createAdminClient } from '@/lib/supabase/admin'
import { TopBar } from '@/components/layout/TopBar'
import { CampaignBuilder } from '@/components/mailchimp/CampaignBuilder'
import type { MailchimpSettings } from '@/lib/types'

const DEFAULTS: MailchimpSettings = {
  api_key: '',
  audience_id: '',
  from_name: 'Northern Warrior',
  from_email: 'info@northernwarrior.co.uk',
  reply_to: '',
}

export default async function CreateCampaignPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings: MailchimpSettings = data?.value
    ? { ...DEFAULTS, ...(data.value as Partial<MailchimpSettings>) }
    : { ...DEFAULTS }

  return (
    <>
      <TopBar title="New Campaign" />
      <CampaignBuilder settings={settings} />
    </>
  )
}
