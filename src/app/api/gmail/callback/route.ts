import { NextRequest, NextResponse } from 'next/server'
import { storeGmailTokens } from '@/lib/gmail'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/todo?error=gmail_denied', req.url))
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001')

  const redirectUri = `${baseUrl}/api/gmail/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    console.error('[gmail/callback] Token exchange failed:', await tokenRes.text())
    return NextResponse.redirect(new URL('/todo?error=gmail_token_exchange', req.url))
  }

  const tokenData = await tokenRes.json()

  // Fetch email address from userinfo
  let email: string | undefined
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    if (userRes.ok) {
      const user = await userRes.json()
      email = user.email
    }
  } catch {
    // non-critical
  }

  await storeGmailTokens({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in ?? 3600,
    email,
  })

  return NextResponse.redirect(new URL('/todo?connected=true', req.url))
}
