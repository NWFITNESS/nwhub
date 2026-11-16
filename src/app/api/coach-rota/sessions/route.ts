import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'
import { weekDates } from '@/lib/rota'

// GET /api/coach-rota/sessions?week=YYYY-MM-DD  (Monday) → that week's sessions
//     /api/coach-rota/sessions?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const week = req.nextUrl.searchParams.get('week')
  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')

  let start = from, end = to
  if (week) {
    const dates = weekDates(week)
    start = dates[0]
    end = dates[6]
  }
  if (!start || !end) return NextResponse.json({ error: 'week or from/to required' }, { status: 400 })

  const { data, error } = await admin
    .from('rota_sessions')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data })
}

// POST /api/coach-rota/sessions — create a session
export async function POST(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin, caller } = guard

  const b = await req.json()
  const { date, start_time, end_time, class_type_id, coach_id, notes, locked } = b
  if (!date || !start_time || !end_time) {
    return NextResponse.json({ error: 'date, start_time and end_time are required' }, { status: 400 })
  }

  const { data, error } = await admin.from('rota_sessions').insert({
    date,
    start_time,
    end_time,
    class_type_id: class_type_id ?? null,
    coach_id: coach_id ?? null,
    notes: notes ?? null,
    locked: !!locked,
    source: 'manual',
    created_by: caller.userId,
    claimed_at: coach_id ? new Date().toISOString() : null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
}

// PATCH /api/coach-rota/sessions — update a session (assign coach, lock, cancel, edit)
export async function PATCH(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const b = await req.json()
  const { id, ...rest } = b as Record<string, unknown> & { id?: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = ['date', 'start_time', 'end_time', 'class_type_id', 'coach_id', 'status', 'locked', 'notes'] as const
  const updates: Record<string, unknown> = {}
  for (const k of allowed) if (k in rest) updates[k] = rest[k]

  // Stamp claimed_at when a coach is (re)assigned, clear when unassigned
  if ('coach_id' in updates) updates.claimed_at = updates.coach_id ? new Date().toISOString() : null

  const { data, error } = await admin.from('rota_sessions').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
}

// DELETE /api/coach-rota/sessions?id=...
export async function DELETE(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await admin.from('rota_sessions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
