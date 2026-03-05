import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// POST /api/blog — create a new blog post
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  const {
    title, slug, excerpt, content, featured_image_url,
    category_id, tags, status, seo_title, seo_description,
  } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title: title.trim(),
      slug: slug?.trim() || slugify(title),
      excerpt: excerpt?.trim() || null,
      content: content || null,
      featured_image_url: featured_image_url?.trim() || null,
      category_id: category_id || null,
      tags: tags ?? [],
      status: status ?? 'draft',
      seo_title: seo_title?.trim() || null,
      seo_description: seo_description?.trim() || null,
      published_at: status === 'published' ? now : null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
