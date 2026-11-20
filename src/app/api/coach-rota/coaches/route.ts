import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'

// GET /api/coach-rota/coaches — list all coaches
export async function GET() {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const { data, error } = await admin
    .from('rota_coaches')
    .select('*')
    .order('active', { ascending: false })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coaches: data })
}

// POST /api/coach-rota/coaches — add a coach (+ create their magic-link login)
export async function POST(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const b = await req.json()
  const name = (b.name ?? '').trim()
  const email = (b.email ?? '').trim().toLowerCase()
  const { phone, hourly_rate, color } = b
  if (!name || !email) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })

  const { data: existing } = await admin.from('rota_coaches').select('id').eq('email', email).maybeSingle()
  if (existing) return NextResponse.json({ error: 'A coach with this email already exists' }, { status: 409 })

  // Ensure an auth user exists so magic-link login (shouldCreateUser:false) works.
  // Reuse an existing auth user with this email if there is one (e.g. a staff member).
  let userId: string | null = null
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID() + '!Aa1',
    email_confirm: true,
    user_metadata: { display_name: name, is_coach: true },
  })
  if (created?.user) {
    userId = created.user.id
  } else if (createErr) {
    // Likely already registered — look the user up and link to them.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    userId = list?.users.find(u => u.email?.toLowerCase() === email)?.id ?? null
    if (!userId) return NextResponse.json({ error: createErr.message }, { status: 500 })
  }

  const { data, error } = await admin.from('rota_coaches').insert({
    user_id: userId,
    name,
    email,
    phone: phone ?? null,
    hourly_rate: hourly_rate ?? 0,
    color: color ?? null,
    active: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coach: data })
}

// PATCH /api/coach-rota/coaches — update a coach
export async function PATCH(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const b = await req.json()
  const { id, ...rest } = b as Record<string, unknown> & { id?: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = ['name', 'phone', 'hourly_rate', 'color', 'active', 'unpaid'] as const
  const updates: Record<string, unknown> = {}
  for (const k of allowed) if (k in rest) updates[k] = rest[k]

  const { data, error } = await admin.from('rota_coaches').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coach: data })
}

// DELETE /api/coach-rota/coaches?id=...  — deactivate (preserves hours history)
export async function DELETE(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await admin.from('rota_coaches').update({ active: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
