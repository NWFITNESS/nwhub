'use client'

import { useState, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
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
    <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px]">
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
      <TopBar title="Financials" />

      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">
              NORTHERN WARRIOR HUB
            </p>
            <h1 className="text-4xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'Rajdhani' }}>
              Financials
            </h1>
            <p className="text-sm text-white/40 mt-1">
              {notConnected
                ? 'Connect Xero to view your financial data'
                : lastSynced
                  ? `Connected to Xero — last synced ${lastSynced}`
                  : 'Loading Xero data…'}
            </p>
          </div>
          {!notConnected && !loading && (
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 border border-white/[0.1] bg-white/[0.03] hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          )}
        </div>

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
            <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[320px]">
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
    </>
  )
}
