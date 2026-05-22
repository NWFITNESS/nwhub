'use client'

import { WidgetGrid } from './WidgetGrid'
import { WidgetShell } from './WidgetShell'
import { useWidgetLayout, type WidgetDef } from './useWidgetLayout'
import { PageStatCard } from '@/components/ui/PageStatCard'
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
            <PageStatCard label="This Month" value={`£${thisMonth.income.toLocaleString()}`} sub={`${revenueVsLastMonth >= 0 ? '+' : ''}${revenueVsLastMonth}% vs last month`} color="#22c55e" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
          </WidgetShell>
        )
      case 'fin-kpi-year-income':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove} noPad>
            <PageStatCard label="Annual Income" value={`£${yearIncome.toLocaleString()}`} sub="Last 12 months" gold icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 1v14M4 5h8M4 9h8" strokeLinecap="round"/></svg>} />
          </WidgetShell>
        )
      case 'fin-kpi-expenses':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove} noPad>
            <PageStatCard label="This Month Expenses" value={`£${thisMonth.expenses.toLocaleString()}`} sub="From Xero P&L" color="#8b5cf6" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 7h14" strokeLinecap="round"/></svg>} />
          </WidgetShell>
        )
      case 'fin-kpi-profit':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove} noPad>
            <PageStatCard label="Net Profit" value={`£${thisMonth.profit.toLocaleString()}`} sub="This month" color={thisMonth.profit >= 0 ? '#22c55e' : '#ef4444'} alert={thisMonth.profit < 0} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="1" width="14" height="14" rx="2"/></svg>} />
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
