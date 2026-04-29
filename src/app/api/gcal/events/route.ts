import { NextRequest, NextResponse } from 'next/server'
import { getGCalAccessToken, fetchGCalEvents, gcalEventDate, type GCalEventRaw } from '@/lib/gcal'
import { requireAuth } from '@/lib/auth-guard'

export const dynamic = 'force-dynamic'

// Maps a raw Google Calendar event to the CalendarEvent shape the frontend uses.
function toCalendarEvent(ev: GCalEventRaw) {
  return {
    id: `gcal_${ev.id}`,
    date: gcalEventDate(ev),
    type: 'gcal' as const,
    label: ev.summary ?? '(No title)',
    meta: ev.id, // Store the raw GCal event ID in meta for delete/update
    // Extra fields for the sidebar (not in CalendarEvent type but safe to include)
    htmlLink: ev.htmlLink,
    isFromGmail: !!ev.source?.url?.includes('mail.google.com'),
    startTime: ev.start.dateTime ? ev.start.dateTime.slice(11, 16) : undefined,
  }
}

export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const auth = await getGCalAccessToken()
  if (!auth) {
    return NextResponse.json({ connected: false, events: [] })
  }

  const { searchParams } = new URL(req.url)
  const year  = Number(searchParams.get('year')  ?? new Date().getFullYear())
  const month = Number(searchParams.get('month') ?? new Date().getMonth()) // 0-indexed

  // Fetch a slightly wider range (include partial weeks at start/end of month)
  const timeMin = new Date(year, month - 1, 21).toISOString()
  const timeMax = new Date(year, month + 1, 10).toISOString()

  const rawEvents = await fetchGCalEvents(auth.accessToken, timeMin, timeMax)

  // Filter out cancelled events and those with no date
  const events = rawEvents
    .filter(ev => ev.status !== 'cancelled' && (ev.start.date || ev.start.dateTime))
    .map(toCalendarEvent)

  return NextResponse.json({ connected: true, events })
}
