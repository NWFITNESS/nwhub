import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { twilioClient, WHATSAPP_FROM } from '@/lib/twilio'

export async function POST(request: Request) {
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
