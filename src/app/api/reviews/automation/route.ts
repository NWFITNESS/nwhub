import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { twilioClient, WHATSAPP_FROM } from '@/lib/twilio'
import { requireAuth } from '@/lib/auth-guard'
import type { ReviewSettings } from '@/lib/types'

export async function POST(req: NextRequest) {
  // Allow both: authenticated UI session OR trusted cron secret header
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    const unauth = await requireAuth()
    if (unauth) return unauth
  }

  const supabase = createAdminClient()
  const now = new Date()
  const results = { sent: 0, skipped: 0, errors: 0 }

  // Load settings
  const { data: settingsRow } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const settings = settingsRow?.value as ReviewSettings | null
  if (!settings?.enabled) {
    return NextResponse.json({ ...results, skipped: -1, message: 'Automation disabled' })
  }

  const {
    days_after_joining,
    reminder_interval_days,
    max_messages,
    review_link,
  } = settings

  const templateSid = process.env.TWILIO_REVIEW_TEMPLATE_SID?.startsWith('HX')
    ? process.env.TWILIO_REVIEW_TEMPLATE_SID
    : settings.first_content_sid

  const followupSid = process.env.TWILIO_REVIEW_FOLLOWUP_SID?.startsWith('HX')
    ? process.env.TWILIO_REVIEW_FOLLOWUP_SID
    : settings.reminder_content_sid

  // Get all contacts with phones
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, phone, created_at')
    .not('phone', 'is', null)

  // Get all existing review requests
  const { data: existingRequests } = await supabase
    .from('review_requests')
    .select('contact_id, messages_sent, last_sent_at, review_detected, opted_out')

  const requestMap = Object.fromEntries(
    (existingRequests ?? []).map((r) => [r.contact_id, r])
  )

  for (const contact of contacts ?? []) {
    const request = requestMap[contact.id]
    const daysSinceJoin = Math.floor(
      (now.getTime() - new Date(contact.created_at).getTime()) / 86400000
    )
    const daysSinceLast = request?.last_sent_at
      ? Math.floor((now.getTime() - new Date(request.last_sent_at).getTime()) / 86400000)
      : null

    // Skip if opted out, review detected, or max messages reached
    if (request?.opted_out || request?.review_detected || (request?.messages_sent ?? 0) >= max_messages) {
      results.skipped++
      continue
    }

    const shouldSendInitial = daysSinceJoin >= days_after_joining && !request
    const shouldSendFollowUp =
      request?.messages_sent === 1 &&
      daysSinceLast !== null &&
      daysSinceLast >= reminder_interval_days

    if (!shouldSendInitial && !shouldSendFollowUp) {
      results.skipped++
      continue
    }

    const sid = shouldSendFollowUp ? followupSid : templateSid
    if (!sid) { results.errors++; continue }

    try {
      await twilioClient.messages.create({
        from: WHATSAPP_FROM,
        to: `whatsapp:${contact.phone}`,
        contentSid: sid,
        contentVariables: JSON.stringify({ '1': contact.first_name ?? '', '2': review_link }),
      })

      await supabase.from('review_requests').upsert(
        {
          contact_id: contact.id,
          phone_number: contact.phone,
          messages_sent: (request?.messages_sent ?? 0) + 1,
          last_sent_at: now.toISOString(),
          review_detected: false,
          opted_out: false,
        },
        { onConflict: 'contact_id' }
      )

      results.sent++
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[reviews/automation] Send failed for', contact.id, msg)
      results.errors++
    }
  }

  return NextResponse.json(results)
}
