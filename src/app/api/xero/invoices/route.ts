import { xero } from '@/lib/xero/client'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { getXeroAuth } from '@/lib/xero/auth'

function parseXeroDate(d: unknown): string | null {
  if (!d) return null
  if (d instanceof Date) return d.toISOString()
  const s = String(d)
  const match = s.match(/\/Date\((\d+)([+-]\d+)?\)\//)
  if (match) return new Date(parseInt(match[1])).toISOString()
  return s
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

    // Fetch invoices and unreconciled payments in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [invoiceRes, paymentRes] = await Promise.all([
      xero.accountingApi.getInvoices(
        tenantId,
        undefined,              // ifModifiedSince
        undefined,              // where
        'Date DESC',            // order
        undefined,              // iDs
        undefined,              // invoiceNumbers
        undefined,              // contactIDs
        ['AUTHORISED', 'PAID'], // statuses
        1,                      // page
        undefined,              // includeArchived
        undefined,              // createdByMyApp
        undefined,              // unitdp
        false,                  // summaryOnly — need amountDue/amountPaid
        100,                    // pageSize
      ),
      xero.accountingApi.getPayments(
        tenantId,
        undefined,                   // ifModifiedSince
        'IsReconciled==false',       // where
        'Date DESC',                 // order
        undefined,                   // page
        100,                         // pageSize
      ),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawInvoices: any[] = (invoiceRes.body as any)?.invoices ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPayments: any[] = (paymentRes.body as any)?.payments ?? []

    // Build set of invoice IDs that have unreconciled payments
    const unreconciledInvoiceIds = new Set<string>()
    for (const p of rawPayments) {
      if (p.invoice?.invoiceID) unreconciledInvoiceIds.add(p.invoice.invoiceID)
    }

    const now = new Date()
    let unpaidCount = 0
    let overdueCount = 0
    let monthSpend = 0

    const invoices = rawInvoices.map((inv) => {
      const date = parseXeroDate(inv.date)
      const dueDate = parseXeroDate(inv.dueDate)
      const status: string = inv.status ?? 'AUTHORISED'
      const amountDue: number = inv.amountDue ?? 0
      const total: number = inv.total ?? 0
      const type: string = inv.type ?? ''

      const isOverdue = status === 'AUTHORISED' && amountDue > 0 && dueDate
        ? new Date(dueDate) < now
        : false

      if (status === 'AUTHORISED' && amountDue > 0) unpaidCount++
      if (isOverdue) overdueCount++

      // Month spend: ACCPAY (bills) paid this month
      if (type === 'ACCPAY' && status === 'PAID') {
        const paidDate = parseXeroDate(inv.fullyPaidOnDate)
        if (paidDate) {
          const pd = new Date(paidDate)
          if (pd.getMonth() === now.getMonth() && pd.getFullYear() === now.getFullYear()) {
            monthSpend += total
          }
        }
      }

      return {
        invoiceId: inv.invoiceID ?? '',
        type: type as 'ACCPAY' | 'ACCREC',
        contact: inv.contact?.name ?? '—',
        invoiceNumber: inv.invoiceNumber ?? '—',
        date,
        dueDate,
        status,
        total,
        amountDue,
        amountPaid: inv.amountPaid ?? 0,
        hasAttachments: inv.hasAttachments ?? false,
        isOverdue,
        hasUnreconciledPayment: unreconciledInvoiceIds.has(inv.invoiceID ?? ''),
      }
    })

    return NextResponse.json({
      invoices,
      stats: {
        unpaidCount,
        overdueCount,
        unreconciledCount: rawPayments.length,
        monthSpend: Math.round(monthSpend),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[xero/invoices]', message)
    return NextResponse.json({ error: 'xero_error', message }, { status: 502 })
  }
}
