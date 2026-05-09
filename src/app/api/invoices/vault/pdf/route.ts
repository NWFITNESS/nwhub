import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { getInvoicePdfUrl } from '@/lib/invoice-storage'

export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

  const url = await getInvoicePdfUrl(path)
  if (!url) return NextResponse.json({ error: 'PDF not found' }, { status: 404 })

  return NextResponse.json({ url })
}
