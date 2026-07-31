'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Search, RefreshCw, ChevronDown, ChevronRight,
  Zap, Wrench, AlertTriangle, Sparkles, Bug,
  Palette, Shield, Gauge, Trash2, Package,
  FileCode2, Clock, GitCommit,
} from 'lucide-react'

interface Entry {
  id: string
  project: 'nwhub' | 'website'
  title: string
  description: string | null
  reason: string | null
  category: string
  level: 'info' | 'improvement' | 'fix' | 'breaking'
  files_changed: number
  commit_hash: string | null
  created_at: string
}

const LEVEL_CONFIG = {
  info:        { label: 'INFO',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  improvement: { label: 'IMPROVEMENT', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)'  },
  fix:         { label: 'FIX',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  breaking:    { label: 'BREAKING',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)'  },
} as const

const CATEGORY_ICONS: Record<string, typeof Zap> = {
  feature: Sparkles,
  design: Palette,
  fix: Bug,
  performance: Gauge,
  cleanup: Trash2,
  accessibility: Shield,
  architecture: Package,
  security: Shield,
}

export function ChangelogClient() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'nwhub' | 'website'>('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (tab !== 'all') params.set('project', tab)
    if (levelFilter !== 'all') params.set('level', levelFilter)
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    if (search) params.set('search', search)

    const res = await fetch(`/api/changelog?${params}`)
    if (res.ok) setEntries(await res.json())
    setLoading(false)
  }, [tab, levelFilter, categoryFilter, search])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const stats = useMemo(() => ({
    total: entries.length,
    info: entries.filter(e => e.level === 'info').length,
    improvement: entries.filter(e => e.level === 'improvement').length,
    fix: entries.filter(e => e.level === 'fix').length,
    breaking: entries.filter(e => e.level === 'breaking').length,
  }), [entries])

  const categories = useMemo(() => {
    const cats = new Set(entries.map(e => e.category))
    return Array.from(cats).sort()
  }, [entries])

  const TABS = [
    { key: 'all' as const, label: 'All Changes' },
    { key: 'nwhub' as const, label: 'NWHub' },
    { key: 'website' as const, label: 'Website' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[rgba(255,255,255,0.06)]">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-gold-400 text-gold-300'
                : 'border-transparent text-nw-400 hover:text-nw-200'
            }`}
            style={{ padding: '10px 16px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nw-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by source, message, or error..."
            className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-sm text-nw-200 placeholder-nw-600 focus:border-[rgba(150,119,5,0.3)] focus:outline-none transition-all"
            style={{ padding: '10px 14px 10px 36px' }}
          />
        </div>

        {/* Level filter */}
        <div className="relative">
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="appearance-none rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-sm text-nw-300 cursor-pointer focus:border-[rgba(150,119,5,0.3)] focus:outline-none"
            style={{ padding: '10px 32px 10px 14px' }}
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="improvement">Improvement</option>
            <option value="fix">Fix</option>
            <option value="breaking">Breaking</option>
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-nw-500 pointer-events-none" />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="appearance-none rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-sm text-nw-300 cursor-pointer focus:border-[rgba(150,119,5,0.3)] focus:outline-none"
            style={{ padding: '10px 32px 10px 14px' }}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-nw-500 pointer-events-none" />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchEntries}
          className="flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-sm text-nw-400 hover:text-nw-200 transition-colors"
          style={{ padding: '10px 14px' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: '#f0f2f5' },
          { label: 'Improvements', value: stats.improvement, color: '#22c55e' },
          { label: 'Fixes', value: stats.fix, color: '#f59e0b' },
          { label: 'Breaking', value: stats.breaking, color: '#ef4444' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl border border-[rgba(255,255,255,0.06)]"
            style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.015)' }}
          >
            <div className="text-2xl font-bold font-brand" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[1.2px] text-nw-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Entries list */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-nw-500" style={{ padding: '48px 24px' }}>
            <RefreshCw size={14} className="animate-spin" />
            Loading changelog...
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-nw-500" style={{ padding: '48px 24px' }}>
            <FileCode2 size={24} className="text-nw-600" />
            No entries found
          </div>
        ) : (
          entries.map((entry, i) => {
            const isExpanded = expanded.has(entry.id)
            const levelCfg = LEVEL_CONFIG[entry.level]
            const CatIcon = CATEGORY_ICONS[entry.category] ?? Zap

            return (
              <div
                key={entry.id}
                style={{ borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
              >
                {/* Row */}
                <div
                  className="flex items-center gap-4 cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                  style={{ padding: '14px 20px' }}
                  onClick={() => toggle(entry.id)}
                >
                  {/* Expand arrow */}
                  <span className="text-nw-600 flex-shrink-0">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>

                  {/* Level badge */}
                  <span
                    className="flex-shrink-0 text-[10px] font-bold tracking-wider rounded-md"
                    style={{
                      padding: '3px 8px',
                      background: levelCfg.bg,
                      color: levelCfg.color,
                      border: `1px solid ${levelCfg.border}`,
                    }}
                  >
                    {levelCfg.label}
                  </span>

                  {/* Category */}
                  <span className="flex items-center gap-1.5 text-xs text-nw-500 flex-shrink-0" style={{ minWidth: 90 }}>
                    <CatIcon size={12} />
                    <span className="capitalize">{entry.category}</span>
                  </span>

                  {/* Title */}
                  <span className="flex-1 text-[13px] font-medium text-nw-200 truncate">
                    {entry.title}
                  </span>

                  {/* Project pill */}
                  <span
                    className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider rounded-md"
                    style={{
                      padding: '2px 7px',
                      background: entry.project === 'nwhub' ? 'rgba(201,167,10,0.1)' : 'rgba(59,130,246,0.1)',
                      color: entry.project === 'nwhub' ? '#c9a70a' : '#3b82f6',
                      border: `1px solid ${entry.project === 'nwhub' ? 'rgba(201,167,10,0.2)' : 'rgba(59,130,246,0.2)'}`,
                    }}
                  >
                    {entry.project}
                  </span>

                  {/* Files changed */}
                  {entry.files_changed > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-nw-500 flex-shrink-0">
                      <FileCode2 size={11} />
                      {entry.files_changed}
                    </span>
                  )}

                  {/* Timestamp */}
                  <span className="flex items-center gap-1 text-[11px] text-nw-600 flex-shrink-0 tabular-nums">
                    <Clock size={10} />
                    {format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm')}
                  </span>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div
                    className="border-t border-[rgba(255,255,255,0.04)]"
                    style={{ padding: '16px 20px 16px 52px', background: 'rgba(255,255,255,0.01)' }}
                  >
                    <div className="flex flex-col gap-3">
                      {entry.description && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-nw-500 mb-1">What Changed</p>
                          <p className="text-[13px] text-nw-300 leading-relaxed whitespace-pre-wrap">{entry.description}</p>
                        </div>
                      )}
                      {entry.reason && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-nw-500 mb-1">Why &amp; Improvement</p>
                          <p className="text-[13px] text-nw-300 leading-relaxed whitespace-pre-wrap">{entry.reason}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-nw-500">
                        {entry.files_changed > 0 && (
                          <span className="flex items-center gap-1">
                            <FileCode2 size={11} /> {entry.files_changed} file{entry.files_changed !== 1 ? 's' : ''} changed
                          </span>
                        )}
                        {entry.commit_hash && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <GitCommit size={11} /> {entry.commit_hash.slice(0, 7)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
