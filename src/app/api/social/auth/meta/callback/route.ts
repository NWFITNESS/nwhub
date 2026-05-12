import { NextRequest, NextResponse } from 'next/server'
import { getSocialConnections, saveSocialConnections } from '@/lib/social/connections'

const META_VERSION = 'v20.0'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const redirectBase = `${appUrl}/settings`

  try {
    const { searchParams } = req.nextUrl
    const code = searchParams.get('code')
    const error = searchParams.get('error_description') ?? searchParams.get('error')

    if (error) throw new Error(error)
    if (!code) throw new Error('No code returned from Meta')

    const appId = process.env.META_APP_ID!
    const appSecret = process.env.META_APP_SECRET!
    const redirectUri = `${appUrl}/api/social/auth/meta/callback`

    // ── Step 1: Exchange code for short-lived user token ──────────────────────
    const tokenRes = await fetch(
      `https://graph.facebook.com/${META_VERSION}/oauth/access_token?` +
        new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code })
    )
    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(tokenData.error.message)
    const shortToken: string = tokenData.access_token

    // ── Step 2: Exchange for long-lived user token (60 days) ─────────────────
    const longRes = await fetch(
      `https://graph.facebook.com/${META_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortToken,
        })
    )
    const longData = await longRes.json()
    if (longData.error) throw new Error(longData.error.message)
    const longUserToken: string = longData.access_token

    // ── Step 3: Fetch managed pages (page tokens never expire) ───────────────
    const pagesRes = await fetch(
      `https://graph.facebook.com/${META_VERSION}/me/accounts?` +
        new URLSearchParams({ access_token: longUserToken, limit: '20' })
    )
    const pagesData = await pagesRes.json()
    if (pagesData.error) throw new Error(pagesData.error.message)

    const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data ?? []
    if (pages.length === 0) throw new Error('No Facebook Pages found. Ensure you are an admin of at least one Page.')

    // Use first page (most accounts manage a single page)
    const page = pages[0]

    // ── Step 4: Find connected Instagram Business account ────────────────────
    const igRes = await fetch(
      `https://graph.facebook.com/${META_VERSION}/${page.id}?` +
        new URLSearchParams({
          fields: 'instagram_business_account',
          access_token: page.access_token,
        })
    )
    const igData = await igRes.json()
    const igUserId: string = igData.instagram_business_account?.id ?? ''

    // Fetch IG username if available
    let igUsername = ''
    if (igUserId) {
      const igProfileRes = await fetch(
        `https://graph.facebook.com/${META_VERSION}/${igUserId}?` +
          new URLSearchParams({ fields: 'username', access_token: page.access_token })
      )
      const igProfile = await igProfileRes.json()
      igUsername = igProfile.username ?? ''
    }

    // ── Step 5: Store ─────────────────────────────────────────────────────────
    const existing = await getSocialConnections()
    const now = new Date().toISOString()

    await saveSocialConnections({
      ...existing,
      facebook: {
        connected: true,
        page_id: page.id,
        page_name: page.name,
        page_access_token: page.access_token,
        connected_at: now,
      },
      instagram: igUserId
        ? {
            connected: true,
            ig_user_id: igUserId,
            username: igUsername,
            page_access_token: page.access_token,
            connected_at: now,
          }
        : existing.instagram,
    })

    return NextResponse.redirect(
      new URL(
        `/settings?social_success=${encodeURIComponent(igUserId ? 'Facebook & Instagram connected' : 'Facebook connected')}`,
        req.url
      )
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Meta OAuth error:', err)
    return NextResponse.redirect(
      new URL(`/settings?social_error=${encodeURIComponent(msg)}`, req.url)
    )
  }
}
