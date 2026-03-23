import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSocialConnections, refreshLinkedInToken } from '@/lib/social'

const META_VERSION = 'v20.0'

export type PublishResult = {
  ok: boolean
  post_id?: string
  error?: string
}

// ─── Image upload to Supabase storage → public URL ───────────────────────────

async function uploadImageToStorage(base64: string): Promise<string> {
  const supabase = createAdminClient()
  const buffer = Buffer.from(base64, 'base64')
  const path = `social-posts/${Date.now()}.png`

  const { error } = await supabase.storage
    .from('media')
    .upload(path, buffer, { contentType: 'image/png', upsert: false })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
  return publicUrl
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

async function publishToFacebook(
  pageId: string,
  pageToken: string,
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  const res = await fetch(`https://graph.facebook.com/${META_VERSION}/${pageId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: imageUrl,
      message: caption,
      published: true,
      access_token: pageToken,
    }),
  })
  const data = await res.json()
  if (data.error) return { ok: false, error: data.error.message }
  return { ok: true, post_id: data.post_id ?? data.id }
}

// ─── Instagram ────────────────────────────────────────────────────────────────

async function publishToInstagram(
  igUserId: string,
  pageToken: string,
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  // Step 1 — create media container
  const containerRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: pageToken,
    }),
  })
  const containerData = await containerRes.json()
  if (containerData.error) return { ok: false, error: containerData.error.message }

  const containerId: string = containerData.id

  // Step 2 — publish
  const publishRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: pageToken,
    }),
  })
  const publishData = await publishRes.json()
  if (publishData.error) return { ok: false, error: publishData.error.message }

  return { ok: true, post_id: publishData.id }
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

async function publishToLinkedIn(
  orgId: string,
  accessToken: string,
  imageBuffer: Buffer<ArrayBufferLike>,
  caption: string
): Promise<PublishResult> {
  const orgUrn = `urn:li:organization:${orgId}`

  // Step 1 — register upload
  const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        owner: orgUrn,
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        serviceRelationships: [
          { identifier: 'urn:li:userGeneratedContent', relationshipType: 'OWNER' },
        ],
        supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
      },
    }),
  })
  const registerData = await registerRes.json()
  if (registerData.message || registerData.code) {
    return { ok: false, error: registerData.message ?? `LinkedIn error ${registerData.code}` }
  }

  const assetUrn: string = registerData.value?.asset
  const uploadUrl: string =
    registerData.value?.uploadMechanism?.[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ]?.uploadUrl

  if (!assetUrn || !uploadUrl) {
    return { ok: false, error: 'LinkedIn did not return an upload URL' }
  }

  // Step 2 — upload binary (convert Buffer → Uint8Array for fetch BodyInit compatibility)
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'image/png',
    },
    body: new Uint8Array(imageBuffer),
  })
  if (!uploadRes.ok) {
    return { ok: false, error: `LinkedIn image upload failed: ${uploadRes.status}` }
  }

  // Step 3 — create post
  const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: orgUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: caption },
          shareMediaCategory: 'IMAGE',
          media: [
            {
              status: 'READY',
              media: assetUrn,
              description: { text: 'Northern Warrior Fitness' },
              title: { text: 'Northern Warrior' },
            },
          ],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  })
  const postData = await postRes.json()
  if (postData.message || postData.code) {
    return { ok: false, error: postData.message ?? `LinkedIn post error ${postData.code}` }
  }

  return { ok: true, post_id: postData.id }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { imageDataUrl, captions, platforms } = await req.json() as {
    imageDataUrl: string
    captions: { facebook?: string; instagram?: string; linkedin?: string }
    platforms: Array<'facebook' | 'instagram' | 'linkedin'>
  }

  if (!imageDataUrl || !platforms?.length) {
    return NextResponse.json({ error: 'imageDataUrl and platforms are required' }, { status: 400 })
  }

  const connections = await getSocialConnections()
  const results: Record<string, PublishResult> = {}

  // Parse the base64 dataUrl
  const base64 = imageDataUrl.split(',')[1] ?? imageDataUrl
  let publicUrl = ''
  let imageBuffer: Buffer<ArrayBufferLike> | null = null

  // We need a public URL for Meta (Facebook/Instagram)
  // We need the buffer for LinkedIn
  const needsMeta = platforms.includes('facebook') || platforms.includes('instagram')
  const needsLinkedIn = platforms.includes('linkedin')

  try {
    if (needsMeta) {
      publicUrl = await uploadImageToStorage(base64)
    }
    if (needsLinkedIn) {
      imageBuffer = Buffer.from(base64, 'base64')
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Image upload failed' },
      { status: 500 }
    )
  }

  // ── Facebook ───────────────────────────────────────────────────────────────
  if (platforms.includes('facebook')) {
    if (!connections.facebook.connected) {
      results.facebook = { ok: false, error: 'Facebook not connected' }
    } else {
      results.facebook = await publishToFacebook(
        connections.facebook.page_id,
        connections.facebook.page_access_token,
        publicUrl,
        captions.facebook ?? ''
      )
    }
  }

  // ── Instagram ──────────────────────────────────────────────────────────────
  if (platforms.includes('instagram')) {
    if (!connections.instagram.connected) {
      results.instagram = { ok: false, error: 'Instagram not connected' }
    } else {
      results.instagram = await publishToInstagram(
        connections.instagram.ig_user_id,
        connections.instagram.page_access_token,
        publicUrl,
        captions.instagram ?? ''
      )
    }
  }

  // ── LinkedIn ───────────────────────────────────────────────────────────────
  if (platforms.includes('linkedin')) {
    if (!connections.linkedin.connected) {
      results.linkedin = { ok: false, error: 'LinkedIn not connected' }
    } else {
      // Refresh token if needed
      const freshConn = await refreshLinkedInToken(connections.linkedin)
      results.linkedin = await publishToLinkedIn(
        freshConn.organization_id,
        freshConn.access_token,
        imageBuffer!,
        captions.linkedin ?? ''
      )
    }
  }

  return NextResponse.json({ results })
}
