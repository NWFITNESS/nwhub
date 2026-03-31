import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

// POST /api/media/record — insert DB record for a file already uploaded to storage
export async function POST(req: NextRequest) {
  try {
    const unauth = await requireAuth()
    if (unauth) return unauth

    const supabase = createAdminClient()
    const { filename, storage_path, url, alt, category, size, width, height } = await req.json()

    if (!filename || !storage_path || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: row, error } = await supabase
      .from('media')
      .insert({ filename, storage_path, url, alt: alt ?? '', category: category ?? 'general', size: size ?? 0, width: width ?? null, height: height ?? null })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Database: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(row)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Unexpected: ${msg}` }, { status: 500 })
  }
}
