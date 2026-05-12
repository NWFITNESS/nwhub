import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL, REPLY_TO } from '@/lib/email/resend'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  // 5 campaign sends per admin per hour (prevents accidental spam loops)
  const ip = getClientIp(request)
  if (!(await rateLimit(`email-send:${ip}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Too many requests — try again later' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { name, subject, preview_text, from_name, from_email, reply_to, html_content, segment_tags, segment_emails } = body

    const admin = createAdminClient()

    // Fetch tag-matched subscribers from email_subscribers table
    let tagMatched: { email: string; first_name: string | null }[] = []
    if (segment_tags && segment_tags.length > 0) {
      const { data, error: fetchError } = await admin
        .from('email_subscribers')
        .select('email, first_name')
        .eq('status', 'subscribed')
        .overlaps('tags', segment_tags)
      if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 })
      tagMatched = data ?? []
    } else if (!segment_emails?.length) {
      // No tags and no emails — fetch all subscribers
      const { data, error: fetchError } = await admin
        .from('email_subscribers')
        .select('email, first_name')
        .eq('status', 'subscribed')
      if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 })
      tagMatched = data ?? []
    }

    // Merge with direct segment emails (e.g. kids parents from kids_parents table
    // who aren't in email_subscribers)
    const emailSet = new Set<string>()
    const subscribers: { email: string; first_name: string | null }[] = []
    for (const s of tagMatched) {
      const key = s.email.toLowerCase()
      if (!emailSet.has(key)) { emailSet.add(key); subscribers.push(s) }
    }
    for (const e of (segment_emails ?? []) as string[]) {
      const key = e.toLowerCase()
      if (!emailSet.has(key)) { emailSet.add(key); subscribers.push({ email: key, first_name: null }) }
    }

    if (subscribers.length === 0) {
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
