import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mc, emailHash } from '@/lib/mailchimp'
import type { MailchimpSettings } from '@/lib/types'

export async function POST() {
  const supabase = createAdminClient()

  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings = (settingsData?.value ?? {}) as Partial<MailchimpSettings>
  const { api_key, audience_id } = settings

  if (!api_key || !audience_id) {
    return NextResponse.json({ error: 'Mailchimp not configured' }, { status: 400 })
  }

  const { data: subscribers } = await supabase
    .from('email_subscribers')
    .select('email, first_name, last_name')
    .eq('status', 'subscribed')

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ synced: 0, failed: 0, total: 0 })
  }

  let synced = 0
  let failed = 0

  for (let i = 0; i < subscribers.length; i += 10) {
    const chunk = subscribers.slice(i, i + 10)
    const results = await Promise.allSettled(
      chunk.map((sub) =>
        mc(api_key, `/lists/${audience_id}/members/${emailHash(sub.email)}`, {
          method: 'PUT',
          body: {
            email_address: sub.email,
            status_if_new: 'subscribed',
            status: 'subscribed',
            merge_fields: { FNAME: sub.first_name ?? '', LNAME: sub.last_name ?? '' },
          },
        }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r
        })
      )
    )
    for (const r of results) {
      if (r.status === 'fulfilled') synced++
      else failed++
    }
  }

  return NextResponse.json({ synced, failed, total: subscribers.length })
}
