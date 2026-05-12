import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { CATEGORY_LABEL, CATEGORY_TIME, formatPence } from '@/lib/kids/constants'
import type { KidsCategory } from '@/lib/kids/types'

const KIDS_ADMIN_EMAIL = 'info@nwfitnesskids.co.uk'

// ─────────────────────────────────────────────────────────────────────────────
// Stripe webhook — Kids & Teens bookings
//
// Listens for `checkout.session.completed` events and marks the matching
// kids_block_bookings or kids_dropin_bookings rows as paid.
//
// SECURITY: every request is signature-verified against STRIPE_WEBHOOK_SECRET.
// Unsigned or tampered requests are rejected with 400. We never trust any
// data from the body until the signature passes.
//
// Webhook URL (configure in Stripe Dashboard → Developers → Webhooks):
//   Production:  https://<nwhub-vercel-domain>/api/webhooks/stripe-kids
//   Development: use `stripe listen --forward-to localhost:3000/api/webhooks/stripe-kids`
//
// Events to subscribe to: checkout.session.completed
// ─────────────────────────────────────────────────────────────────────────────

// Force the Node.js runtime — Stripe's SDK uses Node crypto for signature
// verification and is not edge-compatible.
export const runtime = 'nodejs'

// Disable Next's automatic body parsing so we can read the raw bytes that
// Stripe signed. App Router does this automatically as long as we call
// req.text() ourselves, but be explicit.
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[stripe-kids] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('[stripe-kids] signature verification failed:', (err as Error).message)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  // Always return 200 quickly — long-running work would risk Stripe retries.
  // The handler logic itself is fast (a couple of Supabase updates).
  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    const e = err as Error
    console.error('[stripe-kids] handler error:', e.message, e.stack)
    // Return 500 so Stripe retries with backoff
    return NextResponse.json({ error: 'handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {}
  const type = meta.type
  const admin = createAdminClient()
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null
  const paidAt = new Date().toISOString()

  if (type === 'block') {
    const bookingIds = (meta.booking_ids ?? '').split(',').filter(Boolean)
    if (!bookingIds.length) {
      console.warn('[stripe-kids] block event with no booking_ids in metadata', session.id)
      return
    }

    // Idempotency: check if already paid — Stripe retries can fire multiple
    // times for the same event, and we must not re-send confirmation emails.
    const { data: existing } = await admin
      .from('kids_block_bookings')
      .select('id, payment_status')
      .in('id', bookingIds)
      .eq('payment_status', 'paid')
    if (existing?.length === bookingIds.length) {
      return
    }

    const { error } = await admin
      .from('kids_block_bookings')
      .update({
        payment_status: 'paid',
        paid_at: paidAt,
        stripe_payment_intent_id: paymentIntentId,
        stripe_checkout_session_id: session.id,
      })
      .in('id', bookingIds)
    if (error) {
      console.error('[stripe-kids] supabase update failed:', error.message, error.code, error.details)
      throw new Error(`Failed to mark block bookings paid: ${error.message}`)
    }

    // Fire-and-mostly-forget confirmation email — log failures but never
    // throw because doing so makes Stripe retry the webhook and we'd
    // re-mark already-paid bookings.
    try {
      await sendBlockConfirmationEmail(bookingIds)
    } catch (e) {
      console.error('[stripe-kids] block confirmation email failed:', (e as Error).message)
    }
    return
  }

  if (type === 'dropin') {
    const dropinBookingId = meta.dropin_booking_id
    if (!dropinBookingId) {
      console.warn('[stripe-kids] dropin event with no dropin_booking_id in metadata', session.id)
      return
    }

    // Idempotency: skip if already paid
    const { data: existingDropin } = await admin
      .from('kids_dropin_bookings')
      .select('id, payment_status')
      .eq('id', dropinBookingId)
      .eq('payment_status', 'paid')
      .maybeSingle()
    if (existingDropin) {
      return
    }

    const { error } = await admin
      .from('kids_dropin_bookings')
      .update({
        payment_status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq('id', dropinBookingId)
    if (error) throw new Error(`Failed to mark drop-in paid: ${error.message}`)

    try {
      await sendDropInPaidConfirmationEmail(dropinBookingId)
    } catch (e) {
      console.error('[stripe-kids] dropin paid email failed:', (e as Error).message)
    }
    return
  }

  // Unknown type — log and ignore. Could be from another integration sharing
  // the same webhook endpoint (it shouldn't, but be defensive).
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation emails — fired from the webhook so they only send once,
// after Stripe confirms the actual payment. Both are wrapped in try/catch
// at the call site so a Resend failure doesn't break the webhook (which
// would cause Stripe to retry and re-mark already-paid rows).
// ─────────────────────────────────────────────────────────────────────────────

async function sendBlockConfirmationEmail(bookingIds: string[]): Promise<void> {
  const admin = createAdminClient()

  const { data: bookings } = await admin
    .from('kids_block_bookings')
    .select('id, child_id, parent_id, category, block_id')
    .in('id', bookingIds)
  if (!bookings?.length) return

  const parentId = bookings[0].parent_id
  const blockId = bookings[0].block_id
  const childIds = bookings.map((b) => b.child_id)

  const [parentRes, blockRes, childrenRes, sessionsRes] = await Promise.all([
    admin.from('kids_parents').select('email, name').eq('id', parentId).single(),
    admin.from('kids_blocks').select('name, start_date').eq('id', blockId).single(),
    admin.from('kids_children').select('id, child_name').in('id', childIds),
    admin
      .from('kids_sessions')
      .select('session_date, session_number, is_break, break_label')
      .eq('block_id', blockId)
      .order('session_number'),
  ])

  const parent = parentRes.data
  const block = blockRes.data
  if (!parent?.email || !block) return

  const childNameById = new Map((childrenRes.data ?? []).map((c) => [c.id, c.child_name]))
  const childRows = bookings.map((b) => ({
    name: childNameById.get(b.child_id) ?? 'Your child',
    category: b.category as KidsCategory,
  }))
  const sessions = sessionsRes.data ?? []

  const html = renderBlockConfirmationEmail({
    parentName: parent.name,
    blockName: block.name,
    blockStartDate: block.start_date,
    children: childRows,
    sessions,
  })

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: parent.email,
    bcc: KIDS_ADMIN_EMAIL,
    replyTo: KIDS_ADMIN_EMAIL,
    subject: `You're booked in — ${block.name}`,
    html,
  })
  if (error) throw new Error((error as { message?: string }).message ?? 'unknown')
}

async function sendDropInPaidConfirmationEmail(dropinId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: dropin } = await admin
    .from('kids_dropin_bookings')
    .select('id, child_name, category, parent_email, price_pence, session_id')
    .eq('id', dropinId)
    .single()
  if (!dropin?.parent_email) return

  let sessionDateStr = ''
  if (dropin.session_id) {
    const { data: s } = await admin
      .from('kids_sessions')
      .select('session_date')
      .eq('id', dropin.session_id)
      .single()
    if (s?.session_date) {
      sessionDateStr = new Date(s.session_date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    }
  }

  const category = dropin.category as KidsCategory
  const html = renderDropInPaidEmail({
    childName: dropin.child_name ?? 'your child',
    category,
    sessionDateStr,
    pricePence: dropin.price_pence,
  })

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: dropin.parent_email,
    bcc: KIDS_ADMIN_EMAIL,
    replyTo: KIDS_ADMIN_EMAIL,
    subject: `Drop-in confirmed${sessionDateStr ? ` — ${sessionDateStr}` : ''}`,
    html,
  })
  if (error) throw new Error((error as { message?: string }).message ?? 'unknown')
}

