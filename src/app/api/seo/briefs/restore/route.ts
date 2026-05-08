import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

// POST — restore an old brief version as a new version
// Body: { page_id, from_version }
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { page_id, from_version } = await req.json()
  if (!page_id || from_version == null) {
    return NextResponse.json({ error: 'page_id and from_version required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Get the source brief
  const { data: source } = await supabase
    .from('seo_briefs')
    .select('*')
    .eq('page_id', page_id)
    .eq('version', from_version)
    .single()

  if (!source) {
    return NextResponse.json({ error: 'Source version not found' }, { status: 404 })
  }

  // Get current max version
  const { data: page } = await supabase
    .from('seo_pages')
    .select('version')
    .eq('id', page_id)
    .single()

  const nextVersion = (page?.version ?? from_version) + 1

  // Create new brief from old content
  const { data: newBrief, error } = await supabase
    .from('seo_briefs')
    .insert({
      page_id,
      version: nextVersion,
      prompt_used: source.prompt_used,
      data_snapshot: source.data_snapshot,
      generated_content: source.generated_content,
      model: `restored-from-v${from_version}`,
    })
    .select('id, version')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update page
  await supabase
    .from('seo_pages')
    .update({ version: nextVersion, brief_id: newBrief?.id, updated_at: new Date().toISOString() })
    .eq('id', page_id)

  return NextResponse.json({ version: nextVersion, brief_id: newBrief?.id })
}
