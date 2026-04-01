import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { BrandingStudio } from '@/components/branding/BrandingStudio'
import type { Media } from '@/lib/types'

export default async function PostStudioPage() {
  const supabase = createAdminClient()

  const { data: reviewSettings } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const placeId: string = reviewSettings?.value?.google_place_id ?? ''

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Branding" title="Post" titleGold="Studio" description="Create branded social posts from Google reviews" />
      <BrandingStudio placeId={placeId} />
    </div>
  )
}
