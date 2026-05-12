import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { getSocialConnections, refreshLinkedInToken } from '@/lib/social/connections'
import {
  uploadImageToStorage,
  publishToFacebook,
  publishToInstagram,
  publishToLinkedIn,
  publishMultiToFacebook,
  publishMultiToInstagram,
  publishMultiToLinkedIn,
  type PublishResult,
} from '@/lib/social/publisher'

export { type PublishResult }

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json() as {
    imageDataUrl?: string
    imageUrls?: string[]
    captions: { facebook?: string; instagram?: string; linkedin?: string }
    platforms: Array<'facebook' | 'instagram' | 'linkedin'>
  }

  const { imageDataUrl, imageUrls, captions, platforms } = body
  const isMulti = Array.isArray(imageUrls) && imageUrls.length > 1

  if (!isMulti && !imageDataUrl) {
    return NextResponse.json({ error: 'imageDataUrl or imageUrls required' }, { status: 400 })
  }
  if (!platforms?.length) {
    return NextResponse.json({ error: 'platforms are required' }, { status: 400 })
  }

  const connections = await getSocialConnections()
  const results: Record<string, PublishResult> = {}

  // ── Multi-image carousel flow ─────────────────────────────────────────────
  if (isMulti) {
    // Upload all images to storage for Meta platforms
    const needsMeta = platforms.includes('facebook') || platforms.includes('instagram')
    const needsLinkedIn = platforms.includes('linkedin')

    let publicUrls: string[] = []
    let imageBuffers: Buffer[] = []

    try {
      if (needsMeta) {
        // imageUrls are already public URLs from the media library
        publicUrls = imageUrls!
      }
      if (needsLinkedIn) {
        // Fetch each image as buffer for LinkedIn upload
        imageBuffers = await Promise.all(
          imageUrls!.map(async (url) => {
            const res = await fetch(url)
            const arrayBuf = await res.arrayBuffer()
            return Buffer.from(arrayBuf)
          })
        )
      }
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Image processing failed' }, { status: 500 })
    }

    if (platforms.includes('facebook')) {
      if (!connections.facebook.connected) {
        results.facebook = { ok: false, error: 'Facebook not connected' }
      } else {
        results.facebook = await publishMultiToFacebook(
          connections.facebook.page_id, connections.facebook.page_access_token,
          publicUrls, captions.facebook ?? ''
        )
      }
    }

    if (platforms.includes('instagram')) {
      if (!connections.instagram.connected) {
        results.instagram = { ok: false, error: 'Instagram not connected' }
      } else {
        results.instagram = await publishMultiToInstagram(
          connections.instagram.ig_user_id, connections.instagram.page_access_token,
          publicUrls, captions.instagram ?? ''
        )
      }
    }

    if (platforms.includes('linkedin')) {
      if (!connections.linkedin.connected) {
        results.linkedin = { ok: false, error: 'LinkedIn not connected' }
      } else {
        const freshConn = await refreshLinkedInToken(connections.linkedin)
        results.linkedin = await publishMultiToLinkedIn(
          freshConn.organization_id, freshConn.access_token,
          imageBuffers, captions.linkedin ?? ''
        )
      }
    }

    return NextResponse.json({ results })
  }

  // ── Single-image flow (existing) ──────────────────────────────────────────
  const base64 = imageDataUrl!.split(',')[1] ?? imageDataUrl!
  let publicUrl = ''
  let imageBuffer: Buffer | null = null

  const needsMeta = platforms.includes('facebook') || platforms.includes('instagram')
  const needsLinkedIn = platforms.includes('linkedin')

  try {
    if (needsMeta) publicUrl = await uploadImageToStorage(base64)
    if (needsLinkedIn) imageBuffer = Buffer.from(base64, 'base64')
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Image upload failed' }, { status: 500 })
  }

  if (platforms.includes('facebook')) {
    if (!connections.facebook.connected) {
      results.facebook = { ok: false, error: 'Facebook not connected' }
    } else {
      results.facebook = await publishToFacebook(connections.facebook.page_id, connections.facebook.page_access_token, publicUrl, captions.facebook ?? '')
    }
  }

  if (platforms.includes('instagram')) {
    if (!connections.instagram.connected) {
      results.instagram = { ok: false, error: 'Instagram not connected' }
    } else {
      results.instagram = await publishToInstagram(connections.instagram.ig_user_id, connections.instagram.page_access_token, publicUrl, captions.instagram ?? '')
    }
  }

  if (platforms.includes('linkedin')) {
    if (!connections.linkedin.connected) {
      results.linkedin = { ok: false, error: 'LinkedIn not connected' }
    } else {
      const freshConn = await refreshLinkedInToken(connections.linkedin)
      results.linkedin = await publishToLinkedIn(freshConn.organization_id, freshConn.access_token, imageBuffer!, captions.linkedin ?? '')
    }
  }

  return NextResponse.json({ results })
}
