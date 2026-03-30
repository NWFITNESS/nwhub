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
