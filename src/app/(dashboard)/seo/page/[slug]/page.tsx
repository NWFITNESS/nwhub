'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  RefreshCw, ExternalLink, Copy, Check, ChevronRight,
  TrendingUp, TrendingDown, Globe, Shield, Zap, FileText, Link2, Layers,
  AlertTriangle, Sparkles, History, Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart,
} from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────

interface PageData {
  id: string
  url_path: string
  title: string
  status: string
  version: number
  published_at: string | null
  template_id: string
}

interface TemplateData {
  id: string
  slug: string
  name: string
  url_pattern: string
}

interface BriefData {
  id: string
  version: number
  model: string
  generated_at: string
}

interface DailyPoint {
  date: string
  impressions: number
  clicks: number
  position: number | null
}

interface Metrics {
  range: string
  impressions: number
  impressions_delta: number
  clicks: number
  clicks_delta: number
  ctr: number
  ctr_delta: number
  position: number | null
  position_delta: number | null
  daily: DailyPoint[]
}

interface QueryRow {
  query: string
  impressions: number
  clicks: number
  position: number | null
}

interface HealthData {
  is_indexed: boolean | null
  http_status: number | null
  schema_valid: boolean | null
  schema_types: string[] | null
  lcp_ms: number | null
  cls: number | null
  inp_ms: number | null
  inbound_links: number | null
  outbound_links: number | null
  uniqueness_score: number | null
  checked_at: string | null
}

interface SiblingPage {
  page_id: string
  url_path: string
  title: string
  status: string
  impressions_28d: number
  position_avg: number | null
}

interface Conversions {
  trials: number
  trial_conversion_rate: number
}

interface SeoPageDetail {
  page: PageData
  template: TemplateData | null
  brief: BriefData | null
  metrics: Metrics
  queries: QueryRow[]
  health: HealthData | null
  siblings: SiblingPage[]
  conversions: Conversions
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => Intl.NumberFormat('en-GB').format(n)
const fmtDate = (d: string) => {
  const dt = new Date(d)
  return Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(dt)
}

function DeltaPill({ value, invert, suffix = '%' }: { value: number; invert?: boolean; suffix?: string }) {
  if (value === 0) return null
  const positive = invert ? value < 0 : value > 0
  const icon = positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />
  return (
    <span className={`inline-flex items-center gap-1 rounded-md text-[10px] font-bold ${positive ? 'text-[#4ade80]' : 'text-red-400'}`} style={{ padding: '2px 6px' }}>
      {icon} {value > 0 ? '+' : ''}{value}{suffix}
    </span>
  )
}

function positionVariant(pos: number | null): 'done' | 'gold' | 'danger' | 'default' {
  if (pos == null) return 'default'
  if (pos <= 10) return 'done'
  if (pos <= 20) return 'gold'
  return 'danger'
}

const TOOLTIP_STYLE = {
  background: '#22293d',
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 8,
  fontSize: 12,
}
const AXIS_TICK = { fill: '#8296b4', fontSize: 11 }

const RANGES = ['7d', '28d', '3m', '12m'] as const

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SeoPageDetailPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const urlPath = decodeURIComponent(slug)

