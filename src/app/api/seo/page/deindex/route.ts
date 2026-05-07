import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

// POST — deindex a page (soft delete — marks as deindexed, doesn't remove from DB)
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { page_id } = await req.json()
  if (!page_id) {
    return NextResponse.json({ error: 'page_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('seo_pages')
    .update({ status: 'deindexed', updated_at: new Date().toISOString() })
    .eq('id', page_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
