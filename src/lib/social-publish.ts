import { createAdminClient } from '@/lib/supabase/admin'

export type PublishResult = {
  ok: boolean
  post_id?: string
  error?: string
}

const META_VERSION = 'v20.0'

// ─── Image upload ─────────────────────────────────────────────────────────────

export async function uploadImageToStorage(base64: string): Promise<string> {
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

export async function publishToFacebook(
  pageId: string,
  pageToken: string,
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  const res = await fetch(`https://graph.facebook.com/${META_VERSION}/${pageId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl, message: caption, published: true, access_token: pageToken }),
  })
  const data = await res.json()
  if (data.error) return { ok: false, error: data.error.message }
  return { ok: true, post_id: data.post_id ?? data.id }
}

// ─── Instagram ────────────────────────────────────────────────────────────────

export async function publishToInstagram(
  igUserId: string,
  pageToken: string,
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  const containerRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: pageToken }),
  })
  const containerData = await containerRes.json()
  if (containerData.error) return { ok: false, error: containerData.error.message }

  const publishRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerData.id, access_token: pageToken }),
  })
  const publishData = await publishRes.json()
  if (publishData.error) return { ok: false, error: publishData.error.message }
  return { ok: true, post_id: publishData.id }
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

export async function publishToLinkedIn(
  orgId: string,
  accessToken: string,
  imageBuffer: Buffer,
  caption: string
): Promise<PublishResult> {
  const orgUrn = `urn:li:organization:${orgId}`

  const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify({
      registerUploadRequest: {
        owner: orgUrn,
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        serviceRelationships: [{ identifier: 'urn:li:userGeneratedContent', relationshipType: 'OWNER' }],
        supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
      },
    }),
  })
  const registerData = await registerRes.json()
  if (registerData.message || registerData.code) {
    return { ok: false, error: registerData.message ?? `LinkedIn error ${registerData.code}` }
  }

  const assetUrn: string = registerData.value?.asset
  const uploadUrl: string = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
  if (!assetUrn || !uploadUrl) return { ok: false, error: 'LinkedIn did not return an upload URL' }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'image/png' },
    body: new Uint8Array(imageBuffer),
  })
  if (!uploadRes.ok) return { ok: false, error: `LinkedIn image upload failed: ${uploadRes.status}` }

  const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify({
      author: orgUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: caption },
          shareMediaCategory: 'IMAGE',
          media: [{ status: 'READY', media: assetUrn, description: { text: 'Northern Warrior Fitness' }, title: { text: 'Northern Warrior' } }],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  })
  const postData = await postRes.json()
  if (postData.message || postData.code) return { ok: false, error: postData.message ?? `LinkedIn post error ${postData.code}` }
  return { ok: true, post_id: postData.id }
}

// ─── Instagram Reels ────────────────────────────────────────────────────────
// Requires a publicly accessible video URL. 3-90 seconds, 9:16 aspect ratio.

export async function publishReelToInstagram(
  igUserId: string,
  pageToken: string,
  videoUrl: string,
  caption: string,
  coverUrl?: string,
  shareToFeed = true,
  audioName?: string,
): Promise<PublishResult> {
  // Step 1: Create media container for REELS
  const containerBody: Record<string, unknown> = {
    media_type: 'REELS',
    video_url: videoUrl,
    caption,
    share_to_feed: shareToFeed,
    access_token: pageToken,
  }
  if (coverUrl) containerBody.cover_url = coverUrl
  if (audioName) containerBody.audio_name = audioName

  const containerRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(containerBody),
  })
  const containerData = await containerRes.json()
  if (containerData.error) return { ok: false, error: containerData.error.message }

  const containerId = containerData.id

  // Step 2: Poll until container is ready (video processing)
  const maxAttempts = 30
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const statusRes = await fetch(
      `https://graph.facebook.com/${META_VERSION}/${containerId}?fields=status_code&access_token=${pageToken}`
    )
    const statusData = await statusRes.json()
    if (statusData.status_code === 'FINISHED') break
    if (statusData.status_code === 'ERROR') {
      return { ok: false, error: 'Instagram video processing failed' }
    }
    // IN_PROGRESS — keep polling
  }

  // Step 3: Publish the container
  const publishRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: pageToken }),
  })
  const publishData = await publishRes.json()
  if (publishData.error) return { ok: false, error: publishData.error.message }
  return { ok: true, post_id: publishData.id }
}

