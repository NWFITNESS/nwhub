import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const urlPath = request.nextUrl.searchParams.get('path')
  const range = request.nextUrl.searchParams.get('range') ?? '28d'

  if (!urlPath) {
    return NextResponse.json({ error: 'Missing path param' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  // Range calculation
  const rangeDays: Record<string, number> = { '7d': 7, '28d': 28, '3m': 90, '12m': 365 }
  const days = rangeDays[range] ?? 28
  const rangeStart = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0]
  const prevStart = new Date(now.getTime() - days * 2 * 86400000).toISOString().split('T')[0]

  // Fetch page
  const { data: page } = await supabase
    .from('seo_pages')
    .select('*')
    .eq('url_path', urlPath)
    .single()

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  // Parallel fetch
  const [
    { data: template },
    { data: gscRange },
    { data: gscPrev },
    { data: queries },
    { data: health },
    { data: siblings },
    { data: ga4Range },
    { data: brief },
  ] = await Promise.all([
    supabase.from('seo_templates').select('*').eq('id', page.template_id).single(),
    supabase.from('seo_gsc_daily').select('*').eq('page_id', page.id).gte('date', rangeStart).order('date'),
    supabase.from('seo_gsc_daily').select('impressions, clicks, position').eq('page_id', page.id).gte('date', prevStart).lt('date', rangeStart),
    supabase.from('seo_gsc_queries').select('*').eq('page_id', page.id).order('week_start', { ascending: false }).order('impressions', { ascending: false }).limit(10),
    supabase.from('seo_health').select('*').eq('page_id', page.id).single(),
    supabase.from('seo_pages').select('id, url_path, title, variables, status').eq('template_id', page.template_id).neq('id', page.id).order('url_path').limit(20),
    supabase.from('seo_ga4_daily').select('conversions').eq('page_id', page.id).gte('date', rangeStart),
    supabase.from('seo_briefs').select('*').eq('page_id', page.id).order('version', { ascending: false }).limit(1).maybeSingle(),
  ])

  const allGsc = gscRange ?? []
  const allPrev = gscPrev ?? []

  // Current range metrics
  const impressions = allGsc.reduce((s, r) => s + (r.impressions ?? 0), 0)
  const clicks = allGsc.reduce((s, r) => s + (r.clicks ?? 0), 0)
  const positions = allGsc.filter(r => r.position != null).map(r => Number(r.position))
  const position = positions.length > 0 ? positions.reduce((s, v) => s + v, 0) / positions.length : null
  const ctr = impressions > 0 ? clicks / impressions : 0

  // Previous range metrics for deltas
  const prevImpressions = allPrev.reduce((s, r) => s + (r.impressions ?? 0), 0)
  const prevClicks = allPrev.reduce((s, r) => s + (r.clicks ?? 0), 0)
  const prevPositions = allPrev.filter(r => r.position != null).map(r => Number(r.position))
  const prevPosition = prevPositions.length > 0 ? prevPositions.reduce((s, v) => s + v, 0) / prevPositions.length : null
  const prevCtr = prevImpressions > 0 ? prevClicks / prevImpressions : 0

  const pctDelta = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0

  // Daily chart data
  const daily = allGsc.map(r => ({
    date: r.date,
    impressions: r.impressions ?? 0,
    clicks: r.clicks ?? 0,
    position: r.position != null ? Number(r.position) : null,
  }))

  // Trials
  const trials = (ga4Range ?? []).reduce((s, r) => s + (r.conversions ?? 0), 0)

  // Sibling impressions (last 28d)
  const siblingIds = (siblings ?? []).map(s => s.id)
  let siblingMetrics: Record<string, { impressions: number; position: number[] }> = {}
  if (siblingIds.length > 0) {
    const d28 = new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0]
    const { data: sibGsc } = await supabase
      .from('seo_gsc_daily')
      .select('page_id, impressions, position')
      .in('page_id', siblingIds)
      .gte('date', d28)
    for (const r of (sibGsc ?? [])) {
      if (!siblingMetrics[r.page_id]) siblingMetrics[r.page_id] = { impressions: 0, position: [] }
      siblingMetrics[r.page_id].impressions += r.impressions ?? 0
      if (r.position != null) siblingMetrics[r.page_id].position.push(Number(r.position))
    }
  }

  const siblingList = (siblings ?? []).map(s => {
    const m = siblingMetrics[s.id]
    return {
      page_id: s.id,
      url_path: s.url_path,
      title: s.title,
      status: s.status,
      impressions_28d: m?.impressions ?? 0,
      position_avg: m?.position?.length
        ? m.position.reduce((a, b) => a + b, 0) / m.position.length
        : null,
    }
  })

  return NextResponse.json({
    page,
    template: template ?? null,
    brief: brief ?? null,
    metrics: {
      range,
      impressions,
      impressions_delta: pctDelta(impressions, prevImpressions),
      clicks,
      clicks_delta: pctDelta(clicks, prevClicks),
      ctr: Math.round(ctr * 10000) / 100,
      ctr_delta: Math.round((ctr - prevCtr) * 10000) / 100,
      position: position != null ? Math.round(position * 10) / 10 : null,
      position_delta: position != null && prevPosition != null
        ? Math.round((position - prevPosition) * 10) / 10
        : null,
      daily,
    },
    queries: (queries ?? []).map(q => ({
      query: q.query,
      impressions: q.impressions,
      clicks: q.clicks,
      position: q.position != null ? Number(q.position) : null,
    })),
    health: health ?? null,
    siblings: siblingList,
    conversions: {
      trials: trials,
      trial_conversion_rate: clicks > 0 ? Math.round((trials / clicks) * 10000) / 100 : 0,
    },
  })
}
