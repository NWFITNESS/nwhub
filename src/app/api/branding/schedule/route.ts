import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadImageToStorage } from '@/lib/social/publisher'

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('id, platforms, captions, scheduled_at, status, image_url, created_at')
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { imageDataUrl, captions, platforms, scheduledAt } = await req.json() as {
    imageDataUrl: string
    captions: Record<string, string>
    platforms: string[]
    scheduledAt: string
  }

  if (!imageDataUrl || !platforms?.length || !scheduledAt) {
    return NextResponse.json({ error: 'imageDataUrl, platforms and scheduledAt are required' }, { status: 400 })
  }

  // Upload image to storage now so we have a stable URL
  let imageUrl: string
  try {
    const base64 = imageDataUrl.split(',')[1] ?? imageDataUrl
    imageUrl = await uploadImageToStorage(base64)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Image upload failed' }, { status: 500 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('scheduled_posts')
    .insert({ image_url: imageUrl, captions, platforms, scheduled_at: scheduledAt, status: 'pending' })
    .select('id, platforms, captions, scheduled_at, status, image_url, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
