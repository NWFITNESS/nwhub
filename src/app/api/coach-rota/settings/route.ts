import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'

// GET /api/coach-rota/settings — the pay rates
export async function GET() {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const { data, error } = await admin.from('rota_settings').select('weekday_rate, weekend_rate').eq('id', true).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data ?? { weekday_rate: 13, weekend_rate: 20 } })
}

// PATCH /api/coach-rota/settings — update pay rates
export async function PATCH(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const b = await req.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (b.weekday_rate != null) updates.weekday_rate = Number(b.weekday_rate)
  if (b.weekend_rate != null) updates.weekend_rate = Number(b.weekend_rate)

  const { data, error } = await admin.from('rota_settings').update(updates).eq('id', true).select('weekday_rate, weekend_rate').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data })
}
