import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VisualEditorPage } from '@/components/content/VisualEditorPage'
import { saveDraftAction, publishPageAction, saveAndPublishAction, toggleConstructionAction } from './actions'
import { PAGE_SECTION_DEFAULTS } from '@/lib/content-defaults'

interface Props {
  params: Promise<{ slug: string[] }>
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
  'personal-training': 'Personal Training (KM)',
  physio: 'Advanced Physio',
  timetable: 'Timetable',
  blog: 'Blog',
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
  const { slug: slugParts } = await params
  const slug = Array.isArray(slugParts) ? slugParts.join('/') : slugParts
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

  // Generate label: check static labels first, then derive from slug
  let label = PAGE_LABELS[slug]
  if (!label) {
    // For programmatic pages like kids-classes/whitehaven → "Kids Classes — Whitehaven"
    const parts = slug.split('/')
    label = parts.map(p => p.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(' — ')
  }
  const draftCount = sortedSections.filter((s) => s.draft_content != null).length

  const defaults = PAGE_SECTION_DEFAULTS[slug] ?? {}

  // Check construction mode
  const admin = createAdminClient()
  const { data: constructionData } = await admin
    .from('global_settings')
    .select('value')
    .eq('key', 'page_construction')
    .single()
  const constructionMap = (constructionData?.value as Record<string, boolean>) ?? {}
  const isUnderConstruction = constructionMap[slug] ?? false

  return (
    <>
      <VisualEditorPage
        slug={slug}
        label={label}
        sections={sortedSections as PageSection[]}
        draftCount={draftCount}
        defaults={defaults}
        saveDraftAction={saveDraftAction}
        publishPageAction={publishPageAction}
        saveAndPublishAction={saveAndPublishAction}
        toggleConstructionAction={toggleConstructionAction}
        isUnderConstruction={isUnderConstruction}
      />
    </>
  )
}