  const router = useRouter()
  const [data, setData] = useState<SeoPageDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<string>('28d')
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenResult, setRegenResult] = useState<string | null>(null)
  const [briefHistory, setBriefHistory] = useState<Array<{ id: string; version: number; model: string; generated_at: string }> | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedBrief, setSelectedBrief] = useState<{ prompt_used: string; generated_content: string; model: string; version: number } | null>(null)
  const [deindexing, setDeindexing] = useState(false)
  const [confirmDeindex, setConfirmDeindex] = useState(false)

  async function load(r?: string) {
    setLoading(true)
    setError(null)
    const activeRange = r ?? range
    try {
      const res = await fetch(`/api/seo/page?path=${encodeURIComponent(urlPath)}&range=${activeRange}`)
      if (!res.ok) { setError(`API error (${res.status})`); return }
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function switchRange(r: string) {
    setRange(r)
    load(r)
  }

  function copyUrl() {
    navigator.clipboard.writeText(`https://northernwarrior.co.uk${urlPath}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function regenerate() {
    if (!data?.page?.id) return
    setRegenerating(true)
    setRegenResult(null)
    try {
      const res = await fetch('/api/seo/page/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: data.page.id }),
      })
      const result = await res.json()
      if (result.generated > 0) {
        setRegenResult('Content regenerated successfully')
        load()
      } else {
        setRegenResult(result.results?.[0]?.error ?? result.error ?? 'Generation failed')
      }
    } catch {
      setRegenResult('Failed to regenerate')
    } finally {
      setRegenerating(false)
    }
  }

  async function loadBriefHistory() {
    if (!data?.page?.id) return
    setShowHistory(!showHistory)
    if (briefHistory) return
    const res = await fetch(`/api/seo/briefs?page_id=${data.page.id}`)
    if (res.ok) setBriefHistory(await res.json())
  }

  async function viewBrief(briefId: string) {
    const res = await fetch(`/api/seo/briefs?id=${briefId}`)
    if (res.ok) setSelectedBrief(await res.json())
  }

  async function deindexPage() {
    if (!data?.page?.id) return
    setDeindexing(true)
    try {
      await fetch('/api/seo/page/deindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: data.page.id }),
      })
      router.push('/seo')
    } catch {
      setDeindexing(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertTriangle size={22} className="text-red-400" />
        <p className="text-[13px] text-red-400">{error}</p>
        <Button variant="default" size="sm" onClick={() => load()}><RefreshCw size={12} /> Retry</Button>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 rounded bg-nw-700 animate-pulse" />
        <div className="h-[300px] rounded-2xl bg-nw-750 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-2xl bg-nw-750 animate-pulse" />
          <div className="h-24 rounded-2xl bg-nw-750 animate-pulse" />
        </div>
      </div>
    )
  }

  const { page, template, metrics, queries, health, siblings, conversions, brief } = data
  const publicUrl = `https://northernwarrior.co.uk${page.url_path}`

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] text-nw-500">
        <Link href="/seo" className="hover:text-gold-300 transition-colors">SEO</Link>
        <ChevronRight size={10} />
        {template && <><span className="text-nw-400">{template.name}</span><ChevronRight size={10} /></>}
        <span className="text-nw-200">{page.title}</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-brand text-[28px] font-bold text-white" style={{ letterSpacing: '0.3px' }}>{page.title}</h1>
          <Badge variant={page.status === 'live' ? 'active' : page.status === 'deindexed' ? 'danger' : 'draft'}>
            {page.status}
          </Badge>
          {health?.is_indexed && <Badge variant="done">Indexed</Badge>}
          {brief && <Badge variant="default">v{brief.version}</Badge>}
        </div>

        {/* URL bar */}
        <div
          className="mt-2 flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-nw-800 text-[12px] text-nw-400 overflow-hidden"
          style={{ padding: '6px 10px' }}
        >
          <span className="truncate flex-1">{publicUrl}</span>
          <button onClick={copyUrl} className="flex-shrink-0 text-nw-500 hover:text-gold-300 transition-colors" style={{ padding: 4 }}>
            {copied ? <Check size={13} className="text-[#4ade80]" /> : <Copy size={13} />}
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-nw-500 hover:text-gold-300 transition-colors" style={{ padding: 4 }}>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => switchRange(r)}
            className={`rounded-lg border text-[11px] font-bold uppercase tracking-[0.8px] transition-colors ${
              range === r
                ? 'border-[rgba(212,160,23,0.35)] bg-[rgba(212,160,23,0.12)] text-gold-300'
                : 'border-[rgba(255,255,255,0.09)] bg-transparent text-nw-400 hover:text-nw-200'
            }`}
            style={{ padding: '6px 12px', minHeight: 44 }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750" style={{ padding: '16px 16px 8px' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-2">Impressions &amp; Position</p>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={metrics.daily} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e8b933" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#e8b933" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={fmtDate} interval={Math.max(0, Math.floor(metrics.daily.length / 7) - 1)} />
            <YAxis yAxisId="left" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" reversed tick={AXIS_TICK} axisLine={false} tickLine={false} domain={[0, 50]} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(label) => fmtDate(String(label))}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [
                name === 'position' ? Number(value)?.toFixed(1) : fmt(Number(value)),
                name === 'impressions' ? 'Impressions' : name === 'position' ? 'Position' : String(name),
              ]}
            />
            <Area yAxisId="left" type="monotone" dataKey="impressions" stroke="#e8b933" strokeWidth={2} fill="url(#impGrad)" />
            <Line yAxisId="right" type="monotone" dataKey="position" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile label="Impressions" value={fmt(metrics.impressions)} delta={metrics.impressions_delta} />
        <MetricTile label="Clicks" value={fmt(metrics.clicks)} delta={metrics.clicks_delta} />
        <MetricTile label="Avg Position" value={metrics.position?.toFixed(1) ?? '—'} delta={metrics.position_delta} suffix="" invert />
        <MetricTile label="CTR" value={`${metrics.ctr.toFixed(2)}%`} delta={metrics.ctr_delta} suffix="pp" />
      </div>

      {/* Conversions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750" style={{ padding: 16 }}>
          <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">Trials</p>
          <p className="font-brand text-2xl font-bold text-white mt-1">{conversions.trials}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750" style={{ padding: 16 }}>
          <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">Trial Conv. Rate</p>
          <p className="font-brand text-2xl font-bold text-white mt-1">{conversions.trial_conversion_rate.toFixed(2)}%</p>
        </div>
      </div>

      {/* Top Queries */}
      {queries.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-3">Top Queries</p>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 overflow-hidden">
            {queries.map((q, i) => (
              <div
                key={q.query}
                className={`flex items-center gap-3 ${i < queries.length - 1 ? 'border-b border-[rgba(255,255,255,0.06)]' : ''}`}
                style={{ padding: '10px 16px' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-nw-200 truncate">{q.query}</p>
                </div>
                <span className="text-[11px] text-nw-400 flex-shrink-0">{fmt(q.impressions)} imp</span>
                <span className="text-[11px] text-nw-400 flex-shrink-0">{q.clicks} clk</span>
                {q.position != null && (
                  <Badge variant={positionVariant(q.position)}>
                    {q.position.toFixed(1)}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Checks */}
      {health && <HealthChecks health={health} />}

      {/* Live Preview */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-3">Live Preview</p>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-800 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.08)]" style={{ padding: '8px 12px' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-[10px] text-nw-500 truncate flex-1">{publicUrl}</span>
          </div>
          <iframe
            src={publicUrl}
            sandbox="allow-same-origin"
            className="w-full border-0"
            style={{ height: 400 }}
            title="Live preview"
          />
        </div>
      </div>

      {/* Siblings */}
      {siblings.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-3">
            Sibling Pages ({siblings.length})
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
            {siblings.map((s) => (
              <Link
                key={s.page_id}
                href={`/seo/page/${encodeURIComponent(s.url_path)}`}
                className="flex-shrink-0 w-[240px] md:w-auto snap-start rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 transition-colors hover:border-[rgba(212,160,23,0.22)]"
                style={{ padding: 14 }}
              >
                <p className="text-[13px] font-medium text-nw-200 truncate">{s.title}</p>
                <p className="text-[11px] text-nw-500 truncate mt-0.5">{s.url_path}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-nw-400">{fmt(s.impressions_28d)} imp</span>
                  {s.position_avg != null && (
                    <Badge variant={positionVariant(s.position_avg)}>
                      {s.position_avg.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions: Regenerate + History */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-3">Content</p>
        <div className="flex gap-2 flex-wrap">
          <Button variant="gold" size="sm" onClick={regenerate} loading={regenerating}>
            <Sparkles size={13} /> Regenerate
          </Button>
          <Button variant="default" size="sm" onClick={loadBriefHistory}>
            <History size={13} /> Brief History
          </Button>
        </div>
        {regenResult && (
          <div className="mt-3 rounded-xl border border-[rgba(212,160,23,0.25)] bg-[rgba(212,160,23,0.08)] text-[13px] text-gold-300" style={{ padding: '10px 16px' }}>
            {regenResult}
          </div>
        )}
      </div>

      {/* Brief History drawer */}
      {showHistory && (
        <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 overflow-hidden">
          <div style={{ padding: '12px 16px' }} className="border-b border-[rgba(255,255,255,0.06)]">
            <p className="text-[13px] font-semibold text-nw-200">Brief Versions</p>
          </div>
          {!briefHistory ? (
            <div style={{ padding: 16 }} className="text-[13px] text-nw-400">Loading...</div>
          ) : briefHistory.length === 0 ? (
            <div style={{ padding: 16 }} className="text-[13px] text-nw-400">No briefs generated yet</div>
          ) : (
            briefHistory.map((b, i) => (
              <button
                key={b.id}
                onClick={() => viewBrief(b.id)}
                className={`w-full text-left flex items-center justify-between transition-colors hover:bg-[rgba(255,255,255,0.03)] ${i < briefHistory.length - 1 ? 'border-b border-[rgba(255,255,255,0.06)]' : ''}`}
                style={{ padding: '10px 16px', minHeight: 44 }}
              >
                <div>
                  <p className="text-[13px] text-nw-200">Version {b.version}</p>
                  <p className="text-[11px] text-nw-500">{b.model} · {new Date(b.generated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <ChevronRight size={14} className="text-nw-500" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected brief content */}
      {selectedBrief && (
        <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]" style={{ padding: '12px 16px' }}>
            <p className="text-[13px] font-semibold text-nw-200">Brief v{selectedBrief.version} — {selectedBrief.model}</p>
            <button onClick={() => setSelectedBrief(null)} className="text-nw-500 hover:text-nw-200 text-[11px]">Close</button>
          </div>
          <div style={{ padding: 16 }}>
            <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-2">Prompt</p>
            <pre className="text-[12px] text-nw-400 whitespace-pre-wrap bg-nw-800 rounded-lg overflow-auto max-h-[200px]" style={{ padding: 12 }}>{selectedBrief.prompt_used}</pre>
            <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-2 mt-4">Generated Content</p>
            <pre className="text-[12px] text-nw-300 whitespace-pre-wrap bg-nw-800 rounded-lg overflow-auto max-h-[400px]" style={{ padding: 12 }}>{selectedBrief.generated_content}</pre>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-2xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.04)]" style={{ padding: 16 }}>
        <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-red-400 mb-2">Danger Zone</p>
        <p className="text-[13px] text-nw-400 mb-3">Deindexing removes this page from the sitemap and marks it as deindexed. This does not delete the page data.</p>
        {!confirmDeindex ? (
          <Button variant="danger" size="sm" onClick={() => setConfirmDeindex(true)}>
            <Trash2 size={13} /> Deindex Page
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" onClick={deindexPage} loading={deindexing}>
              Confirm Deindex
            </Button>
            <Button variant="default" size="sm" onClick={() => setConfirmDeindex(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function MetricTile({ label, value, delta, suffix = '%', invert }: {
  label: string; value: string; delta?: number | null; suffix?: string; invert?: boolean
}) {
  return (
    <div
      className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 shadow-gold-sm transition-[box-shadow] duration-150 hover:shadow-gold-md"
      style={{ padding: 14 }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="font-brand text-xl font-bold text-white">{value}</p>
        {delta != null && delta !== 0 && <DeltaPill value={delta} invert={invert} suffix={suffix} />}
      </div>
    </div>
  )
}

function HealthChecks({ health }: { health: HealthData }) {
  const checks = [
    { label: 'Indexed', pass: health.is_indexed === true, detail: health.is_indexed ? 'Page is indexed' : 'Not yet indexed', icon: Globe },
    { label: 'HTTP Status', pass: health.http_status === 200, detail: health.http_status ? `Status ${health.http_status}` : 'Unknown', icon: Shield },
    { label: 'Schema', pass: health.schema_valid === true, detail: health.schema_types?.join(', ') || 'No schema', icon: FileText },
    { label: 'LCP', pass: health.lcp_ms != null && health.lcp_ms <= 2500, detail: health.lcp_ms != null ? `${(health.lcp_ms / 1000).toFixed(1)}s` : '—', icon: Zap },
    { label: 'CLS', pass: health.cls != null && Number(health.cls) <= 0.1, detail: health.cls != null ? Number(health.cls).toFixed(3) : '—', icon: Layers },
    { label: 'Internal Links', pass: (health.inbound_links ?? 0) >= 2, detail: `${health.inbound_links ?? 0} in / ${health.outbound_links ?? 0} out`, icon: Link2 },
  ]

  const passing = checks.filter(c => c.pass).length

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">Health Checks</p>
        <Badge variant={passing === checks.length ? 'done' : 'amber'}>
          {passing}/{checks.length} passing
        </Badge>
      </div>
      <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 overflow-hidden">
        {checks.map((c, i) => (
          <div
            key={c.label}
            className={`flex items-center gap-3 ${i < checks.length - 1 ? 'border-b border-[rgba(255,255,255,0.06)]' : ''}`}
            style={{ padding: '10px 16px' }}
          >
            <div className={`flex-shrink-0 ${c.pass ? 'text-[#4ade80]' : 'text-[#f59e0b]'}`}>
              <c.icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-nw-200">{c.label}</p>
            </div>
            <span className="text-[11px] text-nw-400">{c.detail}</span>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.pass ? 'bg-[#4ade80]' : 'bg-[#f59e0b]'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}
