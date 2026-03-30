import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { BrandPage } from '@/components/branding/BrandPage'
import type { BrandIdentity } from '@/components/branding/BrandPage'
import type { Media } from '@/lib/types'

export default async function BrandingPage() {
  const supabase = createAdminClient()

  const [
    { data: brandSettings },
    { data: reviewSettings },
    { data: mediaRows },
  ] = await Promise.all([
    supabase.from('global_settings').select('value').eq('key', 'brand_identity').single(),
    supabase.from('global_settings').select('value').eq('key', 'review_settings').single(),
    supabase.from('media').select('*').order('created_at', { ascending: false }),
  ])

  const identity: BrandIdentity = (brandSettings?.value as BrandIdentity | undefined) ?? {
    mission: '',
    tagline: '',
    strapline: '',
    values: [],
    colours: [],
    logo_ids: [],
    voice_tone: '',
    tone_keywords: [],
  }

  const placeId: string = reviewSettings?.value?.google_place_id ?? ''
  const media: Media[] = (mediaRows ?? []) as Media[]

  return (
    <div className="bg-nw-900 min-h-screen">
      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader eyebrow="Admin Panel" title="Branding" titleGold="Studio" />
        <BrandPage identity={identity} media={media} placeId={placeId} />
      </main>
    </div>
  )
}
