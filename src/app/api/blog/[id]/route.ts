import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// PATCH /api/blog/[id] — update post or toggle status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await req.json()
  const now = new Date().toISOString()

  // Quick status toggle (only status field sent)
  if (Object.keys(body).length === 1 && 'status' in body) {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        status: body.status,
        published_at: body.status === 'published' ? now : null,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Full update
  const {
    title, slug, excerpt, content, featured_image_url,
    category_id, tags, status, seo_title, seo_description,
    published_at, author,
  } = body

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      title: title?.trim(),
      slug: slug?.trim() || (title ? slugify(title) : undefined),
      excerpt: excerpt?.trim() || null,
      content: content ?? null,
      featured_image_url: featured_image_url?.trim() || null,
      category_id: category_id || null,
      tags: tags ?? [],
      status: status ?? 'draft',
      author: author?.trim() || null,
      seo_title: seo_title?.trim() || null,
      seo_description: seo_description?.trim() || null,
      published_at: status === 'published'
        ? (published_at ?? now)
        : null,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/blog/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
