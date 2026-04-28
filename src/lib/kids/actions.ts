'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, siteUrl } from '@/lib/stripe'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import type { KidsCategory } from './types'
import { CATEGORY_LABEL, CATEGORY_TIME, DROPIN_PRICE_PENCE, categoryFromDob, formatPence } from './constants'

// ─────────────────────────────────────────────────────────────────────────────
// Kids inbox — every parent-facing kids email is BCC'd and reply-to'd to this
// address so all booking-related info funnels into one place. The sender
// stays on the verified northernwarrior.co.uk domain.
// ─────────────────────────────────────────────────────────────────────────────
const KIDS_ADMIN_EMAIL = 'info@nwfitnesskids.co.uk'

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
  // Use the admin client for mutations: the user is already authenticated to
  // be on /kids (the dashboard layout enforces it), and using the admin
  // client eliminates a class of RLS edge cases where the cookie context
  // gets stale during a server action invocation.
  const admin = createAdminClient()

  // Validate inputs upfront — vague errors during production renders are
  // much harder to diagnose than a clean throw here with a real message.
  if (!input.name?.trim()) throw new Error('Block name is required.')
  if (!input.start_date) throw new Error('Start date is required.')
  if (!Number.isInteger(input.session_count) || input.session_count < 1 || input.session_count > 52) {
    throw new Error('Session count must be between 1 and 52.')
  }
  // Sanity check the date format — must be ISO yyyy-mm-dd
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.start_date)) {
    throw new Error('Start date must be in YYYY-MM-DD format.')
  }

  // Capture existing breaks so we can re-apply after regenerating sessions
  const breaksBefore = new Map<number, string | null>()
  if (input.id) {
    const { data: existing } = await admin
      .from('kids_sessions')
      .select('session_number, is_break, break_label')
      .eq('block_id', input.id)
    for (const s of existing ?? []) {
      if (s.is_break) breaksBefore.set(s.session_number, s.break_label)
    }
  }

  let blockId = input.id
  if (blockId) {
    const { error } = await admin
      .from('kids_blocks')
      .update({
        name: input.name.trim(),
        start_date: input.start_date,
        session_count: input.session_count,
        is_recurring: input.is_recurring,
      })
      .eq('id', blockId)
    if (error) throw new Error(`Failed to update block: ${error.message}`)
  } else {
    // Auto-activate this block if there's no other active block. Avoids the
    // common surprise where a freshly created block doesn't show on the
    // public site because it was created inactive and the admin forgot to
    // click "Make active". If another block IS active, we don't touch it —
    // creating a future block shouldn't accidentally swap your live one.
    const { count: activeCount } = await admin
      .from('kids_blocks')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
    const shouldActivate = (activeCount ?? 0) === 0

    const { data, error } = await admin
      .from('kids_blocks')
      .insert({
        name: input.name.trim(),
        start_date: input.start_date,
        session_count: input.session_count,
        is_recurring: input.is_recurring,
        is_active: shouldActivate,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(`Failed to create block: ${error?.message ?? 'unknown'}`)
    blockId = data.id

    // Default pricing for new blocks
    const { error: pricingError } = await admin.from('kids_block_pricing').insert([
      { block_id: blockId, category: 'minis',   capacity: 12, price_pence: 4500 },
      { block_id: blockId, category: 'littles', capacity: 12, price_pence: 4500 },
      { block_id: blockId, category: 'teens',   capacity: 12, price_pence: 5000 },
    ])
    if (pricingError) throw new Error(`Failed to seed pricing: ${pricingError.message}`)
  }

  // Regenerate sessions. Date arithmetic is done in pure UTC to avoid the
  // BST/UTC drift that would otherwise cause Sunday → Saturday on a UK
  // server during summer. Parse the input as UTC midnight, then add 7 *
  // 86400000 ms per session — never call setDate which uses local time.
  const { error: deleteError } = await admin.from('kids_sessions').delete().eq('block_id', blockId)
  if (deleteError) throw new Error(`Failed to clear old sessions: ${deleteError.message}`)

  const startMs = new Date(`${input.start_date}T00:00:00Z`).getTime()
  if (Number.isNaN(startMs)) throw new Error(`Invalid start date: ${input.start_date}`)

  const sessions = Array.from({ length: input.session_count }, (_, i) => {
    const date = new Date(startMs + i * 7 * 86400000)
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
    const { error } = await admin.from('kids_sessions').insert(sessions)
    if (error) throw new Error(`Failed to insert sessions: ${error.message}`)
  }

  revalidatePath('/kids')
  revalidatePath('/kids-teens')
  return { id: blockId! }
}

/**
 * Permanently delete a block and (via cascade) its sessions and pricing rows.
 * Refuses if there are any bookings on the block — those need to be refunded
 * or removed first to avoid orphaning paid customers.
 */
export async function deleteBlock(blockId: string): Promise<void> {
  console.log('[deleteBlock] start', { blockId })
  const admin = createAdminClient()

  // Refuse if any block bookings exist for this block
  const { count: bookingCount, error: countError } = await admin
    .from('kids_block_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('block_id', blockId)
  if (countError) {
    console.error('[deleteBlock] booking-count error:', countError)
    throw new Error(`Failed to check bookings: ${countError.message}`)
  }
  if ((bookingCount ?? 0) > 0) {
    throw new Error(
      `This block has ${bookingCount} booking(s) attached. Refund or remove them before deleting the block.`,
    )
  }

  // Pre-cascade cleanup: explicitly null any kids_dropin_bookings.session_id
  // and kids_trials.session_id that reference sessions of this block. The FK
  // SET NULL should handle this automatically, but we also do it explicitly
  // here so any database edge case can't leave orphaned references that
  // crash subsequent reads.
  const { data: sessionRows, error: sessionsError } = await admin
    .from('kids_sessions')
    .select('id')
    .eq('block_id', blockId)
  if (sessionsError) {
    console.error('[deleteBlock] sessions fetch error:', sessionsError)
    throw new Error(`Failed to load sessions: ${sessionsError.message}`)
  }
  const sessionIds = (sessionRows ?? []).map((s) => s.id)
  if (sessionIds.length) {
    const dropinNullRes = await admin
      .from('kids_dropin_bookings')
      .update({ session_id: null })
      .in('session_id', sessionIds)
    if (dropinNullRes.error) console.error('[deleteBlock] dropin null error:', dropinNullRes.error)

    const trialNullRes = await admin
      .from('kids_trials')
      .update({ session_id: null })
      .in('session_id', sessionIds)
    if (trialNullRes.error) console.error('[deleteBlock] trial null error:', trialNullRes.error)
  }

  const { error } = await admin.from('kids_blocks').delete().eq('id', blockId)
  if (error) {
    console.error('[deleteBlock] block delete error:', error)
    throw new Error(`Failed to delete block: ${error.message}`)
  }

  console.log('[deleteBlock] success', { blockId, sessionIdsCleared: sessionIds.length })
  revalidatePath('/kids')
}

/**
 * Set a block as the active block. Only one block is active at a time, so
 * this also clears `is_active` on every other block.
 */
export async function setActiveBlock(blockId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('kids_blocks').update({ is_active: false }).neq('id', blockId)
  await admin.from('kids_blocks').update({ is_active: true }).eq('id', blockId)
  revalidatePath('/kids')
}

/**
 * Mark a block as inactive without deleting it. Used when a block is
 * finished — keeps it in the roster history but stops it appearing on the
 * public site as the live block.
 */
export async function deactivateBlock(blockId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('kids_blocks')
    .update({ is_active: false })
    .eq('id', blockId)
  if (error) throw new Error(`Failed to deactivate block: ${error.message}`)
  revalidatePath('/kids')
}

/**
 * Mark or unmark a session as a break.
 */
export async function setSessionBreak(
  sessionId: string,
  isBreak: boolean,
  label: string | null = null,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
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
  const admin = createAdminClient()
  for (const row of rows) {
    const { error } = await admin
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
  /** Override the default category price (in pence). Falls back to DROPIN_PRICE_PENCE if not provided. */
  pricePence?: number
}

/**
 * Generate a real Stripe Payment Link for a single drop-in session.
 *
 * Creates the booking row first so we have a stable booking_id to put in the
 * Payment Link metadata, then creates a one-off Price + Payment Link in
 * Stripe, then stores the link ID on the booking row. The Stripe webhook
 * marks the row as paid once the parent completes checkout.
 *
 * The price defaults to DROPIN_PRICE_PENCE for the category but can be
 * overridden via input.pricePence — useful for one-off discounts or
 * promotional rates without touching the global constant.
 */
export async function createDropInPaymentLink(
  input: CreateDropInLinkInput,
): Promise<{ url: string; bookingId: string }> {
  const admin = createAdminClient()
  const pricePence = input.pricePence ?? DROPIN_PRICE_PENCE[input.category]
  if (!Number.isInteger(pricePence) || pricePence < 50) {
    throw new Error('Drop-in price must be at least £0.50.')
  }
  const parentEmail = input.parentEmail.toLowerCase().trim()

  // 1. Insert booking with status 'pending' so we have an ID for metadata
  const { data: booking, error: insertError } = await admin
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
    await admin
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
    await admin.from('kids_dropin_bookings').delete().eq('id', booking.id)
    throw new Error(`Stripe error: ${(e as Error).message}`)
  }
}

interface CreateBlockCheckoutInput {
  blockId: string
  bookingIds: string[]   // one or more kids_block_bookings IDs (multi-child support)
  parentEmail: string
  discountCode?: string  // optional discount code entered by parent
}

/**
 * Create a Stripe Checkout Session for one or more block bookings.
 *
 * Looks up each booking, finds the matching block pricing, and builds a
 * Checkout Session with one line item per booking. Stores the session ID on
 * every booking so the webhook can flip them all to 'paid' at once.
 *
 * Discounts:
 * - Auto-applies sibling discount if 2+ children and an auto_apply discount exists
 * - Accepts an optional discount code from the parent
 * - Only one discount per checkout (code takes priority over auto-apply)
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

  // ── Resolve discount ──────────────────────────────────────────────────
  type AppliedDiscount = { code: string; description: string; discount_type: 'percentage' | 'fixed'; value: number }
  let appliedDiscount: AppliedDiscount | null = null

  // Try manual code first
  if (input.discountCode?.trim()) {
    const { data: codeDiscount } = await admin
      .from('kids_discounts')
      .select('*')
      .eq('is_active', true)
      .eq('auto_apply', false)
      .ilike('code', input.discountCode.trim())
      .maybeSingle()

    if (codeDiscount) {
      const now = new Date()
      const valid =
        (!codeDiscount.valid_from || new Date(codeDiscount.valid_from) <= now) &&
        (!codeDiscount.valid_until || new Date(codeDiscount.valid_until) >= now) &&
        (codeDiscount.max_uses == null || codeDiscount.times_used < codeDiscount.max_uses) &&
        bookings.length >= codeDiscount.min_children
      if (valid) {
        appliedDiscount = {
          code: codeDiscount.code,
          description: codeDiscount.description,
          discount_type: codeDiscount.discount_type,
          value: codeDiscount.value,
        }
      }
    }
  }

  // Fall back to auto-apply sibling discount
  if (!appliedDiscount && bookings.length >= 2) {
    const { data: autoDiscount } = await admin
      .from('kids_discounts')
      .select('*')
      .eq('is_active', true)
      .eq('auto_apply', true)
      .lte('min_children', bookings.length)
      .order('value', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (autoDiscount) {
      appliedDiscount = {
        code: autoDiscount.code,
        description: autoDiscount.description,
        discount_type: autoDiscount.discount_type,
        value: autoDiscount.value,
      }
    }
  }

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

  // ── Create Stripe coupon if discount applies ──────────────────────────
  const stripe = getStripe()
  let stripeCouponId: string | undefined

  if (appliedDiscount) {
    const couponParams: Record<string, unknown> = {
      duration: 'once' as const,
      name: appliedDiscount.description || appliedDiscount.code,
    }
    if (appliedDiscount.discount_type === 'percentage') {
      couponParams.percent_off = appliedDiscount.value
    } else {
      couponParams.amount_off = appliedDiscount.value
      couponParams.currency = 'gbp'
    }
    const coupon = await stripe.coupons.create(couponParams as Parameters<typeof stripe.coupons.create>[0])
    stripeCouponId = coupon.id
  }

  // ── Calculate discount per booking for record-keeping ─────────────────
  let discountPerBookingPence = 0
  if (appliedDiscount) {
    const totalPence = lineItems.reduce((sum, li) => sum + li.price_data.unit_amount, 0)
    let totalDiscountPence: number
    if (appliedDiscount.discount_type === 'percentage') {
      totalDiscountPence = Math.round(totalPence * (appliedDiscount.value / 100))
    } else {
      totalDiscountPence = Math.min(appliedDiscount.value, totalPence)
    }
    discountPerBookingPence = Math.round(totalDiscountPence / bookings.length)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
    customer_email: input.parentEmail.toLowerCase().trim(),
    success_url: `${siteUrl()}/kids-teens/confirmed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/kids-teens`,
    metadata: {
      type: 'block',
      block_id: input.blockId,
      booking_ids: bookings.map((b) => b.id).join(','),
      ...(appliedDiscount ? { discount_code: appliedDiscount.code } : {}),
    },
  })

  if (!session.url) throw new Error('Stripe did not return a checkout URL')

  // Store the session ID + discount info on every booking
  await admin
    .from('kids_block_bookings')
    .update({
      stripe_checkout_session_id: session.id,
      ...(appliedDiscount
        ? { discount_code: appliedDiscount.code, discount_amount_pence: discountPerBookingPence }
        : {}),
    })
    .in('id', bookings.map((b) => b.id))

  // Increment usage counter (non-critical)
  if (appliedDiscount) {
    try {
      const { data } = await admin
        .from('kids_discounts')
        .select('times_used')
        .ilike('code', appliedDiscount.code)
        .single()
      if (data) {
        await admin
          .from('kids_discounts')
          .update({ times_used: data.times_used + 1 })
          .ilike('code', appliedDiscount.code)
      }
    } catch { /* non-critical */ }
  }

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

  // 4. Send — bcc the kids inbox so admin sees a copy in real time
  const resend = getResend()
  const { error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: booking.parent_email,
    bcc: KIDS_ADMIN_EMAIL,
    replyTo: KIDS_ADMIN_EMAIL,
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
  const admin = createAdminClient()
  const { error } = await admin
    .from('kids_children')
    .update({ photo_consent: allowed })
    .eq('id', childId)
  if (error) throw new Error(`Failed to update photo consent: ${error.message}`)
  revalidatePath('/kids')
}

// ─────────────────────────────────────────────────────────────────────────────
// Trials
//
// Trial workflow: a parent (new or returning) submits a free one-off session
// request. We upsert the parent + child records, insert a kids_trials row,
// and send a confirmation email. No payment, no Stripe.
// ─────────────────────────────────────────────────────────────────────────────

interface SubmitTrialInput {
  parent: {
    name: string
    email: string
    phone: string
    emergencyName: string
    emergencyPhone: string
    emergencyRelation?: string
  }
  child: {
    firstName: string
    lastName: string
    dateOfBirth: string  // ISO yyyy-mm-dd
    photoConsent: boolean
    medicalNotes?: string
  }
  /** Caller picks the category explicitly — auto-derived from DOB is only a UI hint. */
  category: KidsCategory
  sessionId: string | null
  notes?: string
  source: 'web' | 'admin'
}

export async function submitTrialBooking(
  input: SubmitTrialInput,
): Promise<{ trialId: string; emailSent: boolean; emailError: string | null }> {
  const admin = createAdminClient()

  const first = input.child.firstName.trim()
  const last = input.child.lastName.trim()
  if (!first || !last) throw new Error("Both the child's first name and surname are required.")
  if (!input.parent.name.trim()) throw new Error('Parent name is required.')
  if (!input.parent.email.trim()) throw new Error('Parent email is required.')
  if (!input.child.dateOfBirth) throw new Error("Child's date of birth is required.")
  if (!input.category) throw new Error('Please pick a category (Minis / Littles / Teens).')

  const email = input.parent.email.toLowerCase().trim()
  const childName = `${first} ${last}`
  const category: KidsCategory = input.category

  // 1. Upsert parent
  const { data: parent, error: parentError } = await admin
    .from('kids_parents')
    .upsert(
      {
        email,
        name: input.parent.name.trim(),
        phone: input.parent.phone.trim() || null,
        emergency_contact_name: input.parent.emergencyName.trim() || null,
        emergency_contact_phone: input.parent.emergencyPhone.trim() || null,
        emergency_contact_relation: input.parent.emergencyRelation?.trim() || null,
      },
      { onConflict: 'email' },
    )
    .select('id, email, name')
    .single()

  if (parentError || !parent) throw new Error(`Failed to save parent: ${parentError?.message ?? 'unknown'}`)

  // 2. Find or create child (match by name + dob to avoid duplicates if the
  //    same parent submits multiple trial requests)
  const { data: existingChild } = await admin
    .from('kids_children')
    .select('id')
    .eq('parent_id', parent.id)
    .eq('child_name', childName)
    .eq('date_of_birth', input.child.dateOfBirth)
    .maybeSingle()

  let childId = existingChild?.id
  if (!childId) {
    const { data: newChild, error: childError } = await admin
      .from('kids_children')
      .insert({
        parent_id: parent.id,
        child_name: childName,
        date_of_birth: input.child.dateOfBirth,
        photo_consent: input.child.photoConsent,
        medical_notes: input.child.medicalNotes?.trim() || null,
      })
      .select('id')
      .single()
    if (childError || !newChild) throw new Error(`Failed to save child: ${childError?.message ?? 'unknown'}`)
    childId = newChild.id
  }

  // 3. Insert trial row
  const { data: trial, error: trialError } = await admin
    .from('kids_trials')
    .insert({
      parent_id: parent.id,
      child_id: childId,
      session_id: input.sessionId,
      category,
      notes: input.notes?.trim() || null,
      source: input.source,
    })
    .select('id')
    .single()

  if (trialError || !trial) throw new Error(`Failed to create trial: ${trialError?.message ?? 'unknown'}`)

  // 4. Send confirmation email. The booking is already saved, so an email
  //    failure does NOT roll back — but we surface the error to the caller
  //    so the UI can show a "booking saved, email failed" message instead of
  //    silently lying about email delivery.
  let emailSent = false
  let emailError: string | null = null

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured on this project')
    }

    let sessionDateStr = ''
    if (input.sessionId) {
      const { data: s } = await admin
        .from('kids_sessions')
        .select('session_date')
        .eq('id', input.sessionId)
        .single()
      if (s?.session_date) {
        sessionDateStr = new Date(s.session_date).toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
      }
    }

    const html = renderTrialConfirmEmail({
      parentName: parent.name,
      childName,
      category,
      sessionDateStr,
    })

    const resend = getResend()
    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: parent.email,
      bcc: KIDS_ADMIN_EMAIL,
      replyTo: KIDS_ADMIN_EMAIL,
      subject: 'Your Northern Warrior Kids trial is booked',
      html,
    })

    if (sendError) {
      throw new Error((sendError as { message?: string }).message ?? 'Resend returned an unknown error')
    }
    emailSent = true
  } catch (e) {
    emailError = (e as Error).message
    console.error('[submitTrialBooking] confirmation email failed:', emailError)
  }

  revalidatePath('/kids')
  return { trialId: trial.id, emailSent, emailError }
}

