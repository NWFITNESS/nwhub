import { NextRequest, NextResponse } from 'next/server'
import { getRotaCaller } from '@/lib/rota-server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/coach-rota/push/subscribe — store the current coach's push subscription.
export async function POST(req: NextRequest) {
  const caller = await getRotaCaller()
  if (!caller.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!caller.coach) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const sub = body?.subscription
  const endpoint: string | undefined = sub?.endpoint
  const p256dh: string | undefined = sub?.keys?.p256dh
  const auth: string | undefined = sub?.keys?.auth
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('coach_push_subscriptions').upsert({
    coach_id: caller.coach.id,
    endpoint,
    p256dh,
    auth,
    user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
  }, { onConflict: 'endpoint' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
