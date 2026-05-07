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

  const logId = await logSyncStart('health')
  let rowsWritten = 0
  const baseUrl = 'https://northernwarrior.co.uk'

  try {
    const supabase = createAdminClient()
    const { data: pages } = await supabase.from('seo_pages').select('id, url_path').eq('status', 'live')
    if (!pages?.length) {
      await logSyncEnd(logId, 0)
      return NextResponse.json({ success: true, rows_written: 0 })
    }

    // GSC URL Inspection API (optional — needs service account)
    const auth = getGoogleAuth(['https://www.googleapis.com/auth/webmasters.readonly'])
    const siteUrl = process.env.GSC_SITE_URL ?? 'sc-domain:northernwarrior.co.uk'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let searchconsole: any = null
    if (auth) {
      searchconsole = google.searchconsole({ version: 'v1', auth })
    }

    const psiKey = process.env.PSI_API_KEY

    for (const page of pages) {
      const fullUrl = `${baseUrl}${page.url_path}`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const healthRow: Record<string, any> = {
        page_id: page.id,
        checked_at: new Date().toISOString(),
      }

      // 1. HTTP status check
      try {
        const res = await fetch(fullUrl, { method: 'HEAD', redirect: 'follow' })
        healthRow.http_status = res.status
      } catch {
        healthRow.http_status = 0
      }

      // 2. URL Inspection (indexing check)
      if (searchconsole) {
        try {
          const inspection = await searchconsole.urlInspection.index.inspect({
            requestBody: { inspectionUrl: fullUrl, siteUrl },
          })
          const result = inspection.data?.inspectionResult?.indexStatusResult
          healthRow.is_indexed = result?.coverageState === 'Submitted and indexed'
            || result?.coverageState === 'Indexed, not submitted in sitemap'
          healthRow.last_crawled_at = result?.lastCrawlTime ?? null
        } catch (e) {
          console.error(`[health] URL inspection failed for ${page.url_path}:`, e instanceof Error ? e.message : e)
        }
      }

      // 3. PageSpeed Insights
      try {
        const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(fullUrl)}&strategy=mobile${psiKey ? `&key=${psiKey}` : ''}`
        const psiRes = await fetch(psiUrl)
        if (psiRes.ok) {
          const psi = await psiRes.json()
          const audits = psi.lighthouseResult?.audits
          if (audits) {
            healthRow.lcp_ms = audits['largest-contentful-paint']?.numericValue
              ? Math.round(audits['largest-contentful-paint'].numericValue)
              : null
            healthRow.cls = audits['cumulative-layout-shift']?.numericValue ?? null
            healthRow.inp_ms = audits['interaction-to-next-paint']?.numericValue
              ? Math.round(audits['interaction-to-next-paint'].numericValue)
              : null
          }
        }
      } catch (e) {
        console.error(`[health] PSI failed for ${page.url_path}:`, e instanceof Error ? e.message : e)
      }

      // 4. Schema validation — fetch HTML and extract ld+json
      try {
        const htmlRes = await fetch(fullUrl, { headers: { 'User-Agent': 'NWHub-HealthCheck/1.0' } })
        if (htmlRes.ok) {
          const html = await htmlRes.text()
          const schemaRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
          const types: string[] = []
          let match
          while ((match = schemaRegex.exec(html)) !== null) {
            try {
              const parsed = JSON.parse(match[1])
              if (parsed['@type']) types.push(parsed['@type'])
            } catch { /* invalid JSON, skip */ }
          }
          healthRow.schema_types = types.length > 0 ? types : null
          healthRow.schema_valid = types.length > 0
        }
      } catch {
        // Non-critical
      }

      // 5. Internal link counts
      try {
        // Inbound: how many other pages link to this page
        const { count: inbound } = await supabase
          .from('seo_pages')
          .select('id', { count: 'exact', head: true })
          .neq('id', page.id)
          .eq('status', 'live')
        healthRow.inbound_links = inbound ?? 0

        // Outbound: count links in this page (rough heuristic from data_row)
        const { data: thisPage } = await supabase.from('seo_pages').select('data_row').eq('id', page.id).single()
        const content = JSON.stringify(thisPage?.data_row ?? {})
        const linkMatches = content.match(/href=["']\/[^"']+["']/g)
        healthRow.outbound_links = linkMatches?.length ?? 0
      } catch {
        // Non-critical
      }

      // Upsert health row
      const { error } = await supabase
        .from('seo_health')
        .upsert(healthRow, { onConflict: 'page_id' })
      if (error) console.error(`[health] Upsert failed for ${page.url_path}:`, error.message)
      else rowsWritten++
    }

    await logSyncEnd(logId, rowsWritten)
    return NextResponse.json({ success: true, rows_written: rowsWritten })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seo/sync/health]', message)
    await logSyncEnd(logId, rowsWritten, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
