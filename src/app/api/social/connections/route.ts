import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { getSocialConnections, saveSocialConnections } from '@/lib/social/connections'

/** GET — returns connection status without exposing access tokens */
export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const connections = await getSocialConnections()

  return NextResponse.json({
    facebook: connections.facebook.connected
      ? { connected: true, page_name: connections.facebook.page_name, page_id: connections.facebook.page_id, connected_at: connections.facebook.connected_at }
      : { connected: false },
    instagram: connections.instagram.connected
      ? { connected: true, username: connections.instagram.username, ig_user_id: connections.instagram.ig_user_id, connected_at: connections.instagram.connected_at }
      : { connected: false },
    linkedin: connections.linkedin.connected
      ? { connected: true, organization_name: connections.linkedin.organization_name, organization_id: connections.linkedin.organization_id, connected_at: connections.linkedin.connected_at, expires_at: connections.linkedin.expires_at }
      : { connected: false },
  })
}

/** DELETE ?platform=facebook|instagram|linkedin — disconnect a platform */
export async function DELETE(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const platform = req.nextUrl.searchParams.get('platform')
  if (!platform || !['facebook', 'instagram', 'linkedin'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  const existing = await getSocialConnections()

  // Disconnecting Facebook also disconnects Instagram (same token)
  if (platform === 'facebook') {
    await saveSocialConnections({
      ...existing,
      facebook: { connected: false },
      instagram: { connected: false },
    })
  } else {
    await saveSocialConnections({
      ...existing,
      [platform]: { connected: false },
    })
  }

  return NextResponse.json({ ok: true })
}
