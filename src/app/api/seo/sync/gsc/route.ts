import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGoogleAuth } from '@/lib/google-auth'
import { verifyCronSecret, logSyncStart, logSyncEnd } from '@/lib/seo-sync'

export async function GET(req: Request) { return handler(req) }
export async function POST(req: Request) { return handler(req) }

async function handler(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth = await getGoogleAuth()
  if (!auth) {
    return NextResponse.json({ skipped: true, reason: 'Google not connected — visit /seo and click Connect Google' })
  }

  const logId = await logSyncStart('gsc-daily')
  let rowsWritten = 0

  try {
    const supabase = createAdminClient()
    const siteUrl = process.env.GSC_SITE_URL ?? 'sc-domain:northernwarrior.co.uk'
    const searchconsole = google.searchconsole({ version: 'v1', auth })

    // Fetch all tracked page URL paths
    const { data: pages } = await supabase.from('seo_pages').select('id, url_path').eq('status', 'live')
    const pageMap = new Map((pages ?? []).map(p => [p.url_path, p.id]))

    // Query last 3 days (GSC lags 2-3 days, so backfill a window)
    const now = new Date()
    const startDate = new Date(now.getTime() - 3 * 86400000).toISOString().split('T')[0]
    const endDate = now.toISOString().split('T')[0]

    let startRow = 0
    const allRows: Array<{ page_id: string; date: string; impressions: number; clicks: number; ctr: number; position: number }> = []

    // Paginate through results
    while (true) {
      const res = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['date', 'page'],
          type: 'web',
          rowLimit: 25000,
          startRow,
        },
      })

      const rows = res.data.rows ?? []
      if (rows.length === 0) break

      for (const row of rows) {
        const [date, fullUrl] = row.keys ?? []
        if (!date || !fullUrl) continue

        // Strip domain to get url_path
        let urlPath: string
        try {
          urlPath = new URL(fullUrl).pathname
        } catch {
          continue
        }

        const pageId = pageMap.get(urlPath)
        if (!pageId) continue

        allRows.push({
          page_id: pageId,
          date,
          impressions: row.impressions ?? 0,
          clicks: row.clicks ?? 0,
          ctr: Math.round((row.ctr ?? 0) * 10000) / 10000,
          position: Math.round((row.position ?? 0) * 100) / 100,
        })
      }

      if (rows.length < 25000) break
      startRow += rows.length
    }

    // Upsert in batches
    for (let i = 0; i < allRows.length; i += 500) {
      const batch = allRows.slice(i, i + 500)
      const { error } = await supabase
        .from('seo_gsc_daily')
        .upsert(batch, { onConflict: 'page_id,date' })
      if (error) console.error('[seo/sync/gsc] Upsert error:', error.message)
      else rowsWritten += batch.length
    }

    await logSyncEnd(logId, rowsWritten)
    return NextResponse.json({ success: true, rows_written: rowsWritten })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seo/sync/gsc]', message)
    await logSyncEnd(logId, rowsWritten, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
