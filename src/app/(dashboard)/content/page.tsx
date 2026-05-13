import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContentGrid, type ContentPage as ContentPageType } from '@/components/content/ContentGrid'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const PAGES = [
  { slug: 'home',             label: 'Home'             },
  { slug: 'training',         label: 'Training'         },
  { slug: 'hyrox',            label: 'HYROX'            },
  { slug: 'kids-teens',       label: 'Kids & Teens'     },
  { slug: 'membership',       label: 'Membership'       },
  { slug: 'our-facilities',   label: 'Our Facilities'   },
  { slug: 'start-here',       label: 'Start Here'       },
  { slug: 'team',             label: 'The Team'         },
  { slug: 'why-us',           label: 'Why Us'           },
  { slug: 'results',          label: 'Results'          },
  { slug: 'contact',          label: 'Contact'          },
  { slug: 'personal-training', label: 'Personal Training' },
  { slug: 'physio',           label: 'Advanced Physio'  },
  { slug: 'timetable',        label: 'Timetable'        },
  { slug: 'blog',             label: 'Blog'             },
  { slug: 'membership-terms', label: 'Membership Terms' },
  { slug: 'global',           label: 'Global Settings'  },
]

export default async function ContentPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const [{ data: rows }, { data: seoPages }, { data: constructionRow }, { data: draftRows }] = await Promise.all([
    supabase
      .from('page_content')
      .select('page_slug, updated_at')
      .order('updated_at', { ascending: false }),
    admin
      .from('seo_pages')
      .select('url_path, title, status, template_id, updated_at, seo_templates(name)')
      .eq('status', 'live')
      .order('url_path'),
    admin
      .from('global_settings')
      .select('value')
      .eq('key', 'page_construction')
      .single(),
    supabase
      .from('page_content')
      .select('page_slug')
      .not('draft_content', 'is', null),
  ])

  const constructionMap: Record<string, boolean> = (constructionRow?.value as Record<string, boolean>) ?? {}

  // Count drafts per page
  const draftCounts: Record<string, number> = {}
  for (const row of (draftRows ?? [])) {
    draftCounts[row.page_slug] = (draftCounts[row.page_slug] ?? 0) + 1
  }

  const lastUpdated = rows?.reduce<Record<string, string>>((acc, row) => {
    if (!acc[row.page_slug] || row.updated_at > acc[row.page_slug]) {
      acc[row.page_slug] = row.updated_at
    }
    return acc
  }, {})

  // Group SEO pages by template for sub-page sections
  const templateGroups = new Map<string, { name: string; pages: ContentPageType[] }>()
  for (const p of (seoPages ?? [])) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templateName = (p as any).seo_templates?.name ?? 'Programmatic Pages'
    const templateId = p.template_id ?? 'unknown'
    if (!templateGroups.has(templateId)) {
      templateGroups.set(templateId, { name: templateName, pages: [] })
    }
    // Convert url_path like /kids-classes/whitehaven to a display label
    const pathParts = p.url_path.split('/')
    const townName = pathParts[pathParts.length - 1]
      .split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    templateGroups.get(templateId)!.pages.push({
      slug: p.url_path.replace(/^\//, ''), // strip leading slash for content editor route
      label: townName,
      updated: p.updated_at ?? undefined,
      status: 'published',
    })
  }

  const subPageGroups = Array.from(templateGroups.entries()).map(([id, g]) => ({
    id,
    label: g.name,
    pages: g.pages,
  }))

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Content"
        title="Site"
        titleGold="Content"
        description="Edit content for each page. Changes are reflected on the live site immediately."
        actions={
          <a href={process.env.NEXT_PUBLIC_SITE_URL ?? '#'} target="_blank" rel="noopener noreferrer">
            <Button variant="gold" size="sm"><Globe size={14} /> View Live Site</Button>
          </a>
        }
      />
      <ContentGrid
        pages={PAGES.map(({ slug, label }) => ({
          slug,
          label,
          updated: lastUpdated?.[slug],
          status: constructionMap[slug] ? 'unpublished' as const : (draftCounts[slug] ? 'draft' as const : 'published' as const),
          draftCount: draftCounts[slug] ?? 0,
        }))}
        subPageGroups={subPageGroups}
      />
    </div>
  )
}
