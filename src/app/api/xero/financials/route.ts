import { xero } from '@/lib/xero'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function refreshXeroToken(refreshToken: string) {
  const credentials = Buffer.from(
    `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Xero token refresh failed (${res.status}): ${text}`)
  }

  const newToken = await res.json()
  newToken.expires_at = Math.floor(Date.now() / 1000) + (newToken.expires_in ?? 1800)
  return newToken
}

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
  try {
    const supabase = createAdminClient()

    const { data: tokenData } = await supabase
      .from('global_settings').select('value').eq('key', 'xero_tokens').single()

    if (!tokenData?.value) {
      return NextResponse.json({ error: 'not_connected' }, { status: 401 })
    }

    let tokenSet = JSON.parse(tokenData.value)

    const expiresAt: number = tokenSet.expires_at ?? 0
    if (expiresAt < Math.floor(Date.now() / 1000) + 60) {
      if (!tokenSet.refresh_token) {
        return NextResponse.json({ error: 'not_connected' }, { status: 401 })
      }
      tokenSet = await refreshXeroToken(tokenSet.refresh_token)
      await supabase.from('global_settings').upsert(
        { key: 'xero_tokens', value: JSON.stringify(tokenSet), updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    }

    await xero.setTokenSet(tokenSet)

    let tenantId = ''
    const { data: tenantData } = await supabase
      .from('global_settings').select('value').eq('key', 'xero_tenant_id').single()

    if (tenantData?.value) {
      tenantId = tenantData.value
    } else {
      await xero.updateTenants()
      tenantId = xero.tenants?.[0]?.tenantId ?? ''
      if (tenantId) {
        await supabase.from('global_settings').upsert(
          { key: 'xero_tenant_id', value: tenantId, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
      }
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'no_tenant' }, { status: 401 })
    }

    // End of current month as toDate; periods=12 with MONTH timeframe gives 12 monthly columns
    const now = new Date()
    const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().split('T')[0]

    let plRes = null, plError = null
    try {
      plRes = await xero.accountingApi.getReportProfitAndLoss(
        tenantId, undefined, toDate, 12, 'MONTH', undefined, undefined,
        undefined, undefined, undefined, undefined
      )
    } catch (e: unknown) {
      plError = e instanceof Error ? e.message : String(e)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyKeys = Object.keys((plRes?.body as any) ?? {})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = (plRes?.body as any)?.reports?.[0]

    // DEBUG — remove once working
    const firstSection = report?.rows?.find((r: any) => r.rowType === 'Section')
    return NextResponse.json({
      _debug: {
        plError,
        plResNull: plRes === null,
        bodyKeys,
        reportKeys: Object.keys(report ?? {}),
        rowCount: report?.rows?.length ?? 0,
        headerCells: report?.rows?.find((r: any) => r.rowType === 'Header')?.cells?.map((c: any) => c.value),
        firstSectionTitle: firstSection?.title,
        firstSectionSummaryRow: firstSection?.rows?.find((r: any) => r.rowType === 'SummaryRow')?.cells?.map((c: any) => c.value),
      }
    })

    const { monthly, incomeBreakdown } = parsePnL(report)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawTxns: any[] = (txnRes?.body as any)?.bankTransactions ?? []
    const bankTransactions = rawTxns.slice(0, 15).map((t) => ({
      date: t.date,
      contact: t.contact?.name ?? '—',
      reference: t.reference || '—',
      amount: t.total ?? 0,
      type: String(t.type ?? '').includes('RECEIVE') ? 'IN' : 'OUT',
    }))

    return NextResponse.json({ monthly, incomeBreakdown, bankTransactions })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[xero/financials]', message)
    return NextResponse.json({ error: 'xero_error', message }, { status: 502 })
  }
}
