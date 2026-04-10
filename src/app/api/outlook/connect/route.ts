import { NextResponse } from 'next/server'
import { getOutlookAuthUrl } from '@/lib/outlook'

/**
 * GET /api/outlook/connect
 *
 * Redirects the admin to Microsoft's OAuth consent screen. After the user
 * approves, Microsoft redirects back to /api/outlook/callback with an auth
 * code that we exchange for access + refresh tokens.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectUri = `${url.origin}/api/outlook/callback`

  try {
    const authUrl = getOutlookAuthUrl(redirectUri)
    return NextResponse.redirect(authUrl)
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    )
  }
}
