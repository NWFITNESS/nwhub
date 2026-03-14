import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { twilioClient, WHATSAPP_FROM } from '@/lib/twilio'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  // 5 campaign sends per admin per hour
  const ip = getClientIp(request)
  if (!rateLimit(`sms-send:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests — try again later' }, { status: 429 })
  }

  try {
    const { name, message, segment_tags } = await request.json()
    if (!name || !message) return NextResponse.json({ error: 'Name and message are required' }, { status: 400 })

    const admin = createAdminClient()

    let query = admin.from('sms_subscribers').select('phone').eq('status', 'subscribed')
    if (segment_tags && segment_tags.length > 0) {
      query = query.overlaps('tags', segment_tags)
    }
    const { data: subscribers, error: fetchError } = await query
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 })
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'No subscribers match this segment' }, { status: 400 })
    }

    // Save campaign
    const { data: campaign, error: campaignError } = await admin.from('sms_campaigns').insert({
      name, message,
      segment_tags: segment_tags ?? [],
      status: 'sent',
      sent_at: new Date().toISOString(),
      stats: { sent: 0, delivered: 0, failed: 0 },
    }).select().single()
    if (campaignError) return NextResponse.json({ error: campaignError.message }, { status: 400 })

    let sent = 0
    let failed = 0

    const results = await Promise.allSettled(
      subscribers.map((sub) =>
        twilioClient.messages.create({
          from: WHATSAPP_FROM,
          to: `whatsapp:${sub.phone}`,
          body: message,
        })
      )
    )

    results.forEach((r) => {
      if (r.status === 'fulfilled') sent++
      else failed++
    })

    await admin.from('sms_campaigns').update({ stats: { sent, delivered: sent, failed } }).eq('id', campaign.id)

    return NextResponse.json({ success: true, sent, failed })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
