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

  const auth = getGoogleAuth(['https://www.googleapis.com/auth/webmasters.readonly'])
  if (!auth) {
    return NextResponse.json({ skipped: true, reason: 'GSC_SERVICE_ACCOUNT_JSON not configured' })
  }

  const logId = await logSyncStart('gsc-queries')
  let rowsWritten = 0

  try {
    const supabase = createAdminClient()
    const siteUrl = process.env.GSC_SITE_URL ?? 'sc-domain:northernwarrior.co.uk'
    const searchconsole = google.searchconsole({ version: 'v1', auth })
    const baseUrl = 'https://northernwarrior.co.uk'

    const { data: pages } = await supabase.from('seo_pages').select('id, url_path').eq('status', 'live')
    if (!pages?.length) {
      await logSyncEnd(logId, 0)
      return NextResponse.json({ success: true, rows_written: 0 })
    }

    // Last 7 days
    const now = new Date()
    const startDate = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]
    const endDate = now.toISOString().split('T')[0]

    // Monday of this week
    const monday = new Date(now)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const weekStart = monday.toISOString().split('T')[0]

    // Process pages in batches of 50
    for (let i = 0; i < pages.length; i += 50) {
      const batch = pages.slice(i, i + 50)
      const results = await Promise.all(
        batch.map(async (page) => {
          try {
            const res = await searchconsole.searchanalytics.query({
              siteUrl,
              requestBody: {
                startDate,
                endDate,
                dimensions: ['query'],
                type: 'web',
                dimensionFilterGroups: [{
                  filters: [{
                    dimension: 'page',
                    operator: 'equals',
                    expression: `${baseUrl}${page.url_path}`,
                  }],
                }],
                rowLimit: 25,
              },
            })
            return { pageId: page.id, rows: res.data.rows ?? [] }
          } catch {
            return { pageId: page.id, rows: [] }
          }
        })
      )

      const upsertRows: Array<{ page_id: string; query: string; impressions: number; clicks: number; position: number; week_start: string }> = []
      for (const { pageId, rows } of results) {
        for (const row of rows) {
          const query = row.keys?.[0]
          if (!query) continue
          upsertRows.push({
            page_id: pageId,
            query,
            impressions: row.impressions ?? 0,
            clicks: row.clicks ?? 0,
            position: Math.round((row.position ?? 0) * 100) / 100,
            week_start: weekStart,
          })
        }
      }

      if (upsertRows.length > 0) {
        const { error } = await supabase
          .from('seo_gsc_queries')
          .upsert(upsertRows, { onConflict: 'page_id,query,week_start' })
        if (error) console.error('[seo/sync/gsc-queries] Upsert error:', error.message)
        else rowsWritten += upsertRows.length
      }
    }

    await logSyncEnd(logId, rowsWritten)
    return NextResponse.json({ success: true, rows_written: rowsWritten })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seo/sync/gsc-queries]', message)
    await logSyncEnd(logId, rowsWritten, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