// ─── Facebook Reels ─────────────────────────────────────────────────────────
// Uses the video_reels endpoint with resumable upload

export async function publishReelToFacebook(
  pageId: string,
  pageToken: string,
  videoUrl: string,
  caption: string,
): Promise<PublishResult> {
  // Step 1: Initialize upload session
  const initRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${pageId}/video_reels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_phase: 'start',
      access_token: pageToken,
    }),
  })
  const initData = await initRes.json()
  if (initData.error) return { ok: false, error: initData.error.message }

  const videoId = initData.video_id
  if (!videoId) return { ok: false, error: 'Facebook did not return a video_id' }

  // Step 2: Upload the video via URL
  const videoRes = await fetch(videoUrl)
  if (!videoRes.ok) return { ok: false, error: 'Failed to fetch video for upload' }
  const videoBuffer = await videoRes.arrayBuffer()
  const videoSize = videoBuffer.byteLength

  const uploadRes = await fetch(`https://rupload.facebook.com/video-upload/${META_VERSION}/${videoId}`, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${pageToken}`,
      'Content-Type': 'application/octet-stream',
      offset: '0',
      file_size: String(videoSize),
    },
    body: new Uint8Array(videoBuffer),
  })
  const uploadData = await uploadRes.json()
  if (uploadData.error) return { ok: false, error: uploadData.error.message }

  // Step 3: Finish upload and publish
  const finishRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${pageId}/video_reels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_phase: 'finish',
      video_id: videoId,
      title: caption.slice(0, 100),
      description: caption,
      access_token: pageToken,
    }),
  })
  const finishData = await finishRes.json()
  if (finishData.error) return { ok: false, error: finishData.error.message }
  return { ok: true, post_id: finishData.video_id ?? videoId }
}

// ─── LinkedIn Video ─────────────────────────────────────────────────────────
// Uses the videos API: register → upload → create post with video URN

export async function publishVideoToLinkedIn(
  orgId: string,
  accessToken: string,
  videoUrl: string,
  caption: string,
): Promise<PublishResult> {
  const orgUrn = `urn:li:organization:${orgId}`

  // Step 1: Fetch video for size
  const videoRes = await fetch(videoUrl)
  if (!videoRes.ok) return { ok: false, error: 'Failed to fetch video for LinkedIn upload' }
  const videoBuffer = await videoRes.arrayBuffer()
  const videoSize = videoBuffer.byteLength

  // Step 2: Register video upload
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
        recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
        serviceRelationships: [{ identifier: 'urn:li:userGeneratedContent', relationshipType: 'OWNER' }],
        supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
      },
    }),
  })
  const registerData = await registerRes.json()
  if (registerData.message || registerData.code) {
    return { ok: false, error: registerData.message ?? `LinkedIn register error ${registerData.code}` }
  }

  const assetUrn: string = registerData.value?.asset
  const uploadUrl: string = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
  if (!assetUrn || !uploadUrl) return { ok: false, error: 'LinkedIn did not return a video upload URL' }

  // Step 3: Upload video
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'video/mp4',
      'Content-Length': String(videoSize),
    },
    body: new Uint8Array(videoBuffer),
  })
  if (!uploadRes.ok) return { ok: false, error: `LinkedIn video upload failed: ${uploadRes.status}` }

  // Step 4: Create post with video
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
          shareMediaCategory: 'VIDEO',
          media: [{
            status: 'READY',
            media: assetUrn,
            description: { text: 'Northern Warrior Fitness' },
            title: { text: 'Northern Warrior' },
          }],
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

// ─── Multi-image: Facebook ───────────────────────────────────────────────────
// Upload each photo as unpublished, then create a feed post with attached_media

export async function publishMultiToFacebook(
  pageId: string,
  pageToken: string,
  imageUrls: string[],
  caption: string,
): Promise<PublishResult> {
  // Step 1: Upload each photo as unpublished
  const photoIds: string[] = []
  for (const url of imageUrls) {
    const res = await fetch(`https://graph.facebook.com/${META_VERSION}/${pageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, published: false, access_token: pageToken }),
    })
    const data = await res.json()
    if (data.error) return { ok: false, error: `Photo upload failed: ${data.error.message}` }
    photoIds.push(data.id)
  }

  // Step 2: Create feed post with all photos attached
  const attachedMedia = photoIds.map((id) => ({ media_fbid: id }))
  const postRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: caption,
      attached_media: attachedMedia,
      access_token: pageToken,
    }),
  })
  const postData = await postRes.json()
  if (postData.error) return { ok: false, error: postData.error.message }
  return { ok: true, post_id: postData.id }
}

