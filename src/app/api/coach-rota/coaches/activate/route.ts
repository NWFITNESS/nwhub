import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'

// POST /api/coach-rota/coaches/activate  Body: { id }
// Creates (or links) the coach's Supabase auth account so they can use the
// magic-link login. Sends NOTHING to the coach — the only email is the login
// link they request themselves at /coach.
export async function POST(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: coach } = await admin.from('rota_coaches').select('*').eq('id', id).maybeSingle()
  if (!coach) return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
  if (coach.user_id) return NextResponse.json({ ok: true, alreadyActive: true })

  const email = (coach.email as string).trim().toLowerCase()

  // Create the auth user (email_confirm:true marks it confirmed — no email sent).
  let userId: string | null = null
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID() + '!Aa1',
    email_confirm: true,
    user_metadata: { display_name: coach.name, is_coach: true },
  })
  if (created?.user) {
    userId = created.user.id
  } else if (createErr) {
    // Already registered (e.g. a staff member) — find and link to them.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    userId = list?.users.find(u => u.email?.toLowerCase() === email)?.id ?? null
    if (!userId) return NextResponse.json({ error: createErr.message }, { status: 500 })
  }

  const { error } = await admin.from('rota_coaches').update({ user_id: userId }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
