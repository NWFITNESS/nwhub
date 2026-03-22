'use client'

import { useState, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import {
  TrendingUp, Receipt, PoundSterling, DollarSign, RefreshCw,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MonthlyPoint {
  label: string
  income: number
  expenses: number
  profit: number
}

interface IncomeAccount {
  name: string
  amount: number
}

interface BankTxn {
  date?: string
  contact?: string
  reference?: string
  amount?: number
  type?: 'IN' | 'OUT'
}

interface FinancialsData {
  monthly: MonthlyPoint[]
  incomeBreakdown: IncomeAccount[]
  bankTransactions: BankTxn[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseXeroDate(xeroDate?: string): Date | null {
  if (!xeroDate) return null
  const match = xeroDate.match(/\/Date\((\d+)([+-]\d+)?\)\//)
  if (match) return new Date(parseInt(match[1]))
  return new Date(xeroDate)
}

function formatDate(xeroDate?: string): string {
  const d = parseXeroDate(xeroDate)
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Chart tooltip style ──────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: '#1a1a1a',
  border: '1px solid rgba(201,167,10,0.3)',
  borderRadius: '8px',
  color: '#F0F0F0',
}
const AXIS_TICK = { fill: 'rgba(255,255,255,0.3)', fontSize: 11 }

const PIE_COLOURS = ['#C9A70A', '#3B82F6', '#22C55E', '#A855F7', '#F97316', '#EC4899']

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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

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

  // ── Derived stats ────────────────────────────────────────────────────────────

  const monthly: MonthlyPoint[] = data?.monthly ?? []
  const thisMonth = monthly[monthly.length - 1] ?? { income: 0, expenses: 0, profit: 0 }
  const lastMonth = monthly[monthly.length - 2] ?? { income: 0, expenses: 0, profit: 0 }

  const yearIncome = monthly.reduce((s, m) => s + m.income, 0)
  const yearExpenses = monthly.reduce((s, m) => s + m.expenses, 0)
  const yearProfit = yearIncome - yearExpenses

  const revenueVsLastMonth = lastMonth.income > 0
    ? Math.round(((thisMonth.income - lastMonth.income) / lastMonth.income) * 100) : 0

  const incomeBreakdown = (data?.incomeBreakdown ?? []).slice(0, 6)
  const bankTransactions: BankTxn[] = data?.bankTransactions ?? []

  const months6 = monthly.slice(-6)

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

        {/* DEBUG */}
        {(data as any)?._debug && (
          <pre className="text-xs text-white/50 bg-white/5 rounded p-3 overflow-x-auto">
            {JSON.stringify((data as any)._debug, null, 2)}
          </pre>
        )}

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
          <>
            {/* Row 1 — Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

              {/* This Month Income */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">This Month</p>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
                    <TrendingUp size={18} className="text-white/70" strokeWidth={1.75} />
                  </div>
                </div>
                <div>
                  <p className="text-5xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'Rajdhani' }}>
                    £{thisMonth.income.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                    {revenueVsLastMonth >= 0
                      ? <ArrowUpRight size={12} className="text-green-500" />
                      : <ArrowDownRight size={12} className="text-red-500" />}
                    {Math.abs(revenueVsLastMonth)}% vs last month
                  </p>
                </div>
              </div>

              {/* Year Income */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Annual Income</p>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,167,10,0.15)' }}>
                    <PoundSterling size={18} className="text-white/70" strokeWidth={1.75} />
                  </div>
                </div>
                <div>
                  <p className="text-5xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'Rajdhani' }}>
                    £{yearIncome.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40 mt-1">Last 12 months</p>
                </div>
              </div>

              {/* Month Expenses */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">This Month Expenses</p>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
                    <Receipt size={18} className="text-white/70" strokeWidth={1.75} />
                  </div>
                </div>
                <div>
                  <p className="text-5xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'Rajdhani' }}>
                    £{thisMonth.expenses.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40 mt-1">From Xero P&L</p>
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Net Profit</p>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                    <TrendingUp size={18} className="text-white/70" strokeWidth={1.75} />
                  </div>
                </div>
                <div>
                  <p className={`text-5xl font-bold ${thisMonth.profit >= 0 ? 'text-[#F0F0F0]' : 'text-red-400'}`} style={{ fontFamily: 'Rajdhani' }}>
                    £{thisMonth.profit.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40 mt-1">This month</p>
                </div>
              </div>
            </div>

            {/* Row 2 — Income & Expenses 12-Month Chart */}
            <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">INCOME & EXPENSES</p>
                  <h3 className="text-[#F0F0F0] font-semibold">12 Month Overview</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <div className="w-3 h-3 rounded-sm bg-[#C9A70A]" /> Income
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <div className="w-4 h-0.5 bg-red-400" /> Expenses
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`£${Number(value).toLocaleString()}`, '']} />
                  <Bar dataKey="income" fill="#C9A70A" radius={[4, 4, 0, 0]} opacity={0.85} />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Row 3 — Three columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Donut — Income by Account */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
                <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">BREAKDOWN</p>
                <h3 className="text-[#F0F0F0] font-semibold mb-4">Income by Account</h3>
                {incomeBreakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={incomeBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                          dataKey="amount" nameKey="name" paddingAngle={3}>
                          {incomeBreakdown.map((_, i) => (
                            <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`£${Number(value).toLocaleString()}`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {incomeBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLOURS[i % PIE_COLOURS.length] }} />
                            <span className="text-xs text-white/50 truncate">{item.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-[#F0F0F0] flex-shrink-0 ml-2">£{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <PoundSterling size={24} className="text-white/20" />
                    <p className="text-xs text-white/30">No breakdown available</p>
                  </div>
                )}
              </div>

              {/* Area chart — Net Profit 6M */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
                <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">PROFIT TREND</p>
                <h3 className="text-[#F0F0F0] font-semibold mb-4">Net Profit — 6 Months</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={months6} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Profit']} />
                    <Area type="monotone" dataKey="profit" stroke="#22C55E" strokeWidth={2} fill="url(#profitGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Year Overview */}
              <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">YEAR OVERVIEW</p>
                  <h3 className="text-[#F0F0F0] font-semibold mb-5">Last 12 Months</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                    <span className="text-sm text-white/50">Total Income</span>
                    <span className="text-sm font-semibold text-green-400">£{yearIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                    <span className="text-sm text-white/50">Total Expenses</span>
                    <span className="text-sm font-semibold text-red-400">£{yearExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-semibold text-white/70">Net Profit</span>
                    <span className={`text-sm font-bold ${yearProfit >= 0 ? 'text-[#C9A70A]' : 'text-red-400'}`}>
                      £{yearProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4 — Recent Bank Transactions */}
            <div className="bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <div>
                  <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">TRANSACTIONS</p>
                  <h3 className="text-[#F0F0F0] font-semibold">Recent Bank Transactions</h3>
                </div>
                <a
                  href="https://go.xero.com/Bank/BankAccounts.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#C9A70A] hover:text-white transition-colors"
                >
                  View in Xero →
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Contact</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Reference</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Type</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-white/30">No transactions found</td>
                      </tr>
                    ) : (
                      bankTransactions.map((txn, i) => (
                        <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-sm text-[#F0F0F0]">{txn.contact}</td>
                          <td className="px-6 py-4 text-sm text-white/50">{txn.reference}</td>
                          <td className="px-6 py-4 text-sm text-white/50">{formatDate(txn.date)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              txn.type === 'IN'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {txn.type === 'IN' ? 'Income' : 'Expense'}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm font-semibold text-right ${txn.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                            {txn.type === 'OUT' ? '-' : ''}£{(txn.amount ?? 0).toLocaleString()}
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
