import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

// POST /api/email/sync-contacts — copy contacts with emails into email_subscribers
export async function POST() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()

  // Get all contacts with email addresses
  const { data: contacts } = await supabase
    .from('contacts')
    .select('email, first_name, last_name, groups')

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ synced: 0, skipped: 0 })
  }

  // Get existing subscribers to avoid duplicates
  const { data: existing } = await supabase
    .from('email_subscribers')
    .select('email')

  const existingEmails = new Set((existing ?? []).map(e => e.email.toLowerCase()))

  // Filter to contacts with emails that aren't already subscribers
  const toInsert = contacts
    .filter(c => c.email && !existingEmails.has(c.email.toLowerCase()))
    .map(c => ({
      email: c.email!.toLowerCase(),
      first_name: c.first_name ?? '',
      last_name: c.last_name ?? '',
      tags: c.groups ?? [],
      source: 'contacts_sync' as const,
      status: 'subscribed' as const,
      subscribed_at: new Date().toISOString(),
    }))

  if (toInsert.length === 0) {
    return NextResponse.json({ synced: 0, skipped: contacts.filter(c => c.email).length })
  }

  // Insert in batches of 50
  let synced = 0
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50)
    const { error } = await supabase.from('email_subscribers').insert(batch)
    if (!error) synced += batch.length
  }

  return NextResponse.json({ synced, skipped: existingEmails.size })
}
