import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'
import sharp from 'sharp'

// Increase Vercel body size limit for file uploads
export const runtime = 'nodejs'
export const maxDuration = 60

// Max dimensions for uploaded images (preserves quality while capping file size)
const MAX_IMAGE_WIDTH = 2000
const MAX_IMAGE_HEIGHT = 2000
const JPEG_QUALITY = 80
const WEBP_QUALITY = 80
const PNG_COMPRESSION = 9

// Compressible image types (skip SVG, GIF — they need special handling)
const COMPRESSIBLE = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * Compress an image buffer using Sharp.
 * Resizes to fit within MAX dimensions and compresses with appropriate codec.
 * Returns { buffer, contentType, width, height }.
 */
async function compressImage(buffer: Buffer, mimeType: string) {
  let pipeline = sharp(buffer).rotate() // auto-rotate from EXIF

  // Get original dimensions
  const meta = await pipeline.metadata()
  const origW = meta.width ?? 0
  const origH = meta.height ?? 0

  // Resize if larger than max
  if (origW > MAX_IMAGE_WIDTH || origH > MAX_IMAGE_HEIGHT) {
    pipeline = pipeline.resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, { fit: 'inside', withoutEnlargement: true })
  }

  let outputBuffer: Buffer
  let outputType = mimeType

  if (mimeType === 'image/jpeg') {
    outputBuffer = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer()
  } else if (mimeType === 'image/png') {
    outputBuffer = await pipeline.png({ compressionLevel: PNG_COMPRESSION }).toBuffer()
  } else {
    // WebP
    outputBuffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer()
  }

  // Get final dimensions
  const finalMeta = await sharp(outputBuffer).metadata()

  return {
    buffer: outputBuffer,
    contentType: outputType,
    width: finalMeta.width ?? origW,
    height: finalMeta.height ?? origH,
  }
}

// POST /api/media — upload a file (auto-compresses images)
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
    let   imgWidth = Number(form.get('width')  ?? 0) || null
    let   imgHeight = Number(form.get('height') ?? 0) || null

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

    const rawBytes = Buffer.from(await file.arrayBuffer())
    let uploadBuffer: Buffer = rawBytes
    let contentType = file.type
    let finalSize = file.size
    const filename = file.name

    // Auto-compress images
    if (COMPRESSIBLE.has(file.type)) {
      try {
        const compressed = await compressImage(rawBytes, file.type)
        uploadBuffer = compressed.buffer
        contentType = compressed.contentType
        finalSize = compressed.buffer.length
        imgWidth = compressed.width
        imgHeight = compressed.height
      } catch {
        // Compression failed — upload original
      }
    }

    const path = `media/${Date.now()}-${filename.replace(/[^a-z0-9.-]/gi, '_')}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, uploadBuffer, { contentType })

    if (uploadError) {
      return NextResponse.json({ error: `Storage: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

    const { data: row, error: dbError } = await supabase
      .from('media')
      .insert({ filename, storage_path: path, url: publicUrl, alt, category, size: finalSize, width: imgWidth, height: imgHeight })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: `Database: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({ ...row, compressed: finalSize < file.size, originalSize: file.size })
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
