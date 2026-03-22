import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { twilioClient, WHATSAPP_FROM } from '@/lib/twilio'
import { requireAuth } from '@/lib/auth-guard'
import type { ReviewSettings } from '@/lib/types'

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { contactId, phone: rawPhone, firstName } = await req.json()
  if (!contactId || !rawPhone) {
    return NextResponse.json({ error: 'contactId and phone are required' }, { status: 400 })
  }

  // Normalise to E.164 — UK 07... → +447..., strip spaces/dashes
  const digits = String(rawPhone).replace(/[\s\-().+]/g, '')
  const phone = digits.startsWith('07')
    ? `+44${digits.slice(1)}`
    : digits.startsWith('44')
      ? `+${digits}`
      : digits.startsWith('+')
        ? String(rawPhone).replace(/[\s\-()]/g, '')
        : `+${digits}`

  const supabase = createAdminClient()

  // Load settings for review link + template SID fallbacks
  const { data: settingsRow } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const settings = settingsRow?.value as ReviewSettings | null

  // Check existing record
  const { data: existing } = await supabase
    .from('review_requests')
    .select('*')
    .eq('contact_id', contactId)
    .maybeSingle()

  const maxMessages = settings?.max_messages ?? 2

  if (existing && existing.messages_sent >= maxMessages) {
    return NextResponse.json({ error: 'Max messages reached for this contact' }, { status: 400 })
  }

  const isFollowUp = !!(existing && existing.messages_sent >= 1)

  // Env vars take priority over settings
  const templateSid = isFollowUp
    ? (process.env.TWILIO_REVIEW_FOLLOWUP_SID?.startsWith('HX') ? process.env.TWILIO_REVIEW_FOLLOWUP_SID : settings?.reminder_content_sid)
    : (process.env.TWILIO_REVIEW_TEMPLATE_SID?.startsWith('HX') ? process.env.TWILIO_REVIEW_TEMPLATE_SID : settings?.first_content_sid)

  const reviewLink = settings?.review_link ?? ''

  if (!templateSid) {
    return NextResponse.json({ error: 'Template SID not configured — set in Reviews settings or env vars' }, { status: 400 })
  }

  // Ensure whatsapp: prefix on both numbers
  const fromWa = WHATSAPP_FROM.startsWith('whatsapp:') ? WHATSAPP_FROM : `whatsapp:${WHATSAPP_FROM}`
  const toWa = `whatsapp:${phone}`

  const contentVariables = JSON.stringify({ '1': firstName ?? '', '2': reviewLink })
  console.log('[reviews/send] Attempting send:', { from: fromWa, to: toWa, templateSid, contentVariables })

  try {
    await twilioClient.messages.create({
      from: fromWa,
      to: toWa,
      contentSid: templateSid,
      contentVariables,
    })
  } catch (e: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = e as any
    console.error('[reviews/send] Twilio error:', {
      code: err?.code,
      message: err?.message,
      details: err?.details,
      moreInfo: err?.moreInfo,
      from: fromWa,
      to: toWa,
      templateSid,
      contentVariables,
    })
    const detail = err?.details ? ` — ${JSON.stringify(err.details)}` : ''
    return NextResponse.json({ error: `Failed to send WhatsApp message (${err?.code ?? err?.message ?? 'unknown'})${detail}` }, { status: 500 })
  }

  // Upsert review_requests
  await supabase.from('review_requests').upsert(
    {
      contact_id: contactId,
      phone_number: phone,
      messages_sent: (existing?.messages_sent ?? 0) + 1,
      last_sent_at: new Date().toISOString(),
      review_detected: existing?.review_detected ?? false,
      opted_out: false,
    },
    { onConflict: 'contact_id' }
  )

  return NextResponse.json({ success: true, type: isFollowUp ? 'followup' : 'initial' })
}
