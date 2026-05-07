'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RefreshCw, Search, AlertTriangle, TrendingUp, TrendingDown, ExternalLink, Zap, Settings, Plus, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────────────────────

interface HeroStats {
  impressions_28d: number
  impressions_28d_delta_pct: number
  clicks_28d: number
  trials_28d: number
  sparkline: number[]
}

interface KPIs {
  pages_live: number
  indexed_count: number
  indexed_rate: number
  avg_position: number
  avg_position_delta: number
}

interface TemplateRow {
  id: string
  slug: string
  name: string
  url_pattern: string
  status: string
  pages_count: number
  indexed_count: number
  queued_count: number
  impressions_28d: number
  clicks_28d: number
  trials_28d: number
  progress_pct: number
}

interface AttentionItem {
  type: 'unindexed' | 'quality' | 'core_web_vitals'
  severity: 'warn' | 'info'
  title: string
  message: string
  page_ids: string[]
}

interface TopPage {
  page_id: string
  url_path: string
  title: string
  template_slug: string
  impressions_28d: number
  position_avg: number | null
}

interface PipelineRun {
  id: string
  status: string
  current_step: string
  cells_planned: number
  cells_generated: number
  started_at: string
  finished_at: string | null
}

interface SeoOverviewData {
  hero: HeroStats
  kpis: KPIs
  templates: TemplateRow[]
  attention: AttentionItem[]
  top_pages: TopPage[]
  current_run: PipelineRun | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => Intl.NumberFormat('en-GB').format(n)

function Sparkline({ data, width = 120, height = 32 }: { data: number[]; width?: number; height?: number }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline points={points} fill="none" stroke="#c9a70a" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function DeltaPill({ value, invert }: { value: number; invert?: boolean }) {
  const positive = invert ? value < 0 : value > 0
  const icon = positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />
  return (
    <span className={`inline-flex items-center gap-1 rounded-md text-[10px] font-bold ${positive ? 'text-[#4ade80]' : 'text-red-400'}`} style={{ padding: '2px 6px' }}>
      {icon} {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

function positionColor(pos: number | null): 'done' | 'gold' | 'danger' | 'default' {
  if (pos == null) return 'default'
  if (pos <= 10) return 'done'
  if (pos <= 20) return 'gold'
  return 'danger'
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ h = 100 }: { h?: number }) {
  return (
    <div
      className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 animate-pulse"
      style={{ padding: 20, minHeight: h }}
    />
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SeoEnginePage() {
  const [data, setData] = useState<SeoOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [editTemplate, setEditTemplate] = useState<TemplateRow | null>(null)
  const [templateForm, setTemplateForm] = useState({ name: '', slug: '', url_pattern: '', status: 'draft', master_prompt: '' })
  const [saving, setSaving] = useState(false)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [genResult, setGenResult] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/seo/overview')
      if (!res.ok) { setError(`API error (${res.status})`); return }
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function syncAll() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/seo/sync/all', { method: 'POST' })
      const result = await res.json()
      const details = (result.results ?? []).map((r: { name: string; status: string; error?: string; rows_written?: number }) =>
        `${r.name}: ${r.status}${r.rows_written ? ` (${r.rows_written} rows)` : ''}${r.error ? ` — ${r.error}` : ''}`
      ).join('\n')
      setSyncResult(`${result.succeeded ?? 0} succeeded, ${result.skipped ?? 0} skipped, ${result.failed ?? 0} failed\n${details}`)
      // Refresh data without clearing the sync result
      const overviewRes = await fetch('/api/seo/overview')
      if (overviewRes.ok) setData(await overviewRes.json())
    } catch {
      setSyncResult('Sync failed — check console')
    } finally {
      setSyncing(false)
    }
  }

  function openEditTemplate(t: TemplateRow) {
    setEditTemplate(t)
    setTemplateForm({ name: t.name, slug: t.slug, url_pattern: t.url_pattern, status: t.status, master_prompt: '' })
    // Fetch the full template with master_prompt
    fetch('/api/seo/templates').then(r => r.json()).then((templates) => {
      const full = templates.find((tt: { id: string }) => tt.id === t.id)
      if (full?.master_prompt) setTemplateForm(f => ({ ...f, master_prompt: full.master_prompt ?? '' }))
    })
  }

  async function saveTemplate() {
    if (!editTemplate) return
    setSaving(true)
    await fetch('/api/seo/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editTemplate.id, ...templateForm }),
    })
    setSaving(false)
    setEditTemplate(null)
    load()
  }

  async function createTemplate() {
    setSaving(true)
    await fetch('/api/seo/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateForm),
    })
    setSaving(false)
    setShowNewTemplate(false)
    setTemplateForm({ name: '', slug: '', url_pattern: '', status: 'draft', master_prompt: '' })
    load()
  }

  async function generateForTemplate(templateId: string) {
    setGenerating(templateId)
    setGenResult(null)
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId }),
      })
      const result = await res.json()
      setGenResult(`Generated ${result.generated}/${result.total} pages`)
      load()
    } catch {
      setGenResult('Generation failed')
    } finally {
      setGenerating(null)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Platform"
        title="SEO"
        titleGold=" Engine"
        actions={
          !loading ? (
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={load}>
                <RefreshCw size={13} /> Refresh
              </Button>
              <Button variant="gold" size="sm" onClick={syncAll} loading={syncing}>
                Sync Now
              </Button>
              <a href="/api/seo/google/connect">
                <Button variant="default" size="sm">
                  Connect Google
                </Button>
              </a>
            </div>
          ) : undefined
        }
      />

      {error && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <AlertTriangle size={22} className="text-red-400" />
          <p className="text-[13px] text-red-400">{error}</p>
          <Button variant="default" size="sm" onClick={load}><RefreshCw size={12} /> Retry</Button>
        </div>
      )}

      {loading && !error && (
        <div className="flex flex-col gap-4">
          <SkeletonCard h={120} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <SkeletonCard h={200} />
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Hero stat */}
          <div
            className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 shadow-gold-sm"
            style={{ padding: 24 }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">28-Day Impressions</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <p className="font-brand text-[32px] font-bold text-white" style={{ letterSpacing: '-0.5px' }}>
                    {fmt(data.hero.impressions_28d)}
                  </p>
                  <DeltaPill value={data.hero.impressions_28d_delta_pct} />
                </div>
                <div className="flex gap-6 mt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[1.4px] text-nw-500">Clicks</p>
                    <p className="font-brand text-lg font-bold text-nw-200">{fmt(data.hero.clicks_28d)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[1.4px] text-nw-500">Trials</p>
                    <p className="font-brand text-lg font-bold text-nw-200">{fmt(data.hero.trials_28d)}</p>
                  </div>
                </div>
              </div>
              <Sparkline data={data.hero.sparkline} width={160} height={48} />
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard label="Pages Live" value={data.kpis.pages_live} />
            <KpiCard label="Indexed" value={`${data.kpis.indexed_count} / ${data.kpis.pages_live}`} sub={`${Math.round(data.kpis.indexed_rate * 100)}%`} />
            <KpiCard
              label="Avg Position"
              value={data.kpis.avg_position.toFixed(1)}
              delta={data.kpis.avg_position_delta}
              invertDelta
            />
          </div>

          {/* Templates */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-3">Templates</p>
            <div className="flex flex-col gap-3">
              {data.templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onEdit={() => openEditTemplate(t)}
                  onGenerate={() => generateForTemplate(t.id)}
                  isGenerating={generating === t.id}
                />
              ))}
              <button
                onClick={() => { setShowNewTemplate(true); setTemplateForm({ name: '', slug: '', url_pattern: '', status: 'draft', master_prompt: '' }) }}
                className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] bg-transparent flex items-center justify-center gap-2 text-[13px] text-nw-400 hover:text-gold-300 hover:border-[rgba(212,160,23,0.3)] transition-colors"
                style={{ padding: 20, minHeight: 80 }}
              >
                <Plus size={14} /> New Template
              </button>
            </div>
          </div>

          {/* Attention queue */}
          {data.attention.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-3">Needs Attention</p>
              <div className="flex flex-col gap-2">
                {data.attention.map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border bg-nw-750 flex items-start gap-3 ${
                      item.severity === 'warn'
                        ? 'border-[rgba(245,158,11,0.25)]'
                        : 'border-[rgba(59,130,246,0.25)]'
                    }`}
                    style={{ padding: '14px 16px' }}
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${item.severity === 'warn' ? 'text-[#f59e0b]' : 'text-[#60a5fa]'}`}>
                      {item.type === 'unindexed' ? <Search size={15} /> :
                       item.type === 'core_web_vitals' ? <Zap size={15} /> :
                       <AlertTriangle size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white">{item.title}</p>
                      <p className="text-[11px] text-nw-400 mt-0.5">{item.message}</p>
                    </div>
                    <Badge variant={item.severity === 'warn' ? 'amber' : 'default'}>
                      {item.page_ids.length} page{item.page_ids.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Pages */}
          {data.top_pages.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-3">Top Pages</p>
              <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 overflow-hidden">
                {data.top_pages.map((p, i) => (
                  <Link
                    key={p.page_id}
                    href={`/seo/page/${encodeURIComponent(p.url_path)}`}
                    className={`flex items-center gap-3 transition-colors hover:bg-[rgba(255,255,255,0.03)] ${
                      i < data.top_pages.length - 1 ? 'border-b border-[rgba(255,255,255,0.06)]' : ''
                    }`}
                    style={{ padding: '12px 16px' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-nw-200 truncate">{p.title}</p>
                      <p className="text-[11px] text-nw-500 truncate">{p.url_path}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] text-nw-400">{fmt(p.impressions_28d)} imp</span>
                      {p.position_avg != null && (
                        <Badge variant={positionColor(p.position_avg)}>
                          {p.position_avg.toFixed(1)}
                        </Badge>
                      )}
                      <ExternalLink size={12} className="text-nw-500" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Generation result */}
          {genResult && (
            <div className="rounded-xl border border-[rgba(212,160,23,0.25)] bg-[rgba(212,160,23,0.08)] text-[13px] text-gold-300" style={{ padding: '10px 16px' }}>
              {genResult}
            </div>
          )}

          {/* Sync result toast */}
          {syncResult && (
            <div
              className="rounded-xl border border-[rgba(212,160,23,0.25)] bg-[rgba(212,160,23,0.08)] text-[13px] text-gold-300 whitespace-pre-line"
              style={{ padding: '12px 16px' }}
            >
              {syncResult}
            </div>
          )}

          {/* Pipeline run */}
          <div
            className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750"
            style={{ padding: '14px 16px' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500 mb-2">Pipeline</p>
            {data.current_run ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-nw-200">
                    Run {data.current_run.status === 'succeeded' ? 'completed' : data.current_run.status}
                  </p>
                  <p className="text-[11px] text-nw-400 mt-0.5">
                    {data.current_run.cells_generated}/{data.current_run.cells_planned} pages generated
                    {data.current_run.finished_at && (
                      <> · {timeAgo(data.current_run.finished_at)}</>
                    )}
                  </p>
                </div>
                <Badge variant={data.current_run.status === 'succeeded' ? 'done' : data.current_run.status === 'running' ? 'gold' : 'default'}>
                  {data.current_run.status}
                </Badge>
              </div>
            ) : (
              <p className="text-[13px] text-nw-400">No pipeline runs yet</p>
            )}
          </div>
        </>
      )}

      {/* Template editor modal */}
      {(editTemplate || showNewTemplate) && (
        <Modal
          open={true}
          onClose={() => { setEditTemplate(null); setShowNewTemplate(false) }}
          title={editTemplate ? `Edit: ${editTemplate.name}` : 'New Template'}
          width="lg"
        >
          <div className="flex flex-col gap-3" style={{ padding: 0 }}>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Name</label>
              <input value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none focus:border-[rgba(212,160,23,0.4)]"
                style={{ padding: '8px 12px' }} placeholder="Kids Classes by Town" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Slug</label>
                <input value={templateForm.slug} onChange={e => setTemplateForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none focus:border-[rgba(212,160,23,0.4)]"
                  style={{ padding: '8px 12px' }} placeholder="kids-by-town" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">URL Pattern</label>
                <input value={templateForm.url_pattern} onChange={e => setTemplateForm(f => ({ ...f, url_pattern: e.target.value }))}
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none focus:border-[rgba(212,160,23,0.4)]"
                  style={{ padding: '8px 12px' }} placeholder="/kids-classes/[town]" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Status</label>
              <select value={templateForm.status} onChange={e => setTemplateForm(f => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none"
                style={{ padding: '8px 12px' }}>
                <option value="draft">Draft</option>
                <option value="live">Live</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Master Prompt</label>
              <textarea value={templateForm.master_prompt} onChange={e => setTemplateForm(f => ({ ...f, master_prompt: e.target.value }))}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none focus:border-[rgba(212,160,23,0.4)] min-h-[160px]"
                style={{ padding: '8px 12px' }}
                placeholder="Generate a landing page for {{data.town}}. Use {{town}} in the URL..." />
              <p className="text-[10px] text-nw-500 mt-1">Use {'{{variable}}'} for page variables and {'{{data.field}}'} for data row fields</p>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="default" size="sm" onClick={() => { setEditTemplate(null); setShowNewTemplate(false) }}>Cancel</Button>
              <Button variant="gold" size="sm" onClick={editTemplate ? saveTemplate : createTemplate} loading={saving}>
                {editTemplate ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, delta, invertDelta }: {
  label: string; value: string | number; sub?: string; delta?: number; invertDelta?: boolean
}) {
  return (
    <div
      className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 shadow-gold-sm transition-[box-shadow] duration-150 hover:shadow-gold-md"
      style={{ padding: 18 }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="font-brand text-2xl font-bold text-white">{value}</p>
        {sub && <span className="text-[11px] text-nw-400">{sub}</span>}
        {delta != null && delta !== 0 && <DeltaPill value={Math.round(delta * -10) / 10} invert={invertDelta} />}
      </div>
    </div>
  )
}

const TEMPLATE_COLORS: Record<string, string> = {
  'kids-by-town': 'linear-gradient(180deg, #ff6b2b, #e8c96a)',
  'discipline-by-town': 'linear-gradient(180deg, #60a5fa, #818cf8)',
  'goals-by-town': 'linear-gradient(180deg, #4ade80, #22d3ee)',
}

function TemplateCard({ template: t, onEdit, onGenerate, isGenerating }: { template: TemplateRow; onEdit: () => void; onGenerate: () => void; isGenerating: boolean }) {
  const accent = TEMPLATE_COLORS[t.slug] ?? 'linear-gradient(180deg, #c9a70a, #967705)'
  return (
    <div
      className="relative rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 overflow-hidden"
      style={{ padding: '16px 16px 16px 20px' }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent }} />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-white">{t.name}</p>
            <Badge variant={t.status === 'live' ? 'active' : t.status === 'paused' ? 'paused' : 'draft'}>
              {t.status}
            </Badge>
          </div>
          <p className="text-[11px] text-nw-500 mt-0.5">{t.url_pattern}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={onGenerate} disabled={isGenerating}
            className="rounded-lg border border-[rgba(212,160,23,0.3)] text-gold-300 text-[10px] font-bold uppercase tracking-[0.6px] hover:bg-[rgba(212,160,23,0.1)] transition-colors disabled:opacity-40"
            style={{ padding: '5px 10px', minHeight: 32 }} title="Generate content for all pages">
            {isGenerating ? '...' : <><Sparkles size={11} /> Generate</>}
          </button>
          <button onClick={onEdit}
            className="rounded-lg border border-[rgba(255,255,255,0.09)] text-nw-400 text-[10px] font-bold uppercase tracking-[0.6px] hover:text-nw-200 transition-colors"
            style={{ padding: '5px 10px', minHeight: 32 }} title="Edit template">
            <Settings size={11} />
          </button>
        </div>
      </div>

      {/* Mini stats grid */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        <MiniStat label="Pages" value={t.pages_count} />
        <MiniStat label="Impressions" value={fmt(t.impressions_28d)} />
        <MiniStat label="Clicks" value={fmt(t.clicks_28d)} />
        <MiniStat label="Trials" value={t.trials_28d} />
      </div>

      {/* Progress bar */}
      {t.pages_count > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-nw-500 mb-1">
            <span>Indexed</span>
            <span>{t.indexed_count}/{t.pages_count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-nw-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(t.progress_pct * 100)}%`,
                background: accent,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">{label}</p>
      <p className="font-brand text-[15px] font-bold text-nw-200 mt-0.5">{value}</p>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
