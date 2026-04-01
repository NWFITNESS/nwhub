import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { subscribers } = await req.json()

  if (!Array.isArray(subscribers) || subscribers.length === 0) {
    return NextResponse.json({ error: 'No subscribers provided' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Get existing to dedupe
  const { data: existing } = await supabase.from('email_subscribers').select('email')
  const existingEmails = new Set((existing ?? []).map(e => e.email.toLowerCase()))

  const toInsert = subscribers
    .filter((s: { email: string }) => s.email && !existingEmails.has(s.email.toLowerCase()))
    .map((s: { email: string; first_name?: string; last_name?: string; tags?: string[]; source?: string }) => ({
      email: s.email.toLowerCase().trim(),
      first_name: s.first_name ?? '',
      last_name: s.last_name ?? '',
      tags: s.tags ?? [],
      source: s.source ?? 'import',
      status: 'subscribed' as const,
      subscribed_at: new Date().toISOString(),
    }))

  let synced = 0
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50)
    const { error } = await supabase.from('email_subscribers').insert(batch)
    if (!error) synced += batch.length
  }

  return NextResponse.json({ synced, skipped: subscribers.length - toInsert.length })
}
