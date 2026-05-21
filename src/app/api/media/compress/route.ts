import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min for bulk processing

const MAX_WIDTH = 2000
const MAX_HEIGHT = 2000
const JPEG_QUALITY = 80
const WEBP_QUALITY = 80
const PNG_COMPRESSION = 9

/**
 * POST /api/media/compress
 * One-off: downloads every image from Supabase storage, compresses it,
 * and re-uploads. Reports savings.
 */
export async function POST() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()

  // Get all media rows
  const { data: items, error } = await supabase
    .from('media')
    .select('id, storage_path, url, size, filename')
    .order('size', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!items?.length) return NextResponse.json({ message: 'No media found', count: 0 })

  // Only process compressible images
  const compressible = items.filter(i => {
    const ext = i.storage_path?.split('.').pop()?.toLowerCase()
    return ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
  })

  let compressed = 0
  let failed = 0
  let totalSaved = 0
  const results: { file: string; before: number; after: number; saved: number }[] = []

  for (const item of compressible) {
    try {
      // Download from storage
      const { data: blob, error: dlError } = await supabase.storage
        .from('media')
        .download(item.storage_path)

      if (dlError || !blob) { failed++; continue }

      const buffer = Buffer.from(await blob.arrayBuffer())
      const originalSize = buffer.length

      // Skip if already small (under 200KB)
      if (originalSize < 200 * 1024) continue

      const ext = item.storage_path.split('.').pop()?.toLowerCase()
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

      let pipeline = sharp(buffer).rotate()
      const meta = await pipeline.metadata()

      if ((meta.width ?? 0) > MAX_WIDTH || (meta.height ?? 0) > MAX_HEIGHT) {
        pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
      }

      let output: Buffer
      if (mime === 'image/jpeg') {
        output = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer()
      } else if (mime === 'image/png') {
        output = await pipeline.png({ compressionLevel: PNG_COMPRESSION }).toBuffer()
      } else {
        output = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer()
      }

      // Only re-upload if we actually saved space (at least 10%)
      const saved = originalSize - output.length
      if (saved < originalSize * 0.1) continue

      // Re-upload compressed version
      const { error: upError } = await supabase.storage
        .from('media')
        .upload(item.storage_path, output, {
          contentType: mime,
          upsert: true,
        })

      if (upError) { failed++; continue }

      // Update size in DB
      const finalMeta = await sharp(output).metadata()
      await supabase.from('media').update({
        size: output.length,
        width: finalMeta.width ?? null,
        height: finalMeta.height ?? null,
      }).eq('id', item.id)

      totalSaved += saved
      compressed++
      results.push({
        file: item.filename ?? item.storage_path,
        before: originalSize,
        after: output.length,
        saved,
      })
    } catch {
      failed++
    }
  }

  return NextResponse.json({
    message: `Compressed ${compressed} images, saved ${(totalSaved / 1024 / 1024).toFixed(1)}MB`,
    compressed,
    failed,
    skipped: compressible.length - compressed - failed,
    totalSavedBytes: totalSaved,
    totalSavedMB: +(totalSaved / 1024 / 1024).toFixed(1),
    results,
  })
}
