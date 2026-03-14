import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL, REPLY_TO } from '@/lib/resend'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  // 5 campaign sends per admin per hour (prevents accidental spam loops)
  const ip = getClientIp(request)
  if (!rateLimit(`email-send:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests — try again later' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { name, subject, preview_text, from_name, from_email, reply_to, html_content, segment_tags } = body

    const admin = createAdminClient()

    // Fetch matching subscribers
    let query = admin.from('email_subscribers').select('email, first_name').eq('status', 'subscribed')
    if (segment_tags && segment_tags.length > 0) {
      query = query.overlaps('tags', segment_tags)
    }
    const { data: subscribers, error: fetchError } = await query
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 })
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'No subscribers match this segment' }, { status: 400 })
    }

    // Save campaign as draft first
    const { data: campaign, error: campaignError } = await admin.from('email_campaigns').insert({
      name, subject, preview_text: preview_text ?? '',
      from_name: from_name ?? 'Northern Warrior',
      from_email: from_email ?? 'noreply@northernwarrior.co.uk',
      reply_to: reply_to ?? REPLY_TO,
      html_content,
      segment_tags: segment_tags ?? [],
      status: 'sent',
      sent_at: new Date().toISOString(),
      stats: { sent: 0, opened: 0, clicked: 0, bounced: 0 },
    }).select().single()
    if (campaignError) return NextResponse.json({ error: campaignError.message }, { status: 400 })

    // Send in batches of 50
    const BATCH = 50
    let sentCount = 0
    const fromField = `${from_name ?? 'Northern Warrior'} <${from_email ?? 'noreply@northernwarrior.co.uk'}>`

    const resend = getResend()
    for (let i = 0; i < subscribers.length; i += BATCH) {
      const batch = subscribers.slice(i, i + BATCH)
      await Promise.allSettled(
        batch.map((sub) =>
          resend.emails.send({
            from: fromField,
            to: sub.email,
            subject,
            html: html_content,
            replyTo: reply_to ?? REPLY_TO,
          })
        )
      )
      sentCount += batch.length
    }

    // Update stats
    await admin.from('email_campaigns').update({ stats: { sent: sentCount, opened: 0, clicked: 0, bounced: 0 } }).eq('id', campaign.id)

    return NextResponse.json({ success: true, sent: sentCount })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
