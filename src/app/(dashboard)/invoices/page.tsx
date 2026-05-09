'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DollarSign, RefreshCw, FileText, Download, AlertTriangle, Paperclip, Mail, Link2, X } from 'lucide-react'
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
    if (filter === 'from-email') return inv.source === 'email'
    return true
  }) ?? []

  const emailCount = data?.invoices.filter(i => i.source === 'email').length ?? 0

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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label="Unpaid Invoices" value={data.stats.unpaidCount} sub="Awaiting payment" />
            <StatCard label="Overdue" value={data.stats.overdueCount} sub="Past due date" danger={data.stats.overdueCount > 0} />
            <StatCard label="Unreconciled" value={data.stats.unreconciledCount} sub="Payments to reconcile" danger={data.stats.unreconciledCount > 0} />
            <StatCard label="Unmatched" value={data.stats.unmatchedEmailCount} sub="Email invoices to match" danger={data.stats.unmatchedEmailCount > 0} />
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
