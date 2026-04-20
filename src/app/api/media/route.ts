import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

// Increase Vercel body size limit for file uploads
export const runtime = 'nodejs'
export const maxDuration = 60

// POST /api/media — upload a file
export async function POST(req: NextRequest) {
  try {
    const unauth = await requireAuth()
    if (unauth) return unauth

    const supabase = createAdminClient()

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const alt      = (form.get('alt')      as string | null) ?? ''
    const category = (form.get('category') as string | null) ?? 'general'
    const width    = Number(form.get('width')  ?? 0) || null
    const height   = Number(form.get('height') ?? 0) || null

    // Validate file type
    const ALLOWED_MIME_TYPES = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
    ]
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" not allowed. Accepted: images, videos, PDFs.` },
        { status: 400 }
      )
    }

    // Validate file size (120 MB max)
    const MAX_FILE_SIZE = 120 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 120 MB.' },
        { status: 413 }
      )
    }

    const bytes       = await file.arrayBuffer()
    const contentType = file.type
    const filename    = file.name
    const size        = file.size

    const path = `media/${Date.now()}-${filename.replace(/[^a-z0-9.-]/gi, '_')}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, bytes, { contentType })

    if (uploadError) {
      return NextResponse.json({ error: `Storage: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

    const { data: row, error: dbError } = await supabase
      .from('media')
      .insert({ filename, storage_path: path, url: publicUrl, alt, category, size, width, height })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: `Database: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json(row)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Unexpected: ${msg}` }, { status: 500 })
  }
}

// PATCH /api/media — update alt and category
export async function PATCH(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()
  const { id, alt, category } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: row, error } = await supabase
    .from('media')
    .update({ alt, category })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(row)
}

// DELETE /api/media — delete a file by id
export async function DELETE(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()
  const { id, storage_path } = await req.json()
  if (!id || !storage_path) return NextResponse.json({ error: 'Missing id or storage_path' }, { status: 400 })

  await supabase.storage.from('media').remove([storage_path])
  await supabase.from('media').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
