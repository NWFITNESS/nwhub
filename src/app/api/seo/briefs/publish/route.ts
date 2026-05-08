import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

// POST — set a specific brief version as the current (published) version
// Body: { page_id, version }
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { page_id, version } = await req.json()
  if (!page_id || version == null) {
    return NextResponse.json({ error: 'page_id and version required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: brief } = await supabase
    .from('seo_briefs')
    .select('id')
    .eq('page_id', page_id)
    .eq('version', version)
    .single()

  if (!brief) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }

  await supabase
    .from('seo_pages')
    .update({ version, brief_id: brief.id, updated_at: new Date().toISOString() })
    .eq('id', page_id)

  return NextResponse.json({ success: true, version, brief_id: brief.id })
}