// ─── HTML templates ──────────────────────────────────────────────────────

function renderBlockConfirmationEmail(args: {
  parentName: string
  blockName: string
  blockStartDate: string
  children: { name: string; category: KidsCategory }[]
  sessions: { session_date: string; is_break: boolean; break_label: string | null }[]
}): string {
  const childRows = args.children
    .map(
      (c) => `<tr><td style="padding:6px 0;color:#fff;font-size:14px;">${escapeHtml(c.name)}</td><td style="padding:6px 0;color:#f2cb55;font-size:12px;text-align:right;">${CATEGORY_LABEL[c.category]} &middot; ${CATEGORY_TIME[c.category]}</td></tr>`,
    )
    .join('')

  const sessionRows = args.sessions
    .map((s) => {
      if (s.is_break) {
        return `<li style="padding:4px 0;color:#6b7587;font-style:italic;">No session — ${escapeHtml(s.break_label ?? 'break')}</li>`
      }
      const formatted = new Date(s.session_date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      return `<li style="padding:4px 0;color:#cdd5e3;">${escapeHtml(formatted)}</li>`
    })
    .join('')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You're booked in</title></head>
<body style="margin:0;padding:0;background:#0b0e14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0e14;padding:32px 16px;"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#161c2a;border:1px solid rgba(212,160,23,0.18);border-radius:12px;overflow:hidden;">
      <tr><td style="padding:28px 32px 0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c9a70a;margin-bottom:8px;">Northern Warrior Kids</div>
        <h1 style="margin:0;font-size:22px;line-height:1.25;color:#fff;font-weight:700;">You&rsquo;re booked in</h1>
      </td></tr>
      <tr><td style="padding:20px 32px 0;color:#cdd5e3;font-size:14px;line-height:1.55;">
        Thanks ${escapeHtml(args.parentName)} — your booking for <strong style="color:#fff;">${escapeHtml(args.blockName)}</strong> is confirmed and paid. We can&rsquo;t wait to meet you on the first session.
      </td></tr>
      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0e14;border:1px solid rgba(255,255,255,0.07);border-radius:10px;"><tr><td style="padding:14px 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${childRows}</table>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:24px 32px 0;color:#cdd5e3;font-size:13px;line-height:1.55;">
        <strong style="color:#fff;">Session dates</strong>
        <ul style="margin:8px 0 0;padding:0 0 0 18px;font-size:13px;">${sessionRows}</ul>
      </td></tr>
      <tr><td style="padding:24px 32px 0;color:#cdd5e3;font-size:13px;line-height:1.55;">
        <strong style="color:#fff;">What to bring:</strong> trainers, water, comfortable kit. We&rsquo;ll have everything else.
      </td></tr>
      <tr><td style="padding:24px 32px 28px;">
        <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:18px;color:#8a93a5;font-size:12px;line-height:1.6;">Reply to this email if anything comes up — we&rsquo;ll get back to you the same day.</div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

function renderDropInPaidEmail(args: {
  childName: string
  category: KidsCategory
  sessionDateStr: string
  pricePence: number
}): string {
  const time = CATEGORY_TIME[args.category]
  const catLabel = CATEGORY_LABEL[args.category]
  const sessionLine = args.sessionDateStr
    ? `<tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Date</td><td style="padding:6px 0;color:#fff;font-size:14px;text-align:right;">${escapeHtml(args.sessionDateStr)}</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Drop-in confirmed</title></head>
<body style="margin:0;padding:0;background:#0b0e14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0e14;padding:32px 16px;"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;background:#161c2a;border:1px solid rgba(212,160,23,0.18);border-radius:12px;overflow:hidden;">
      <tr><td style="padding:28px 32px 0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c9a70a;margin-bottom:8px;">Northern Warrior Kids</div>
        <h1 style="margin:0;font-size:22px;line-height:1.25;color:#fff;font-weight:700;">Drop-in confirmed</h1>
      </td></tr>
      <tr><td style="padding:20px 32px 0;color:#cdd5e3;font-size:14px;line-height:1.55;">
        Thanks — payment received. <strong style="color:#fff;">${escapeHtml(args.childName)}</strong> is booked in for the session below.
      </td></tr>
      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0e14;border:1px solid rgba(255,255,255,0.07);border-radius:10px;"><tr><td style="padding:14px 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Group</td><td style="padding:6px 0;color:#fff;font-size:14px;text-align:right;">${catLabel} &middot; ${time}</td></tr>
            ${sessionLine}
            <tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Paid</td><td style="padding:6px 0;color:#22c55e;font-size:14px;font-weight:700;text-align:right;">${formatPence(args.pricePence)}</td></tr>
          </table>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:24px 32px 0;color:#cdd5e3;font-size:13px;line-height:1.55;">
        <strong style="color:#fff;">What to bring:</strong> trainers, water, comfortable kit.
      </td></tr>
      <tr><td style="padding:24px 32px 28px;">
        <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:18px;color:#8a93a5;font-size:12px;line-height:1.6;">See you on the day. Reply if anything comes up.</div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
