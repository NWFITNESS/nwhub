import { NextResponse } from 'next/server'
import { exchangeOutlookCode } from '@/lib/outlook'

/**
 * GET /api/outlook/callback
 *
 * Microsoft redirects here after the admin approves the OAuth consent.
 * We exchange the auth code for tokens, store them in global_settings,
 * and redirect back to the inbox page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    console.error('[outlook/callback] OAuth error:', error, url.searchParams.get('error_description'))
    return NextResponse.redirect(`${url.origin}/inbox?outlook_error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${url.origin}/inbox?outlook_error=no_code`)
  }

  const redirectUri = `${url.origin}/api/outlook/callback`

  try {
    const tokens = await exchangeOutlookCode(code, redirectUri)
    console.log('[outlook/callback] Connected successfully:', tokens.email ?? 'unknown email')
    return NextResponse.redirect(`${url.origin}/inbox?outlook_connected=true`)
  } catch (e) {
    console.error('[outlook/callback] Token exchange failed:', (e as Error).message)
    return NextResponse.redirect(
      `${url.origin}/inbox?outlook_error=${encodeURIComponent((e as Error).message)}`,
    )
  }
}
