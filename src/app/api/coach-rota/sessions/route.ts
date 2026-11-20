import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin, type RotaCaller } from '@/lib/rota-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { weekDates } from '@/lib/rota'
import type { RotaSession } from '@/lib/rota'

type Admin = ReturnType<typeof createAdminClient>

async function coachName(admin: Admin, id: string | null): Promise<string | null> {
  if (!id) return null
  const { data } = await admin.from('rota_coaches').select('name').eq('id', id).maybeSingle()
  return (data as { name: string } | null)?.name ?? null
}

async function sessionLabel(admin: Admin, s: Pick<RotaSession, 'class_type_id' | 'start_time'>): Promise<string> {
  let cls = 'Session'
  if (s.class_type_id) {
    const { data } = await admin.from('rota_class_types').select('name').eq('id', s.class_type_id).maybeSingle()
    cls = (data as { name: string } | null)?.name ?? cls
  }
  return `${cls} ${s.start_time.slice(0, 5)}`
}

async function logAudit(admin: Admin, caller: RotaCaller, row: {
  session_id: string; date: string; action: string; from_coach?: string | null; to_coach?: string | null; detail: string
}) {
  await admin.from('rota_audit').insert({
    ...row,
    actor: caller.profile?.display_name ?? caller.coach?.name ?? 'Admin',
    actor_kind: caller.coach && !caller.profile ? 'coach' : 'admin',
  })
}

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

  const created = data as RotaSession
  await logAudit(admin, caller, {
    session_id: created.id, date: created.date, action: 'create',
    to_coach: await coachName(admin, created.coach_id), detail: await sessionLabel(admin, created),
  })

  return NextResponse.json({ session: data })
}

// PATCH /api/coach-rota/sessions — update a session (assign coach, lock, cancel, edit)
export async function PATCH(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin, caller } = guard

  const b = await req.json()
  const { id, ...rest } = b as Record<string, unknown> & { id?: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = ['date', 'start_time', 'end_time', 'class_type_id', 'coach_id', 'status', 'locked', 'notes'] as const
  const updates: Record<string, unknown> = {}
  for (const k of allowed) if (k in rest) updates[k] = rest[k]

  // Stamp claimed_at when a coach is (re)assigned, clear when unassigned
  if ('coach_id' in updates) updates.claimed_at = updates.coach_id ? new Date().toISOString() : null

  const { data: before } = await admin.from('rota_sessions').select('*').eq('id', id).maybeSingle()
  const old = before as RotaSession | null

  const { data, error } = await admin.from('rota_sessions').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit the change (coach reassignment, cancel/restore, or a general edit).
  if (old) {
    const now = data as RotaSession
    const label = await sessionLabel(admin, now)
    if (old.coach_id !== now.coach_id) {
      await logAudit(admin, caller, {
        session_id: id, date: now.date,
        action: !now.coach_id ? 'release' : !old.coach_id ? 'claim' : 'reassign',
        from_coach: await coachName(admin, old.coach_id), to_coach: await coachName(admin, now.coach_id), detail: label,
      })
    } else if (old.status !== now.status) {
      await logAudit(admin, caller, { session_id: id, date: now.date, action: now.status === 'cancelled' ? 'cancel' : 'uncancel', detail: label })
    } else if (old.start_time !== now.start_time || old.end_time !== now.end_time || old.date !== now.date || old.class_type_id !== now.class_type_id || old.locked !== now.locked) {
      await logAudit(admin, caller, { session_id: id, date: now.date, action: 'edit', detail: label })
    }
  }

  return NextResponse.json({ session: data })
}

// DELETE /api/coach-rota/sessions?id=...
export async function DELETE(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin, caller } = guard

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: before } = await admin.from('rota_sessions').select('*').eq('id', id).maybeSingle()
  const old = before as RotaSession | null

  const { error } = await admin.from('rota_sessions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (old) {
    await logAudit(admin, caller, {
      session_id: id, date: old.date, action: 'delete',
      from_coach: await coachName(admin, old.coach_id), detail: await sessionLabel(admin, old),
    })
  }

  return NextResponse.json({ success: true })
}
