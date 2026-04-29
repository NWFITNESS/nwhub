import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGCalAccessToken, createGCalEvent, deleteGCalEvent } from '@/lib/gcal'
import { requireAuth } from '@/lib/auth-guard'

export const dynamic = 'force-dynamic'

// ─── POST — create event ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const body = await req.json() as {
    date: string         // "YYYY-MM-DD"
    label: string        // event title
    type: string         // 'class' | 'enquiry' | 'renewal' | 'gcal'
    description?: string
    startTime?: string   // "HH:MM"
    endTime?: string     // "HH:MM"
  }

  const { date, label, type, description, startTime, endTime } = body

  if (!date || !label || !type) {
    return NextResponse.json({ error: 'date, label and type are required' }, { status: 400 })
  }

  // Try to push to Google Calendar first to get the event ID
  let gcalId: string | null = null
  const auth = await getGCalAccessToken()
  if (auth) {
    gcalId = await createGCalEvent(auth.accessToken, {
      summary:     label,
      description: description ?? `NWHub event (${type})`,
      date,
      startTime,
      endTime,
    })
  }

  // Save to Supabase — store gcalId in meta if we got one
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      date,
      type,
      label,
      meta: gcalId ?? (description ?? null),
    })
    .select()
    .single()

  if (error) {
    console.error('[calendar/events POST] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: data, gcalId, synced: !!gcalId })
}

// ─── DELETE — remove event ────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const { searchParams } = new URL(req.url)
  const id     = searchParams.get('id')      // Supabase row ID (null for pure GCal events)
  const gcalId = searchParams.get('gcalId')  // Google Calendar event ID

  if (!id && !gcalId) {
    return NextResponse.json({ error: 'id or gcalId required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // If we have a Supabase ID, fetch the row first (may contain gcalId in meta)
  let resolvedGcalId = gcalId
  if (id) {
    const { data: row } = await supabase
      .from('calendar_events')
      .select('meta')
      .eq('id', id)
      .single()

    // meta stores the gcalId when the event was created via NWHub
    // Only treat meta as gcalId if it looks like a GCal ID (no spaces, reasonably short)
    if (!resolvedGcalId && row?.meta && /^[a-zA-Z0-9_-]{10,}$/.test(row.meta)) {
      resolvedGcalId = row.meta
    }

    await supabase.from('calendar_events').delete().eq('id', id)
  }

  // Also delete from Google Calendar
  let gcalDeleted = false
  if (resolvedGcalId) {
    const auth = await getGCalAccessToken()
    if (auth) {
      gcalDeleted = await deleteGCalEvent(auth.accessToken, resolvedGcalId)
    }
  }

  return NextResponse.json({ deleted: true, gcalDeleted })
}
