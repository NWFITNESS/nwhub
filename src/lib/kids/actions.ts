'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, siteUrl } from '@/lib/stripe'
import { getResend, FROM_EMAIL, REPLY_TO } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import type { KidsCategory } from './types'
import { CATEGORY_LABEL, CATEGORY_TIME, DROPIN_PRICE_PENCE, formatPence } from './constants'

// ─────────────────────────────────────────────────────────────────────────────
// Kids & Teens — server actions
//
// Every action revalidates /kids so the page reflects the change. Stripe is
// stubbed in this phase — Phase 3 replaces the dropin link generator and
// adds createBlockCheckoutSession + the webhook.
// ─────────────────────────────────────────────────────────────────────────────

interface SaveBlockInput {
  id?: string
  name: string
  start_date: string
  session_count: number
  is_recurring: boolean
}

/**
 * Upsert a block. If the block exists, update it; otherwise create it AND
 * insert default pricing rows AND generate sessions.
 *
 * On update: regenerate the kids_sessions rows (cascading delete then re-insert),
 * but preserve break flags by matching session_number to the previous state.
 */
export async function saveBlock(input: SaveBlockInput): Promise<{ id: string }> {
  const supabase = await createClient()

  // Capture existing breaks (so we can re-apply after regenerating sessions)
  const breaksBefore = new Map<number, string | null>()
  if (input.id) {
    const { data: existing } = await supabase
      .from('kids_sessions')
      .select('session_number, is_break, break_label')
      .eq('block_id', input.id)
    for (const s of existing ?? []) {
      if (s.is_break) breaksBefore.set(s.session_number, s.break_label)
    }
  }

  let blockId = input.id
  if (blockId) {
    const { error } = await supabase
      .from('kids_blocks')
      .update({
        name: input.name,
        start_date: input.start_date,
        session_count: input.session_count,
        is_recurring: input.is_recurring,
      })
      .eq('id', blockId)
    if (error) throw new Error(`Failed to update block: ${error.message}`)
  } else {
    const { data, error } = await supabase
      .from('kids_blocks')
      .insert({
        name: input.name,
        start_date: input.start_date,
        session_count: input.session_count,
        is_recurring: input.is_recurring,
        is_active: false,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(`Failed to create block: ${error?.message ?? 'unknown'}`)
    blockId = data.id

    // Default pricing for new blocks
    await supabase.from('kids_block_pricing').insert([
      { block_id: blockId, category: 'minis',   capacity: 12, price_pence: 4500 },
      { block_id: blockId, category: 'littles', capacity: 12, price_pence: 4500 },
      { block_id: blockId, category: 'teens',   capacity: 12, price_pence: 5000 },
    ])
  }

  // Regenerate sessions
  await supabase.from('kids_sessions').delete().eq('block_id', blockId)
  const startDate = new Date(input.start_date)
  const sessions = Array.from({ length: input.session_count }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i * 7)
    const sessionNumber = i + 1
    const wasBreak = breaksBefore.has(sessionNumber)
    return {
      block_id: blockId!,
      session_date: date.toISOString().slice(0, 10),
      session_number: sessionNumber,
      is_break: wasBreak,
      break_label: wasBreak ? breaksBefore.get(sessionNumber) ?? null : null,
    }
  })
  if (sessions.length) {
    const { error } = await supabase.from('kids_sessions').insert(sessions)
    if (error) throw new Error(`Failed to insert sessions: ${error.message}`)
  }

  revalidatePath('/kids')
  return { id: blockId! }
}

/**
 * Set a block as the active block. Only one block is active at a time.
 */
export async function setActiveBlock(blockId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('kids_blocks').update({ is_active: false }).neq('id', blockId)
  await supabase.from('kids_blocks').update({ is_active: true }).eq('id', blockId)
  revalidatePath('/kids')
  revalidatePath('/kids-teens')
}

/**
 * Mark or unmark a session as a break.
 */
