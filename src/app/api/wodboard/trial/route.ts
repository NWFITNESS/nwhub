import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  // Verify shared secret
  const secret = process.env.WODBOARD_WEBHOOK_SECRET
  if (secret && req.headers.get('x-wodboard-secret') !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.member_name || !body?.start_date) {
    return Response.json({ error: 'member_name and start_date are required' }, { status: 400 })
  }

  const start = new Date(body.start_date)
  if (isNaN(start.getTime())) {
    return Response.json({ error: 'Invalid start_date' }, { status: 400 })
  }

  const end = new Date(start)
  end.setDate(end.getDate() + 13)
  const end_date = end.toISOString().slice(0, 10)
  const start_date = start.toISOString().slice(0, 10)

  const supabase = createAdminClient()
  const { error } = await supabase.from('trials').insert({
    member_name: body.member_name,
    start_date,
    end_date,
    source: 'wodboard',
  })

  if (error) {
    console.error('[wodboard/trial] insert error:', error)
    return Response.json({ error: 'Failed to create trial' }, { status: 500 })
  }

  return Response.json({ ok: true, start_date, end_date })
}
