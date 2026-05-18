import { NextResponse } from 'next/server'
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

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

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
  const today = now.toISOString().split('T')[0]
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString().split('T')[0]
  const toDateStr = (d: Date) => d.toISOString().split('T')[0]

  // "This Week" = Monday to today
  const dayOfWeek = now.getDay() // 0=Sun
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now.getTime() - daysSinceMonday * 86400000)
  const mondayStr = toDateStr(monday)

  // "This Month" = 1st of month to today
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthStartStr = toDateStr(monthStart)

  // "This Year" = Jan 1st to today
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearStartStr = toDateStr(yearStart)

  // Comparison periods
  const prevMonday = new Date(monday.getTime() - 7 * 86400000)
  const prevMondayEnd = new Date(monday.getTime() - 86400000)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0) // last day of prev month
  const prevYearStart = new Date(now.getFullYear() - 1, 0, 1)
  const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31)

  // Fetch all ranges in parallel (current + comparison periods)
  const [hourlyRows, weekRows, monthRows, yearRows, prevWeekRows, prevMonthRows, prevYearRows] = await Promise.all([
    // 24h — hourly breakdown for today + yesterday
    runGa4Report(token, propertyId, daysAgo(1), today, [{ name: 'dateHour' }]),
    // This week — Monday to today
    runGa4Report(token, propertyId, mondayStr, today, [{ name: 'date' }]),
    // This month — 1st to today
    runGa4Report(token, propertyId, monthStartStr, today, [{ name: 'date' }]),
    // This year — Jan 1 to today (bucket into months)
    runGa4Report(token, propertyId, yearStartStr, today, [{ name: 'date' }]),
    // Prev week comparison
    runGa4Report(token, propertyId, toDateStr(prevMonday), toDateStr(prevMondayEnd), [{ name: 'date' }]),
    // Prev month comparison
    runGa4Report(token, propertyId, toDateStr(prevMonthStart), toDateStr(prevMonthEnd), [{ name: 'date' }]),
    // Prev year comparison
    runGa4Report(token, propertyId, toDateStr(prevYearStart), toDateStr(prevYearEnd), [{ name: 'date' }]),
  ])

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
    const dateStr = h.toISOString().split('T')[0].replace(/-/g, '')
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
    const key = d.toISOString().split('T')[0].replace(/-/g, '')
    const isToday = i === daysSinceMonday
    const label = isToday ? 'Today' : `${dayNames[d.getDay()]} ${d.getDate()}`
    data7d.push({ label, value: weekDayMap.get(key) || 0 })
  }

  // Comparison: previous week (same days)
  const prevWeekDayMap = buildDayMap(prevWeekRows)
  const comp7d: ChartDataPoint[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(prevMonday.getTime() + i * 86400000)
    const key = d.toISOString().split('T')[0].replace(/-/g, '')
    const label = `${dayNames[d.getDay()]} ${d.getDate()}`
    comp7d.push({ label, value: prevWeekDayMap.get(key) || 0 })
  }

  // ── Build This Month chart (1st → today) ────────────────────────────────────
  const monthDayMap = buildDayMap(monthRows)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const data30d: ChartDataPoint[] = []
  for (let day = 1; day <= now.getDate(); day++) {
    const d = new Date(now.getFullYear(), now.getMonth(), day)
    const key = d.toISOString().split('T')[0].replace(/-/g, '')
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
    const key = d.toISOString().split('T')[0].replace(/-/g, '')
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
