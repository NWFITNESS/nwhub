import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'
import { formatTime } from '@/lib/rota'
import type { RotaClassType } from '@/lib/rota'

// GET /api/coach-rota/reminders/send — cron (every ~15 min). Nudges each coach
// ~1 hour before a session they're assigned to. Secured by CRON_SECRET
// (Vercel sends `Authorization: Bearer <CRON_SECRET>` to cron routes).
export const dynamic = 'force-dynamic'

// Minutes-before window. A 15-min cron means every session passes through this
// 35-min window on at least one run; reminded_at dedupes the send.
const MIN_LEAD = 40
const MAX_LEAD = 75

/** Europe/London offset (minutes) at a given instant: 0 in winter, 60 in BST. */
function londonOffsetMinutes(at: Date): number {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at).reduce<Record<string, string>>((a, x) => { a[x.type] = x.value; return a }, {})
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return Math.round((asUTC - at.getTime()) / 60000)
}

/** UTC instant for a London wall-clock date ('YYYY-MM-DD') + time ('HH:MM:SS'). */
function londonInstant(dateISO: string, timeHHMMSS: string): Date {
  const [y, mo, d] = dateISO.split('-').map(Number)
  const [h, mi, s] = timeHHMMSS.split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, d, h, mi, s || 0)
  const offset = londonOffsetMinutes(new Date(guess))
  return new Date(guess - offset * 60000)
}

/** Today's London date as 'YYYY-MM-DD', optionally shifted by n days. */
function londonDateISO(at: Date, addDays = 0): string {
  const shifted = new Date(at.getTime() + addDays * 86400000)
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(shifted)
  return p // en-CA → YYYY-MM-DD
}

interface SessionRow {
  id: string; date: string; start_time: string; end_time: string
  class_type_id: string | null; coach_id: string | null; status: string; reminded_at: string | null
}
interface SubRow { coach_id: string; endpoint: string; p256dh: string; auth: string }

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const today = londonDateISO(now)
  const tomorrow = londonDateISO(now, 1)

  const [{ data: sessions }, { data: classTypes }] = await Promise.all([
    admin.from('rota_sessions')
      .select('id, date, start_time, end_time, class_type_id, coach_id, status, reminded_at')
      .in('date', [today, tomorrow]).eq('status', 'active').not('coach_id', 'is', null).is('reminded_at', null),
    admin.from('rota_class_types').select('id, name'),
  ])

  const classMap = new Map((classTypes as Pick<RotaClassType, 'id' | 'name'>[] ?? []).map(c => [c.id, c.name]))

  // Which sessions are ~1 hour out right now?
  const due = (sessions as SessionRow[] ?? []).filter(s => {
    const mins = (londonInstant(s.date, s.start_time).getTime() - now.getTime()) / 60000
    return mins >= MIN_LEAD && mins <= MAX_LEAD
  })
  if (due.length === 0) return NextResponse.json({ sent: 0, due: 0 })

  // Subscriptions for the relevant coaches.
  const coachIds = [...new Set(due.map(s => s.coach_id!))]
  const { data: subs } = await admin.from('coach_push_subscriptions')
    .select('coach_id, endpoint, p256dh, auth').in('coach_id', coachIds)
  const subsByCoach = new Map<string, SubRow[]>()
  for (const s of (subs as SubRow[] ?? [])) {
    const arr = subsByCoach.get(s.coach_id) ?? []
    arr.push(s); subsByCoach.set(s.coach_id, arr)
  }

  let sent = 0
  const deadEndpoints: string[] = []
  const remindedIds: string[] = []

  for (const s of due) {
    const coachSubs = subsByCoach.get(s.coach_id!) ?? []
    const className = (s.class_type_id && classMap.get(s.class_type_id)) || 'session'
    const payload = {
      title: 'Coaching in 1 hour',
      body: `You're on for ${className} at ${formatTime(s.start_time)}.`,
      url: '/coach',
      tag: `rota-${s.id}`,
    }
    for (const sub of coachSubs) {
      const res = await sendPush(sub, payload)
      if (res === 'ok') sent++
      else if (res === 'gone') deadEndpoints.push(sub.endpoint)
    }
    // Mark reminded even if the coach has no subscription, so we don't reconsider
    // it every run once it's inside the window.
    remindedIds.push(s.id)
  }

  if (remindedIds.length) {
    await admin.from('rota_sessions').update({ reminded_at: now.toISOString() }).in('id', remindedIds)
  }
  if (deadEndpoints.length) {
    await admin.from('coach_push_subscriptions').delete().in('endpoint', deadEndpoints)
  }

  return NextResponse.json({ sent, due: due.length, cleaned: deadEndpoints.length })
}
