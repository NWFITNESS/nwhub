import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { VisualEditorPage } from '@/components/content/VisualEditorPage'
import { saveDraftAction, publishPageAction, saveAndPublishAction } from './actions'

interface Props {
  params: Promise<{ slug: string }>
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  training: 'Training',
  hyrox: 'Hyrox',
  'kids-teens': 'Kids & Teens',
  membership: 'Membership',
  'our-facilities': 'Our Facilities',
  'start-here': 'Start Here',
  team: 'The Team',
  contact: 'Contact',
  timetable: 'Timetable',
  'membership-terms': 'Membership Terms',
  global: 'Global Settings',
}

export type PageSection = {
  section_key: string
  sort_order: number | null
  content: Record<string, unknown>
  draft_content: Record<string, unknown> | null
  updated_at: string
}

export default async function ContentEditorPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: sections, error: sectionsError } = await supabase
    .from('page_content')
    .select('section_key, sort_order, content, draft_content, updated_at')
    .eq('page_slug', slug)

  const sortedSections = (sections ?? []).slice().sort((a, b) => {
    const aOrder = a.sort_order ?? 9999
    const bOrder = b.sort_order ?? 9999
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.section_key.localeCompare(b.section_key)
  })

  const label = PAGE_LABELS[slug] ?? slug
  const draftCount = sortedSections.filter((s) => s.draft_content != null).length

  return (
    <>
      <TopBar title={`Content — ${label}`} />
      <VisualEditorPage
        slug={slug}
        label={label}
        sections={sortedSections as PageSection[]}
        draftCount={draftCount}
        saveDraftAction={saveDraftAction}
        publishPageAction={publishPageAction}
        saveAndPublishAction={saveAndPublishAction}
      />
    </>
  )
}
