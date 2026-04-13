'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { DollarSign, Receipt, RefreshCw } from 'lucide-react'
import { FinancialsWidgetGrid, type FinancialsData } from '@/components/widgets/FinancialsWidgetGrid'

function NotConnected() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)]">
        <DollarSign size={28} className="text-gold-400" />
      </div>
      <h3 className="font-brand text-xl font-bold text-nw-100">Connect Xero to get started</h3>
      <p className="text-[13px] text-nw-500 text-center max-w-[320px]">
        Connect your Xero account to see revenue, expenses, and financial insights
      </p>
      <a href="/api/xero/connect">
        <Button variant="gold" size="md">Connect Xero</Button>
      </a>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 p-6 min-h-[100px]">
      <div className="h-3 w-24 rounded bg-nw-700 mb-4 animate-pulse" />
      <div className="h-8 w-20 rounded bg-nw-700 mb-2 animate-pulse" />
      <div className="h-2 w-32 rounded bg-nw-700 animate-pulse" />
    </div>
  )
}

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
      if (!res.ok) { setApiError(json?.message ?? `Xero API error (${res.status})`); setLoading(false); return }
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
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Platform"
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
            <Button variant="default" size="sm" onClick={load}>
              <RefreshCw size={13} /> Refresh
            </Button>
          ) : undefined
        }
      />

      {notConnected && <NotConnected />}

      {!notConnected && apiError && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
            <Receipt size={22} className="text-red-400" strokeWidth={1.75} />
          </div>
          <p className="text-[13px] font-medium text-red-400">Failed to load Xero data</p>
          <p className="text-xs font-medium text-nw-400 text-center max-w-[360px]">{apiError}</p>
          <Button variant="default" size="sm" onClick={load}>
            <RefreshCw size={12} /> Retry
          </Button>
        </div>
      )}

      {loading && !notConnected && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 p-6 min-h-[320px]">
            <div className="h-4 w-40 rounded bg-nw-700 mb-6 animate-pulse" />
            <div className="w-full h-[280px] rounded bg-nw-700 animate-pulse" />
          </div>
        </>
      )}

      {!loading && !notConnected && !apiError && data && (
        <FinancialsWidgetGrid data={data} />
      )}
    </div>
  )
}
