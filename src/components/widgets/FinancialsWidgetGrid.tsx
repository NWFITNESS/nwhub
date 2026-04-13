'use client'

import { TrendingUp, Receipt, PoundSterling } from 'lucide-react'
import { WidgetGrid } from './WidgetGrid'
import { WidgetShell } from './WidgetShell'
import { useWidgetLayout, type WidgetDef } from './useWidgetLayout'
import { FinStatCard } from './financials/FinStatCard'
import { MonthlyOverviewWidget } from './financials/MonthlyOverviewWidget'
import { IncomeBreakdownWidget } from './financials/IncomeBreakdownWidget'
import { NetProfitTrendWidget } from './financials/NetProfitTrendWidget'
import { YearOverviewWidget } from './financials/YearOverviewWidget'
import { BankTransactionsWidget } from './financials/BankTransactionsWidget'

interface MonthlyPoint { label: string; income: number; expenses: number; profit: number }
interface IncomeAccount { name: string; amount: number }
interface BankTxn { date?: string; contact?: string; reference?: string; amount?: number; type?: 'IN' | 'OUT' }

export interface FinancialsData {
  monthly: MonthlyPoint[]
  incomeBreakdown: IncomeAccount[]
  bankTransactions: BankTxn[]
}

const FINANCIALS_WIDGETS: WidgetDef[] = [
  { id: 'fin-kpi-month-income',  name: 'This Month Income',    category: 'kpi',   defaultLayout: { w: 3, h: 3, x: 0,  y: 0 } },
  { id: 'fin-kpi-year-income',   name: 'Annual Income',        category: 'kpi',   defaultLayout: { w: 3, h: 3, x: 3,  y: 0 } },
  { id: 'fin-kpi-expenses',      name: 'This Month Expenses',  category: 'kpi',   defaultLayout: { w: 3, h: 3, x: 6,  y: 0 } },
  { id: 'fin-kpi-profit',        name: 'Net Profit',           category: 'kpi',   defaultLayout: { w: 3, h: 3, x: 9,  y: 0 } },
  { id: 'fin-chart-monthly',     name: '12-Month Overview',    category: 'chart', defaultLayout: { w: 12, h: 7, x: 0, y: 3 } },
  { id: 'fin-chart-breakdown',   name: 'Income by Account',    category: 'chart', defaultLayout: { w: 4, h: 7, x: 0,  y: 10 } },
  { id: 'fin-chart-profit-trend',name: 'Net Profit Trend',     category: 'chart', defaultLayout: { w: 4, h: 7, x: 4,  y: 10 } },
  { id: 'fin-summary-year',      name: 'Year Overview',        category: 'misc',  defaultLayout: { w: 4, h: 7, x: 8,  y: 10 } },
  { id: 'fin-table-transactions',name: 'Bank Transactions',    category: 'table', defaultLayout: { w: 12, h: 8, x: 0, y: 17 } },
]

interface Props {
  data: FinancialsData
}

export function FinancialsWidgetGrid({ data }: Props) {
  const monthly = data.monthly ?? []
  const thisMonth = monthly[monthly.length - 1] ?? { income: 0, expenses: 0, profit: 0 }
  const lastMonth = monthly[monthly.length - 2] ?? { income: 0, expenses: 0, profit: 0 }
  const yearIncome = monthly.reduce((s, m) => s + m.income, 0)
  const yearExpenses = monthly.reduce((s, m) => s + m.expenses, 0)
  const yearProfit = yearIncome - yearExpenses
  const revenueVsLastMonth = lastMonth.income > 0
    ? Math.round(((thisMonth.income - lastMonth.income) / lastMonth.income) * 100) : 0
  const months6 = monthly.slice(-6)
  const incomeBreakdown = (data.incomeBreakdown ?? []).slice(0, 6)
  const bankTransactions = data.bankTransactions ?? []

  const { layouts, visibleIds, saveLayouts, removeWidget, addWidget } = useWidgetLayout('financials', FINANCIALS_WIDGETS)

  function renderWidget(id: string, isCustomising: boolean, onRemove: (id: string) => void) {
    switch (id) {
      case 'fin-kpi-month-income':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove} noPad>
            <FinStatCard label="This Month" value={thisMonth.income} icon={TrendingUp} iconBg="rgba(34,197,94,0.15)" trend={revenueVsLastMonth} />
          </WidgetShell>
        )
      case 'fin-kpi-year-income':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove} noPad>
            <FinStatCard label="Annual Income" value={yearIncome} icon={PoundSterling} iconBg="rgba(201,167,10,0.15)" sub="Last 12 months" />
          </WidgetShell>
        )
      case 'fin-kpi-expenses':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove} noPad>
            <FinStatCard label="This Month Expenses" value={thisMonth.expenses} icon={Receipt} iconBg="rgba(168,85,247,0.15)" sub="From Xero P&L" />
          </WidgetShell>
        )
      case 'fin-kpi-profit':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove} noPad>
            <FinStatCard label="Net Profit" value={thisMonth.profit} icon={TrendingUp} iconBg="rgba(59,130,246,0.15)" sub="This month" negative />
          </WidgetShell>
        )
      case 'fin-chart-monthly':
        return (
          <WidgetShell key={id} id={id} subtitle="INCOME & EXPENSES" title="12 Month Overview" isCustomising={isCustomising} onRemove={onRemove}>
            <MonthlyOverviewWidget data={monthly} />
          </WidgetShell>
        )
      case 'fin-chart-breakdown':
        return (
          <WidgetShell key={id} id={id} subtitle="BREAKDOWN" title="Income by Account" isCustomising={isCustomising} onRemove={onRemove}>
            <IncomeBreakdownWidget data={incomeBreakdown} />
          </WidgetShell>
        )
      case 'fin-chart-profit-trend':
        return (
          <WidgetShell key={id} id={id} subtitle="PROFIT TREND" title="Net Profit — 6 Months" isCustomising={isCustomising} onRemove={onRemove}>
            <NetProfitTrendWidget data={months6} />
          </WidgetShell>
        )
      case 'fin-summary-year':
        return (
          <WidgetShell key={id} id={id} subtitle="YEAR OVERVIEW" title="Last 12 Months" isCustomising={isCustomising} onRemove={onRemove}>
            <YearOverviewWidget yearIncome={yearIncome} yearExpenses={yearExpenses} yearProfit={yearProfit} />
          </WidgetShell>
        )
      case 'fin-table-transactions':
        return (
          <WidgetShell key={id} id={id} subtitle="TRANSACTIONS" title="Recent Bank Transactions" isCustomising={isCustomising} onRemove={onRemove} noPad
            headerRight={
              <a href="https://go.xero.com/Bank/BankAccounts.aspx" target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#C9A70A] hover:text-white transition-colors">
                View in Xero →
              </a>
            }
          >
            <BankTransactionsWidget transactions={bankTransactions} />
          </WidgetShell>
        )
      default:
        return null
    }
  }

  return (
    <WidgetGrid
      layouts={layouts}
      visibleIds={visibleIds}
      allWidgets={FINANCIALS_WIDGETS}
      saveLayouts={saveLayouts}
      removeWidget={removeWidget}
      addWidget={addWidget}
      renderWidget={renderWidget}
    />
  )
}
