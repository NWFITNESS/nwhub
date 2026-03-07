import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mc } from '@/lib/mailchimp'
import type { MailchimpSettings } from '@/lib/types'

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings = (settingsData?.value ?? {}) as Partial<MailchimpSettings>
  const { api_key } = settings

  if (!api_key) {
    return NextResponse.json({ error: 'Mailchimp not configured' }, { status: 400 })
  }

  const { campaign_id, test_emails } = await req.json()

  if (!campaign_id || !test_emails?.length) {
    return NextResponse.json({ error: 'campaign_id and test_emails are required' }, { status: 400 })
  }

  const res = await mc(api_key, `/campaigns/${campaign_id}/actions/test`, {
    method: 'POST',
    body: { test_emails, send_type: 'html' },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: err.detail ?? 'Failed to send test email' }, { status: res.status })
  }

  return NextResponse.json({ success: true })
}
