import { NextRequest, NextResponse } from 'next/server'
import { getSocialConnections, saveSocialConnections } from '@/lib/social/connections'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  try {
    const { searchParams } = req.nextUrl
    const code = searchParams.get('code')
    const error = searchParams.get('error_description') ?? searchParams.get('error')

    if (error) throw new Error(error)
    if (!code) throw new Error('No code returned from LinkedIn')

    const clientId = process.env.LINKEDIN_CLIENT_ID!
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
    const redirectUri = `${appUrl}/api/social/auth/linkedin/callback`

    // ── Step 1: Exchange code for access token ────────────────────────────────
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(`${tokenData.error}: ${tokenData.error_description}`)

    const accessToken: string = tokenData.access_token
    const refreshToken: string | null = tokenData.refresh_token ?? null
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    // ── Step 2: Fetch organizations the user admins ───────────────────────────
    const orgAclsRes = await fetch(
      'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=10',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )
    const orgAcls = await orgAclsRes.json()
    const elements: Array<{ organizationUrn: string }> = orgAcls.elements ?? []

    if (elements.length === 0) {
      throw new Error('No LinkedIn organizations found. Ensure you are an administrator of at least one Company Page.')
    }

    // Extract numeric org ID from URN like "urn:li:organization:12345678"
    const orgUrn = elements[0].organizationUrn
    const orgId = orgUrn.split(':').pop() ?? ''

    // ── Step 3: Fetch org name ────────────────────────────────────────────────
    const orgRes = await fetch(
      `https://api.linkedin.com/v2/organizations/${orgId}?projection=(id,name~(localized,preferredLocale))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )
    const orgData = await orgRes.json()

    // name~ returns localized name map; pick preferred locale value
    const locale = orgData['name~']?.preferredLocale
    const orgName: string = locale
      ? (orgData['name~']?.localized?.[`${locale.language}_${locale.country}`] ?? 'Unknown Organisation')
      : 'Unknown Organisation'

    // ── Step 4: Store ─────────────────────────────────────────────────────────
    const existing = await getSocialConnections()
    await saveSocialConnections({
      ...existing,
      linkedin: {
        connected: true,
        organization_id: orgId,
        organization_name: orgName,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        connected_at: new Date().toISOString(),
      },
    })

    return NextResponse.redirect(
      new URL(`/settings?social_success=${encodeURIComponent('LinkedIn connected')}`, req.url)
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('LinkedIn OAuth error:', err)
    return NextResponse.redirect(
      new URL(`/settings?social_error=${encodeURIComponent(msg)}`, req.url)
    )
  }
}
