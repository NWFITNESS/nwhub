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
  AlertTriangle, Sparkles, History, Trash2, MoreVertical, ClipboardCopy,
  Search, BarChart3, Pause, X, RotateCcw,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart,
} from 'recharts'
import { PageEditorModal } from '@/components/seo/editor/PageEditorModal'

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
  generated_content?: string | Record<string, unknown>
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
  const [deindexSlug, setDeindexSlug] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [querySheet, setQuerySheet] = useState<QueryRow | null>(null)
  const [recheckingHealth, setRecheckingHealth] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

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

  async function recheckHealth() {
    if (!data?.page?.id) return
    setRecheckingHealth(true)
    try {
      await fetch('/api/seo/sync/health/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: data.page.id }),
      })
      load()
    } catch { /* ignore */ }
    finally { setRecheckingHealth(false) }
  }

  async function restoreVersion(version: number) {
    if (!data?.page?.id) return
    await fetch('/api/seo/briefs/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: data.page.id, from_version: version }),
    })
    setBriefHistory(null)
    setSelectedBrief(null)
    load()
  }

  async function deleteVersion(version: number) {
    if (!data?.page?.id) return
    await fetch('/api/seo/briefs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: data.page.id, version }),
    })
    setBriefHistory(null)
    load()
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
          <h1 className="font-brand text-[28px] font-bold text-white flex-1" style={{ letterSpacing: '0.3px' }}>{page.title}</h1>
          <button
            onClick={() => setShowMenu(true)}
            className="flex-shrink-0 rounded-lg border border-[rgba(255,255,255,0.09)] text-nw-400 hover:text-nw-200 transition-colors"
            style={{ padding: 8, minHeight: 44, minWidth: 44 }}
            aria-label="Page actions"
          >
            <MoreVertical size={16} />
          </button>
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
              <button
                key={q.query}
                onClick={() => setQuerySheet(q)}
                className={`w-full text-left flex items-center gap-3 transition-colors hover:bg-[rgba(255,255,255,0.03)] ${i < queries.length - 1 ? 'border-b border-[rgba(255,255,255,0.06)]' : ''}`}
                style={{ padding: '10px 16px', minHeight: 44 }}
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
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Health Checks */}
      {health && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">Health Checks</p>
            </div>
            <Button variant="default" size="sm" onClick={recheckHealth} loading={recheckingHealth}>
              <RefreshCw size={11} /> Recheck
            </Button>
          </div>
          <HealthChecksInner health={health} />
        </div>
      )}

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
            sandbox="allow-same-origin allow-scripts"
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
          <Button variant="gold" size="sm" onClick={() => setShowEditor(true)}>
            <FileText size={13} /> Edit Page
          </Button>
          <Button variant="default" size="sm" onClick={regenerate} loading={regenerating}>
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
              <div
                key={b.id}
                className={`flex items-center gap-2 ${i < briefHistory.length - 1 ? 'border-b border-[rgba(255,255,255,0.06)]' : ''}`}
                style={{ padding: '10px 16px' }}
              >
                <button
                  onClick={() => viewBrief(b.id)}
                  className="flex-1 text-left min-w-0"
                  style={{ minHeight: 44 }}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] text-nw-200">Version {b.version}</p>
                    {b.version === page.version && <Badge variant="gold">Current</Badge>}
                    {b.model.startsWith('restored') && <Badge variant="default">Restored</Badge>}
                  </div>
                  <p className="text-[11px] text-nw-500">{b.model} · {new Date(b.generated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </button>
                <div className="flex gap-1 flex-shrink-0">
                  {b.version !== page.version && (
                    <>
                      <button
                        onClick={() => restoreVersion(b.version)}
                        className="rounded-lg border border-[rgba(255,255,255,0.09)] text-nw-400 hover:text-gold-300 transition-colors"
                        style={{ padding: '4px 8px', minHeight: 32 }}
                        title="Restore as new version"
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button
                        onClick={() => deleteVersion(b.version)}
                        className="rounded-lg border border-[rgba(255,255,255,0.09)] text-nw-400 hover:text-red-400 transition-colors"
                        style={{ padding: '4px 8px', minHeight: 32 }}
                        title="Delete version"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
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
        {metrics.clicks > 100 && (
          <div className="rounded-lg border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.06)] text-[12px] text-red-300 mb-3" style={{ padding: '8px 12px' }}>
            This page has had {fmt(metrics.clicks)} clicks in the last {range} — deindexing will lose this traffic.
          </div>
        )}
        {!confirmDeindex ? (
          <Button variant="danger" size="sm" onClick={() => setConfirmDeindex(true)}>
            <Trash2 size={13} /> Deindex Page
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-nw-400">Type the page path to confirm: <span className="text-nw-200 font-mono text-[11px]">{page.url_path}</span></p>
            <input
              value={deindexSlug}
              onChange={e => setDeindexSlug(e.target.value)}
              className="w-full rounded-lg border border-[rgba(248,113,113,0.25)] bg-nw-800 text-[13px] text-white outline-none font-mono"
              style={{ padding: '8px 12px' }}
              placeholder={page.url_path}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={deindexPage}
                loading={deindexing}
                disabled={deindexSlug !== page.url_path}
              >
                Confirm Deindex
              </Button>
              <Button variant="default" size="sm" onClick={() => { setConfirmDeindex(false); setDeindexSlug('') }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Page Editor Modal */}
      {showEditor && (
        <PageEditorModal
          pageId={page.id}
          urlPath={page.url_path}
          title={page.title}
          publicUrl={publicUrl}
          briefContent={(() => {
            const gc = brief?.generated_content
            if (!gc) return null
            if (typeof gc === 'string') { try { return JSON.parse(gc) } catch { return null } }
            return gc as Record<string, unknown>
          })()}
          onClose={() => setShowEditor(false)}
          onSaved={(version) => {
            setShowEditor(false)
            setRegenResult(`Saved as v${version}`)
            load()
          }}
        />
      )}

      {/* Kebab menu overlay */}
      {showMenu && <PageActionsMenu page={page} publicUrl={publicUrl} onClose={() => setShowMenu(false)} onDeindex={() => { setShowMenu(false); setConfirmDeindex(true) }} />}

      {/* Query detail sheet */}
      {querySheet && <QueryDetailSheet query={querySheet} onClose={() => setQuerySheet(null)} />}
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

function HealthChecksInner({ health }: { health: HealthData }) {
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

// ── Page Actions Menu (bottom sheet) ─────────────────────────────────────────

function PageActionsMenu({ page, publicUrl, onClose, onDeindex }: {
  page: PageData; publicUrl: string; onClose: () => void; onDeindex: () => void
}) {
  function copyUrl() {
    navigator.clipboard.writeText(publicUrl)
    onClose()
  }
  function copyMarkdown() {
    navigator.clipboard.writeText(`[${page.title}](${publicUrl})`)
    onClose()
  }
  function openGsc() {
    window.open(`https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Anorthernwarrior.co.uk&page=*${encodeURIComponent(page.url_path)}`, '_blank', 'noopener,noreferrer')
    onClose()
  }
  function openGa4() {
    const propId = '(check GA4 dashboard)'
    window.open(`https://analytics.google.com/analytics/web/#/p${propId}/reports/explorer?params=_u.dateOption%3Dlast28days`, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-nw-750 rounded-t-2xl border-t border-[rgba(255,255,255,0.12)]"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center" style={{ padding: '10px 0 6px' }}>
          <div className="w-9 h-1 rounded-full bg-nw-600" />
        </div>

        <div className="flex flex-col">
          <MenuRow icon={<ClipboardCopy size={16} />} label="Copy URL" onClick={copyUrl} />
          <MenuRow icon={<FileText size={16} />} label="Copy as Markdown link" onClick={copyMarkdown} />
          <div className="h-px bg-[rgba(255,255,255,0.06)] mx-4 my-1" />
          <MenuRow icon={<Search size={16} />} label="View in Search Console" onClick={openGsc} />
          <MenuRow icon={<BarChart3 size={16} />} label="View in GA4" onClick={openGa4} />
          <div className="h-px bg-[rgba(255,255,255,0.06)] mx-4 my-1" />
          <MenuRow icon={<Trash2 size={16} />} label="Deindex page" onClick={onDeindex} danger />
        </div>
      </div>
    </div>
  )
}

function MenuRow({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.04)] ${danger ? 'text-red-400' : 'text-nw-200'}`}
      style={{ padding: '12px 20px', minHeight: 44 }}
    >
      <span className={danger ? 'text-red-400' : 'text-nw-400'}>{icon}</span>
      <span className="text-[14px]">{label}</span>
    </button>
  )
}

// ── Query Detail Sheet ───────────────────────────────────────────────────────

function QueryDetailSheet({ query, onClose }: { query: QueryRow; onClose: () => void }) {
  const ctr = query.impressions > 0 ? ((query.clicks / query.impressions) * 100).toFixed(2) : '0.00'

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-nw-750 rounded-t-2xl border-t border-[rgba(255,255,255,0.12)] max-h-[70vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center" style={{ padding: '10px 0 6px' }}>
          <div className="w-9 h-1 rounded-full bg-nw-600" />
        </div>

        <div style={{ padding: '0 20px 16px' }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-brand text-lg font-bold text-white flex-1" style={{ letterSpacing: '0.3px' }}>
              &ldquo;{query.query}&rdquo;
            </h3>
            <button onClick={onClose} className="text-nw-500 hover:text-nw-200" style={{ padding: 4 }} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-nw-800" style={{ padding: 12 }}>
              <p className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">Impressions</p>
              <p className="font-brand text-xl font-bold text-white mt-0.5">{Intl.NumberFormat('en-GB').format(query.impressions)}</p>
            </div>
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-nw-800" style={{ padding: 12 }}>
              <p className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">Clicks</p>
              <p className="font-brand text-xl font-bold text-white mt-0.5">{query.clicks}</p>
            </div>
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-nw-800" style={{ padding: 12 }}>
              <p className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">CTR</p>
              <p className="font-brand text-xl font-bold text-white mt-0.5">{ctr}%</p>
            </div>
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-nw-800" style={{ padding: 12 }}>
              <p className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">Avg Position</p>
              <p className="font-brand text-xl font-bold text-white mt-0.5">{query.position?.toFixed(1) ?? '—'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                window.open(`https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Anorthernwarrior.co.uk&query=*${encodeURIComponent(query.query)}`, '_blank')
                onClose()
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.09)] bg-nw-800 text-[12px] font-bold text-nw-200 transition-colors hover:border-[rgba(212,160,23,0.3)]"
              style={{ padding: '10px 12px', minHeight: 44 }}
            >
              <Search size={13} /> View in GSC
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
