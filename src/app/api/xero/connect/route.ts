import { xero } from '@/lib/xero'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth
  console.log('[xero/connect] XERO_REDIRECT_URI:', process.env.XERO_REDIRECT_URI)
  const consentUrl = await xero.buildConsentUrl()
  console.log('[xero/connect] consentUrl:', consentUrl)
  return NextResponse.redirect(consentUrl)
}
