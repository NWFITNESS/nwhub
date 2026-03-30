import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { MediaGrid } from '@/components/media/MediaGrid'

export default async function MediaPage() {
  const supabase = await createClient()
  const { data: media } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="bg-nw-900 min-h-screen">
      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader eyebrow="Admin Panel" title="Media" titleGold="Library" description={`${media?.length ?? 0} files`} />
        <MediaGrid initialMedia={media ?? []} />
      </main>
    </div>
  )
}
