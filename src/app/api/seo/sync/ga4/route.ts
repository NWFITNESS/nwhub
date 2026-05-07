import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGoogleAuth } from '@/lib/google-auth'
import { verifyCronSecret, logSyncStart, logSyncEnd } from '@/lib/seo-sync'

export async function GET(req: Request) { return handler(req) }
export async function POST(req: Request) { return handler(req) }

async function handler(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) {
    return NextResponse.json({ skipped: true, reason: 'GA4_PROPERTY_ID not configured' })
  }

  const auth = await getGoogleAuth()
  if (!auth) {
    return NextResponse.json({ skipped: true, reason: 'Google not connected — visit /seo and click Connect Google' })
  }

  const logId = await logSyncStart('ga4-daily')
  let rowsWritten = 0

  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      authClient: auth as never,
    })
    const supabase = createAdminClient()

    const { data: pages } = await supabase.from('seo_pages').select('id, url_path').eq('status', 'live')
    const pageMap = new Map((pages ?? []).map(p => [p.url_path, p.id]))

    // Last 3 days
    const now = new Date()
    const startDate = new Date(now.getTime() - 3 * 86400000).toISOString().split('T')[0]
    const endDate = now.toISOString().split('T')[0]

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }, { name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'conversions' },
      ],
    })

    const upsertRows: Array<{ page_id: string; date: string; sessions: number; engaged_sessions: number; conversions: number }> = []

    for (const row of response.rows ?? []) {
      const rawDate = row.dimensionValues?.[0]?.value // YYYYMMDD format
      const pagePath = row.dimensionValues?.[1]?.value
      if (!rawDate || !pagePath) continue

      const pageId = pageMap.get(pagePath)
      if (!pageId) continue

      // Convert YYYYMMDD to YYYY-MM-DD
      const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`

      upsertRows.push({
        page_id: pageId,
        date,
        sessions: parseInt(row.metricValues?.[0]?.value ?? '0'),
        engaged_sessions: parseInt(row.metricValues?.[1]?.value ?? '0'),
        conversions: parseInt(row.metricValues?.[2]?.value ?? '0'),
      })
    }

    // Upsert
    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from('seo_ga4_daily')
        .upsert(upsertRows, { onConflict: 'page_id,date' })
      if (error) console.error('[seo/sync/ga4] Upsert error:', error.message)
      else rowsWritten = upsertRows.length
    }

    await logSyncEnd(logId, rowsWritten)
    return NextResponse.json({ success: true, rows_written: rowsWritten })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seo/sync/ga4]', message)
    await logSyncEnd(logId, rowsWritten, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
