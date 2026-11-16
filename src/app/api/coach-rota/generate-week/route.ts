import { NextRequest, NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'
import { weekDates, dayOfWeekIndex } from '@/lib/rota'
import type { RotaTemplateSlot, RotaSession } from '@/lib/rota'

// POST /api/coach-rota/generate-week
// Body: { week: 'YYYY-MM-DD' (Monday), mode?: 'template' | 'copy', from?: 'YYYY-MM-DD',
//         includeCoaches?: boolean }
// - 'template' (default): create sessions from the active weekly template.
// - 'copy': copy the active sessions from the `from` week into `week`.
// Existing template-sourced slots for the week are never duplicated.
export async function POST(req: NextRequest) {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin, caller } = guard

  const { week, mode = 'template', from, includeCoaches = false } = await req.json()
  if (!week) return NextResponse.json({ error: 'week (Monday) required' }, { status: 400 })

  const dates = weekDates(week)

  // What already exists this week (to avoid duplicating template slots)
  const { data: existing } = await admin
    .from('rota_sessions')
    .select('template_slot_id')
    .gte('date', dates[0])
    .lte('date', dates[6])
  const takenSlotIds = new Set((existing ?? []).map(r => r.template_slot_id).filter(Boolean))

  let rows: Record<string, unknown>[] = []

  if (mode === 'copy') {
    if (!from) return NextResponse.json({ error: 'from (Monday) required for copy' }, { status: 400 })
    const fromDates = weekDates(from)
    const { data: src } = await admin
      .from('rota_sessions')
      .select('*')
      .gte('date', fromDates[0])
      .lte('date', fromDates[6])
      .eq('status', 'active')
    rows = (src as RotaSession[] ?? []).map(s => ({
      date: dates[dayOfWeekIndex(s.date)],
      start_time: s.start_time,
      end_time: s.end_time,
      class_type_id: s.class_type_id,
      coach_id: includeCoaches ? s.coach_id : null,
      notes: s.notes,
      locked: false,
      source: 'manual',
      template_slot_id: null,
      created_by: caller.userId,
      claimed_at: includeCoaches && s.coach_id ? new Date().toISOString() : null,
    }))
  } else {
    const { data: slots } = await admin
      .from('rota_template_slots')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    rows = (slots as RotaTemplateSlot[] ?? [])
      .filter(slot => !takenSlotIds.has(slot.id))
      .map(slot => ({
        date: dates[slot.day_of_week],
        start_time: slot.start_time,
        end_time: slot.end_time,
        class_type_id: slot.class_type_id,
        coach_id: null,
        notes: slot.notes,
        locked: false,
        source: 'template',
        template_slot_id: slot.id,
        created_by: caller.userId,
      }))
  }

  if (rows.length === 0) return NextResponse.json({ inserted: 0 })

  const { data, error } = await admin.from('rota_sessions').insert(rows).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inserted: data?.length ?? 0 })
}
