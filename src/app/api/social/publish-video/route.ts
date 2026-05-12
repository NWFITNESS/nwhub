import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { getSocialConnections, refreshLinkedInToken } from '@/lib/social/connections'
import {
  publishReelToInstagram,
  publishReelToFacebook,
  publishVideoToLinkedIn,
  type PublishResult,
} from '@/lib/social/publisher'

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json() as {
    videoUrl: string
    captions: { facebook?: string; instagram?: string; linkedin?: string }
    platforms: Array<'facebook' | 'instagram' | 'linkedin'>
    coverUrl?: string
    shareToFeed?: boolean
    audioName?: string
  }

  const { videoUrl, captions, platforms, coverUrl, shareToFeed = true, audioName } = body

  if (!videoUrl) {
    return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 })
  }
  if (!platforms?.length) {
    return NextResponse.json({ error: 'platforms are required' }, { status: 400 })
  }

  const connections = await getSocialConnections()
  const results: Record<string, PublishResult> = {}

  if (platforms.includes('instagram')) {
    if (!connections.instagram.connected) {
      results.instagram = { ok: false, error: 'Instagram not connected' }
    } else {
      results.instagram = await publishReelToInstagram(
        connections.instagram.ig_user_id,
        connections.instagram.page_access_token,
        videoUrl,
        captions.instagram ?? '',
        coverUrl,
        shareToFeed,
        audioName,
      )
    }
  }

  if (platforms.includes('facebook')) {
    if (!connections.facebook.connected) {
      results.facebook = { ok: false, error: 'Facebook not connected' }
    } else {
      results.facebook = await publishReelToFacebook(
        connections.facebook.page_id,
        connections.facebook.page_access_token,
        videoUrl,
        captions.facebook ?? '',
      )
    }
  }

  if (platforms.includes('linkedin')) {
    if (!connections.linkedin.connected) {
      results.linkedin = { ok: false, error: 'LinkedIn not connected' }
    } else {
      const freshConn = await refreshLinkedInToken(connections.linkedin)
      results.linkedin = await publishVideoToLinkedIn(
        freshConn.organization_id,
        freshConn.access_token,
        videoUrl,
        captions.linkedin ?? '',
      )
    }
  }

  return NextResponse.json({ results })
}
