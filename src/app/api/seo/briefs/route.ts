import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

// GET — list all briefs for a page, or get a specific brief
// ?page_id=xxx — list all versions
// ?id=xxx — get single brief with full content
export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()
  const pageId = req.nextUrl.searchParams.get('page_id')
  const briefId = req.nextUrl.searchParams.get('id')

  if (briefId) {
    const { data, error } = await supabase
      .from('seo_briefs')
      .select('*')
      .eq('id', briefId)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (pageId) {
    const { data, error } = await supabase
      .from('seo_briefs')
      .select('id, page_id, version, model, generated_at')
      .eq('page_id', pageId)
      .order('version', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'page_id or id required' }, { status: 400 })
}
