import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',     // Search Console
  'https://www.googleapis.com/auth/analytics.readonly',       // GA4
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001')

  const redirectUri = `${baseUrl}/api/seo/google/callback`

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')

  return NextResponse.redirect(url.toString())
}
