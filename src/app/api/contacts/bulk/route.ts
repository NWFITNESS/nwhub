import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const supabase = createAdminClient()
  const { ids, action, group } = await req.json()

  if (!ids?.length || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (action === 'delete') {
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
