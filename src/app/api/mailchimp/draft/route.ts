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
import { requireAuth } from '@/lib/auth-guard'

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth
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

  const { campaign_id, subject, title, preview_text, from_name, from_email, reply_to, html, design_json, segment_emails, segment_tags } = await req.json()
  let campaignId = campaign_id as string | undefined

  const campaignSettings = {
    subject_line: subject || 'Campaign',
    title: title || subject || 'Campaign',
    preview_text: preview_text || '',
    from_name: from_name || settings.from_name || 'Northern Warrior',
    reply_to: reply_to || from_email || settings.reply_to || settings.from_email || 'info@northernwarrior.co.uk',
  }

  // Build recipients — use tag-based segmentation if tags provided,
  // otherwise create a temporary Mailchimp static segment for the selected emails.
  // NEVER fall through to full audience unless explicitly intended.
  const segTags = Array.isArray(segment_tags) ? (segment_tags as string[]).filter(Boolean) : []
  const segmentEmails = Array.isArray(segment_emails)
    ? (segment_emails as string[]).filter(Boolean)
    : []

  let recipients: Record<string, unknown>

  if (segTags.length > 0) {
    // Look up Mailchimp tag IDs by name
    const tagIds: number[] = []
    const segRes = await mc(api_key, `/lists/${audience_id}/segments?type=static&count=100`, { method: 'GET' })
    if (segRes.ok) {
      const segData = await segRes.json()
      for (const tagName of segTags) {
        const match = segData.segments?.find((s: { name: string; id: number }) =>
          s.name.toLowerCase() === tagName.toLowerCase()
        )
        if (match) tagIds.push(match.id)
      }
    }

    if (tagIds.length > 0) {
      recipients = {
        list_id: audience_id,
        segment_opts: {
          match: 'any',
          conditions: tagIds.map((id) => ({
            condition_type: 'StaticSegment',
            field: 'static_segment',
            op: 'static_is',
            value: id,
          })),
        },
      }
    } else {
      return NextResponse.json({ error: `Mailchimp tags not found: ${segTags.join(', ')}` }, { status: 400 })
    }
  } else if (segmentEmails.length > 0) {
    // Create a temporary static segment with the exact email list.
    // This is the only reliable way to target an arbitrary list in Mailchimp
    // (EmailAddress conditions are capped at ~5).
    const campaignTag = `_campaign_${Date.now()}`
    const createSegRes = await mc(api_key, `/lists/${audience_id}/segments`, {
      method: 'POST',
      body: {
        name: campaignTag,
        static_segment: segmentEmails,
      },
    })

    if (!createSegRes.ok) {
      const err = await createSegRes.json().catch(() => ({}))
      return NextResponse.json({ error: `Failed to create recipient segment: ${err.detail ?? 'unknown error'}` }, { status: 500 })
    }

    const createdSeg = await createSegRes.json()
    recipients = {
      list_id: audience_id,
      segment_opts: {
        match: 'all',
        conditions: [{
          condition_type: 'StaticSegment',
          field: 'static_segment',
          op: 'static_is',
          value: createdSeg.id,
        }],
      },
    }
  } else {
    // No emails and no tags — send to full Mailchimp audience
    // (only reached when "All Subscribers" is explicitly selected in the UI)
    recipients = { list_id: audience_id }
  }

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
