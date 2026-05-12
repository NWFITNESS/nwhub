import { xero } from '@/lib/xero/client'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const consentUrl = await xero.buildConsentUrl()
  return NextResponse.redirect(consentUrl)
}
