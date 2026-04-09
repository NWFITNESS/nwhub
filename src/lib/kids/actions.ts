'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { KidsCategory } from './types'
import { DROPIN_PRICE_PENCE } from './constants'

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
 * Generate a payment link for a single drop-in session.
 *
 * STUBBED — returns a placeholder URL until Phase 3 wires real Stripe.
 * Still inserts a kids_dropin_bookings row with payment_status='link_sent'
 * so the recent-drop-ins table reflects it.
 */
export async function createDropInPaymentLink(
  input: CreateDropInLinkInput,
): Promise<{ url: string; bookingId: string }> {
  const supabase = await createClient()
  const pricePence = DROPIN_PRICE_PENCE[input.category]

  // STUB: Phase 3 replaces this with stripe.paymentLinks.create()
  const stubLinkId = `stub_${Math.random().toString(36).slice(2, 10)}`
  const stubUrl = `https://buy.stripe.com/test_stub/${stubLinkId}`

  const { data, error } = await supabase
    .from('kids_dropin_bookings')
    .insert({
      session_id: input.sessionId,
      child_name: input.childName,
      parent_email: input.parentEmail.toLowerCase().trim(),
      category: input.category,
      stripe_payment_link_id: stubLinkId,
      payment_status: 'link_sent',
      price_pence: pricePence,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create drop-in: ${error?.message ?? 'unknown'}`)

  revalidatePath('/kids')
  return { url: stubUrl, bookingId: data.id }
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
