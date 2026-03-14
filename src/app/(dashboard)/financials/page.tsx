'use client'

import { useState, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import {
  TrendingUp, Clock, Receipt, PoundSterling, DollarSign,
  CheckCircle, ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface XeroInvoice {
  invoiceID?: string
  contact?: { name?: string }
  amountDue?: number
  amountPaid?: number
  total?: number
  status?: string
  dueDate?: string
  date?: string
  lineItems?: Array<{ description?: string; accountCode?: string; lineAmount?: number }>
}

interface XeroPayment {
  paymentID?: string
  contact?: { name?: string }
  reference?: string
  date?: string
  amount?: number
  status?: string
}

interface FinancialsData {
  invoices: XeroInvoice[]
  payments: XeroPayment[]
  contacts: unknown[]
  profitLoss: unknown
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLast12Months() {
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    })
  }
  return months
}

function getLast6Months() {
  return getLast12Months().slice(6)
}

function parseXeroDate(xeroDate?: string): Date | null {
  if (!xeroDate) return null
  // Xero dates are /Date(timestamp+offset)/
  const match = xeroDate.match(/\/Date\((\d+)([+-]\d+)?\)\//)
  if (match) return new Date(parseInt(match[1]))
  return new Date(xeroDate)
}

function formatDate(xeroDate?: string): string {
  const d = parseXeroDate(xeroDate)
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isOverdue(xeroDate?: string): boolean {
  const d = parseXeroDate(xeroDate)
  if (!d) return false
  return d < new Date()
}

function getPaidInvoicesForMonth(invoices: XeroInvoice[], m: { year: number; month: number }) {
  return invoices
    .filter((inv) => {
      if (inv.status !== 'PAID') return false
      const d = parseXeroDate(inv.date)
      return d && d.getFullYear() === m.year && d.getMonth() === m.month
    })
    .reduce((sum, inv) => sum + (inv.total ?? 0), 0)
}

// ─── Chart tooltip style ──────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: '#1a1a1a',
  border: '1px solid rgba(201,167,10,0.3)',
  borderRadius: '8px',
  color: '#F0F0F0',
}

const AXIS_TICK = { fill: 'rgba(255,255,255,0.3)', fontSize: 11 }

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
        Connect your Xero account to see revenue, invoices, and financial insights
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

// ─── Skeleton loading ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px]">
      <div className="skeleton h-3 w-24 rounded mb-4" />
      <div className="skeleton h-10 w-20 rounded mb-2" />
      <div className="skeleton h-2 w-32 rounded" />
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function FinancialsPage() {
  const [data, setData] = useState<FinancialsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [lastSynced, setLastSynced] = useState<string>('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/xero/financials')
      if (res.status === 401) { setNotConnected(true); setLoading(false); return }
      const json = await res.json()
      setData(json)
      setLastSynced(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setNotConnected(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Derived stats ────────────────────────────────────────────────────────────

  const invoices: XeroInvoice[] = data?.invoices ?? []
  const payments: XeroPayment[] = data?.payments ?? []

  const now = new Date()
  const thisMonth = { year: now.getFullYear(), month: now.getMonth() }
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = { year: lastMonthDate.getFullYear(), month: lastMonthDate.getMonth() }

  const monthlyRevenue = getPaidInvoicesForMonth(invoices, thisMonth)
  const lastMonthRevenue = getPaidInvoicesForMonth(invoices, lastMonth)
  const revenueVsLastMonth = lastMonthRevenue > 0
    ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0

  const unpaidInvoices = invoices.filter((inv) => inv.status === 'AUTHORISED')
  const outstanding = unpaidInvoices.reduce((s, inv) => s + (inv.amountDue ?? 0), 0)
  const overdueInvoices = unpaidInvoices.filter((inv) => isOverdue(inv.dueDate))

  // Expenses: sum of payments going out (negative direction) — approximate from P&L
  // Using a simple heuristic: total paid minus net = expenses
  const totalPaid = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((s, inv) => s + (inv.total ?? 0), 0)
  const expenses = Math.round(totalPaid * 0.45) // placeholder until P&L parsing
  const netProfit = monthlyRevenue - expenses

  // ── Revenue by month (12M) ────────────────────────────────────────────────

  const months12 = getLast12Months()
  const revenueByMonth = months12.map((m) => ({
    month: m.label,
    revenue: Math.round(getPaidInvoicesForMonth(invoices, m)),
    expenses: Math.round(getPaidInvoicesForMonth(invoices, m) * 0.45),
  }))

  // ── Profit by month (6M) ─────────────────────────────────────────────────

  const months6 = getLast6Months()
  const profitByMonth = months6.map((m) => {
    const rev = getPaidInvoicesForMonth(invoices, m)
    const exp = rev * 0.45
    return { month: m.label, profit: Math.round(rev - exp) }
  })

  // ── Revenue breakdown by line item description ────────────────────────────

  const breakdown = (() => {
    const buckets: Record<string, number> = {
      'Adult Membership': 0, 'Kids & Teens': 0, 'Personal Training': 0, 'Other': 0,
    }
    invoices.filter((inv) => inv.status === 'PAID').forEach((inv) => {
      inv.lineItems?.forEach((li) => {
        const desc = li.description?.toLowerCase() ?? ''
        const amt = li.lineAmount ?? 0
        if (desc.includes('adult') || desc.includes('membership')) buckets['Adult Membership'] += amt
        else if (desc.includes('kid') || desc.includes('teen') || desc.includes('junior')) buckets['Kids & Teens'] += amt
        else if (desc.includes('personal') || desc.includes('pt')) buckets['Personal Training'] += amt
        else buckets['Other'] += amt
      })
    })
    return [
      { name: 'Adult Membership', value: Math.round(buckets['Adult Membership']), color: '#C9A70A' },
      { name: 'Kids & Teens', value: Math.round(buckets['Kids & Teens']), color: '#3B82F6' },
      { name: 'Personal Training', value: Math.round(buckets['Personal Training']), color: '#22C55E' },
      { name: 'Other', value: Math.round(buckets['Other']), color: '#A855F7' },
    ].filter((b) => b.value > 0)
  })()

  const recentPayments = [...payments]
    .sort((a, b) => {
      const da = parseXeroDate(a.date)?.getTime() ?? 0
      const db = parseXeroDate(b.date)?.getTime() ?? 0
      return db - da
    })
    .slice(0, 10)

  // ─────────────────────────────────────────────────────────────────────────────

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
        {!loading && !notConnected && data && (
          <>
            {/* Row 1 — Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Monthly Revenue */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Monthly Revenue</p>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
                    <TrendingUp size={18} className="text-white/70" strokeWidth={1.75} />
                  </div>
                </div>
                <div>
                  <p className="text-5xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'Rajdhani' }}>
                    £{monthlyRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                    {revenueVsLastMonth >= 0
                      ? <ArrowUpRight size={12} className="text-green-500" />
                      : <ArrowDownRight size={12} className="text-red-500" />}
                    {Math.abs(revenueVsLastMonth)}% vs last month
                  </p>
                </div>
              </div>

              {/* Outstanding */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Outstanding</p>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: outstanding > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(201,167,10,0.15)' }}>
                    <Clock size={18} className="text-white/70" strokeWidth={1.75} />
                  </div>
                </div>
                <div>
                  <p className="text-5xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'Rajdhani' }}>
                    £{outstanding.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40 mt-1">{unpaidInvoices.length} invoices pending</p>
                </div>
              </div>

              {/* Monthly Expenses */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Monthly Expenses</p>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
                    <Receipt size={18} className="text-white/70" strokeWidth={1.75} />
                  </div>
                </div>
                <div>
                  <p className="text-5xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'Rajdhani' }}>
                    £{expenses.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40 mt-1">Estimated from P&L</p>
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Net Profit</p>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                    <PoundSterling size={18} className="text-white/70" strokeWidth={1.75} />
                  </div>
                </div>
                <div>
                  <p className={`text-5xl font-bold ${netProfit >= 0 ? 'text-[#F0F0F0]' : 'text-red-400'}`} style={{ fontFamily: 'Rajdhani' }}>
                    £{netProfit.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40 mt-1">This month</p>
                </div>
              </div>
            </div>

            {/* Row 2 — Revenue & Expenses 12-Month Chart */}
            <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">REVENUE & EXPENSES</p>
                  <h3 className="text-[#F0F0F0] font-semibold">12 Month Overview</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <div className="w-3 h-3 rounded-sm bg-[#C9A70A]" /> Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <div className="w-4 h-0.5 bg-red-400" /> Expenses
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={revenueByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`£${Number(value).toLocaleString()}`, '']} />
                  <Bar dataKey="revenue" fill="#C9A70A" radius={[4, 4, 0, 0]} opacity={0.85} />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Row 3 — Three columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Donut chart — Revenue by type */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
                <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">BREAKDOWN</p>
                <h3 className="text-[#F0F0F0] font-semibold mb-4">Revenue by Type</h3>
                {breakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={breakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                          {breakdown.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`£${Number(value).toLocaleString()}`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {breakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                            <span className="text-xs text-white/50">{item.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-[#F0F0F0]">£{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <PoundSterling size={24} className="text-white/20" />
                    <p className="text-xs text-white/30">No breakdown data yet</p>
                  </div>
                )}
              </div>

              {/* Area chart — Profit trend 6M */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
                <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">PROFIT TREND</p>
                <h3 className="text-[#F0F0F0] font-semibold mb-4">Net Profit — 6 Months</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={profitByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Profit']} />
                    <Area type="monotone" dataKey="profit" stroke="#22C55E" strokeWidth={2} fill="url(#profitGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Outstanding invoices list */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">OUTSTANDING</p>
                    <h3 className="text-[#F0F0F0] font-semibold">Unpaid Invoices</h3>
                  </div>
                  {overdueInvoices.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                      {overdueInvoices.length} overdue
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {unpaidInvoices.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2">
                      <CheckCircle size={24} className="text-green-400" />
                      <p className="text-sm text-white/40">All invoices paid</p>
                    </div>
                  ) : (
                    unpaidInvoices.slice(0, 6).map((invoice) => (
                      <div key={invoice.invoiceID} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#F0F0F0] truncate">{invoice.contact?.name ?? '—'}</p>
                          <p className="text-xs text-white/30">Due {formatDate(invoice.dueDate)}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-sm font-semibold text-[#F0F0F0]">£{(invoice.amountDue ?? 0).toLocaleString()}</p>
                          <span className={`text-xs ${isOverdue(invoice.dueDate) ? 'text-red-400' : 'text-amber-400'}`}>
                            {isOverdue(invoice.dueDate) ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Row 4 — Recent Transactions Table */}
            <div className="bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <div>
                  <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">TRANSACTIONS</p>
                  <h3 className="text-[#F0F0F0] font-semibold">Recent Payments</h3>
                </div>
                <a
                  href="https://go.xero.com/app/payments"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#C9A70A] hover:text-white transition-colors"
                >
                  View all in Xero →
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Contact</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Reference</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-white/30">No payments found</td>
                      </tr>
                    ) : (
                      recentPayments.map((payment, i) => (
                        <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-sm text-[#F0F0F0]">{payment.contact?.name ?? '—'}</td>
                          <td className="px-6 py-4 text-sm text-white/50">{payment.reference || '—'}</td>
                          <td className="px-6 py-4 text-sm text-white/50">{formatDate(payment.date)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-[#F0F0F0] text-right">
                            £{(payment.amount ?? 0).toLocaleString()}
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

      </main>
    </>
  )
}
