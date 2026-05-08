import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

// POST — save manual edits as a new brief version
// Body: { page_id, changes: Record<block_id, content>, meta_changes?: { title?, description? } }
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { page_id, changes, meta_changes } = await req.json()
  if (!page_id) return NextResponse.json({ error: 'page_id required' }, { status: 400 })

  const supabase = createAdminClient()

  // Get current page + brief
  const { data: page } = await supabase
    .from('seo_pages')
    .select('*, seo_briefs(*)')
    .eq('id', page_id)
    .single()

  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  // Get the current brief content
  let currentContent = ''
  let currentPrompt = ''
  let currentSnapshot = page.data_row ?? {}

  if (page.brief_id) {
    const { data: brief } = await supabase
      .from('seo_briefs')
      .select('*')
      .eq('id', page.brief_id)
      .single()
    if (brief) {
      currentContent = brief.generated_content ?? ''
      currentPrompt = brief.prompt_used ?? ''
      currentSnapshot = brief.data_snapshot ?? page.data_row ?? {}
    }
  }

  // Apply changes to the content
  let newContent = currentContent
  if (changes && typeof changes === 'object') {
    for (const [blockId, content] of Object.entries(changes)) {
      // Replace content within data-nw-editable blocks
      const regex = new RegExp(
        `(data-nw-editable=["']${blockId}["'][^>]*>)([\\s\\S]*?)(</)`,
        'g'
      )
      newContent = newContent.replace(regex, `$1${content}$3`)
    }
  }

  // Apply meta changes
  if (meta_changes?.title) {
    newContent = newContent.replace(/<title>[^<]*<\/title>/, `<title>${meta_changes.title}</title>`)
  }

  const nextVersion = (page.version ?? 0) + 1

  // Create new brief
  const { data: newBrief, error } = await supabase
    .from('seo_briefs')
    .insert({
      page_id,
      version: nextVersion,
      prompt_used: currentPrompt,
      data_snapshot: currentSnapshot,
      generated_content: newContent,
      model: 'manual-edit',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update page
  await supabase
    .from('seo_pages')
    .update({
      version: nextVersion,
      brief_id: newBrief?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', page_id)

  return NextResponse.json({ version: nextVersion, brief_id: newBrief?.id })
}
