import { xero } from '@/lib/xero'
import { NextResponse } from 'next/server'

export async function GET() {
  const consentUrl = await xero.buildConsentUrl()
  return NextResponse.redirect(consentUrl)
}
