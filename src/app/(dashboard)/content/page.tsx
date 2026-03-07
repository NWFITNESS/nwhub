import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContentGrid } from '@/components/content/ContentGrid'

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
      <main className="p-10">
        <PageHeader
          title="Site Content"
          description="Edit content for each page. Changes are reflected on the live site immediately."
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
