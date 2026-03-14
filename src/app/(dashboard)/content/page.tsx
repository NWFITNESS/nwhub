import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContentGrid } from '@/components/content/ContentGrid'
import { Globe } from 'lucide-react'

const PAGES = [
  { slug: 'home', label: 'Home' },
  { slug: 'training', label: 'Training' },
  { slug: 'hyrox', label: 'Hyrox' },
  { slug: 'kids-teens', label: 'Kids & Teens' },
  { slug: 'membership', label: 'Membership' },
  { slug: 'our-facilities', label: 'Our Facilities' },
  { slug: 'start-here', label: 'Start Here' },
  { slug: 'team', label: 'The Team' },
  { slug: 'contact', label: 'Contact' },
  { slug: 'timetable', label: 'Timetable' },
  { slug: 'membership-terms', label: 'Membership Terms' },
  { slug: 'global', label: 'Global Settings' },
]

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('page_content')
    .select('page_slug, updated_at')
    .order('updated_at', { ascending: false })

  const lastUpdated = rows?.reduce<Record<string, string>>((acc, row) => {
    if (!acc[row.page_slug] || row.updated_at > acc[row.page_slug]) {
      acc[row.page_slug] = row.updated_at
    }
    return acc
  }, {})

  return (
    <>
      <TopBar title="Content" />
      <main className="flex flex-col gap-6 p-4 lg:p-8 min-h-[calc(100vh-5rem)]">
        <PageHeader
          title="Site Content"
          description="Edit content for each page. Changes are reflected on the live site immediately."
          actions={
            <a
              href={process.env.NEXT_PUBLIC_SITE_URL ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                         text-black bg-gradient-to-r from-[#967705] to-[#C9A70A]
                         hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(201,167,10,0.25)]"
            >
              <Globe size={15} />
              View Live Site
            </a>
          }
        />
        <ContentGrid
          pages={PAGES.map(({ slug, label }) => ({
            slug,
            label,
            updated: lastUpdated?.[slug],
          }))}
        />
      </main>
    </>
  )
}
