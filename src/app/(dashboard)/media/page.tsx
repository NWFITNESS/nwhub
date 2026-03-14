import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { MediaGrid } from '@/components/media/MediaGrid'

export default async function MediaPage() {
  const supabase = await createClient()
  const { data: media } = await supabase
    .from('media')
    .select('*')
    .order('uploaded_at', { ascending: false })

  return (
    <>
      <TopBar title="Media" />
      <main className="flex flex-col gap-6 px-6 lg:px-12 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader title="Media Library" description={`${media?.length ?? 0} files`} />
        <MediaGrid initialMedia={media ?? []} />
      </main>
    </>
  )
}
