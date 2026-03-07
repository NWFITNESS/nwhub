/**
 * review-run — Supabase Edge Function
 *
 * Sends Google Review request messages to eligible contacts via WhatsApp.
 * Intended to run daily via pg_cron (see supabase/migrations/).
 *
 * Required Supabase secrets (set via `supabase secrets set KEY=value`):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_NUMBER     — full whatsapp:+E.164 value
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl       = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const twilioSid         = Deno.env.get('TWILIO_ACCOUNT_SID')!
const twilioToken       = Deno.env.get('TWILIO_AUTH_TOKEN')!
const twilioWhatsApp    = Deno.env.get('TWILIO_WHATSAPP_NUMBER') ?? ''

// ---------------------------------------------------------------------------
// Twilio REST helper
// ---------------------------------------------------------------------------
async function sendTwilioMessage(params: Record<string, string>): Promise<void> {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `Twilio ${res.status}`)
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Load settings
  const { data: settingsRow } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const settings = settingsRow?.value as Record<string, unknown> | null
  if (!settings?.enabled) {
    return new Response(
      JSON.stringify({ skipped: 'automation disabled' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const daysAfterJoining    = settings.days_after_joining as number
  const reminderIntervalDays = settings.reminder_interval_days as number
  const maxMessages         = settings.max_messages as number
  const firstContentSid     = settings.first_content_sid as string
  const reminderContentSid  = settings.reminder_content_sid as string
  const reviewLink          = settings.review_link as string

  const now = new Date()
  const cutoff = new Date(now.getTime() - daysAfterJoining * 864e5).toISOString()

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

  const existingIds = new Set(
    (existing ?? []).map((r: { contact_id: string }) => r.contact_id)
  )

  const newEligible = (allActive ?? []).filter(
    (c: { id: string }) => !existingIds.has(c.id)
  ) as Array<{ id: string; first_name: string | null; phone: string }>

  let newRequests = 0

  for (const contact of newEligible) {
    try {
      await sendTwilioMessage({
        From: twilioWhatsApp,
        To: `whatsapp:${contact.phone}`,
        ContentSid: firstContentSid,
        ContentVariables: JSON.stringify({ '1': contact.first_name ?? '', '2': reviewLink }),
      })

      await supabase.from('review_requests').insert({
        contact_id: contact.id,
        phone_number: contact.phone,
        messages_sent: 1,
        last_sent_at: now.toISOString(),
      })
      newRequests++
    } catch {
      // skip failed individual sends — don't abort the whole run
    }
  }

  // -------------------------------------------------------------------------
  // 2. Reminder-eligible contacts
  // -------------------------------------------------------------------------
  const reminderCutoff = new Date(now.getTime() - reminderIntervalDays * 864e5).toISOString()

  const { data: reminderEligible } = await supabase
    .from('review_requests')
    .select('id, phone_number, messages_sent, contact:contacts(first_name)')
    .lt('messages_sent', maxMessages)
    .eq('review_detected', false)
    .eq('opted_out', false)
    .lte('last_sent_at', reminderCutoff)

  let reminders = 0

  for (const req of (reminderEligible ?? []) as Array<{
    id: string
    phone_number: string
    messages_sent: number
    contact: { first_name?: string } | null
  }>) {
    try {
      await sendTwilioMessage({
        From: twilioWhatsApp,
        To: `whatsapp:${req.phone_number}`,
        ContentSid: reminderContentSid,
        ContentVariables: JSON.stringify({ '1': req.contact?.first_name ?? '', '2': reviewLink }),
      })

      await supabase
        .from('review_requests')
        .update({
          messages_sent: req.messages_sent + 1,
          last_sent_at: now.toISOString(),
        })
        .eq('id', req.id)

      reminders++
    } catch {
      // skip failed individual sends
    }
  }

  return new Response(
    JSON.stringify({ new_requests: newRequests, reminders }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
