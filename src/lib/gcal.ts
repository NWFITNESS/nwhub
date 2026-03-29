import { createAdminClient } from './supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GCalTokens {
  access_token: string
  refresh_token: string
  expires_at: number // unix seconds
  email?: string
}

export interface GCalEventRaw {
  id: string
  summary?: string
  description?: string
  start: { date?: string; dateTime?: string; timeZone?: string }
  end: { date?: string; dateTime?: string; timeZone?: string }
  htmlLink?: string
  source?: { title?: string; url?: string } // Gmail-extracted events have this
  status?: string
}

// ─── Token storage ────────────────────────────────────────────────────────────

async function loadTokens(): Promise<GCalTokens | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'gcal_tokens')
    .single()
  if (!data?.value) return null
  try {
    const v = data.value
    return (typeof v === 'string' ? JSON.parse(v) : v) as GCalTokens
  } catch { return null }
}

async function saveTokens(tokens: GCalTokens) {
  const supabase = createAdminClient()
  await supabase.from('global_settings').upsert(
    { key: 'gcal_tokens', value: JSON.stringify(tokens), updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  )
}

async function doRefresh(tokens: GCalTokens): Promise<GCalTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`GCal token refresh failed: ${await res.text()}`)
  const data = await res.json()
  return {
    access_token: data.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    email: tokens.email,
  }
}

/** Returns a valid access token, refreshing if needed. Returns null if not connected. */
export async function getGCalAccessToken(): Promise<{ accessToken: string } | null> {
  let tokens = await loadTokens()
  if (!tokens) return null

  // Refresh if expiring within 5 minutes
  if (tokens.expires_at < Math.floor(Date.now() / 1000) + 300) {
    try {
      tokens = await doRefresh(tokens)
      await saveTokens(tokens)
    } catch (err) {
      console.error('[gcal] refresh failed:', err)
      return null
    }
  }

  return { accessToken: tokens.access_token }
}

export async function storeGCalTokens(params: {
  access_token: string
  refresh_token: string
  expires_in: number
  email?: string
}) {
  await saveTokens({
    access_token: params.access_token,
    refresh_token: params.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + params.expires_in,
    email: params.email,
  })
}

export async function isGCalConnected(): Promise<boolean> {
  const tokens = await loadTokens()
  return !!tokens?.refresh_token
}

// ─── Calendar API calls ───────────────────────────────────────────────────────

/** Fetch events from the user's primary calendar for a date range. */
export async function fetchGCalEvents(
  accessToken: string,
  timeMin: string, // ISO datetime e.g. "2026-03-01T00:00:00Z"
  timeMax: string,
): Promise<GCalEventRaw[]> {
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('timeMin', timeMin)
  url.searchParams.set('timeMax', timeMax)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '250')
  url.searchParams.set('showDeleted', 'false')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    console.error('[gcal] fetchEvents failed:', res.status, await res.text())
    return []
  }

  const data = await res.json()
  return (data.items ?? []) as GCalEventRaw[]
}

/** Create an all-day or timed event in the primary calendar. Returns the new event ID. */
export async function createGCalEvent(
  accessToken: string,
  event: {
    summary: string
    description?: string
    date: string   // "YYYY-MM-DD"
    startTime?: string // "HH:MM" — if omitted, creates an all-day event
    endTime?: string   // "HH:MM" — defaults to startTime + 1 hour
  },
): Promise<string | null> {
  let start: Record<string, string>
  let end: Record<string, string>

  if (event.startTime) {
    const tz = 'Europe/London'
    const startDT = `${event.date}T${event.startTime}:00`
    const endDT = event.endTime
      ? `${event.date}T${event.endTime}:00`
      : addOneHour(startDT)
    start = { dateTime: startDT, timeZone: tz }
    end   = { dateTime: endDT,   timeZone: tz }
  } else {
    // All-day event — end date must be the next day for Google Calendar
    const nextDay = new Date(event.date)
    nextDay.setDate(nextDay.getDate() + 1)
    start = { date: event.date }
    end   = { date: nextDay.toISOString().slice(0, 10) }
  }

  const body = {
    summary: event.summary,
    ...(event.description ? { description: event.description } : {}),
    start,
    end,
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('[gcal] createEvent failed:', await res.text())
    return null
  }

  const created = await res.json()
  return created.id as string
}

/** Delete an event from the primary calendar. Returns true if successful (or already gone). */
export async function deleteGCalEvent(accessToken: string, gcalEventId: string): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(gcalEventId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
  )
  return res.ok || res.status === 404 || res.status === 410
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addOneHour(dt: string): string {
  const d = new Date(dt)
  d.setHours(d.getHours() + 1)
  return d.toISOString().slice(0, 19) // "YYYY-MM-DDTHH:MM:SS"
}

/** Extract the plain date ("YYYY-MM-DD") from a GCal event (handles all-day and timed). */
export function gcalEventDate(ev: GCalEventRaw): string {
  return (ev.start.date ?? ev.start.dateTime ?? '').slice(0, 10)
}
