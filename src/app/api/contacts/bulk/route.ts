import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const { ids, action, group } = await req.json()

  if (!ids?.length || !action || !group) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
