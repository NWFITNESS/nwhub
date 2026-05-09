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

  // Check exact match first, then fall back to template defaults for programmatic pages
  let defaults = PAGE_SECTION_DEFAULTS[slug]
  if (!defaults && slug.startsWith('kids-classes/')) {
    const town = slug.replace('kids-classes/', '')
    const townDisplay = town.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    defaults = {
      town_hero_image: {
        image_url: '',
        image_position: '50% 50%',
        alt: `Kids training at Northern Warrior`,
        caption: '',
      },
      town_gallery: {
        heading: `${townDisplay} warriors in action`,
        items: [
          { image_url: '', alt: 'Kids session photo 1', image_position: '50% 50%' },
          { image_url: '', alt: 'Kids session photo 2', image_position: '50% 50%' },
          { image_url: '', alt: 'Kids session photo 3', image_position: '50% 50%' },
          { image_url: '', alt: 'Kids session photo 4', image_position: '50% 50%' },
        ],
      },
      town_coaches: {
        heading: 'Meet the coaches',
        items: [
          { name: 'Mathew Tomkinson', role: 'Head Kids Coach', image_url: '', image_position: '50% 30%', bio: 'Paediatric first aid, full DBS clearance. Runs every session.' },
          { name: 'Lauren', role: 'Assistant Coach', image_url: '', image_position: '50% 30%', bio: 'Level 3 Sport Science, first aid, DBS clearance.' },
        ],
      },
      town_feature_image: {
        image_url: '',
        image_position: '50% 50%',
        alt: 'Northern Warrior gym facility',
        caption: `Our gym in Egremont`,
      },
    }
  }
  if (!defaults) defaults = {}

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
