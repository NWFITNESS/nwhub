import { NextResponse } from 'next/server'
import { getGoogleAuth } from '@/lib/google-auth'
import { requireAuth } from '@/lib/auth-guard'

interface ChartDataPoint { label: string; value: number }

interface VisitorData {
  data24h: ChartDataPoint[]
  data7d: ChartDataPoint[]
  data30d: ChartDataPoint[]
  data1y: ChartDataPoint[]
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

  // Fetch all ranges in parallel
  const [hourlyRows, dailyRows, yearlyRows] = await Promise.all([
    // 24h — hourly breakdown for today + yesterday
    runGa4Report(token, propertyId, daysAgo(1), today, [{ name: 'dateHour' }]),
    // 30d — daily breakdown (covers both 7d and 30d)
    runGa4Report(token, propertyId, daysAgo(29), today, [{ name: 'date' }]),
    // 1y — daily breakdown for 365 days (we'll bucket into months)
    runGa4Report(token, propertyId, daysAgo(364), today, [{ name: 'date' }]),
  ])

  // ── Build 24h chart ─────────────────────────────────────────────────────────
  const hourMap = new Map<string, number>()
  for (const row of hourlyRows) {
    const dateHour = row.dimensionValues[0].value // "2026051213"
    const hour = dateHour.slice(8, 10) // "13"
    const sessions = parseInt(row.metricValues[0].value, 10) || 0
    hourMap.set(`${dateHour.slice(0, 8)}-${hour}`, (hourMap.get(`${dateHour.slice(0, 8)}-${hour}`) || 0) + sessions)
  }

  const data24h: ChartDataPoint[] = []
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 3600000)
    const dateStr = h.toISOString().split('T')[0].replace(/-/g, '')
    const hourStr = String(h.getHours()).padStart(2, '0')
    const key = `${dateStr}-${hourStr}`
    data24h.push({ label: `${hourStr}:00`, value: hourMap.get(key) || 0 })
  }

  // ── Build 7d chart ──────────────────────────────────────────────────────────
  const dayMap = new Map<string, number>()
  for (const row of dailyRows) {
    const date = row.dimensionValues[0].value
    dayMap.set(date, parseInt(row.metricValues[0].value, 10) || 0)
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const data7d: ChartDataPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toISOString().split('T')[0].replace(/-/g, '')
    data7d.push({ label: dayNames[d.getDay()], value: dayMap.get(key) || 0 })
  }

  // ── Build 30d chart ─────────────────────────────────────────────────────────
  const data30d: ChartDataPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toISOString().split('T')[0].replace(/-/g, '')
    data30d.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: dayMap.get(key) || 0 })
  }

  // ── Build 1y chart (monthly buckets) ────────────────────────────────────────
  const monthMap = new Map<string, number>()
  for (const row of yearlyRows) {
    const d = formatDate(row.dimensionValues[0].value)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    monthMap.set(key, (monthMap.get(key) || 0) + (parseInt(row.metricValues[0].value, 10) || 0))
  }

  const data1y: ChartDataPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    data1y.push({ label: d.toLocaleString('en-GB', { month: 'short' }), value: monthMap.get(key) || 0 })
  }

  const result: VisitorData = { data24h, data7d, data30d, data1y }
  return NextResponse.json(result)
}
