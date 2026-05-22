'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DollarSign, RefreshCw, FileText, Download, AlertTriangle, Paperclip, Mail, Link2, X, Eye, RotateCcw } from 'lucide-react'
import { PageStatCard } from '@/components/ui/PageStatCard'
import { Modal } from '@/components/ui/Modal'

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
  // Extended fields for unified display
  source?: 'xero' | 'email' | 'manual'
  vaultId?: string
  xeroMatchStatus?: string
  pdfStoragePath?: string
}

interface EmailInvoice {
  id: string
  source: string
  supplier: string | null
  invoice_number: string | null
  amount: number | null
  invoice_date: string | null
  due_date: string | null
  pdf_storage_path: string | null
  xero_match_status: string
  xero_invoice_id: string | null
  created_at: string
}

interface InvoiceVaultData {
  invoices: InvoiceRow[]
  stats: {
    unpaidCount: number
    overdueCount: number
    unreconciledCount: number
    monthSpend: number
    unmatchedEmailCount: number
  }
}

interface MatchCandidate {
  xeroInvoiceId: string
  contactName: string
  total: number
  date: string
  score: number
}

type FilterTab = 'all' | 'unpaid' | 'paid' | 'overdue' | 'from-email'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

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
  const [matchModal, setMatchModal] = useState<{ vaultId: string; supplier: string } | null>(null)
  const [matchCandidates, setMatchCandidates] = useState<MatchCandidate[]>([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [monthFilter, setMonthFilter] = useState<string>('all') // 'all' or 'YYYY-MM'
  const [regenerating, setRegenerating] = useState(false)
  const [regenerateResult, setRegenerateResult] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setApiError(null)
    try {
      // Fetch Xero invoices + email vault in parallel
      const [xeroRes, vaultRes] = await Promise.all([
        fetch('/api/xero/invoices'),
        fetch('/api/invoices/vault'),
      ])

      if (xeroRes.status === 401) { setNotConnected(true); setLoading(false); return }

      const xeroText = await xeroRes.text()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let xeroJson: any = {}
      try { if (xeroText) xeroJson = JSON.parse(xeroText) } catch { /* ignore */ }
      if (!xeroRes.ok) { setApiError(xeroJson?.message ?? `Xero API error (${xeroRes.status})`); setLoading(false); return }

      // Add source='xero' to Xero invoices
      const xeroInvoices: InvoiceRow[] = (xeroJson.invoices ?? []).map((inv: InvoiceRow) => ({ ...inv, source: 'xero' as const }))

      // Convert email vault items to InvoiceRow format
      let emailInvoices: InvoiceRow[] = []
      let unmatchedCount = 0
      if (vaultRes.ok) {
        const vaultData = await vaultRes.json()
        unmatchedCount = vaultData.unmatched_count ?? 0
        emailInvoices = (vaultData.items ?? []).map((v: EmailInvoice) => ({
          invoiceId: v.id,
          type: 'ACCPAY' as const,
          contact: v.supplier ?? '—',
          invoiceNumber: v.invoice_number ?? '—',
          date: v.invoice_date,
          dueDate: v.due_date,
          status: 'PAID',
          total: v.amount ?? 0,
          amountDue: 0,
          amountPaid: v.amount ?? 0,
          hasAttachments: !!v.pdf_storage_path,
          isOverdue: false,
          hasUnreconciledPayment: false,
          source: 'email' as const,
          vaultId: v.id,
          xeroMatchStatus: v.xero_match_status,
          pdfStoragePath: v.pdf_storage_path,
        }))
      }

      setData({
        invoices: [...xeroInvoices, ...emailInvoices],
        stats: {
          ...xeroJson.stats,
          unmatchedEmailCount: unmatchedCount,
        },
      })
      setLastSynced(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to load invoice data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function regenerateInvoices() {
    setRegenerating(true)
    setRegenerateResult(null)
    try {
      const res = await fetch('/api/invoices/vault/regenerate', { method: 'POST' })
      if (!res.ok) throw new Error('Regeneration failed')
      const data = await res.json()
      setRegenerateResult(`${data.updated} invoice(s) regenerated${data.failed ? `, ${data.failed} failed` : ''}`)
    } catch (err) {
      setRegenerateResult('Failed to regenerate invoices')
    } finally {
      setRegenerating(false)
    }
  }

  async function openMatchModal(vaultId: string, supplier: string) {
    setMatchModal({ vaultId, supplier })
    setMatchLoading(true)
    try {
      const res = await fetch(`/api/invoices/match?vault_id=${vaultId}`)
      if (res.ok) setMatchCandidates(await res.json())
    } catch { /* ignore */ }
    finally { setMatchLoading(false) }
  }

  async function confirmMatch(vaultId: string, xeroInvoiceId: string) {
    await fetch('/api/invoices/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vault_id: vaultId, xero_invoice_id: xeroInvoiceId }),
    })
    setMatchModal(null)
    load()
  }

  async function previewPdf(invoiceId: string, source?: string, storagePath?: string) {
    setPreviewLoading(true)
    try {
      if (source === 'email' && storagePath) {
        // Fetch content and create blob URL to bypass X-Frame-Options
        const res = await fetch(`/api/invoices/vault/pdf?path=${encodeURIComponent(storagePath)}`)
        if (res.ok) {
          if (storagePath.endsWith('.html')) {
            const html = await res.text()
            const blob = new Blob([html], { type: 'text/html' })
            setPreviewUrl(URL.createObjectURL(blob))
          } else {
            const { url } = await res.json()
            setPreviewUrl(url)
          }
        }
      } else {
        // Xero PDF — fetch as blob and create object URL
        const res = await fetch(`/api/xero/invoices/pdf?id=${invoiceId}`)
        if (res.ok) {
          const blob = await res.blob()
          setPreviewUrl(URL.createObjectURL(blob))
        }
      }
    } catch { /* ignore */ }
    finally { setPreviewLoading(false) }
  }

  async function downloadPdf(invoiceId: string, source?: string, storagePath?: string) {
    setDownloading(invoiceId)
    try {
      let url: string
      if (source === 'email' && storagePath) {
        // Fetch signed URL from Supabase Storage
        const res = await fetch(`/api/invoices/vault/pdf?path=${encodeURIComponent(storagePath)}`)
        if (!res.ok) throw new Error('PDF URL failed')
        const { url: signedUrl } = await res.json()
        url = signedUrl
        window.open(url, '_blank')
        setDownloading(null)
        return
      }
      const res = await fetch(`/api/xero/invoices/pdf?id=${invoiceId}`)
      if (!res.ok) throw new Error('PDF download failed')
      const blob = await res.blob()
      url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // download failed
    } finally {
      setDownloading(null)
    }
  }

  const filtered = data?.invoices.filter((inv) => {
    // Tab filter
    if (filter === 'unpaid') { if (!(inv.status === 'AUTHORISED' && inv.amountDue > 0)) return false }
    else if (filter === 'paid') { if (inv.status !== 'PAID') return false }
    else if (filter === 'overdue') { if (!inv.isOverdue) return false }
    else if (filter === 'from-email') { if (inv.source !== 'email') return false }
    // Month filter
    if (monthFilter !== 'all' && inv.date) {
      const invMonth = inv.date.slice(0, 7) // YYYY-MM
      if (invMonth !== monthFilter) return false
    }
    return true
  }) ?? []

  const emailCount = data?.invoices.filter(i => i.source === 'email').length ?? 0

  // Get available months from invoice dates for the month picker
  const availableMonths = [...new Set(
    (data?.invoices ?? [])
      .filter(i => i.date)
      .map(i => i.date!.slice(0, 7))
  )].sort().reverse()

  const TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: data?.invoices.length },
    { key: 'unpaid', label: 'Unpaid', count: data?.stats.unpaidCount },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue', count: data?.stats.overdueCount },
    { key: 'from-email', label: 'From Email', count: emailCount > 0 ? emailCount : undefined },
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
            <div className="flex items-center gap-2">
              {emailCount > 0 && (
                <Button variant="default" size="sm" onClick={regenerateInvoices} disabled={regenerating}>
                  <RotateCcw size={13} className={regenerating ? 'animate-spin' : ''} />
                  {regenerating ? 'Regenerating…' : 'Regenerate Invoices'}
                </Button>
              )}
              <Button variant="default" size="sm" onClick={load}>
                <RefreshCw size={13} /> Refresh
              </Button>
            </div>
          ) : undefined
        }
      />

      {regenerateResult && (
        <div className="flex items-center justify-between rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.08)]" style={{ padding: '10px 16px' }}>
          <p className="text-[13px] text-green-400 font-medium">{regenerateResult}</p>
          <button onClick={() => setRegenerateResult(null)} className="text-green-400/60 hover:text-green-400">
            <X size={14} />
          </button>
        </div>
      )}

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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <PageStatCard label="Unpaid Invoices" value={data.stats.unpaidCount} sub="Awaiting payment" color="#f59e0b" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="1" width="10" height="14" rx="1.5"/><path d="M6 5h4M6 8h4M6 11h2" strokeLinecap="round"/></svg>} />
            <PageStatCard label="Overdue" value={data.stats.overdueCount} sub="Past due date" alert={data.stats.overdueCount > 0} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 1l7 13H1L8 1z"/><path d="M8 6v3M8 11.5v.5" strokeLinecap="round"/></svg>} />
            <PageStatCard label="Unreconciled" value={data.stats.unreconciledCount} sub="Payments to reconcile" alert={data.stats.unreconciledCount > 0} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2" strokeLinecap="round"/></svg>} />
            <PageStatCard label="Unmatched" value={data.stats.unmatchedEmailCount} sub="Email invoices to match" alert={data.stats.unmatchedEmailCount > 0} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 1v6M5 4l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="9" width="14" height="6" rx="2"/></svg>} />
            <PageStatCard label="Month Spend" value={formatCurrency(data.stats.monthSpend)} sub="Bills paid this month" gold icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="1" width="14" height="14" rx="2"/></svg>} />
          </div>

          {/* Filter Tabs + Month Picker */}
          <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 4 }}>
            <div className="flex gap-1.5">
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
            {/* Month filter */}
            <select
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="rounded-lg border border-[rgba(255,255,255,0.09)] bg-transparent text-[11px] font-bold uppercase tracking-[0.8px] text-nw-400 outline-none"
              style={{ padding: '6px 10px' }}
            >
              <option value="all">All Months</option>
              {availableMonths.map(m => {
                const [y, mo] = m.split('-')
                return <option key={m} value={m}>{MONTHS[parseInt(mo) - 1]} {y}</option>
              })}
            </select>
          </div>

          {/* Invoice Table */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {['Source', 'Type', 'Contact', 'Invoice #', 'Date', 'Due Date', 'Amount', 'Status', ''].map((h) => (
                      <th key={h} className="border-b border-[rgba(255,255,255,0.07)] text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 16px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-[13px] text-nw-500" style={{ padding: '48px 16px' }}>
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inv) => (
                      <tr key={inv.invoiceId} className="transition-colors hover:bg-[rgba(255,255,255,0.03)]">
                        <td className="border-b border-[rgba(255,255,255,0.05)]" style={{ padding: '12px 16px' }}>
                          <Badge variant={inv.source === 'email' ? 'gold' : inv.source === 'manual' ? 'default' : 'active'}>
                            {inv.source === 'email' ? 'Email' : inv.source === 'manual' ? 'Manual' : 'Xero'}
                          </Badge>
                        </td>
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
                            {inv.source === 'email' ? (
                              inv.xeroMatchStatus === 'matched' ? (
                                <Badge variant="done">Matched</Badge>
                              ) : (
                                <Badge variant="amber">Unmatched</Badge>
                              )
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        </td>
                        <td className="border-b border-[rgba(255,255,255,0.05)]" style={{ padding: '12px 16px' }}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => previewPdf(inv.invoiceId, inv.source, inv.pdfStoragePath ?? undefined)}
                              className="flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.09)] bg-transparent text-nw-400 transition-colors hover:text-nw-200 hover:border-[rgba(255,255,255,0.18)]"
                              style={{ padding: '5px 8px', minHeight: 28 }}
                              title="Preview PDF"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => downloadPdf(inv.invoiceId, inv.source, inv.pdfStoragePath ?? undefined)}
                              disabled={downloading === inv.invoiceId}
                              className="flex items-center gap-1 rounded-lg border border-[rgba(255,255,255,0.09)] bg-transparent text-[11px] font-bold uppercase tracking-[0.6px] text-nw-400 transition-colors hover:text-nw-200 hover:border-[rgba(255,255,255,0.18)] disabled:opacity-40"
                              style={{ padding: '5px 10px' }}
                              title="Download PDF"
                            >
                              <Download size={12} />
                              PDF
                            </button>
                            {inv.source === 'email' && inv.xeroMatchStatus === 'unmatched' && inv.vaultId && (
                              <button
                                onClick={() => openMatchModal(inv.vaultId!, inv.contact)}
                                className="flex items-center gap-1 rounded-lg border border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-[11px] font-bold uppercase tracking-[0.6px] text-gold-300 transition-colors hover:bg-[rgba(212,160,23,0.22)]"
                                style={{ padding: '5px 10px' }}
                                title="Match to Xero"
                              >
                                <Link2 size={12} />
                                Match
                              </button>
                            )}
                          </div>
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

      {/* PDF Preview modal */}
      {(previewUrl || previewLoading) && (
        <div className="fixed inset-0 z-50" onClick={() => { setPreviewUrl(null); setPreviewLoading(false) }}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="absolute inset-4 md:inset-12 bg-nw-800 rounded-2xl border border-[rgba(255,255,255,0.12)] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] flex-shrink-0" style={{ padding: '10px 16px' }}>
              <p className="text-[13px] font-medium text-nw-200">Invoice Preview</p>
              <button
                onClick={() => { setPreviewUrl(null); setPreviewLoading(false) }}
                className="text-nw-400 hover:text-nw-200 transition-colors"
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>
            {previewLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-[13px] text-nw-400">Loading PDF...</p>
                </div>
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                className="flex-1 w-full border-0"
                title="Invoice PDF preview"
              />
            ) : null}
          </div>
        </div>
      )}

      {/* Manual match modal */}
      {matchModal && (
        <Modal open onClose={() => setMatchModal(null)} title={`Match: ${matchModal.supplier}`} width="lg">
          <div style={{ padding: 0 }}>
            <p className="text-[13px] text-nw-400 mb-4">Select the matching Xero bill to link this email invoice.</p>
            {matchLoading ? (
              <div className="text-[13px] text-nw-400" style={{ padding: '20px 0' }}>Searching Xero...</div>
            ) : matchCandidates.length === 0 ? (
              <div className="text-[13px] text-nw-400" style={{ padding: '20px 0' }}>No matching Xero bills found within ±7 days and similar amount.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {matchCandidates.map((c) => (
                  <div key={c.xeroInvoiceId} className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] bg-nw-800" style={{ padding: '10px 14px' }}>
                    <div>
                      <p className="text-[13px] text-nw-200 font-medium">{c.contactName}</p>
                      <p className="text-[11px] text-nw-500">{formatCurrency(c.total)} · {c.date ? formatDate(c.date) : '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.score >= 70 ? 'done' : c.score >= 50 ? 'gold' : 'default'}>
                        {c.score}%
                      </Badge>
                      <Button variant="gold" size="sm" onClick={() => confirmMatch(matchModal.vaultId, c.xeroInvoiceId)}>
                        <Link2 size={11} /> Match
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
