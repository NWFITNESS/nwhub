import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'

// GET /api/coach-rota/class-types — list (include archived with ?all=1)
export async function GET(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  let q = admin.from('rota_class_types').select('*').order('sort_order', { ascending: true })
  if (req.nextUrl.searchParams.get('all') !== '1') q = q.eq('archived', false)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ classTypes: data })
}

// POST /api/coach-rota/class-types — create a class type
export async function POST(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin, caller } = guard

  const b = await req.json()
  const name = (b.name ?? '').trim()
  const color = (b.color ?? '#3b82f6').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await admin.from('rota_class_types')
    .insert({ name, color, paid: b.paid ?? true, sort_order: b.sort_order ?? 100, created_by: caller.userId })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ classType: data })
}

// PATCH /api/coach-rota/class-types — update name/colour/sort/archived
export async function PATCH(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const b = await req.json()
  const { id, ...rest } = b as Record<string, unknown> & { id?: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = ['name', 'color', 'sort_order', 'archived', 'paid'] as const
  const updates: Record<string, unknown> = {}
  for (const k of allowed) if (k in rest) updates[k] = rest[k]

  const { data, error } = await admin.from('rota_class_types').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ classType: data })
}

// DELETE /api/coach-rota/class-types?id=...  — archive (safe; keeps referenced rows)
export async function DELETE(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await admin.from('rota_class_types').update({ archived: true }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