// ─── Multi-image: Instagram (Carousel) ───────────────────────────────────────
// Create a container per image, then a carousel container, then publish

export async function publishMultiToInstagram(
  igUserId: string,
  pageToken: string,
  imageUrls: string[],
  caption: string,
): Promise<PublishResult> {
  // Step 1: Create sub-containers for each image
  const childIds: string[] = []
  for (const url of imageUrls) {
    const res = await fetch(`https://graph.facebook.com/${META_VERSION}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: pageToken }),
    })
    const data = await res.json()
    if (data.error) return { ok: false, error: `IG container failed: ${data.error.message}` }
    childIds.push(data.id)
  }

  // Step 2: Create carousel container
  const carouselRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      caption,
      access_token: pageToken,
    }),
  })
  const carouselData = await carouselRes.json()
  if (carouselData.error) return { ok: false, error: carouselData.error.message }

  // Step 3: Publish
  const publishRes = await fetch(`https://graph.facebook.com/${META_VERSION}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: carouselData.id, access_token: pageToken }),
  })
  const publishData = await publishRes.json()
  if (publishData.error) return { ok: false, error: publishData.error.message }
  return { ok: true, post_id: publishData.id }
}

// ─── Multi-image: LinkedIn ───────────────────────────────────────────────────
// Register + upload each image, then create ugcPost with multiple media assets

export async function publishMultiToLinkedIn(
  orgId: string,
  accessToken: string,
  imageBuffers: Buffer[],
  caption: string,
): Promise<PublishResult> {
  const orgUrn = `urn:li:organization:${orgId}`
  const assetUrns: string[] = []

  for (const buf of imageBuffers) {
    // Register upload
    const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
      body: JSON.stringify({
        registerUploadRequest: {
          owner: orgUrn,
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          serviceRelationships: [{ identifier: 'urn:li:userGeneratedContent', relationshipType: 'OWNER' }],
          supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
        },
      }),
    })
    const registerData = await registerRes.json()
    if (registerData.message || registerData.code) {
      return { ok: false, error: registerData.message ?? `LinkedIn register error ${registerData.code}` }
    }

    const assetUrn: string = registerData.value?.asset
    const uploadUrl: string = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
    if (!assetUrn || !uploadUrl) return { ok: false, error: 'LinkedIn did not return an upload URL' }

    // Upload image
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'image/png' },
      body: new Uint8Array(buf),
    })
    if (!uploadRes.ok) return { ok: false, error: `LinkedIn image upload failed: ${uploadRes.status}` }

    assetUrns.push(assetUrn)
  }

  // Create post with multiple media
  const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify({
      author: orgUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: caption },
          shareMediaCategory: 'IMAGE',
          media: assetUrns.map((urn) => ({
            status: 'READY',
            media: urn,
            description: { text: 'Northern Warrior Fitness' },
            title: { text: 'Northern Warrior' },
          })),
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  })
  const postData = await postRes.json()
  if (postData.message || postData.code) return { ok: false, error: postData.message ?? `LinkedIn post error ${postData.code}` }
  return { ok: true, post_id: postData.id }
}
