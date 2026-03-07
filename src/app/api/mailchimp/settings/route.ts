import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { MailchimpSettings } from '@/lib/types'

const DEFAULTS: MailchimpSettings = {
  api_key: '',
  audience_id: '',
  from_name: '',
  from_email: 'info@northernwarrior.co.uk',
  reply_to: '',
}

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings: MailchimpSettings = data?.value
    ? { ...DEFAULTS, ...(data.value as Partial<MailchimpSettings>) }
    : { ...DEFAULTS }

  return NextResponse.json({
    ...settings,
    api_key: settings.api_key ? '••••••••' : '',
  })
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body: Partial<MailchimpSettings> = await req.json()

  let api_key = body.api_key ?? ''
  if (api_key === '••••••••') {
    const { data: existing } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'mailchimp_settings')
      .single()
    api_key = ((existing?.value as Partial<MailchimpSettings>)?.api_key) ?? ''
  }

  const value: MailchimpSettings = {
    api_key,
    audience_id: body.audience_id ?? '',
    from_name: body.from_name ?? '',
    from_email: body.from_email ?? 'info@northernwarrior.co.uk',
    reply_to: body.reply_to ?? '',
  }

  const { error } = await supabase.from('global_settings').upsert(
    { key: 'mailchimp_settings', value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
