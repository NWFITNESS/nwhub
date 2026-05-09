import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

// GET — list all rules ordered by priority
export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('inbox_rules')
    .select('*')
    .order('priority', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — create a new rule
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json()
  const { name, conditions, action, match_type, enabled, priority } = body

  if (!name || !conditions || !action) {
    return NextResponse.json({ error: 'name, conditions, and action are required' }, { status: 400 })
  }

  if (!Array.isArray(conditions) || conditions.length === 0) {
    return NextResponse.json({ error: 'At least one condition is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Auto-assign priority if not provided: max existing + 10
  let rulePriority = priority
  if (rulePriority == null) {
    const { data: maxRule } = await supabase
      .from('inbox_rules')
      .select('priority')
      .order('priority', { ascending: false })
      .limit(1)
      .single()
    rulePriority = (maxRule?.priority ?? 0) + 10
  }

  const { data, error } = await supabase
    .from('inbox_rules')
    .insert({
      name,
      conditions,
      action,
      match_type: match_type ?? 'all',
      enabled: enabled ?? true,
      priority: rulePriority,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH — update a rule (including reorder via priority)
export async function PATCH(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  updates.updated_at = new Date().toISOString()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('inbox_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — delete a rule
export async function DELETE(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('inbox_rules')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
