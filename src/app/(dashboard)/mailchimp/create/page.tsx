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

interface EmailTemplate {
  id: string
  name: string
  design_json: object
  created_at: string
}

export default async function CreateCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const { template: templateId } = await searchParams
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings: MailchimpSettings = data?.value
    ? { ...DEFAULTS, ...(data.value as Partial<MailchimpSettings>) }
    : { ...DEFAULTS }

  let designJson: object | null = null
  if (templateId) {
    const { data: tmplData } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'mailchimp_templates')
      .single()
    const templates = (tmplData?.value ?? []) as EmailTemplate[]
    const found = templates.find((t) => t.id === templateId)
    if (found) designJson = found.design_json
  }

  return (
    <>
      <TopBar title="New Campaign" />
      <CampaignBuilder settings={settings} designJson={designJson} />
    </>
  )
}
