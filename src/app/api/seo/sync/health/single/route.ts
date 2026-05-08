import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGoogleAuth } from '@/lib/google-auth'
import { requireAuth } from '@/lib/auth-guard'

const BASE_URL = 'https://northernwarrior.co.uk'

// POST — run health checks for a single page
// Body: { page_id }
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { page_id } = await req.json()
  if (!page_id) return NextResponse.json({ error: 'page_id required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: page } = await supabase
    .from('seo_pages')
    .select('id, url_path')
    .eq('id', page_id)
    .single()

  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  const fullUrl = `${BASE_URL}${page.url_path}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const healthRow: Record<string, any> = {
    page_id: page.id,
    checked_at: new Date().toISOString(),
  }

  // HTTP status
  try {
    const res = await fetch(fullUrl, { method: 'HEAD', redirect: 'follow' })
    healthRow.http_status = res.status
  } catch {
    healthRow.http_status = 0
  }

  // URL Inspection
  const auth = await getGoogleAuth()
  if (auth) {
    const siteUrl = process.env.GSC_SITE_URL ?? 'sc-domain:northernwarrior.co.uk'
    try {
      const searchconsole = google.searchconsole({ version: 'v1', auth })
      const inspection = await searchconsole.urlInspection.index.inspect({
        requestBody: { inspectionUrl: fullUrl, siteUrl },
      })
      const result = inspection.data?.inspectionResult?.indexStatusResult
      healthRow.is_indexed = result?.coverageState === 'Submitted and indexed'
        || result?.coverageState === 'Indexed, not submitted in sitemap'
      healthRow.last_crawled_at = result?.lastCrawlTime ?? null
    } catch { /* non-critical */ }
  }

  // PageSpeed
  try {
    const psiKey = process.env.PSI_API_KEY
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(fullUrl)}&strategy=mobile${psiKey ? `&key=${psiKey}` : ''}`
    const psiRes = await fetch(psiUrl)
    if (psiRes.ok) {
      const psi = await psiRes.json()
      const audits = psi.lighthouseResult?.audits
      if (audits) {
        healthRow.lcp_ms = audits['largest-contentful-paint']?.numericValue ? Math.round(audits['largest-contentful-paint'].numericValue) : null
        healthRow.cls = audits['cumulative-layout-shift']?.numericValue ?? null
        healthRow.inp_ms = audits['interaction-to-next-paint']?.numericValue ? Math.round(audits['interaction-to-next-paint'].numericValue) : null
      }
    }
  } catch { /* non-critical */ }

  // Schema
  try {
    const htmlRes = await fetch(fullUrl, { headers: { 'User-Agent': 'NWHub-HealthCheck/1.0' } })
    if (htmlRes.ok) {
      const html = await htmlRes.text()
      const schemaRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      const types: string[] = []
      let match
      while ((match = schemaRegex.exec(html)) !== null) {
        try { const p = JSON.parse(match[1]); if (p['@type']) types.push(p['@type']) } catch { /* skip */ }
      }
      healthRow.schema_types = types.length > 0 ? types : null
      healthRow.schema_valid = types.length > 0
    }
  } catch { /* non-critical */ }

  const { error } = await supabase.from('seo_health').upsert(healthRow, { onConflict: 'page_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(healthRow)
}
