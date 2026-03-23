import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const { ids, action, group } = await req.json()

  if (!ids?.length || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (action === 'delete') {
    // Remove related records first to avoid FK constraint failures
    await supabase.from('review_requests').delete().in('contact_id', ids)

    // Fetch phones so we can clean up sms_subscribers
    const { data: contactRows } = await supabase.from('contacts').select('phone').in('id', ids)
    const phones = (contactRows ?? []).map((c) => c.phone).filter(Boolean)
    if (phones.length > 0) {
      await supabase.from('sms_subscribers').delete().in('phone', phones)
    }

    const { error } = await supabase.from('contacts').delete().in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ deleted: ids.length })
  }

  if (action === 'add_group') {
    const trimmed = group.trim().toLowerCase()

    // Fetch current groups for selected contacts
    const { data, error } = await supabase
      .from('contacts')
      .select('id, groups')
      .in('id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Only update contacts that don't already have this group
    const updates = (data ?? [])
      .filter((c) => !c.groups.includes(trimmed))
      .map((c) => ({ id: c.id, groups: [...c.groups, trimmed] }))

    if (updates.length > 0) {
      const { error: upsertError } = await supabase.from('contacts').upsert(updates)
      if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ updated: updates.length })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
