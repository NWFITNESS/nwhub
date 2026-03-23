import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

const SCOPES = [
  'pages_manage_posts',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_content_publish',
].join(',')

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const appId = process.env.META_APP_ID
  if (!appId) return NextResponse.json({ error: 'META_APP_ID not configured' }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const redirectUri = `${appUrl}/api/social/auth/meta/callback`

  const url = new URL('https://www.facebook.com/v20.0/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}
