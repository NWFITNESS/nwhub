import { NextRequest, NextResponse } from 'next/server'

// Normalise merge tags — convert {{first_name}} style to Mailchimp *|FNAME|* style
function normaliseMergeTags(html: string): string {
  return html
    .replace(/\{\{first_name\}\}/gi, '*|FNAME|*')
    .replace(/\{\{last_name\}\}/gi,  '*|LNAME|*')
    .replace(/\{\{email\}\}/gi,      '*|EMAIL|*')
}
import { createAdminClient } from '@/lib/supabase/admin'
import { mc, resolveApiKey } from '@/lib/mailchimp'
import type { MailchimpSettings } from '@/lib/types'

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings = (settingsData?.value ?? {}) as Partial<MailchimpSettings>
  const api_key = resolveApiKey(settings.api_key)
  const audience_id = settings.audience_id ?? ''

  if (!api_key || !audience_id) {
    return NextResponse.json({ error: 'Mailchimp not configured' }, { status: 400 })
  }

  const { campaign_id, subject, title, preview_text, from_name, from_email, reply_to, html, design_json, segment_emails } = await req.json()
  let campaignId = campaign_id as string | undefined

  const campaignSettings = {
    subject_line: subject || 'Campaign',
    title: title || subject || 'Campaign',
    preview_text: preview_text || '',
    from_name: from_name || settings.from_name || 'Northern Warrior',
    reply_to: reply_to || from_email || settings.reply_to || settings.from_email || 'info@northernwarrior.co.uk',
  }

  const segmentEmails = Array.isArray(segment_emails)
    ? (segment_emails as string[]).filter(Boolean)
    : []

  const recipients =
    segmentEmails.length > 0
      ? {
          list_id: audience_id,
          segment_opts: {
            match: 'any',
            conditions: segmentEmails.map((email: string) => ({
              condition_type: 'EmailAddress',
              field: 'EMAIL',
              op: 'is',
              value: email,
            })),
          },
        }
      : { list_id: audience_id }

  if (!campaignId) {
    const createRes = await mc(api_key, '/campaigns', {
      method: 'POST',
      body: {
        type: 'regular',
        recipients,
        settings: campaignSettings,
      },
    })
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      const fieldErrors = err.errors?.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join(', ')
      return NextResponse.json({ error: fieldErrors || err.detail || 'Failed to create campaign draft' }, { status: createRes.status })
    }
    const campaign = await createRes.json()
    campaignId = campaign.id as string
  } else {
    const patchRes = await mc(api_key, `/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: {
        recipients,
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
      body: { html: normaliseMergeTags(html) },
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
