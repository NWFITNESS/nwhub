import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSocialConnections, refreshLinkedInToken } from '@/lib/social'
import {
  publishToFacebook,
  publishToInstagram,
  publishToLinkedIn,
  type PublishResult,
} from '@/lib/social-publish'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts?.length) return NextResponse.json({ processed: 0 })

  const connections = await getSocialConnections()
  let processed = 0

  for (const post of posts) {
    const results: Record<string, PublishResult> = {}
    const platforms: string[] = post.platforms ?? []
    const captions: Record<string, string> = post.captions ?? {}
    const imageUrl: string = post.image_url

    // Fetch image buffer for LinkedIn upfront
    let imageBuffer: Buffer | null = null
    if (platforms.includes('linkedin') && connections.linkedin.connected) {
      try {
        const imgRes = await fetch(imageUrl)
        imageBuffer = Buffer.from(await imgRes.arrayBuffer())
      } catch {
        results.linkedin = { ok: false, error: 'Failed to fetch image for LinkedIn' }
      }
    }

    if (platforms.includes('facebook')) {
      results.facebook = connections.facebook.connected
        ? await publishToFacebook(connections.facebook.page_id, connections.facebook.page_access_token, imageUrl, captions.facebook ?? '')
        : { ok: false, error: 'Facebook not connected' }
    }

    if (platforms.includes('instagram')) {
      results.instagram = connections.instagram.connected
        ? await publishToInstagram(connections.instagram.ig_user_id, connections.instagram.page_access_token, imageUrl, captions.instagram ?? '')
        : { ok: false, error: 'Instagram not connected' }
    }

    if (platforms.includes('linkedin') && imageBuffer && !results.linkedin) {
      if (!connections.linkedin.connected) {
        results.linkedin = { ok: false, error: 'LinkedIn not connected' }
      } else {
        const freshConn = await refreshLinkedInToken(connections.linkedin)
        results.linkedin = await publishToLinkedIn(freshConn.organization_id, freshConn.access_token, imageBuffer, captions.linkedin ?? '')
      }
    }

    const values = Object.values(results)
    const newStatus = values.length === 0 ? 'failed' : values.every((r) => r.ok) ? 'published' : 'partial'

    await supabase
      .from('scheduled_posts')
      .update({ status: newStatus, results })
      .eq('id', post.id)

    processed++
  }

  return NextResponse.json({ processed })
}
