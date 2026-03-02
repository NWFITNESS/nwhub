import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

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
      <main className="p-6">
        <PageHeader
          title="Site Content"
          description="Edit content for each page. Changes are reflected on the live site immediately."
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PAGES.map(({ slug, label }) => {
            const updated = lastUpdated?.[slug]
            return (
              <Link
                key={slug}
                href={`/content/${slug}`}
                className="bg-[#161616] border border-white/[0.08] rounded-xl p-4 hover:border-[#967705]/40 hover:bg-[#967705]/5 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 group-hover:bg-[#967705]/20 group-hover:text-[#c9a70a] transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-white group-hover:text-[#c9a70a] transition-colors">{label}</p>
                <p className="text-xs text-white/30 mt-1">
                  {updated ? `Updated ${formatDistanceToNow(new Date(updated))} ago` : 'Not yet seeded'}
                </p>
              </Link>
            )
          })}
        </div>
      </main>
    </>
  )
}
