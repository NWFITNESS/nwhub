import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mc, emailHash, resolveApiKey } from '@/lib/mailchimp'
import type { MailchimpSettings } from '@/lib/types'

export const maxDuration = 120

/**
 * Unified auto-sync — runs as a cron job or on-demand POST.
 *
 * Step 1: Sync kids_parents → email_subscribers (tagged 'kids-parents')
 * Step 2: Sync all email_subscribers → Mailchimp audience (with tags)
 *
 * This ensures both kids parents and WodBoard-imported gym members
 * end up in Mailchimp where campaigns can target them by tag.
 *
 * Protected by CRON_SECRET for cron calls, or auth for manual calls.
 */
export async function POST(req: NextRequest) {
  // Allow cron or authenticated admin
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCron) {
    // Fall back to auth check for manual triggers
    const { requireAuth } = await import('@/lib/auth-guard')
    const unauth = await requireAuth()
    if (unauth) return unauth
  }

  const supabase = createAdminClient()
  const stats = { kids_synced: 0, kids_skipped: 0, mailchimp_synced: 0, mailchimp_failed: 0, total: 0 }

  // ── Step 1: Kids parents → email_subscribers ─────────────────────────────

  const [{ data: kidsParents }, { data: kidsRegs }, { data: existingSubs }] = await Promise.all([
    supabase.from('kids_parents').select('email, name'),
    supabase.from('kids_registrations').select('parent_email, parent_name'),
    supabase.from('email_subscribers').select('email, tags').eq('status', 'subscribed'),
  ])

  const existingByEmail = new Map<string, { tags: string[] }>()
  for (const s of (existingSubs ?? [])) existingByEmail.set(s.email.toLowerCase(), { tags: s.tags ?? [] })

  // Collect all unique kids parent emails
  const allKidsEmails = new Set<string>()
  const kidsToInsert: { email: string; first_name: string; last_name: string }[] = []
  const seen = new Set<string>()

  for (const p of (kidsParents ?? [])) {
    if (!p.email) continue
    const key = p.email.toLowerCase()
    allKidsEmails.add(key)
    if (seen.has(key)) continue
    seen.add(key)
    if (existingByEmail.has(key)) { stats.kids_skipped++; continue }
    const parts = (p.name ?? '').trim().split(/\s+/)
    kidsToInsert.push({ email: key, first_name: parts[0] ?? '', last_name: parts.slice(1).join(' ') })
  }

  for (const r of (kidsRegs ?? [])) {
    if (!r.parent_email) continue
    const key = r.parent_email.toLowerCase()
    allKidsEmails.add(key)
    if (seen.has(key)) continue
    seen.add(key)
    if (existingByEmail.has(key)) { stats.kids_skipped++; continue }
    const parts = (r.parent_name ?? '').trim().split(/\s+/)
    kidsToInsert.push({ email: key, first_name: parts[0] ?? '', last_name: parts.slice(1).join(' ') })
  }

  // Insert NEW kids parents into email_subscribers
  if (kidsToInsert.length) {
    const now = new Date().toISOString()
    for (let i = 0; i < kidsToInsert.length; i += 50) {
      const batch = kidsToInsert.slice(i, i + 50).map((k) => ({
        email: k.email,
        first_name: k.first_name,
        last_name: k.last_name,
        tags: ['kids-parents'],
        source: 'kids_sync',
        status: 'subscribed' as const,
        subscribed_at: now,
      }))
      const { error } = await supabase.from('email_subscribers').upsert(batch, { onConflict: 'email', ignoreDuplicates: true })
      if (!error) stats.kids_synced += batch.length
    }
  }

  // Tag EXISTING subscribers as kids-parents if they aren't already
  const kidsToTag: string[] = []
  for (const email of allKidsEmails) {
    const existing = existingByEmail.get(email)
    if (existing && !existing.tags.includes('kids-parents')) {
      kidsToTag.push(email)
    }
  }
  if (kidsToTag.length) {
    for (const email of kidsToTag) {
      const existing = existingByEmail.get(email)!
      await supabase.from('email_subscribers')
        .update({ tags: [...existing.tags, 'kids-parents'] })
        .eq('email', email)
    }
    stats.kids_synced += kidsToTag.length
  }

  // ── Step 2: All email_subscribers → Mailchimp ────────────────────────────

  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings = (settingsData?.value ?? {}) as Partial<MailchimpSettings>
  const api_key = resolveApiKey(settings.api_key)
  const audience_id = settings.audience_id ?? ''

  if (!api_key || !audience_id) {
    return NextResponse.json({ ...stats, mailchimp: 'not configured — skipped' })
  }

  // Re-fetch all subscribers (including the ones we just added)
  const { data: allSubs } = await supabase
    .from('email_subscribers')
    .select('email, first_name, last_name, tags')
    .eq('status', 'subscribed')

  if (!allSubs?.length) {
    return NextResponse.json({ ...stats, mailchimp: 'no subscribers' })
  }

  stats.total = allSubs.length

  // Batch sync to Mailchimp in chunks of 10
  for (let i = 0; i < allSubs.length; i += 10) {
    const chunk = allSubs.slice(i, i + 10)
    const results = await Promise.allSettled(
      chunk.map((sub) => {
        // Convert tags to Mailchimp tags format
        const mcTags = (sub.tags ?? []).map((t: string) => ({ name: t, status: 'active' }))

        return mc(api_key, `/lists/${audience_id}/members/${emailHash(sub.email)}`, {
          method: 'PUT',
          body: {
            email_address: sub.email,
            status_if_new: 'subscribed',
            status: 'subscribed',
            merge_fields: {
              FNAME: sub.first_name ?? '',
              LNAME: sub.last_name ?? '',
            },
          },
        }).then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          // Sync tags separately (Mailchimp tags API is a separate endpoint)
          if (mcTags.length) {
            await mc(api_key, `/lists/${audience_id}/members/${emailHash(sub.email)}/tags`, {
              method: 'POST',
              body: { tags: mcTags },
            })
          }
          return r
        })
      })
    )
    for (const r of results) {
      if (r.status === 'fulfilled') stats.mailchimp_synced++
      else stats.mailchimp_failed++
    }
  }

  return NextResponse.json(stats)
}

// GET handler for cron
export async function GET(req: NextRequest) {
  return POST(req)
}
