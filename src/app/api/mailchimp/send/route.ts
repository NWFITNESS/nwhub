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
  const { api_key, audience_id, from_name, reply_to } = settings

  if (!api_key || !audience_id) {
    return NextResponse.json({ error: 'Mailchimp not configured' }, { status: 400 })
  }

  const body = await req.json()
  const { subject, title, html, campaign_id: existingCampaignId, scheduled_time } = body

  let campaignId = existingCampaignId as string | undefined

  if (!campaignId) {
    const createRes = await mc(api_key, '/campaigns', {
      method: 'POST',
      body: {
        type: 'regular',
        recipients: { list_id: audience_id },
        settings: {
          subject_line: subject,
          title: title || subject,
          from_name: from_name || 'Northern Warrior',
          reply_to: reply_to || '',
        },
      },
    })
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      return NextResponse.json({ error: err.detail ?? 'Failed to create campaign' }, { status: createRes.status })
    }
    const campaign = await createRes.json()
    campaignId = campaign.id as string

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

  if (scheduled_time) {
    const scheduleRes = await mc(api_key, `/campaigns/${campaignId}/actions/schedule`, {
      method: 'POST',
      body: { schedule_time: scheduled_time },
    })
    if (!scheduleRes.ok) {
      const err = await scheduleRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: err.detail ?? 'Failed to schedule campaign', campaign_id: campaignId },
        { status: scheduleRes.status }
      )
    }
  } else {
    const sendRes = await mc(api_key, `/campaigns/${campaignId}/actions/send`, { method: 'POST' })
    if (!sendRes.ok) {
      const err = await sendRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: err.detail ?? 'Failed to send campaign', campaign_id: campaignId },
        { status: sendRes.status }
      )
    }
  }

  return NextResponse.json({ success: true, campaign_id: campaignId })
}
