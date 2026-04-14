import { createClient } from '@/lib/supabase/server'
import type {
  BlockWithDetails,
  DropInRow,
  KidsBlock,
  KidsBlockPricing,
  KidsCategory,
  KidsChild,
  KidsDiscount,
  KidsParent,
  KidsSession,
  KidsStats,
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

  // Two-step query instead of an !inner join — Supabase's auto-detected
  // relation joins occasionally fail in production with no useful error,
  // and the cost of two round-trips here is negligible (~5ms each).
  const [bookingsRes, sessionIdsRes] = await Promise.all([
    supabase
      .from('kids_block_bookings')
      .select('category')
      .eq('block_id', blockId),
    supabase
      .from('kids_sessions')
      .select('id')
      .eq('block_id', blockId),
  ])

  if (bookingsRes.error) console.error('[getStatsForBlock] bookings error:', bookingsRes.error.message)
  if (sessionIdsRes.error) console.error('[getStatsForBlock] sessions error:', sessionIdsRes.error.message)

  const sessionIds = (sessionIdsRes.data ?? []).map((s) => s.id)

  let dropinCount = 0
  if (sessionIds.length) {
    const { count, error } = await supabase
      .from('kids_dropin_bookings')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
    if (error) console.error('[getStatsForBlock] dropins error:', error.message)
    dropinCount = count ?? 0
  }

  const counts: Record<KidsCategory, number> = { minis: 0, littles: 0, teens: 0 }
  for (const b of (bookingsRes.data ?? []) as { category: KidsCategory }[]) {
    counts[b.category]++
  }

  return {
    minis_enrolled: counts.minis,
    littles_enrolled: counts.littles,
    teens_enrolled: counts.teens,
    block_total: counts.minis + counts.littles + counts.teens,
    dropins_this_block: dropinCount,
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
