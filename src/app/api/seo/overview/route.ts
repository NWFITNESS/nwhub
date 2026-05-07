import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()
  const now = new Date()
  const d28ago = new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0]
  const d56ago = new Date(now.getTime() - 56 * 86400000).toISOString().split('T')[0]

  // ── Parallel data fetch ───────────────────────────────────────────────────
  const [
    { data: templates },
    { data: pages },
    { data: gsc28 },
    { data: gscPrev28 },
    { data: ga428 },
    { data: healthRows },
    { data: pipelineRuns },
    { data: gscDaily28 },
  ] = await Promise.all([
    supabase.from('seo_templates').select('*').order('created_at'),
    supabase.from('seo_pages').select('*').order('url_path'),
    supabase.from('seo_gsc_daily').select('page_id, impressions, clicks, position, date').gte('date', d28ago),
    supabase.from('seo_gsc_daily').select('page_id, impressions, clicks, position').gte('date', d56ago).lt('date', d28ago),
    supabase.from('seo_ga4_daily').select('page_id, conversions').gte('date', d28ago),
    supabase.from('seo_health').select('*'),
    supabase.from('seo_pipeline_runs').select('*').order('started_at', { ascending: false }).limit(1),
    supabase.from('seo_gsc_daily').select('date, impressions').gte('date', d28ago),
  ])

  const allTemplates = templates ?? []
  const allPages = pages ?? []
  const allGsc28 = gsc28 ?? []
  const allGscPrev = gscPrev28 ?? []
  const allGa4 = ga428 ?? []
  const allHealth = healthRows ?? []

  // ── Hero stats ────────────────────────────────────────────────────────────
  const impressions28d = allGsc28.reduce((s, r) => s + (r.impressions ?? 0), 0)
  const clicks28d = allGsc28.reduce((s, r) => s + (r.clicks ?? 0), 0)
  const prevImpressions = allGscPrev.reduce((s, r) => s + (r.impressions ?? 0), 0)
  const impressions28dDelta = prevImpressions > 0
    ? Math.round(((impressions28d - prevImpressions) / prevImpressions) * 100)
    : 0
  const trials28d = allGa4.reduce((s, r) => s + (r.conversions ?? 0), 0)

  // Sparkline: 28 daily impression totals
  const sparklineMap = new Map<string, number>()
  for (const row of (gscDaily28 ?? [])) {
    const d = String(row.date)
    sparklineMap.set(d, (sparklineMap.get(d) ?? 0) + (row.impressions ?? 0))
  }
  const sparkline: number[] = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0]
    sparkline.push(sparklineMap.get(d) ?? 0)
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const pagesLive = allPages.filter(p => p.status === 'live').length
  const indexedCount = allHealth.filter(h => h.is_indexed).length
  const indexedRate = pagesLive > 0 ? indexedCount / pagesLive : 0

  const positions28 = allGsc28.filter(r => r.position != null).map(r => Number(r.position))
  const avgPosition = positions28.length > 0
    ? positions28.reduce((s, v) => s + v, 0) / positions28.length
    : 0
  const prevPositions = allGscPrev.filter(r => r.position != null).map(r => Number(r.position))
  const prevAvgPosition = prevPositions.length > 0
    ? prevPositions.reduce((s, v) => s + v, 0) / prevPositions.length
    : 0
  const avgPositionDelta = prevAvgPosition > 0 ? avgPosition - prevAvgPosition : 0

  // ── Per-template stats ────────────────────────────────────────────────────
  const templateStats = allTemplates.map(t => {
    const tPages = allPages.filter(p => p.template_id === t.id)
    const tPageIds = new Set(tPages.map(p => p.id))
    const tGsc = allGsc28.filter(r => tPageIds.has(r.page_id))
    const tGa4 = allGa4.filter(r => tPageIds.has(r.page_id))
    const tHealth = allHealth.filter(h => tPageIds.has(h.page_id))
    const tIndexed = tHealth.filter(h => h.is_indexed).length
    const tQueued = tPages.filter(p => p.status === 'draft').length

    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      url_pattern: t.url_pattern,
      status: t.status,
      pages_count: tPages.length,
      indexed_count: tIndexed,
      queued_count: tQueued,
      impressions_28d: tGsc.reduce((s, r) => s + (r.impressions ?? 0), 0),
      clicks_28d: tGsc.reduce((s, r) => s + (r.clicks ?? 0), 0),
      trials_28d: tGa4.reduce((s, r) => s + (r.conversions ?? 0), 0),
      progress_pct: tPages.length > 0 ? tIndexed / tPages.length : 0,
    }
  })

  // ── Attention queue ───────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attention: any[] = []

  // Unindexed live pages
  const unindexedPages = allPages.filter(p => {
    if (p.status !== 'live') return false
    const h = allHealth.find(h => h.page_id === p.id)
    return !h?.is_indexed
  })
  if (unindexedPages.length > 0) {
    attention.push({
      type: 'unindexed',
      severity: 'warn',
      title: `${unindexedPages.length} page${unindexedPages.length > 1 ? 's' : ''} not indexed`,
      message: 'These live pages haven\'t been picked up by Google yet.',
      page_ids: unindexedPages.map(p => p.id),
      action: { label: 'Push to IndexPlease', endpoint: '/api/seo/indexplease/push', method: 'POST', body: { page_ids: unindexedPages.map(p => p.id) } },
    })
  }

  // Poor Core Web Vitals (LCP > 2500ms or CLS > 0.1)
  const cwvPages = allHealth.filter(h => (h.lcp_ms && h.lcp_ms > 2500) || (h.cls && Number(h.cls) > 0.1))
  if (cwvPages.length > 0) {
    attention.push({
      type: 'core_web_vitals',
      severity: 'warn',
      title: `${cwvPages.length} page${cwvPages.length > 1 ? 's' : ''} failing Core Web Vitals`,
      message: 'LCP > 2.5s or CLS > 0.1 on these pages.',
      page_ids: cwvPages.map(h => h.page_id),
      action: { label: 'View PageSpeed', endpoint: '', method: 'POST', body: {} },
    })
  }

  // Schema validation failures
  const schemaFail = allHealth.filter(h => h.schema_valid === false)
  if (schemaFail.length > 0) {
    attention.push({
      type: 'quality',
      severity: 'info',
      title: `${schemaFail.length} page${schemaFail.length > 1 ? 's' : ''} with schema issues`,
      message: 'Structured data validation failed on these pages.',
      page_ids: schemaFail.map(h => h.page_id),
      action: { label: 'Review', endpoint: '', method: 'POST', body: {} },
    })
  }

  // ── Top pages by impressions ──────────────────────────────────────────────
  const pageImpressions = new Map<string, { impressions: number; positions: number[]; page: typeof allPages[0] }>()
  for (const p of allPages.filter(p => p.status === 'live')) {
    const pGsc = allGsc28.filter(r => r.page_id === p.id)
    const imp = pGsc.reduce((s, r) => s + (r.impressions ?? 0), 0)
    const pos = pGsc.filter(r => r.position != null).map(r => Number(r.position))
    pageImpressions.set(p.id, { impressions: imp, positions: pos, page: p })
  }
  const topPages = [...pageImpressions.entries()]
    .sort((a, b) => b[1].impressions - a[1].impressions)
    .slice(0, 5)
    .map(([, v]) => ({
      page_id: v.page.id,
      url_path: v.page.url_path,
      title: v.page.title,
      template_slug: allTemplates.find(t => t.id === v.page.template_id)?.slug ?? '',
      impressions_28d: v.impressions,
      position_avg: v.positions.length > 0
        ? v.positions.reduce((s, p) => s + p, 0) / v.positions.length
        : null,
    }))

  // ── Current pipeline run ──────────────────────────────────────────────────
  const currentRun = (pipelineRuns ?? [])[0] ?? null

  return NextResponse.json({
    hero: {
      impressions_28d: impressions28d,
      impressions_28d_delta_pct: impressions28dDelta,
      clicks_28d: clicks28d,
      trials_28d: trials28d,
      sparkline,
    },
    kpis: {
      pages_live: pagesLive,
      indexed_count: indexedCount,
      indexed_rate: Math.round(indexedRate * 100) / 100,
      avg_position: Math.round(avgPosition * 10) / 10,
      avg_position_delta: Math.round(avgPositionDelta * 10) / 10,
    },
    templates: templateStats,
    attention,
    top_pages: topPages,
    current_run: currentRun,
  })
}
