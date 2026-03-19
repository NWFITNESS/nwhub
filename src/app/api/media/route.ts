import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

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

    const bytes       = await file.arrayBuffer()
    const contentType = file.type || 'application/octet-stream'
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