export async function setSessionBreak(
  sessionId: string,
  isBreak: boolean,
  label: string | null = null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('kids_sessions')
    .update({ is_break: isBreak, break_label: isBreak ? label : null })
    .eq('id', sessionId)
  if (error) throw new Error(`Failed to update break: ${error.message}`)
  revalidatePath('/kids')
  revalidatePath('/kids-teens')
}

/**
 * Save capacity + pricing for a block. Upserts each category row.
 */
export async function saveBlockPricing(
  blockId: string,
  rows: { category: KidsCategory; capacity: number; price_pence: number; stripe_price_id?: string | null }[],
): Promise<void> {
  const supabase = await createClient()
  for (const row of rows) {
    const { error } = await supabase
      .from('kids_block_pricing')
      .upsert(
        { block_id: blockId, ...row },
        { onConflict: 'block_id,category' },
      )
    if (error) throw new Error(`Failed to save pricing for ${row.category}: ${error.message}`)
  }
  revalidatePath('/kids')
}

interface CreateDropInLinkInput {
  childName: string
  category: KidsCategory
  sessionId: string | null
  parentEmail: string
}

/**
 * Generate a real Stripe Payment Link for a single drop-in session.
 *
 * Creates the booking row first so we have a stable booking_id to put in the
 * Payment Link metadata, then creates a one-off Price + Payment Link in
 * Stripe, then stores the link ID on the booking row. The Stripe webhook
 * marks the row as paid once the parent completes checkout.
 */
export async function createDropInPaymentLink(
  input: CreateDropInLinkInput,
): Promise<{ url: string; bookingId: string }> {
  const supabase = await createClient()
  const pricePence = DROPIN_PRICE_PENCE[input.category]
  const parentEmail = input.parentEmail.toLowerCase().trim()

  // 1. Insert booking with status 'pending' so we have an ID for metadata
  const { data: booking, error: insertError } = await supabase
    .from('kids_dropin_bookings')
    .insert({
      session_id: input.sessionId,
      child_name: input.childName,
      parent_email: parentEmail,
      category: input.category,
      payment_status: 'pending',
      price_pence: pricePence,
    })
    .select('id')
    .single()

  if (insertError || !booking) {
    throw new Error(`Failed to create drop-in booking: ${insertError?.message ?? 'unknown'}`)
  }

  try {
    const stripe = getStripe()

    // 2. Create a one-off Price (Payment Links require a Price object, not
    //    inline price_data). The product is created inline via product_data.
    const price = await stripe.prices.create({
      unit_amount: pricePence,
      currency: 'gbp',
      product_data: {
        name: `Drop-in: ${input.childName} (${CATEGORY_LABEL[input.category]})`,
      },
    })

    // 3. Create the Payment Link with metadata that the webhook will read
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        type: 'dropin',
        dropin_booking_id: booking.id,
        child_name: input.childName,
        category: input.category,
        session_id: input.sessionId ?? '',
      },
      after_completion: {
        type: 'redirect',
        redirect: { url: `${siteUrl()}/kids-teens/confirmed?dropin=${booking.id}` },
      },
    })

    // 4. Store the link ID on the booking and flip status to link_sent
    await supabase
      .from('kids_dropin_bookings')
      .update({
        stripe_payment_link_id: link.id,
        payment_status: 'link_sent',
      })
      .eq('id', booking.id)

    revalidatePath('/kids')
    return { url: link.url, bookingId: booking.id }
  } catch (e) {
    // Roll back: delete the orphan booking row so the UI doesn't show a
    // pending row for a Stripe call that never succeeded.
    await supabase.from('kids_dropin_bookings').delete().eq('id', booking.id)
    throw new Error(`Stripe error: ${(e as Error).message}`)
  }
}

interface CreateBlockCheckoutInput {
  blockId: string
  bookingIds: string[]   // one or more kids_block_bookings IDs (multi-child support)
  parentEmail: string
}

/**
 * Create a Stripe Checkout Session for one or more block bookings.
 *
 * Looks up each booking, finds the matching block pricing, and builds a
 * Checkout Session with one line item per booking. Stores the session ID on
 * every booking so the webhook can flip them all to 'paid' at once.
 *
 * Bookings must already exist in kids_block_bookings with payment_status
 * 'pending' before this is called — the public register form / returning
 * flow inserts those rows first, then calls this action.
 */
