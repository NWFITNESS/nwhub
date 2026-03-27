'use client'

import { useState, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { DollarSign, Receipt, RefreshCw } from 'lucide-react'
import { FinancialsWidgetGrid, type FinancialsData } from '@/components/widgets/FinancialsWidgetGrid'

// ─── Not Connected State ──────────────────────────────────────────────────────

function NotConnected() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[#967705]/10 border border-[#967705]/20 flex items-center justify-center">
        <DollarSign size={28} className="text-[#C9A70A]" />
      </div>
      <h3 className="text-xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'Rajdhani' }}>
        Connect Xero to get started
      </h3>
      <p className="text-sm text-white/40 text-center max-w-[320px]">
        Connect your Xero account to see revenue, expenses, and financial insights
      </p>
      <a
        href="/api/xero/connect"
        className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity mt-2"
      >
        Connect Xero
      </a>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl p-6 min-h-[130px]" style={{ background: 'var(--slate-750)', border: '1px solid var(--r-panel-border)' }}>
      <div className="skeleton h-3 w-24 rounded mb-4" />
      <div className="skeleton h-10 w-20 rounded mb-2" />
      <div className="skeleton h-2 w-32 rounded" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinancialsPage() {
  const [data, setData] = useState<FinancialsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<string>('')

  async function load() {
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch('/api/xero/financials')
      if (res.status === 401) { setNotConnected(true); setLoading(false); return }
      const text = await res.text()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let json: any = {}
      try { if (text) json = JSON.parse(text) } catch { /* ignore */ }
      if (!res.ok) {
        setApiError(json?.message ?? `Xero API error (${res.status})`)
        setLoading(false)
        return
      }
      setData(json)
      setLastSynced(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden flex flex-col bg-[#0f0f0f] min-h-[100dvh]">
        <div className="sticky top-0 z-20 flex items-center h-14 bg-[#111] border-b border-[#1e1e1e] px-4 gap-2">
          <span className="flex-1 text-[15px] font-medium text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Financials</span>
          {!notConnected && !loading && (
            <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/50 active:bg-white/[0.06]">
              <RefreshCw size={16} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))] p-3 flex flex-col gap-3">
          {notConnected && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-[14px] text-[#888]">Connect Xero to view financials</p>
              <a href="/api/xero/connect" className="px-5 py-2.5 rounded-xl bg-[#e0c97f] text-[#0d0d0d] text-[13px] font-semibold">
                Connect Xero
              </a>
            </div>
          )}
          {loading && !notConnected && (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#111] rounded-xl p-4 border border-[#1e1e1e] h-24 skeleton" />
              ))}
            </div>
          )}
          {apiError && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-[14px] text-red-400">Failed to load Xero data</p>
              <button onClick={load} className="text-[12px] text-[#e0c97f] mt-2">Retry</button>
            </div>
          )}
          {!loading && !notConnected && !apiError && data && (() => {
            const latest = data.monthly?.[data.monthly.length - 1]
            const fmt = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0 })}`
            const stats = [
              { label: 'Revenue (this month)',  value: latest ? fmt(latest.income)   : '—' },
              { label: 'Expenses (this month)', value: latest ? fmt(latest.expenses) : '—' },
              { label: 'Net Profit',            value: latest ? fmt(latest.profit)   : '—' },
            ]
            return (
              <>
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-[#111] rounded-xl p-4 border border-[#1e1e1e]">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className="text-[26px] font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{stat.value}</p>
                  </div>
                ))}
              </>
            )
          })()}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block">
      <TopBar title="Financials" />

      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">

        {/* ── Page Header ── */}
        <PageHeader
          title="Financials"
          description={
            notConnected
              ? 'Connect Xero to view your financial data'
              : lastSynced
                ? `Connected to Xero — last synced ${lastSynced}`
                : 'Loading Xero data…'
          }
          actions={
            !notConnected && !loading ? (
              <button
                onClick={load}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 7, fontSize: 13,
                  color: 'var(--slate-400)', background: 'var(--r-panel-bg)',
                  border: '1px solid var(--r-panel-border)', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--slate-100)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--slate-400)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--r-panel-bg)' }}
              >
                <RefreshCw size={13} />
                Refresh
              </button>
            ) : undefined
          }
        />

        {/* ── Not Connected ── */}
        {notConnected && <NotConnected />}

        {/* ── API Error ── */}
        {!notConnected && apiError && (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Receipt size={22} className="text-red-400" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-red-400">Failed to load Xero data</p>
            <p className="text-xs text-white/40 text-center max-w-[360px]">{apiError}</p>
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white/60 border border-white/[0.1] bg-white/[0.03] hover:text-white hover:border-white/20 transition-all mt-1"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && !notConnected && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="rounded-xl p-6 min-h-[320px]" style={{ background: 'var(--slate-750)', border: '1px solid var(--r-panel-border)' }}>
              <div className="skeleton h-4 w-40 rounded mb-6" />
              <div className="skeleton w-full h-[280px] rounded" />
            </div>
          </>
        )}

        {/* ── Connected Dashboard ── */}
        {!loading && !notConnected && !apiError && data && (
          <FinancialsWidgetGrid data={data} />
        )}

      </main>
      </div>
    </>
  )
}
