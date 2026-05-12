import { xero } from '@/lib/xero/client'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { getXeroAuth } from '@/lib/xero/auth'

export async function GET(request: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const invoiceId = request.nextUrl.searchParams.get('id')
  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 })
  }

  try {
    const auth = await getXeroAuth()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { tenantId } = auth

    const pdfRes = await xero.accountingApi.getInvoiceAsPdf(tenantId, invoiceId)
    const buffer = pdfRes.body as Buffer
    const bytes = new Uint8Array(buffer)

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
        'Content-Length': String(bytes.length),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[xero/invoices/pdf]', message)
    return NextResponse.json({ error: 'pdf_error', message }, { status: 502 })
  }
}
