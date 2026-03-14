'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Save all live edits directly to content (no draft step) and publish in one shot.
 * Also promotes any pre-existing drafts not covered by liveEdits.
 */
export async function saveAndPublishAction(
  slug: string,
  edits: Record<string, Record<string, unknown>>
) {
  const admin = createAdminClient()
  const editKeys = Object.keys(edits)

  // Write each changed section directly to content
  if (editKeys.length > 0) {
    await Promise.all(
      Object.entries(edits).map(([sectionKey, content]) =>
        admin
          .from('page_content')
          .upsert(
            {
              page_slug: slug,
              section_key: sectionKey,
              content,
              draft_content: null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'page_slug,section_key' }
          )
      )
    )
  }

  // Promote any remaining pre-existing drafts (sections not in liveEdits)
  const query = admin
    .from('page_content')
    .select('id, draft_content')
    .eq('page_slug', slug)
    .not('draft_content', 'is', null)

  const { data: remaining } = editKeys.length > 0
    ? await query.not('section_key', 'in', `(${editKeys.join(',')})`)
    : await query

  if (remaining && remaining.length > 0) {
    await Promise.all(
      remaining.map((row) =>
        admin
          .from('page_content')
          .update({ content: row.draft_content, draft_content: null, updated_at: new Date().toISOString() })
          .eq('id', row.id)
      )
    )
  }

  revalidatePath(`/content/${slug}`)
}

/**
 * Save content to draft_content without touching the live content column.
 * Pass null as content to discard/clear the draft.
 */
export async function saveDraftAction(
  slug: string,
  sectionKey: string,
  content: Record<string, unknown> | null
) {
  const admin = createAdminClient()
  await admin
    .from('page_content')
    .upsert(
      {
        page_slug: slug,
        section_key: sectionKey,
        draft_content: content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'page_slug,section_key' }
    )
  revalidatePath(`/content/${slug}`)
}

/**
 * Publish all pending drafts for a page:
 * copies draft_content → content, then clears draft_content.
 */
export async function publishPageAction(slug: string) {
  const admin = createAdminClient()

  // Fetch all sections that have a pending draft
  const { data: drafts } = await admin
    .from('page_content')
    .select('id, draft_content')
    .eq('page_slug', slug)
    .not('draft_content', 'is', null)

  if (!drafts || drafts.length === 0) return

  // Promote each draft to live content
  await Promise.all(
    drafts.map((row) =>
      admin
        .from('page_content')
        .update({
          content: row.draft_content,
          draft_content: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
    )
  )

  revalidatePath(`/content/${slug}`)
}
