import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'

// GET /api/coach-rota/template — list all template slots
export async function GET() {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const { data, error } = await admin
    .from('rota_template_slots')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

// POST /api/coach-rota/template — add a template slot
export async function POST(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const b = await req.json()
  const { day_of_week, start_time, end_time, class_type_id, notes } = b
  if (day_of_week == null || !start_time || !end_time) {
    return NextResponse.json({ error: 'day_of_week, start_time and end_time are required' }, { status: 400 })
  }

  const { data, error } = await admin.from('rota_template_slots').insert({
    day_of_week,
    start_time,
    end_time,
    class_type_id: class_type_id ?? null,
    notes: notes ?? null,
    sort_order: b.sort_order ?? 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slot: data })
}

// PATCH /api/coach-rota/template — update a template slot
export async function PATCH(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const b = await req.json()
  const { id, ...rest } = b as Record<string, unknown> & { id?: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = ['day_of_week', 'start_time', 'end_time', 'class_type_id', 'notes', 'active', 'sort_order'] as const
  const updates: Record<string, unknown> = {}
  for (const k of allowed) if (k in rest) updates[k] = rest[k]

  const { data, error } = await admin.from('rota_template_slots').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slot: data })
}

// DELETE /api/coach-rota/template?id=...
export async function DELETE(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await admin.from('rota_template_slots').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
