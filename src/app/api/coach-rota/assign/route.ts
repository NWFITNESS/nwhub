import { NextRequest, NextResponse } from 'next/server'
import { getRotaCaller, isRotaAdmin } from '@/lib/rota-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'
import { formatTime } from '@/lib/rota'
import type { RotaSession } from '@/lib/rota'

// POST /api/coach-rota/assign — reassign a session to another coach (or unassign).
// Coaches can change who's on any unlocked, active session; the newly-assigned
// coach gets a push. Goes through the service role so RLS stays tight.
export async function POST(req: NextRequest) {
  const caller = await getRotaCaller()
  if (!caller.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!caller.coach && !isRotaAdmin(caller.profile)) {
    return NextResponse.json({ error: 'Not a coach' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const sessionId: string | undefined = body?.sessionId
  const toCoachId: string | null = body?.toCoachId ?? null
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: session } = await admin.from('rota_sessions').select('*').eq('id', sessionId).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  const s = session as RotaSession
  if (s.locked) return NextResponse.json({ error: 'This session is locked.' }, { status: 409 })
  if (s.status !== 'active') return NextResponse.json({ error: 'This session is cancelled.' }, { status: 409 })

  if (toCoachId) {
    const { data: coach } = await admin.from('rota_coaches').select('id, active').eq('id', toCoachId).maybeSingle()
    if (!coach || !(coach as { active: boolean }).active) {
      return NextResponse.json({ error: 'Unknown coach' }, { status: 400 })
    }
  }

  const fromCoachId = s.coach_id
  const { error } = await admin.from('rota_sessions')
    .update({ coach_id: toCoachId, claimed_at: toCoachId ? new Date().toISOString() : null })
    .eq('id', sessionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Look up names for the audit log + notification.
  let className = 'a session'
  if (s.class_type_id) {
    const { data: ct } = await admin.from('rota_class_types').select('name').eq('id', s.class_type_id).maybeSingle()
    className = (ct as { name: string } | null)?.name ?? className
  }
  const nameOf = async (id: string | null) => {
    if (!id) return null
    const { data } = await admin.from('rota_coaches').select('name').eq('id', id).maybeSingle()
    return (data as { name: string } | null)?.name ?? null
  }
  const fromName = await nameOf(fromCoachId)
  const toName = await nameOf(toCoachId)

  // Record who changed what.
  await admin.from('rota_audit').insert({
    session_id: sessionId,
    date: s.date,
    action: !toCoachId ? 'release' : !fromCoachId ? 'claim' : 'reassign',
    actor: caller.coach?.name ?? caller.profile?.display_name ?? 'Admin',
    actor_kind: caller.coach ? 'coach' : 'admin',
    from_coach: fromName,
    to_coach: toName,
    detail: `${className} ${s.start_time.slice(0, 5)}`,
  })

  // Notify the newly-assigned coach (unless they assigned themselves).
  if (toCoachId && toCoachId !== caller.coach?.id) {
    const { data: subs } = await admin.from('coach_push_subscriptions')
      .select('endpoint, p256dh, auth').eq('coach_id', toCoachId)
    const list = (subs as { endpoint: string; p256dh: string; auth: string }[] ?? [])
    if (list.length) {
      const when = new Date(`${s.date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
      const dead: string[] = []
      for (const sub of list) {
        const res = await sendPush(sub, {
          title: 'Added to a session',
          body: `You're on for ${className}, ${when} at ${formatTime(s.start_time)}.`,
          url: '/coach',
          tag: `assign-${sessionId}`,
        })
        if (res === 'gone') dead.push(sub.endpoint)
      }
      if (dead.length) await admin.from('coach_push_subscriptions').delete().in('endpoint', dead)
    }
  }

  return NextResponse.json({ ok: true })
}
