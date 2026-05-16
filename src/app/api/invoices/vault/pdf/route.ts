import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { getInvoicePdfUrl, getInvoiceFileContent } from '@/lib/invoices/storage'

export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

  // For HTML invoices, serve the content directly so iframes render it properly
  if (path.endsWith('.html')) {
    const content = await getInvoiceFileContent(path)
    if (!content) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  }

  // For PDFs, return signed URL as before
  const url = await getInvoicePdfUrl(path)
  if (!url) return NextResponse.json({ error: 'PDF not found' }, { status: 404 })

  return NextResponse.json({ url })
}
