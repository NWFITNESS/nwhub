import { xero } from '@/lib/xero/client'
import { getXeroAuth } from '@/lib/xero/auth'

interface MatchResult {
  matched: boolean
  xeroInvoiceId?: string
  confidence?: number
  contactName?: string
}

/**
 * Find a matching Xero bill (ACCPAY) for an extracted invoice.
 * Searches invoices within ±3 days of the extracted date and scores by:
 *   - Amount within £1: +50
 *   - Supplier name fuzzy match: +40
 *   - Invoice number exact match: +30
 * Returns matched=true if best score >= 70.
 */
export async function findMatchingXeroInvoice(extracted: {
  supplier: string
  amount_total: number
  invoice_date: string
  invoice_number?: string | null
}): Promise<MatchResult> {
  try {
    const auth = await getXeroAuth()
    if (!auth.ok) return { matched: false }

    const { tenantId } = auth

    // Date range: ±3 days
    const date = new Date(extracted.invoice_date)
    const fromDate = new Date(date.getTime() - 3 * 86400000)
    const toDate = new Date(date.getTime() + 3 * 86400000)

    const fromStr = fromDate.toISOString().split('T')[0]
    const toStr = toDate.toISOString().split('T')[0]

    // Fetch ACCPAY (bills) in the date range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let invoices: any[] = []
    try {
      const res = await xero.accountingApi.getInvoices(
        tenantId,
        undefined, // ifModifiedSince
        `Type=="ACCPAY"&&Date>=DateTime(${fromDate.getFullYear()},${fromDate.getMonth() + 1},${fromDate.getDate()})&&Date<=DateTime(${toDate.getFullYear()},${toDate.getMonth() + 1},${toDate.getDate()})`,
        undefined, // order
        undefined, // ids
        undefined, // invoiceNumbers
        undefined, // contactIDs
        undefined, // statuses
        1,         // page
        undefined, // includeArchived
        undefined, // createdByMyApp
        undefined, // unitdp
        false,     // summaryOnly
        50,        // pageSize
      )
      invoices = (res.body as { invoices?: unknown[] })?.invoices ?? []
    } catch (e) {
      console.error('[xero-matcher] Invoice fetch failed:', e instanceof Error ? e.message : e)
      return { matched: false }
    }

    if (invoices.length === 0) return { matched: false }

    // Score each candidate
    let bestScore = 0
    let bestInvoice: { invoiceID?: string; contact?: { name?: string } } | null = null

    for (const inv of invoices) {
      let score = 0
      const total = inv.total ?? 0

      // Amount within £1
      if (Math.abs(total - extracted.amount_total) <= 1.0) {
        score += 50
      }

      // Supplier name fuzzy match (case-insensitive contains either way)
      const contactName = (inv.contact?.name ?? '').toLowerCase()
      const supplierName = extracted.supplier.toLowerCase()
      if (contactName && supplierName) {
        if (contactName.includes(supplierName) || supplierName.includes(contactName)) {
          score += 40
        }
      }

      // Invoice number exact match
      if (extracted.invoice_number && inv.invoiceNumber) {
        if (String(inv.invoiceNumber).toLowerCase() === String(extracted.invoice_number).toLowerCase()) {
          score += 30
        }
      }

      if (score > bestScore) {
        bestScore = score
        bestInvoice = inv
      }
    }

    if (bestScore >= 70 && bestInvoice) {
      return {
        matched: true,
        xeroInvoiceId: bestInvoice.invoiceID,
        confidence: bestScore,
        contactName: bestInvoice.contact?.name,
      }
    }

    return { matched: false, confidence: bestScore }
  } catch (e) {
    console.error('[xero-matcher] Error:', e instanceof Error ? e.message : e)
    return { matched: false }
  }
}

/**
 * Find candidate Xero matches with a lower threshold (score >= 40).
 * Used for the manual match modal UI.
 */
export async function findXeroCandidates(extracted: {
  supplier: string
  amount_total: number
  invoice_date: string
  invoice_number?: string | null
}): Promise<Array<{ xeroInvoiceId: string; contactName: string; total: number; date: string; score: number }>> {
  try {
    const auth = await getXeroAuth()
    if (!auth.ok) return []

    const { tenantId } = auth
    const date = new Date(extracted.invoice_date)
    const fromDate = new Date(date.getTime() - 7 * 86400000) // wider window for candidates
    const toDate = new Date(date.getTime() + 7 * 86400000)

    const res = await xero.accountingApi.getInvoices(
      tenantId, undefined,
      `Type=="ACCPAY"&&Date>=DateTime(${fromDate.getFullYear()},${fromDate.getMonth() + 1},${fromDate.getDate()})&&Date<=DateTime(${toDate.getFullYear()},${toDate.getMonth() + 1},${toDate.getDate()})`,
      'Date DESC', undefined, undefined, undefined, undefined, 1, undefined, undefined, undefined, false, 50,
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoices: any[] = (res.body as { invoices?: unknown[] })?.invoices ?? []
    const candidates: Array<{ xeroInvoiceId: string; contactName: string; total: number; date: string; score: number }> = []

    for (const inv of invoices) {
      let score = 0
      if (Math.abs((inv.total ?? 0) - extracted.amount_total) <= 1.0) score += 50
      const cn = (inv.contact?.name ?? '').toLowerCase()
      const sn = extracted.supplier.toLowerCase()
      if (cn && sn && (cn.includes(sn) || sn.includes(cn))) score += 40
      if (extracted.invoice_number && inv.invoiceNumber && String(inv.invoiceNumber).toLowerCase() === String(extracted.invoice_number).toLowerCase()) score += 30

      if (score >= 40) {
        candidates.push({
          xeroInvoiceId: inv.invoiceID,
          contactName: inv.contact?.name ?? '—',
          total: inv.total ?? 0,
          date: inv.date ? String(inv.date) : '',
          score,
        })
      }
    }

    return candidates.sort((a, b) => b.score - a.score)
  } catch {
    return []
  }
}
