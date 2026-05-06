'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DollarSign, RefreshCw, FileText, Download, AlertTriangle, Paperclip } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface InvoiceRow {
  invoiceId: string
  type: 'ACCPAY' | 'ACCREC'
  contact: string
  invoiceNumber: string
  date: string | null
  dueDate: string | null
  status: string
  total: number
  amountDue: number
  amountPaid: number
  hasAttachments: boolean
  isOverdue: boolean
  hasUnreconciledPayment: boolean
}

interface InvoiceVaultData {
  invoices: InvoiceRow[]
  stats: {
    unpaidCount: number
    overdueCount: number
    unreconciledCount: number
    monthSpend: number
  }
}

type FilterTab = 'all' | 'unpaid' | 'paid' | 'overdue'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Not Connected ────────────────────────────────────────────────────────────

function NotConnected() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)]">
        <FileText size={28} className="text-gold-400" />
      </div>
      <h3 className="font-brand text-xl font-bold text-nw-100">Connect Xero to get started</h3>
      <p className="text-[13px] text-nw-500 text-center max-w-[320px]">
        Connect your Xero account to view invoices and track reconciliation
      </p>
      <a href="/api/xero/connect">
        <Button variant="gold" size="md">Connect Xero</Button>
      </a>
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, danger }: { label: string; value: string | number; sub: string; danger?: boolean }) {
  return (
    <div
      className="relative cursor-default overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.13)] bg-nw-750 shadow-gold-sm transition-[background,border-color,box-shadow] duration-[180ms] hover:border-[rgba(212,160,23,0.22)] hover:bg-nw-700 hover:shadow-gold-md"
      style={{ padding: 18 }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">{label}</p>
      <p className={`mt-1.5 font-brand text-2xl font-bold ${danger ? 'text-red-400' : 'text-nw-100'}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-nw-500">{sub}</p>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 min-h-[100px]" style={{ padding: 20 }}>
      <div className="h-3 w-24 rounded bg-nw-700 mb-4 animate-pulse" />
      <div className="h-8 w-20 rounded bg-nw-700 mb-2 animate-pulse" />
      <div className="h-2 w-32 rounded bg-nw-700 animate-pulse" />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InvoiceVaultPage() {
  const [data, setData] = useState<InvoiceVaultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [downloading, setDownloading] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch('/api/xero/invoices')
      if (res.status === 401) { setNotConnected(true); setLoading(false); return }
      const text = await res.text()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let json: any = {}
      try { if (text) json = JSON.parse(text) } catch { /* ignore */ }
      if (!res.ok) { setApiError(json?.message ?? `Xero API error (${res.status})`); setLoading(false); return }
      setData(json)
      setLastSynced(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to load invoice data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function downloadPdf(invoiceId: string) {
    setDownloading(invoiceId)
    try {
      const res = await fetch(`/api/xero/invoices/pdf?id=${invoiceId}`)
      if (!res.ok) throw new Error('PDF download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download error:', err)
    } finally {
      setDownloading(null)
    }
  }

  const filtered = data?.invoices.filter((inv) => {
    if (filter === 'unpaid') return inv.status === 'AUTHORISED' && inv.amountDue > 0
    if (filter === 'paid') return inv.status === 'PAID'
    if (filter === 'overdue') return inv.isOverdue
    return true
  }) ?? []

  const TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: data?.invoices.length },
    { key: 'unpaid', label: 'Unpaid', count: data?.stats.unpaidCount },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue', count: data?.stats.overdueCount },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Finance"
        title="Invoice Vault"
        description={
          notConnected
            ? 'Connect Xero to view your invoices'
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
            <AlertTriangle size={22} className="text-red-400" strokeWidth={1.75} />
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
          <div className="rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 min-h-[320px]" style={{ padding: 20 }}>
            <div className="h-4 w-40 rounded bg-nw-700 mb-6 animate-pulse" />
            <div className="w-full h-[280px] rounded bg-nw-700 animate-pulse" />
          </div>
        </>
      )}

      {!loading && !notConnected && !apiError && data && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Unpaid Invoices" value={data.stats.unpaidCount} sub="Awaiting payment" />
            <StatCard label="Overdue" value={data.stats.overdueCount} sub="Past due date" danger={data.stats.overdueCount > 0} />
            <StatCard label="Unreconciled" value={data.stats.unreconciledCount} sub="Payments to reconcile" danger={data.stats.unreconciledCount > 0} />
            <StatCard label="Month Spend" value={formatCurrency(data.stats.monthSpend)} sub="Bills paid this month" />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1.5" style={{ marginTop: 4 }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-lg border text-[11px] font-bold uppercase tracking-[0.8px] transition-colors ${
                  filter === tab.key
                    ? 'border-[rgba(212,160,23,0.35)] bg-[rgba(212,160,23,0.12)] text-gold-300'
                    : 'border-[rgba(255,255,255,0.09)] bg-transparent text-nw-400 hover:text-nw-200 hover:border-[rgba(255,255,255,0.15)]'
                }`}
                style={{ padding: '6px 12px' }}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-70">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Invoice Table */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {['Type', 'Contact', 'Invoice #', 'Date', 'Due Date', 'Amount', 'Status', ''].map((h) => (
                      <th key={h} className="border-b border-[rgba(255,255,255,0.07)] text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 16px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-[13px] text-nw-500" style={{ padding: '48px 16px' }}>
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inv) => (
                      <tr key={inv.invoiceId} className="transition-colors hover:bg-[rgba(255,255,255,0.03)]">
                        <td className="border-b border-[rgba(255,255,255,0.05)] text-nw-400" style={{ padding: '12px 16px' }}>
                          <Badge variant={inv.type === 'ACCREC' ? 'green' : 'amber'}>
                            {inv.type === 'ACCREC' ? 'Invoice' : 'Bill'}
                          </Badge>
                        </td>
                        <td className="border-b border-[rgba(255,255,255,0.05)] text-nw-200 font-medium" style={{ padding: '12px 16px' }}>
                          {inv.contact}
                        </td>
                        <td className="border-b border-[rgba(255,255,255,0.05)] text-nw-400" style={{ padding: '12px 16px' }}>
                          <span className="flex items-center gap-1.5">
                            {inv.invoiceNumber}
                            {inv.hasAttachments && <Paperclip size={12} className="text-nw-500" />}
                          </span>
                        </td>
                        <td className="border-b border-[rgba(255,255,255,0.05)] text-xs font-medium text-nw-400" style={{ padding: '12px 16px' }}>
                          {formatDate(inv.date)}
                        </td>
                        <td className="border-b border-[rgba(255,255,255,0.05)] text-xs font-medium text-nw-400" style={{ padding: '12px 16px' }}>
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="border-b border-[rgba(255,255,255,0.05)] text-right font-medium text-nw-200" style={{ padding: '12px 16px' }}>
                          {formatCurrency(inv.total)}
                          {inv.amountDue > 0 && inv.amountDue < inv.total && (
                            <span className="block text-[10px] text-nw-500">
                              {formatCurrency(inv.amountDue)} due
                            </span>
                          )}
                        </td>
                        <td className="border-b border-[rgba(255,255,255,0.05)]" style={{ padding: '12px 16px' }}>
                          <div className="flex flex-col gap-1">
                            {inv.status === 'PAID' ? (
                              <Badge variant="done">Paid</Badge>
                            ) : inv.isOverdue ? (
                              <Badge variant="danger">Overdue</Badge>
                            ) : (
                              <Badge variant="amber">Unpaid</Badge>
                            )}
                            {inv.hasUnreconciledPayment && (
                              <Badge variant="danger">Unreconciled</Badge>
                            )}
                          </div>
                        </td>
                        <td className="border-b border-[rgba(255,255,255,0.05)]" style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => downloadPdf(inv.invoiceId)}
                            disabled={downloading === inv.invoiceId}
                            className="flex items-center gap-1 rounded-lg border border-[rgba(255,255,255,0.09)] bg-transparent text-[11px] font-bold uppercase tracking-[0.6px] text-nw-400 transition-colors hover:text-nw-200 hover:border-[rgba(255,255,255,0.18)] disabled:opacity-40"
                            style={{ padding: '5px 10px' }}
                            title="Download PDF"
                          >
                            <Download size={12} />
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