/**
 * Update a trial's status (mark attended / no-show / cancelled).
 */
export async function setTrialStatus(
  trialId: string,
  status: 'confirmed' | 'attended' | 'no_show' | 'cancelled',
): Promise<void> {
  const admin = createAdminClient()
  const update: Record<string, unknown> = { status }
  if (status === 'attended') update.attended_at = new Date().toISOString()
  const { error } = await admin.from('kids_trials').update(update).eq('id', trialId)
  if (error) throw new Error(`Failed to update trial: ${error.message}`)
  revalidatePath('/kids')
}

/**
 * Permanently delete a trial. Used by the NWHub admin to clean up cancelled
 * or test entries.
 */
export async function deleteTrial(trialId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('kids_trials').delete().eq('id', trialId)
  if (error) throw new Error(`Failed to delete trial: ${error.message}`)
  revalidatePath('/kids')
}

function renderTrialConfirmEmail(args: {
  parentName: string
  childName: string
  category: KidsCategory
  sessionDateStr: string
}): string {
  const time = CATEGORY_TIME[args.category]
  const catLabel = CATEGORY_LABEL[args.category]
  const sessionLine = args.sessionDateStr
    ? `<tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Session</td><td style="padding:6px 0;color:#fff;font-size:14px;text-align:right;">${escapeHtml(args.sessionDateStr)}</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your trial is booked</title></head>
<body style="margin:0;padding:0;background:#0b0e14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0e14;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;background:#161c2a;border:1px solid rgba(212,160,23,0.18);border-radius:12px;overflow:hidden;">
          <tr><td style="padding:28px 32px 0;">
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d4a017;margin-bottom:8px;">Northern Warrior Kids</div>
            <h1 style="margin:0;font-size:22px;line-height:1.25;color:#fff;font-weight:700;">Your trial is booked</h1>
          </td></tr>
          <tr><td style="padding:20px 32px 0;color:#cdd5e3;font-size:14px;line-height:1.55;">
            Hi ${escapeHtml(args.parentName)} — we&rsquo;ve booked a free trial session for <strong style="color:#fff;">${escapeHtml(args.childName)}</strong>. There&rsquo;s nothing to pay; just turn up at the session below and we&rsquo;ll take care of the rest.
          </td></tr>
          <tr><td style="padding:24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0e14;border:1px solid rgba(255,255,255,0.07);border-radius:10px;">
              <tr><td style="padding:14px 18px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Child</td><td style="padding:6px 0;color:#fff;font-size:14px;text-align:right;">${escapeHtml(args.childName)}</td></tr>
                  <tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Group</td><td style="padding:6px 0;color:#fff;font-size:14px;text-align:right;">${catLabel} &middot; ${time}</td></tr>
                  ${sessionLine}
                  <tr><td style="padding:6px 0;color:#8a93a5;font-size:13px;">Cost</td><td style="padding:6px 0;color:#f2cb55;font-size:14px;font-weight:700;text-align:right;">Free trial</td></tr>
                </table>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:24px 32px 0;color:#cdd5e3;font-size:13px;line-height:1.55;">
            <strong style="color:#fff;">What to bring:</strong><br>
            Trainers, water, comfortable kit. We&rsquo;ll have everything else.
          </td></tr>
          <tr><td style="padding:24px 32px 28px;">
            <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:18px;color:#8a93a5;font-size:12px;line-height:1.6;">
              Reply to this email if anything comes up or you need to reschedule. We can&rsquo;t wait to meet you both.
            </div>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
 * Delete a pending (unpaid) block booking. Only bookings with
 * payment_status='pending' can be deleted — paid or refunded rows
 * must use refundBlockBooking instead.
 */
export async function deletePendingBooking(bookingId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: booking, error } = await admin
    .from('kids_block_bookings')
    .select('id, payment_status')
    .eq('id', bookingId)
    .maybeSingle()

  if (error) throw new Error(`Booking lookup failed: ${error.message}`)

  // Already gone (e.g. cleaned up by the public registration flow) — just refresh
  if (!booking) {
    revalidatePath('/kids')
    return
  }
  if (booking.payment_status !== 'pending') {
    throw new Error('Only pending (unpaid) bookings can be deleted.')
  }

  await admin.from('kids_block_bookings').delete().eq('id', bookingId)
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

// ─────────────────────────────────────────────────────────────────────────────
// Discount management
// ─────────────────────────────────────────────────────────────────────────────

interface SaveDiscountInput {
  id?: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  value: number
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  max_uses: number | null
  min_children: number
  auto_apply: boolean
}

export async function saveDiscount(input: SaveDiscountInput): Promise<{ id: string }> {
  const admin = createAdminClient()
  if (!input.code.trim()) throw new Error('Code is required.')
  if (input.value <= 0) throw new Error('Discount value must be greater than 0.')
  if (input.discount_type === 'percentage' && input.value > 100) throw new Error('Percentage cannot exceed 100.')

  const row = {
    code: input.code.trim().toUpperCase(),
    description: input.description.trim(),
    discount_type: input.discount_type,
    value: input.value,
    is_active: input.is_active,
    valid_from: input.valid_from || null,
    valid_until: input.valid_until || null,
    max_uses: input.max_uses,
    min_children: input.min_children,
    auto_apply: input.auto_apply,
  }

  if (input.id) {
    const { error } = await admin
      .from('kids_discounts')
      .update(row)
      .eq('id', input.id)
    if (error) throw new Error(`Failed to update discount: ${error.message}`)
    revalidatePath('/kids')
    return { id: input.id }
  }

  const { data, error } = await admin
    .from('kids_discounts')
    .insert(row)
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to create discount: ${error?.message ?? 'unknown'}`)
  revalidatePath('/kids')
  return { id: data.id }
}

export async function toggleDiscount(discountId: string, isActive: boolean): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('kids_discounts')
    .update({ is_active: isActive })
    .eq('id', discountId)
  if (error) throw new Error(`Failed to toggle discount: ${error.message}`)
  revalidatePath('/kids')
}

export async function deleteDiscount(discountId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('kids_discounts')
    .delete()
    .eq('id', discountId)
  if (error) throw new Error(`Failed to delete discount: ${error.message}`)
  revalidatePath('/kids')
}
