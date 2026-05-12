import { xero } from '@/lib/xero/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { getXeroAuth } from '@/lib/xero/auth'

const parseNum = (v: unknown) =>
  Math.abs(parseFloat(String(v ?? '').replace(/,/g, '')) || 0)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePnL(report: any) {
  const rows: any[] = report?.rows ?? []

  // Header row → period labels (e.g. "Apr 2025", "May 2025", …)
  const headerRow = rows.find((r: any) => r.rowType === 'Header')
  const labels: string[] = headerRow?.cells?.slice(1).map((c: any) => String(c.value ?? '').trim()) ?? []
  if (!labels.length) return { monthly: [], incomeBreakdown: [] }

  const income = new Array<number>(labels.length).fill(0)
  const expenses = new Array<number>(labels.length).fill(0)
  const incomeBreakdown: { name: string; amount: number }[] = []

  for (const section of rows) {
    if (section.rowType !== 'Section') continue

    const summaryRow = section.rows?.find((r: any) => r.rowType === 'SummaryRow')
    if (!summaryRow?.cells?.length) continue

    const summaryTitle = String(summaryRow.cells[0]?.value ?? '').toLowerCase()
    const vals: number[] = summaryRow.cells.slice(1).map((c: any) => parseNum(c.value))

    const isIncome =
      summaryTitle.includes('total income') ||
      summaryTitle.includes('total revenue') ||
      summaryTitle.includes('total trading income')

    if (isIncome) {
      vals.forEach((v, i) => { income[i] = v })

      // Parse individual account rows for the breakdown (year total = sum across periods)
      for (const row of section.rows ?? []) {
        if (row.rowType !== 'Row') continue
        const name = String(row.cells?.[0]?.value ?? '').trim()
        const yearTotal = (row.cells ?? []).slice(1).reduce(
          (s: number, c: any) => s + parseNum(c.value), 0
        )
        if (name && yearTotal > 0) incomeBreakdown.push({ name, amount: Math.round(yearTotal) })
      }
    } else {
      // All non-income sections (cost of sales, operating expenses, etc.) count as expenses
      vals.forEach((v, i) => { expenses[i] += v })
    }
  }

  const monthly = labels.map((label, i) => ({
    label,
    income: Math.round(income[i]),
    expenses: Math.round(expenses[i]),
    profit: Math.round(income[i] - expenses[i]),
  }))

  return { monthly, incomeBreakdown }
}

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth
  try {
    const auth = await getXeroAuth()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { tenantId } = auth

    // End of current month as toDate; periods=11 with MONTH timeframe gives 12 monthly columns
    const now = new Date()
    const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().split('T')[0]

    let plRes = null, plError = null
    try {
      plRes = await xero.accountingApi.getReportProfitAndLoss(
        tenantId, undefined, toDate, 11, 'MONTH', undefined, undefined,
        undefined, undefined, undefined, undefined
      )
    } catch (e: unknown) {
      plError = e instanceof Error ? e.message : String(e)
    }

    if (plError || !plRes) {
      console.error('[xero/financials] P&L error:', plError)
      return NextResponse.json({ error: 'xero_error', message: plError ?? 'P&L fetch failed' }, { status: 502 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = (plRes.body as any)?.reports?.[0]
    const { monthly, incomeBreakdown } = parsePnL(report)

    const payRes = await xero.accountingApi.getPayments(tenantId, undefined, undefined, 'Date DESC', undefined, 15)
      .catch((e: unknown) => { console.error('[xero/financials] getPayments error:', e instanceof Error ? e.message : e); return null })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPayments: any[] = (payRes?.body as any)?.payments ?? []
    const bankTransactions = rawPayments.map((p) => ({
      date: p.date,
      contact: p.invoice?.contact?.name ?? '—',
      reference: p.reference || p.invoice?.invoiceNumber || '—',
      amount: p.amount ?? 0,
      type: p.invoice?.type === 'ACCREC' ? 'IN' : 'OUT',
    }))

    // Cache the most recent month's income for the dashboard card (avoids concurrent token refreshes)
    const supabase = createAdminClient()
    const lastIncome = monthly[monthly.length - 1]?.income ?? 0
    try {
      await supabase.from('global_settings').upsert(
        { key: 'xero_revenue_cache', value: String(lastIncome), updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    } catch { /* non-critical cache write, ignore failures */ }

    return NextResponse.json({ monthly, incomeBreakdown, bankTransactions })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[xero/financials]', message)
    return NextResponse.json({ error: 'xero_error', message }, { status: 502 })
  }
}
