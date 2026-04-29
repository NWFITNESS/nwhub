import { createClient } from '@/lib/supabase/server'
import type {
  AttendanceStatus,
  BlockWithDetails,
  BookingEditorData,
  BookingType,
  DropInRow,
  KidsBlock,
  KidsBlockPricing,
  KidsCategory,
  KidsChild,
  KidsDiscount,
  KidsParent,
  KidsSession,
  KidsStats,
  RegisterRow,
  RosterRow,
  TrialRow,
  TrialStatus,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Kids & Teens — server-side data fetchers
//
// All run with the cookie-based server client, so the authenticated NWHub
// session lets RLS pass through every query.
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllBlocks(): Promise<BlockWithDetails[]> {
  const supabase = await createClient()
  const { data: blocks } = await supabase
    .from('kids_blocks')
    .select('*')
    .order('start_date', { ascending: false })

  if (!blocks?.length) return []

  const blockIds = blocks.map((b: KidsBlock) => b.id)

  const [sessionsRes, pricingRes] = await Promise.all([
    supabase.from('kids_sessions').select('*').in('block_id', blockIds).order('session_number'),
    supabase.from('kids_block_pricing').select('*').in('block_id', blockIds),
  ])

  const sessionsByBlock = new Map<string, KidsSession[]>()
  for (const s of (sessionsRes.data ?? []) as KidsSession[]) {
    const arr = sessionsByBlock.get(s.block_id) ?? []
    arr.push(s)
    sessionsByBlock.set(s.block_id, arr)
  }

  const pricingByBlock = new Map<string, KidsBlockPricing[]>()
  for (const p of (pricingRes.data ?? []) as KidsBlockPricing[]) {
    const arr = pricingByBlock.get(p.block_id) ?? []
    arr.push(p)
    pricingByBlock.set(p.block_id, arr)
  }

  return (blocks as KidsBlock[]).map((b) => ({
    ...b,
    sessions: sessionsByBlock.get(b.id) ?? [],
    pricing: pricingByBlock.get(b.id) ?? [],
  }))
}

export async function getActiveBlock(): Promise<BlockWithDetails | null> {
  const all = await getAllBlocks()
  return all.find((b) => b.is_active) ?? all[0] ?? null
}

export async function getRosterForBlock(blockId: string): Promise<RosterRow[]> {
  const supabase = await createClient()
  const { data: bookings } = await supabase
    .from('kids_block_bookings')
    .select('id, block_id, child_id, parent_id, category, payment_status, waiver_signed')
    .eq('block_id', blockId)

  if (!bookings?.length) return []

  const childIds = [...new Set(bookings.map((b) => b.child_id))]
  const parentIds = [...new Set(bookings.map((b) => b.parent_id))]

  const [childrenRes, parentsRes] = await Promise.all([
    supabase.from('kids_children').select('*').in('id', childIds),
    supabase.from('kids_parents').select('id, name, email').in('id', parentIds),
  ])

  const childrenById = new Map<string, KidsChild>()
  for (const c of (childrenRes.data ?? []) as KidsChild[]) childrenById.set(c.id, c)

  const parentsById = new Map<string, Pick<KidsParent, 'id' | 'name' | 'email'>>()
  for (const p of (parentsRes.data ?? []) as Pick<KidsParent, 'id' | 'name' | 'email'>[]) parentsById.set(p.id, p)

  return bookings.map((b): RosterRow => {
    const child = childrenById.get(b.child_id)
    const parent = parentsById.get(b.parent_id)
    return {
      booking_id: b.id,
      block_id: b.block_id,
      child_id: b.child_id,
      child_name: child?.child_name ?? 'Unknown',
      date_of_birth: child?.date_of_birth ?? '',
      parent_id: b.parent_id,
      parent_name: parent?.name ?? 'Unknown',
      parent_email: parent?.email ?? '',
      category: b.category,
      payment_status: b.payment_status,
      photo_consent: child?.photo_consent ?? false,
      waiver_signed: b.waiver_signed,
    }
  })
}

export async function getRecentDropIns(limit = 10): Promise<DropInRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kids_dropin_bookings')
    .select('id, child_id, child_name, category, payment_status, price_pence, created_at, session_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data?.length) return []

  // Resolve child names and session dates in batch
  const childIds = data.map((d) => d.child_id).filter(Boolean) as string[]
  const sessionIds = data.map((d) => d.session_id).filter(Boolean) as string[]

  const [childrenRes, sessionsRes] = await Promise.all([
    childIds.length
      ? supabase.from('kids_children').select('id, child_name').in('id', childIds)
      : Promise.resolve({ data: [] as { id: string; child_name: string }[] }),
    sessionIds.length
      ? supabase.from('kids_sessions').select('id, session_date').in('id', sessionIds)
      : Promise.resolve({ data: [] as { id: string; session_date: string }[] }),
  ])

  const childById = new Map<string, string>()
  for (const c of childrenRes.data ?? []) childById.set(c.id, c.child_name)

  const sessionById = new Map<string, string>()
  for (const s of sessionsRes.data ?? []) sessionById.set(s.id, s.session_date)

  return data.map((d): DropInRow => ({
    id: d.id,
    child_name: d.child_id ? (childById.get(d.child_id) ?? 'Unknown') : (d.child_name ?? 'Unknown'),
    category: d.category,
    price_pence: d.price_pence,
    payment_status: d.payment_status,
    created_at: d.created_at,
    session_date: d.session_id ? (sessionById.get(d.session_id) ?? null) : null,
  }))
}

export async function getStatsForBlock(blockId: string): Promise<KidsStats> {
  const supabase = await createClient()

  // Fetch bookings with pricing + payment info, and sessions in parallel
  const [bookingsRes, pricingRes, sessionIdsRes] = await Promise.all([
    supabase
      .from('kids_block_bookings')
      .select('category, payment_status, discount_amount_pence, stripe_checkout_session_id')
      .eq('block_id', blockId),
    supabase
      .from('kids_block_pricing')
      .select('category, price_pence')
      .eq('block_id', blockId),
    supabase
      .from('kids_sessions')
      .select('id')
      .eq('block_id', blockId),
  ])

  if (bookingsRes.error) console.error('[getStatsForBlock] bookings error:', bookingsRes.error.message)
  if (pricingRes.error) console.error('[getStatsForBlock] pricing error:', pricingRes.error.message)
  if (sessionIdsRes.error) console.error('[getStatsForBlock] sessions error:', sessionIdsRes.error.message)

  const sessionIds = (sessionIdsRes.data ?? []).map((s) => s.id)

  // Drop-in count + revenue
  let dropinCount = 0
  let dropinRevenuePence = 0
  if (sessionIds.length) {
    const { data: dropins, error } = await supabase
      .from('kids_dropin_bookings')
      .select('id, price_pence, payment_status')
      .in('session_id', sessionIds)
    if (error) console.error('[getStatsForBlock] dropins error:', error.message)
    dropinCount = dropins?.length ?? 0
    for (const d of dropins ?? []) {
      if (d.payment_status === 'paid') dropinRevenuePence += d.price_pence
    }
  }

  // Block booking counts + revenue
  const priceByCategory = new Map<string, number>()
  for (const p of pricingRes.data ?? []) priceByCategory.set(p.category, p.price_pence)

  const counts: Record<KidsCategory, number> = { minis: 0, littles: 0, teens: 0 }
  let blockRevenuePence = 0
  // Count unique checkout sessions to estimate Stripe transaction count
  const paidSessionIds = new Set<string>()

  for (const b of (bookingsRes.data ?? []) as { category: KidsCategory; payment_status: string; discount_amount_pence: number; stripe_checkout_session_id: string | null }[]) {
    counts[b.category]++
    if (b.payment_status === 'paid') {
      const price = priceByCategory.get(b.category) ?? 0
      const discount = b.discount_amount_pence ?? 0
      blockRevenuePence += Math.max(0, price - discount)
      if (b.stripe_checkout_session_id) paidSessionIds.add(b.stripe_checkout_session_id)
    }
  }

  const grossPence = blockRevenuePence + dropinRevenuePence

  // Stripe fees: 1.5% + 20p per transaction (UK domestic cards)
  // Each unique checkout session = 1 transaction, each paid drop-in = 1 transaction
  const paidDropinCount = (await (async () => {
    if (!sessionIds.length) return 0
    const { count } = await supabase
      .from('kids_dropin_bookings')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .eq('payment_status', 'paid')
    return count ?? 0
  })())
  const txnCount = paidSessionIds.size + paidDropinCount
  const stripeFeesPence = Math.round(grossPence * 0.015) + (txnCount * 20)
  const netPence = grossPence - stripeFeesPence

  return {
    minis_enrolled: counts.minis,
    littles_enrolled: counts.littles,
    teens_enrolled: counts.teens,
    block_total: counts.minis + counts.littles + counts.teens,
    dropins_this_block: dropinCount,
    gross_pence: grossPence,
    stripe_fees_pence: stripeFeesPence,
    net_pence: netPence,
  }
}

/**
 * Fetch all kids trials with denormalised parent + child + session info,
 * ordered most recent first. Limits to 50 — admin can filter later if it
 * grows.
 */
export async function getKidsTrials(): Promise<TrialRow[]> {
  const supabase = await createClient()
  const { data: trials } = await supabase
    .from('kids_trials')
    .select('id, parent_id, child_id, session_id, category, status, source, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!trials?.length) return []

  const childIds = [...new Set(trials.map((t) => t.child_id))]
  const parentIds = [...new Set(trials.map((t) => t.parent_id))]
  const sessionIds = [...new Set(trials.map((t) => t.session_id).filter(Boolean) as string[])]

  const [childrenRes, parentsRes, sessionsRes] = await Promise.all([
    supabase.from('kids_children').select('id, child_name').in('id', childIds),
    supabase.from('kids_parents').select('id, name, email').in('id', parentIds),
    sessionIds.length
      ? supabase.from('kids_sessions').select('id, session_date').in('id', sessionIds)
      : Promise.resolve({ data: [] as { id: string; session_date: string }[] }),
  ])

  const childById = new Map<string, string>()
  for (const c of childrenRes.data ?? []) childById.set(c.id, c.child_name)

  const parentById = new Map<string, { name: string; email: string }>()
  for (const p of parentsRes.data ?? []) parentById.set(p.id, { name: p.name, email: p.email })

  const sessionDateById = new Map<string, string>()
  for (const s of sessionsRes.data ?? []) sessionDateById.set(s.id, s.session_date)

  return trials.map((t): TrialRow => {
    const parent = parentById.get(t.parent_id)
    return {
      id: t.id,
      child_name: childById.get(t.child_id) ?? 'Unknown',
      parent_name: parent?.name ?? 'Unknown',
      parent_email: parent?.email ?? '',
      category: t.category as KidsCategory,
      status: t.status as TrialStatus,
      session_date: t.session_id ? (sessionDateById.get(t.session_id) ?? null) : null,
      source: t.source as 'web' | 'admin',
      created_at: t.created_at,
    }
  })
}

/**
 * Search children by name across ALL blocks and drop-ins.
 * Returns each unique child with their booking history tags.
 */
export async function searchChildren(query: string) {
  const supabase = await createClient()
  const q = query.trim()
  if (!q) return []

  const { data: children } = await supabase
    .from('kids_children')
    .select('id, child_name')
    .ilike('child_name', `%${q}%`)
    .limit(50)

  if (!children?.length) return []

  const childIds = children.map((c) => c.id)

  const [bookingsRes, dropinsRes, blocksRes, sessionsRes] = await Promise.all([
    supabase
      .from('kids_block_bookings')
      .select('id, child_id, block_id, category')
      .in('child_id', childIds),
    supabase
      .from('kids_dropin_bookings')
      .select('id, child_id, session_id, category, created_at')
      .in('child_id', childIds),
    supabase.from('kids_blocks').select('id, name'),
    supabase.from('kids_sessions').select('id, session_date'),
  ])

  const blockNameById = new Map<string, string>()
  for (const b of blocksRes.data ?? []) blockNameById.set(b.id, b.name)
  const sessionDateById = new Map<string, string>()
  for (const s of sessionsRes.data ?? []) sessionDateById.set(s.id, s.session_date)

  return children.map((child) => {
    const childBookings = (bookingsRes.data ?? []).filter((b) => b.child_id === child.id)
    const childDropins = (dropinsRes.data ?? []).filter((d) => d.child_id === child.id)
    return {
      child_id: child.id,
      child_name: child.child_name,
      category: (childBookings[0]?.category ?? childDropins[0]?.category ?? 'littles') as KidsCategory,
      block_tags: childBookings.map((b) => ({
        block_id: b.block_id,
        block_name: blockNameById.get(b.block_id) ?? 'Block',
      })),
      dropin_tags: childDropins.map((d) => ({
        dropin_id: d.id,
        session_date: d.session_id ? (sessionDateById.get(d.session_id) ?? null) : null,
      })),
    }
  })
}

/**
 * Fetch all discount codes, ordered by created_at desc.
 */
export async function getAllDiscounts(): Promise<KidsDiscount[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kids_discounts')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as KidsDiscount[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking Editor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch full child + parent + booking data for the booking editor modal.
 */
export async function getBookingEditorData(bookingId: string): Promise<BookingEditorData | null> {
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('kids_block_bookings')
    .select('id, block_id, child_id, parent_id, category, payment_status, waiver_signed, paid_at')
    .eq('id', bookingId)
    .maybeSingle()

  if (!booking) return null

  const [childRes, parentRes, blockRes] = await Promise.all([
    supabase.from('kids_children').select('*').eq('id', booking.child_id).single(),
    supabase.from('kids_parents').select('*').eq('id', booking.parent_id).single(),
    supabase.from('kids_blocks').select('name').eq('id', booking.block_id).single(),
  ])

  const child = childRes.data as KidsChild | null
  const parent = parentRes.data as KidsParent | null
  if (!child || !parent) return null

  return {
    booking_id: booking.id,
    block_id: booking.block_id,
    block_name: blockRes.data?.name ?? 'Block',
    child_id: booking.child_id,
    parent_id: booking.parent_id,
    child_name: child.child_name,
    date_of_birth: child.date_of_birth,
    medical_notes: child.medical_notes,
    authorised_pickups: child.authorised_pickups,
    photo_consent: child.photo_consent,
    parent_name: parent.name,
    parent_email: parent.email,
    parent_phone: parent.phone,
    emergency_contact_name: parent.emergency_contact_name,
    emergency_contact_phone: parent.emergency_contact_phone,
    emergency_contact_relation: parent.emergency_contact_relation,
    category: booking.category as KidsCategory,
    payment_status: booking.payment_status,
    waiver_signed: booking.waiver_signed,
    paid_at: booking.paid_at ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Register
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the register for a single session — merges block bookings, drop-ins
 * and trials into RegisterRow[] grouped by category.
 */
export async function getRegisterForSession(
  sessionId: string,
  blockId: string,
): Promise<Record<KidsCategory, RegisterRow[]>> {
  const supabase = await createClient()

  const [blockBookingsRes, dropinsRes, trialsRes, attendanceRes] = await Promise.all([
    supabase
      .from('kids_block_bookings')
      .select('id, child_id, category, payment_status')
      .eq('block_id', blockId)
      .in('payment_status', ['paid', 'pending']),
    supabase
      .from('kids_dropin_bookings')
      .select('id, child_id, child_name, category, payment_status')
      .eq('session_id', sessionId)
      .in('payment_status', ['paid', 'link_sent', 'pending']),
    supabase
      .from('kids_trials')
      .select('id, child_id, category, status')
      .eq('session_id', sessionId)
      .neq('status', 'cancelled'),
    supabase
      .from('kids_session_attendance')
      .select('id, child_id, booking_type, booking_id, status')
      .eq('session_id', sessionId),
  ])

  // Build attendance lookup: `${child_id}-${booking_type}-${booking_id}` → record
  const attendanceMap = new Map<string, { id: string; status: AttendanceStatus }>()
  for (const a of (attendanceRes.data ?? []) as { id: string; child_id: string; booking_type: string; booking_id: string; status: AttendanceStatus }[]) {
    attendanceMap.set(`${a.child_id}-${a.booking_type}-${a.booking_id}`, { id: a.id, status: a.status })
  }

  // Collect child IDs to batch-fetch names
  const childIds = new Set<string>()
  for (const b of blockBookingsRes.data ?? []) if (b.child_id) childIds.add(b.child_id)
  for (const d of dropinsRes.data ?? []) if (d.child_id) childIds.add(d.child_id)
  for (const t of trialsRes.data ?? []) if (t.child_id) childIds.add(t.child_id)

  const childById = new Map<string, { name: string; dob: string | null }>()
  if (childIds.size) {
    const { data: children } = await supabase
      .from('kids_children')
      .select('id, child_name, date_of_birth')
      .in('id', [...childIds])
    for (const c of children ?? []) childById.set(c.id, { name: c.child_name, dob: c.date_of_birth ?? null })
  }

  const result: Record<KidsCategory, RegisterRow[]> = { minis: [], littles: [], teens: [] }

  // Block bookings
  for (const b of (blockBookingsRes.data ?? [])) {
    const key = `${b.child_id}-block-${b.id}`
    const att = attendanceMap.get(key)
    const child = childById.get(b.child_id)
    result[b.category as KidsCategory].push({
      child_id: b.child_id,
      child_name: child?.name ?? 'Unknown',
      date_of_birth: child?.dob ?? null,
      booking_type: 'block',
      booking_id: b.id,
      category: b.category as KidsCategory,
      attendance_id: att?.id ?? null,
      status: att?.status ?? null,
    })
  }

  // Drop-ins
  for (const d of (dropinsRes.data ?? [])) {
    const childId = d.child_id ?? d.id // fallback to booking ID for anonymous drop-ins
    const key = `${childId}-dropin-${d.id}`
    const att = attendanceMap.get(key)
    const child = d.child_id ? childById.get(d.child_id) : null
    result[d.category as KidsCategory].push({
      child_id: childId,
      child_name: child?.name ?? d.child_name ?? 'Unknown',
      date_of_birth: child?.dob ?? null,
      booking_type: 'dropin',
      booking_id: d.id,
      category: d.category as KidsCategory,
      attendance_id: att?.id ?? null,
      status: att?.status ?? null,
    })
  }

  // Trials
  for (const t of (trialsRes.data ?? [])) {
    const key = `${t.child_id}-trial-${t.id}`
    const att = attendanceMap.get(key)
    const child = childById.get(t.child_id)
    result[t.category as KidsCategory].push({
      child_id: t.child_id,
      child_name: child?.name ?? 'Unknown',
      date_of_birth: child?.dob ?? null,
      booking_type: 'trial',
      booking_id: t.id,
      category: t.category as KidsCategory,
      attendance_id: att?.id ?? null,
      status: att?.status ?? null,
    })
  }

  // Sort each category alphabetically by child name
  for (const cat of ['minis', 'littles', 'teens'] as KidsCategory[]) {
    result[cat].sort((a, b) => a.child_name.localeCompare(b.child_name))
  }

  return result
}

/**
 * Aggregate attendance counts per session for a block — used for the
 * register page overview.
 */
export async function getAttendanceSummary(
  blockId: string,
): Promise<{ session_id: string; present: number; total: number }[]> {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('kids_sessions')
    .select('id')
    .eq('block_id', blockId)
    .eq('is_break', false)

  if (!sessions?.length) return []

  const sessionIds = sessions.map((s) => s.id)

  const { data: attendance } = await supabase
    .from('kids_session_attendance')
    .select('session_id, status')
    .in('session_id', sessionIds)

  const bySession = new Map<string, { present: number; total: number }>()
  for (const sid of sessionIds) bySession.set(sid, { present: 0, total: 0 })

  for (const a of (attendance ?? []) as { session_id: string; status: string }[]) {
    const entry = bySession.get(a.session_id)
    if (!entry) continue
    entry.total++
    if (a.status === 'present' || a.status === 'late') entry.present++
  }

  return sessionIds.map((sid) => ({ session_id: sid, ...bySession.get(sid)! }))
}
