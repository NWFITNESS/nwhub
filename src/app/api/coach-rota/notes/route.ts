import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'

// GET /api/coach-rota/notes?from=YYYY-MM-DD&to=YYYY-MM-DD → day notes in range
export async function GET(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from and to required' }, { status: 400 })

  const { data, error } = await admin.from('rota_day_notes').select('*').gte('date', from).lte('date', to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data })
}

// PUT /api/coach-rota/notes  Body: { date, note }
// Empty/blank note clears the day's note.
export async function PUT(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin, caller } = guard

  const { date, note } = await req.json()
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const trimmed = (note ?? '').trim()
  if (!trimmed) {
    const { error } = await admin.from('rota_day_notes').delete().eq('date', date)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, cleared: true })
  }

  const { error } = await admin.from('rota_day_notes')
    .upsert({ date, note: trimmed, created_by: caller.userId, updated_at: new Date().toISOString() }, { onConflict: 'date' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
