'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, siteUrl } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import type { KidsCategory } from './types'
import { CATEGORY_LABEL, DROPIN_PRICE_PENCE } from './constants'

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
 * Send the drop-in payment link via email.
 *
 * STUBBED — Phase 6 wires real Resend send. For now records nothing extra
 * but returns success so the UI can show a confirm message.
 */
export async function sendDropInLinkEmail(_bookingId: string): Promise<{ ok: true }> {
  // TODO: Phase 6 — pull booking + send via Resend
  return { ok: true }
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
