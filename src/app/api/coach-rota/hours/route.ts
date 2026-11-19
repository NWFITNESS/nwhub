import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'
import { sessionHours, payableHours, sessionPay, DEFAULT_RATES } from '@/lib/rota'
import type { RotaSession, RotaCoach, RotaClassType, RotaSettings } from '@/lib/rota'

// GET /api/coach-rota/hours?month=YYYY-MM
// Per-coach hours + pay. Pay is by day type (weekday/weekend rate); classes
// flagged unpaid (e.g. CF Kids) count hours but £0.
export async function GET(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const month = req.nextUrl.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month (YYYY-MM) required' }, { status: 400 })
  }

  const [y, m] = month.split('-').map(Number)
  const first = `${month}-01`
  const nextY = m === 12 ? y + 1 : y
  const nextM = m === 12 ? 1 : m + 1
  const nextFirst = `${nextY}-${String(nextM).padStart(2, '0')}-01`

  const [{ data: coaches }, { data: classTypes }, { data: settings }, { data: sessions, error }] = await Promise.all([
    admin.from('rota_coaches').select('*'),
    admin.from('rota_class_types').select('id, paid'),
    admin.from('rota_settings').select('weekday_rate, weekend_rate').eq('id', true).maybeSingle(),
    admin.from('rota_sessions').select('*')
      .gte('date', first).lt('date', nextFirst)
      .eq('status', 'active').not('coach_id', 'is', null),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rates: RotaSettings = (settings as RotaSettings) ?? DEFAULT_RATES
  const coachMap = new Map((coaches as RotaCoach[] ?? []).map(c => [c.id, c]))
  const paidMap = new Map((classTypes as Pick<RotaClassType, 'id' | 'paid'>[] ?? []).map(c => [c.id, c.paid]))

  const totals = new Map<string, { sessions: number; hours: number; paidHours: number; pay: number }>()
  for (const s of (sessions as RotaSession[] ?? [])) {
    const cur = totals.get(s.coach_id!) ?? { sessions: 0, hours: 0, paidHours: 0, pay: 0 }
    const paid = s.class_type_id ? (paidMap.get(s.class_type_id) ?? true) : true
    const hrs = sessionHours(s.start_time, s.end_time)
    cur.sessions += 1
    cur.hours += hrs
    if (paid) cur.paidHours += payableHours(s.start_time, s.end_time)
    cur.pay += sessionPay(s, paid, rates)
    totals.set(s.coach_id!, cur)
  }

  const rows = Array.from(totals.entries()).map(([coachId, t]) => ({
    coach_id: coachId,
    name: coachMap.get(coachId)?.name ?? 'Unknown',
    sessions: t.sessions,
    hours: Math.round(t.hours * 100) / 100,
    paid_hours: Math.round(t.paidHours * 100) / 100,
    pay: Math.round(t.pay * 100) / 100,
    active: coachMap.get(coachId)?.active ?? true,
  })).sort((a, b) => a.name.localeCompare(b.name))

  const grand = {
    hours: Math.round(rows.reduce((s, r) => s + r.hours, 0) * 100) / 100,
    pay: Math.round(rows.reduce((s, r) => s + r.pay, 0) * 100) / 100,
    sessions: rows.reduce((s, r) => s + r.sessions, 0),
  }

  return NextResponse.json({ month, rows, grand, rates })
}
