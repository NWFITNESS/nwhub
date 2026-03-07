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
  const { api_key, audience_id } = settings

  if (!api_key || !audience_id) {
    return NextResponse.json({ error: 'Mailchimp not configured' }, { status: 400 })
  }

  const { campaign_id, subject, title, preview_text, from_name, from_email, reply_to, html, design_json } = await req.json()
  let campaignId = campaign_id as string | undefined

  const campaignSettings = {
    subject_line: subject,
    title: title || subject,
    preview_text: preview_text || '',
    from_name: from_name || 'Northern Warrior',
    reply_to: reply_to || from_email || '',
  }

  if (!campaignId) {
    const createRes = await mc(api_key, '/campaigns', {
      method: 'POST',
      body: {
        type: 'regular',
        recipients: { list_id: audience_id },
        settings: campaignSettings,
      },
    })
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      return NextResponse.json({ error: err.detail ?? 'Failed to create campaign draft' }, { status: createRes.status })
    }
    const campaign = await createRes.json()
    campaignId = campaign.id as string
  } else {
    const patchRes = await mc(api_key, `/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: {
        recipients: { list_id: audience_id },
        settings: campaignSettings,
      },
    })
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}))
      return NextResponse.json({ error: err.detail ?? 'Failed to update campaign draft' }, { status: patchRes.status })
    }
  }

  if (html) {
    const contentRes = await mc(api_key, `/campaigns/${campaignId}/content`, {
      method: 'PUT',
      body: { html },
    })
    if (!contentRes.ok) {
      const err = await contentRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: err.detail ?? 'Failed to set campaign content', campaign_id: campaignId },
        { status: contentRes.status }
      )
    }
  }

  if (design_json && campaignId) {
    const { data: existingDesigns } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'mailchimp_designs')
      .single()
    const existingMap = (existingDesigns?.value ?? {}) as Record<string, unknown>
    await supabase.from('global_settings').upsert(
      { key: 'mailchimp_designs', value: { ...existingMap, [campaignId]: design_json }, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  }

  return NextResponse.json({ campaign_id: campaignId })
}
