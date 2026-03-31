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
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Content" title="Media" titleGold="Library" description={`${media?.length ?? 0} files`} />
      <MediaGrid initialMedia={media ?? []} />
    </div>
  )
}