export async function createBlockCheckoutSession(
  input: CreateBlockCheckoutInput,
): Promise<{ url: string; sessionId: string }> {
  const admin = createAdminClient()

  // Look up bookings + block + pricing in one go
  const { data: bookings, error: bookingsError } = await admin
    .from('kids_block_bookings')
    .select('id, block_id, child_id, parent_id, category')
    .in('id', input.bookingIds)

  if (bookingsError || !bookings?.length) {
    throw new Error(`Failed to load bookings: ${bookingsError?.message ?? 'no rows'}`)
  }

  // All bookings must be for the same block (and must match input.blockId)
  for (const b of bookings) {
    if (b.block_id !== input.blockId) {
      throw new Error('All bookings must belong to the same block')
    }
  }

  const [blockRes, pricingRes, childrenRes] = await Promise.all([
    admin.from('kids_blocks').select('name').eq('id', input.blockId).single(),
    admin.from('kids_block_pricing').select('category, price_pence').eq('block_id', input.blockId),
    admin.from('kids_children').select('id, child_name').in('id', bookings.map((b) => b.child_id)),
  ])

  if (blockRes.error || !blockRes.data) {
    throw new Error(`Block not found: ${blockRes.error?.message ?? 'unknown'}`)
  }
  const blockName = blockRes.data.name

  const priceByCategory = new Map<KidsCategory, number>()
  for (const p of pricingRes.data ?? []) priceByCategory.set(p.category as KidsCategory, p.price_pence)

  const childById = new Map<string, string>()
  for (const c of childrenRes.data ?? []) childById.set(c.id, c.child_name)

  // Build line items
  const lineItems = bookings.map((b) => {
    const pricePence = priceByCategory.get(b.category as KidsCategory)
    if (pricePence == null) throw new Error(`No price for category ${b.category} on block ${input.blockId}`)
    const childName = childById.get(b.child_id) ?? 'Child'
    return {
      price_data: {
        currency: 'gbp' as const,
        product_data: {
          name: `${blockName} — ${CATEGORY_LABEL[b.category as KidsCategory]} (${childName})`,
        },
        unit_amount: pricePence,
      },
      quantity: 1,
    }
  })

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: input.parentEmail.toLowerCase().trim(),
    success_url: `${siteUrl()}/kids-teens/confirmed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/kids-teens`,
    metadata: {
      type: 'block',
      block_id: input.blockId,
      booking_ids: bookings.map((b) => b.id).join(','),
    },
  })

  if (!session.url) throw new Error('Stripe did not return a checkout URL')

  // Store the session ID on every booking so the webhook can flip them all
  await admin
    .from('kids_block_bookings')
    .update({ stripe_checkout_session_id: session.id })
    .in('id', bookings.map((b) => b.id))

  return { url: session.url, sessionId: session.id }
}

/**
 * Send the drop-in payment link to the parent via Resend.
 *
 * Loads the booking, joins through to the session date and the Stripe link,
 * builds the dark/gold branded NW email, and sends. Throws if anything fails
 * so the UI can surface the error to the admin user.
 */
