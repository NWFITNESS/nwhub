import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/media — upload a file
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const path = `media/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, '_')}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, bytes, { contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

  const { data: row, error: dbError } = await supabase
    .from('media')
    .insert({ filename: file.name, storage_path: path, public_url: publicUrl, file_size: file.size, mime_type: file.type })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(row)
}

// DELETE /api/media — delete a file by id
export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient()
  const { id, storage_path } = await req.json()
  if (!id || !storage_path) return NextResponse.json({ error: 'Missing id or storage_path' }, { status: 400 })

  await supabase.storage.from('media').remove([storage_path])
  await supabase.from('media').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
