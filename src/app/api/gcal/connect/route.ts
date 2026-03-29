import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  console.log('[gcal/connect] GOOGLE_CLIENT_ID present:', !!clientId, '| length:', clientId?.length ?? 0)
  console.log('[gcal/connect] All GOOGLE_ vars:', Object.keys(process.env).filter(k => k.startsWith('GOOGLE')))
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001')

  const redirectUri = `${baseUrl}/api/gcal/callback`

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent') // Always prompt to ensure refresh_token is returned

  return NextResponse.redirect(url.toString())
}
