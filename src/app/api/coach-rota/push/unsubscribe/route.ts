import { NextRequest, NextResponse } from 'next/server'
import { getRotaCaller } from '@/lib/rota-server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/coach-rota/push/unsubscribe — remove the current coach's subscription.
export async function POST(req: NextRequest) {
  const caller = await getRotaCaller()
  if (!caller.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!caller.coach) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const endpoint: string | undefined = body?.endpoint
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('coach_push_subscriptions')
    .delete().eq('endpoint', endpoint).eq('coach_id', caller.coach.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
