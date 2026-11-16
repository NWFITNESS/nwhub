import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'
import { sessionHours } from '@/lib/rota'
import type { RotaSession, RotaCoach } from '@/lib/rota'

// GET /api/coach-rota/hours?month=YYYY-MM
// Per-coach hours + pay for filled, active sessions in the month.
export async function GET(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const month = req.nextUrl.searchParams.get('month') // 'YYYY-MM'
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month (YYYY-MM) required' }, { status: 400 })
  }

  const [y, m] = month.split('-').map(Number)
  const first = `${month}-01`
  const nextY = m === 12 ? y + 1 : y
  const nextM = m === 12 ? 1 : m + 1
  const nextFirst = `${nextY}-${String(nextM).padStart(2, '0')}-01`

  const [{ data: coaches }, { data: sessions, error }] = await Promise.all([
    admin.from('rota_coaches').select('*'),
    admin.from('rota_sessions').select('*')
      .gte('date', first).lt('date', nextFirst)
      .eq('status', 'active').not('coach_id', 'is', null),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const coachMap = new Map((coaches as RotaCoach[] ?? []).map(c => [c.id, c]))
  const totals = new Map<string, { sessions: number; hours: number }>()

  for (const s of (sessions as RotaSession[] ?? [])) {
    const cur = totals.get(s.coach_id!) ?? { sessions: 0, hours: 0 }
    cur.sessions += 1
    cur.hours += sessionHours(s.start_time, s.end_time)
    totals.set(s.coach_id!, cur)
  }

  const rows = Array.from(totals.entries()).map(([coachId, t]) => {
    const coach = coachMap.get(coachId)
    const rate = coach?.hourly_rate ?? 0
    return {
      coach_id: coachId,
      name: coach?.name ?? 'Unknown',
      hourly_rate: rate,
      sessions: t.sessions,
      hours: Math.round(t.hours * 100) / 100,
      pay: Math.round(t.hours * rate * 100) / 100,
      active: coach?.active ?? true,
    }
  }).sort((a, b) => a.name.localeCompare(b.name))

  const grand = {
    hours: Math.round(rows.reduce((s, r) => s + r.hours, 0) * 100) / 100,
    pay: Math.round(rows.reduce((s, r) => s + r.pay, 0) * 100) / 100,
    sessions: rows.reduce((s, r) => s + r.sessions, 0),
  }

  return NextResponse.json({ month, rows, grand })
}
