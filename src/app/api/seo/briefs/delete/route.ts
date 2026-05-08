import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

// POST — delete a brief version (cannot delete current version)
// Body: { page_id, version }
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { page_id, version } = await req.json()
  if (!page_id || version == null) {
    return NextResponse.json({ error: 'page_id and version required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Check this isn't the current version
  const { data: page } = await supabase
    .from('seo_pages')
    .select('version')
    .eq('id', page_id)
    .single()

  if (page?.version === version) {
    return NextResponse.json({ error: 'Cannot delete the current version' }, { status: 400 })
  }

  const { error } = await supabase
    .from('seo_briefs')
    .delete()
    .eq('page_id', page_id)
    .eq('version', version)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
