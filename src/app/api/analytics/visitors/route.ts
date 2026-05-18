import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuth } from '@/lib/google-auth'
import { requireAuth } from '@/lib/auth-guard'

interface ChartDataPoint { label: string; value: number }

interface VisitorData {
  data24h: ChartDataPoint[]
  data7d: ChartDataPoint[]
  data30d: ChartDataPoint[]
  data1y: ChartDataPoint[]
  comp7d: ChartDataPoint[]
  comp30d: ChartDataPoint[]
  comp1y: ChartDataPoint[]
}

async function runGa4Report(
  token: string,
  propertyId: string,
  startDate: string,
  endDate: string,
  dimensions: { name: string }[],
  metrics: { name: string }[] = [{ name: 'sessions' }],
): Promise<Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions,
        metrics,
      }),
    },
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.rows ?? []
}

function formatDate(yyyymmdd: string): Date {
  return new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`)
}

export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const debug = req.nextUrl.searchParams.get('debug') === '1'

  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) {
    return NextResponse.json({ error: 'GA4_PROPERTY_ID not configured' }, { status: 503 })
  }

  const auth = await getGoogleAuth()
  if (!auth) {
    return NextResponse.json({ error: 'Google not connected' }, { status: 503 })
  }

  let token: string | null | undefined
  try {
    const res = await auth.getAccessToken()
    token = res.token
  } catch {
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 503 })
  }
  if (!token) {
    return NextResponse.json({ error: 'No access token' }, { status: 503 })
  }

  const now = new Date()
  // Use local date parts to avoid UTC timezone shift issues
  const pad = (n: number) => String(n).padStart(2, '0')
  const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const today = toDateStr(now)
  const daysAgo = (n: number) => toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n))

  // "This Week" = Monday to today
  const dayOfWeek = now.getDay() // 0=Sun
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday)
  const mondayStr = toDateStr(monday)

  // "This Month" = 1st of month to today
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthStartStr = toDateStr(monthStart)

  // "This Year" = Jan 1st to today
  const yearStartStr = `${now.getFullYear()}-01-01`

  // Comparison periods
  const prevMonday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7)
  const prevMondayEnd = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0) // last day of prev month
  const prevYearStart = new Date(now.getFullYear() - 1, 0, 1)
  const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31)

  // Fetch current data first (essential), then comparisons (nice-to-have)
  const [hourlyRows, weekRows, monthRows, yearRows] = await Promise.all([
    runGa4Report(token, propertyId, daysAgo(1), today, [{ name: 'dateHour' }]),
    runGa4Report(token, propertyId, mondayStr, today, [{ name: 'date' }]),
    runGa4Report(token, propertyId, monthStartStr, today, [{ name: 'date' }]),
    runGa4Report(token, propertyId, yearStartStr, today, [{ name: 'date' }]),
  ])

  // Comparison data — fetch in parallel but don't block if they fail
  let prevWeekRows: typeof hourlyRows = []
  let prevMonthRows: typeof hourlyRows = []
  let prevYearRows: typeof hourlyRows = []
  try {
    ;[prevWeekRows, prevMonthRows, prevYearRows] = await Promise.all([
      runGa4Report(token, propertyId, toDateStr(prevMonday), toDateStr(prevMondayEnd), [{ name: 'date' }]),
      runGa4Report(token, propertyId, toDateStr(prevMonthStart), toDateStr(prevMonthEnd), [{ name: 'date' }]),
      runGa4Report(token, propertyId, toDateStr(prevYearStart), toDateStr(prevYearEnd), [{ name: 'date' }]),
    ])
  } catch { /* comparison data is optional */ }

  if (debug) {
    return NextResponse.json({
      queries: {
        hourly: { start: daysAgo(1), end: today, rows: hourlyRows.length },
        week: { start: mondayStr, end: today, rows: weekRows.length },
        month: { start: monthStartStr, end: today, rows: monthRows.length },
        year: { start: yearStartStr, end: today, rows: yearRows.length },
      },
      sampleMonthRows: monthRows.slice(0, 3),
      sampleMonthKeys: monthRows.slice(0, 3).map(r => r.dimensionValues[0].value),
      generatedKeys: Array.from({ length: 3 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), i + 1)
        return toGaKey(d)
      }),
      serverTime: now.toISOString(),
      propertyId,
    })
  }

  // Helper to build a date→sessions map from GA rows
  function buildDayMap(rows: typeof hourlyRows) {
    const m = new Map<string, number>()
    for (const row of rows) {
      const date = row.dimensionValues[0].value
      m.set(date, (m.get(date) || 0) + (parseInt(row.metricValues[0].value, 10) || 0))
    }
    return m
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  // GA4 returns dates as YYYYMMDD — build a matching key from a local Date
  const toGaKey = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`

  // ── Build 24h chart ─────────────────────────────────────────────────────────
  const hourMap = new Map<string, number>()
  for (const row of hourlyRows) {
    const dateHour = row.dimensionValues[0].value
    const hour = dateHour.slice(8, 10)
    const sessions = parseInt(row.metricValues[0].value, 10) || 0
    hourMap.set(`${dateHour.slice(0, 8)}-${hour}`, (hourMap.get(`${dateHour.slice(0, 8)}-${hour}`) || 0) + sessions)
  }

  const data24h: ChartDataPoint[] = []
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 3600000)
    const dateStr = toGaKey(h)
    const hourStr = String(h.getHours()).padStart(2, '0')
    const key = `${dateStr}-${hourStr}`
    const hour = h.getHours()
    const ampm = hour < 12 ? 'am' : 'pm'
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const label = hour === 0 ? `${h.getDate()}/${h.getMonth() + 1}` : `${h12}${ampm}`
    data24h.push({ label, value: hourMap.get(key) || 0 })
  }

  // ── Build This Week chart (Mon → today) ─────────────────────────────────────
  const weekDayMap = buildDayMap(weekRows)
  const data7d: ChartDataPoint[] = []
  for (let i = 0; i <= daysSinceMonday; i++) {
    const d = new Date(monday.getTime() + i * 86400000)
    const key = toGaKey(d)
    const isToday = i === daysSinceMonday
    const label = isToday ? 'Today' : `${dayNames[d.getDay()]} ${d.getDate()}`
    data7d.push({ label, value: weekDayMap.get(key) || 0 })
  }

  // Comparison: previous week (same days)
  const prevWeekDayMap = buildDayMap(prevWeekRows)
  const comp7d: ChartDataPoint[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(prevMonday.getTime() + i * 86400000)
    const key = toGaKey(d)
    const label = `${dayNames[d.getDay()]} ${d.getDate()}`
    comp7d.push({ label, value: prevWeekDayMap.get(key) || 0 })
  }

  // ── Build This Month chart (1st → today) ────────────────────────────────────
  const monthDayMap = buildDayMap(monthRows)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const data30d: ChartDataPoint[] = []
  for (let day = 1; day <= now.getDate(); day++) {
    const d = new Date(now.getFullYear(), now.getMonth(), day)
    const key = toGaKey(d)
    const isToday = day === now.getDate()
    const label = isToday ? 'Today' : `${day} ${monthNames[now.getMonth()]}`
    data30d.push({ label, value: monthDayMap.get(key) || 0 })
  }

  // Comparison: previous month (full month, same day numbers)
  const prevMonthDayMap = buildDayMap(prevMonthRows)
  const prevMonthDays = prevMonthEnd.getDate()
  const comp30d: ChartDataPoint[] = []
  for (let day = 1; day <= prevMonthDays; day++) {
    const d = new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth(), day)
    const key = toGaKey(d)
    const label = `${day} ${monthNames[prevMonthStart.getMonth()]}`
    comp30d.push({ label, value: prevMonthDayMap.get(key) || 0 })
  }

  // ── Build This Year chart (Jan → now, monthly buckets) ──────────────────────
  const yearMonthMap = new Map<string, number>()
  for (const row of yearRows) {
    const d = formatDate(row.dimensionValues[0].value)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    yearMonthMap.set(key, (yearMonthMap.get(key) || 0) + (parseInt(row.metricValues[0].value, 10) || 0))
  }

  const data1y: ChartDataPoint[] = []
  for (let m = 0; m <= now.getMonth(); m++) {
    const key = `${now.getFullYear()}-${m}`
    const mName = monthNames[m]
    const label = m === now.getMonth() ? `${mName} (now)` : mName
    data1y.push({ label, value: yearMonthMap.get(key) || 0 })
  }

  // Comparison: previous year (all 12 months)
  const prevYearMonthMap = new Map<string, number>()
  for (const row of prevYearRows) {
    const d = formatDate(row.dimensionValues[0].value)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    prevYearMonthMap.set(key, (prevYearMonthMap.get(key) || 0) + (parseInt(row.metricValues[0].value, 10) || 0))
  }

  const comp1y: ChartDataPoint[] = []
  for (let m = 0; m < 12; m++) {
    const key = `${now.getFullYear() - 1}-${m}`
    const label = `${monthNames[m]} ${String(now.getFullYear() - 1).slice(2)}`
    comp1y.push({ label, value: prevYearMonthMap.get(key) || 0 })
  }

  const result: VisitorData = {
    data24h, data7d, data30d, data1y,
    comp7d, comp30d, comp1y,
  }
  return NextResponse.json(result)
}
