import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { twilioClient, WHATSAPP_FROM } from '@/lib/twilio'
import type { ReviewSettings } from '@/lib/types'

export async function POST() {
  const supabase = createAdminClient()

  const { data: settingsRow } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const settings = settingsRow?.value as ReviewSettings | null
  if (!settings?.enabled) {
    return NextResponse.json({ error: 'Automation is disabled' }, { status: 400 })
  }

  const {
    days_after_joining, reminder_interval_days, max_messages,
    first_content_sid, reminder_content_sid, review_link,
  } = settings

  const cutoff = new Date(Date.now() - days_after_joining * 864e5).toISOString()

  // -------------------------------------------------------------------------
  // 1. New contacts eligible for first request
  // -------------------------------------------------------------------------
  const { data: allActive } = await supabase
    .from('contacts')
    .select('id, first_name, phone')
    .eq('status', 'active')
    .lte('created_at', cutoff)
    .not('phone', 'is', null)

  const { data: existing } = await supabase
    .from('review_requests')
    .select('contact_id')

  const existingIds = new Set((existing ?? []).map((r) => r.contact_id))
  const newEligible = (allActive ?? []).filter((c) => !existingIds.has(c.id))

  let newRequests = 0

  for (const contact of newEligible) {
    try {
      await twilioClient.messages.create({
        from: WHATSAPP_FROM,
        to: `whatsapp:${contact.phone}`,
        contentSid: first_content_sid,
        contentVariables: JSON.stringify({ '1': contact.first_name ?? '', '2': review_link }),
      })
      await supabase.from('review_requests').insert({
        contact_id: contact.id,
        phone_number: contact.phone,
        messages_sent: 1,
        last_sent_at: new Date().toISOString(),
      })
      newRequests++
    } catch {
      // skip failed sends
    }
  }

  // -------------------------------------------------------------------------
  // 2. Reminder-eligible contacts
  // -------------------------------------------------------------------------
  const reminderCutoff = new Date(Date.now() - reminder_interval_days * 864e5).toISOString()

  const { data: reminderEligible } = await supabase
    .from('review_requests')
    .select('id, phone_number, messages_sent, contact:contacts(first_name)')
    .lt('messages_sent', max_messages)
    .eq('review_detected', false)
    .eq('opted_out', false)
    .lte('last_sent_at', reminderCutoff)

  let reminders = 0

  for (const req of reminderEligible ?? []) {
    const contact = req.contact as { first_name?: string } | null
    try {
      await twilioClient.messages.create({
        from: WHATSAPP_FROM,
        to: `whatsapp:${req.phone_number}`,
        contentSid: reminder_content_sid,
        contentVariables: JSON.stringify({ '1': contact?.first_name ?? '', '2': review_link }),
      })
      await supabase
        .from('review_requests')
        .update({ messages_sent: req.messages_sent + 1, last_sent_at: new Date().toISOString() })
        .eq('id', req.id)
      reminders++
    } catch {
      // skip failed sends
    }
  }

  return NextResponse.json({ new_requests: newRequests, reminders })
}