export async function sendDropInLinkEmail(bookingId: string): Promise<{ ok: true }> {
  const admin = createAdminClient()

  // 1. Load the booking + (optionally) the session date
  const { data: booking, error } = await admin
    .from('kids_dropin_bookings')
    .select('id, child_name, parent_email, category, price_pence, stripe_payment_link_id, session_id')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    throw new Error(`Drop-in booking not found: ${error?.message ?? 'unknown'}`)
  }
  if (!booking.parent_email) {
    throw new Error('No parent email on this booking — generate a link with an email first.')
  }
  if (!booking.stripe_payment_link_id) {
    throw new Error('No Stripe payment link attached to this booking.')
  }

  // 2. Fetch the actual hosted URL from Stripe (we only stored the link ID,
  //    not the URL). Cheaper than denormalising and survives the rare case
  //    where the URL has changed.
  const stripe = getStripe()
  const link = await stripe.paymentLinks.retrieve(booking.stripe_payment_link_id)
  const paymentUrl = link.url
  if (!paymentUrl) throw new Error('Stripe payment link is missing a URL')

  // 3. Resolve the session date if there is one
  let sessionDateStr = ''
  if (booking.session_id) {
    const { data: s } = await admin
      .from('kids_sessions')
      .select('session_date')
      .eq('id', booking.session_id)
      .single()
    if (s?.session_date) {
      sessionDateStr = new Date(s.session_date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    }
  }

  const category = booking.category as KidsCategory
  const html = renderDropInEmail({
    childName: booking.child_name ?? 'your child',
    category,
    sessionDateStr,
    pricePence: booking.price_pence,
    paymentUrl,
  })

  // 4. Send
  const resend = getResend()
  const { error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: booking.parent_email,
    replyTo: REPLY_TO,
    subject: 'Your drop-in payment link — Northern Warrior Kids',
    html,
  })

  if (sendError) {
    throw new Error(`Resend failed: ${(sendError as { message?: string }).message ?? 'unknown'}`)
  }

  return { ok: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email template — drop-in payment link
//
// Inline HTML (no template engine) to match the convention used elsewhere in
// this repo. Dark background, gold accents, single CTA. Avoids any external
// CSS or images so it renders consistently in every mail client.
// ─────────────────────────────────────────────────────────────────────────────

function renderDropInEmail(args: {
  childName: string
  category: KidsCategory
  sessionDateStr: string
  pricePence: number
  paymentUrl: string
}): string {
  const time = CATEGORY_TIME[args.category]
  const catLabel = CATEGORY_LABEL[args.category]
  const price = formatPence(args.pricePence)
  const sessionLine = args.sessionDateStr
    ? `<tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Session</td><td style="padding:6px 0;color:#fff;font-size:14px;text-align:right;">${escapeHtml(args.sessionDateStr)}</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your drop-in payment link</title>
</head>
<body style="margin:0;padding:0;background:#0b0e14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0e14;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;background:#161c2a;border:1px solid rgba(212,160,23,0.18);border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 0;">
              <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d4a017;margin-bottom:8px;">Northern Warrior Kids</div>
              <h1 style="margin:0;font-size:22px;line-height:1.25;color:#fff;font-weight:700;">Your drop-in payment link</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;color:#cdd5e3;font-size:14px;line-height:1.55;">
              Hi — here&rsquo;s the payment link for <strong style="color:#fff;">${escapeHtml(args.childName)}</strong>&rsquo;s drop-in session at Northern Warrior. Click the button below to secure the spot.
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0e14;border:1px solid rgba(255,255,255,0.07);border-radius:10px;">
                <tr><td style="padding:14px 18px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Child</td><td style="padding:6px 0;color:#fff;font-size:14px;text-align:right;">${escapeHtml(args.childName)}</td></tr>
                    <tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Category</td><td style="padding:6px 0;color:#fff;font-size:14px;text-align:right;">${catLabel} &middot; ${time}</td></tr>
                    ${sessionLine}
                    <tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Amount</td><td style="padding:6px 0;color:#f2cb55;font-size:14px;font-weight:700;text-align:right;">${price}</td></tr>
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <a href="${args.paymentUrl}" style="display:inline-block;background:#d4a017;color:#0b0e14;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;letter-spacing:0.3px;">Pay now &rarr;</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;color:#6b7587;font-size:11px;text-align:center;line-height:1.5;">
              Or copy and paste this link:<br>
              <a href="${args.paymentUrl}" style="color:#d4a017;word-break:break-all;">${args.paymentUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 28px;">
              <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:18px;color:#8a93a5;font-size:12px;line-height:1.6;">
                <strong style="color:#cdd5e3;">Where to find us</strong><br>
                Northern Warrior Functional Fitness<br>
                Reply to this email if you have any questions.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Toggle photo consent for a child (used by the public returning-parent flow,
 * but also surfaced from the NWHub roster if needed).
 */
export async function setPhotoConsent(childId: string, allowed: boolean): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('kids_children')
    .update({ photo_consent: allowed })
    .eq('id', childId)
  if (error) throw new Error(`Failed to update photo consent: ${error.message}`)
  revalidatePath('/kids')
}

// ─────────────────────────────────────────────────────────────────────────────
// Refund + cancel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Refund a paid block booking via Stripe and mark the row as refunded.
 *
 * Refunds the full amount from the Stripe PaymentIntent attached to the
 * Checkout Session. If the booking is part of a multi-child checkout
 * (booking_ids was a comma-joined list in the session metadata), only THIS
 * booking is marked refunded — Stripe refunds the entire PaymentIntent
 * because line items can't be partially refunded by ID. If you have multiple
 * children on the same checkout you'll currently get a full refund of all of
 * them. We can revisit with `amount`-based partial refunds if needed.
 */
export async function refundBlockBooking(bookingId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: booking, error } = await admin
    .from('kids_block_bookings')
    .select('id, payment_status, stripe_payment_intent_id')
    .eq('id', bookingId)
    .single()

  if (error || !booking) throw new Error(`Booking not found: ${error?.message ?? 'unknown'}`)
  if (booking.payment_status !== 'paid') {
    throw new Error('Only paid bookings can be refunded.')
  }
  if (!booking.stripe_payment_intent_id) {
    throw new Error('No Stripe payment intent on this booking — cannot refund.')
  }

  const stripe = getStripe()
  await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id })

  await admin
    .from('kids_block_bookings')
    .update({ payment_status: 'refunded' })
    .eq('id', bookingId)

  revalidatePath('/kids')
}

/**
 * Refund a paid drop-in booking via Stripe and mark the row as refunded.
 */
export async function refundDropIn(bookingId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: booking, error } = await admin
    .from('kids_dropin_bookings')
    .select('id, payment_status, stripe_payment_intent_id')
    .eq('id', bookingId)
    .single()

  if (error || !booking) throw new Error(`Drop-in not found: ${error?.message ?? 'unknown'}`)
  if (booking.payment_status !== 'paid') {
    throw new Error('Only paid drop-ins can be refunded.')
  }
  if (!booking.stripe_payment_intent_id) {
    throw new Error('No Stripe payment intent on this drop-in — cannot refund.')
  }

  const stripe = getStripe()
  await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id })

  await admin
    .from('kids_dropin_bookings')
    .update({ payment_status: 'refunded' })
    .eq('id', bookingId)

  revalidatePath('/kids')
}

/**
 * Cancel and remove a drop-in booking that hasn't been paid yet.
 *
 * Deactivates the Stripe Payment Link so the URL stops working (Stripe
 * doesn't support deletion of payment links — only setting active=false),
 * then deletes the row from kids_dropin_bookings so it disappears from the
 * recent-drop-ins list. Refuses if the booking is already paid — use
 * refundDropIn instead in that case.
 */
export async function cancelDropIn(bookingId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: booking, error } = await admin
    .from('kids_dropin_bookings')
    .select('id, payment_status, stripe_payment_link_id')
    .eq('id', bookingId)
    .single()

  if (error || !booking) throw new Error(`Drop-in not found: ${error?.message ?? 'unknown'}`)
  if (booking.payment_status === 'paid') {
    throw new Error('This drop-in is already paid — use Refund instead.')
  }

  // Deactivate the Stripe payment link if there is one. Best-effort: if the
  // link was never created or has already been deactivated we don't want to
  // block the row deletion on a Stripe error.
  if (booking.stripe_payment_link_id) {
    try {
      const stripe = getStripe()
      await stripe.paymentLinks.update(booking.stripe_payment_link_id, { active: false })
    } catch (e) {
      console.warn('[cancelDropIn] failed to deactivate Stripe link:', (e as Error).message)
    }
  }

  const { error: deleteError } = await admin
    .from('kids_dropin_bookings')
    .delete()
    .eq('id', bookingId)

  if (deleteError) throw new Error(`Failed to delete drop-in: ${deleteError.message}`)

  revalidatePath('/kids')
}
