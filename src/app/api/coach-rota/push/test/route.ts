import { NextResponse } from 'next/server'
import { getRotaCaller } from '@/lib/rota-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'

// POST /api/coach-rota/push/test — send a test push to the current coach's own
// devices, so they can verify notifications work without waiting for a session.
export async function POST() {
  const caller = await getRotaCaller()
  if (!caller.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!caller.coach) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

  const admin = createAdminClient()
  const { data: subs } = await admin.from('coach_push_subscriptions')
    .select('endpoint, p256dh, auth').eq('coach_id', caller.coach.id)

  const list = (subs as { endpoint: string; p256dh: string; auth: string }[] ?? [])
  if (list.length === 0) return NextResponse.json({ sent: 0, error: 'No devices subscribed' }, { status: 400 })

  let sent = 0
  const dead: string[] = []
  for (const sub of list) {
    const res = await sendPush(sub, {
      title: 'Test — reminders are on ✅',
      body: "This is how your 1-hour coaching nudge will look.",
      url: '/coach',
      tag: 'coach-test',
    })
    if (res === 'ok') sent++
    else if (res === 'gone') dead.push(sub.endpoint)
  }
  if (dead.length) await admin.from('coach_push_subscriptions').delete().in('endpoint', dead)

  return NextResponse.json({ sent, devices: list.length })
}
