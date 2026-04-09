import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

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
    console.error('[stripe-kids] handler error:', (err as Error).message)
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
    const { error } = await admin
      .from('kids_block_bookings')
      .update({
        payment_status: 'paid',
        paid_at: paidAt,
        stripe_payment_intent_id: paymentIntentId,
        stripe_checkout_session_id: session.id,
      })
      .in('id', bookingIds)
    if (error) throw new Error(`Failed to mark block bookings paid: ${error.message}`)
    return
  }

  if (type === 'dropin') {
    const dropinBookingId = meta.dropin_booking_id
    if (!dropinBookingId) {
      console.warn('[stripe-kids] dropin event with no dropin_booking_id in metadata', session.id)
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
    return
  }

  // Unknown type — log and ignore. Could be from another integration sharing
  // the same webhook endpoint (it shouldn't, but be defensive).
  console.log('[stripe-kids] ignoring event with unknown metadata.type:', type)
}
