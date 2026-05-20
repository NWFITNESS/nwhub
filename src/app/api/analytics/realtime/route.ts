import { NextResponse } from 'next/server'
import { getGoogleAuth } from '@/lib/google-auth'
import { requireAuth } from '@/lib/auth-guard'

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) return NextResponse.json({ error: 'GA4 not configured' }, { status: 503 })

  const auth = await getGoogleAuth()
  if (!auth) return NextResponse.json({ error: 'Google not connected' }, { status: 503 })

  let token: string | null | undefined
  try { const res = await auth.getAccessToken(); token = res.token } catch { return NextResponse.json({ error: 'Token failed' }, { status: 503 }) }
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 503 })

  const pad = (n: number) => String(n).padStart(2, '0')
  const now = new Date()
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const daysAgo = (n: number) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - n)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  async function runReport(startDate: string, endDate: string, dimensions: { name: string }[], metrics: { name: string }[]) {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateRanges: [{ startDate, endDate }], dimensions, metrics, limit: 10 }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.rows ?? []
  }

  // Fetch in parallel: today's totals, top pages (30d), device category (30d)
  const [todayRows, pageRows, deviceRows] = await Promise.all([
    // Today's sessions + users + pageviews
    runReport(today, today, [], [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }]),
    // Top pages last 30 days
    runReport(daysAgo(29), today, [{ name: 'pagePath' }], [{ name: 'screenPageViews' }]),
    // Device breakdown last 30 days
    runReport(daysAgo(29), today, [{ name: 'deviceCategory' }], [{ name: 'sessions' }]),
  ])

  // Today's stats
  const todayStats = {
    sessions: todayRows[0]?.metricValues?.[0]?.value ? parseInt(todayRows[0].metricValues[0].value) : 0,
    users: todayRows[0]?.metricValues?.[1]?.value ? parseInt(todayRows[0].metricValues[1].value) : 0,
    pageViews: todayRows[0]?.metricValues?.[2]?.value ? parseInt(todayRows[0].metricValues[2].value) : 0,
  }

  // Top pages
  const topPages = pageRows
    .map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
      path: r.dimensionValues[0].value,
      views: parseInt(r.metricValues[0].value) || 0,
    }))
    .sort((a: { views: number }, b: { views: number }) => b.views - a.views)
    .slice(0, 8)

  // Device breakdown
  const devices: Record<string, number> = {}
  let deviceTotal = 0
  for (const r of deviceRows) {
    const cat = r.dimensionValues[0].value
    const val = parseInt(r.metricValues[0].value) || 0
    devices[cat] = val
    deviceTotal += val
  }

  return NextResponse.json({
    today: todayStats,
    topPages,
    devices: Object.entries(devices).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      pct: deviceTotal > 0 ? Math.round((count / deviceTotal) * 100) : 0,
    })),
  })
}
