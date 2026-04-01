import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { BrandGuidePage } from '@/components/branding/BrandGuidePage'
import type { BrandIdentity } from '@/components/branding/BrandPage'
import type { Media } from '@/lib/types'

export default async function BrandAssetsPage() {
  const supabase = createAdminClient()

  const [{ data: brandSettings }, { data: mediaRows }] = await Promise.all([
    supabase.from('global_settings').select('value').eq('key', 'brand_identity').single(),
    supabase.from('media').select('*').order('created_at', { ascending: false }),
  ])

  const identity: BrandIdentity = (brandSettings?.value as BrandIdentity | undefined) ?? {
    mission: '', tagline: '', strapline: '', values: [], colours: [], logo_ids: [], voice_tone: '', tone_keywords: [],
  }

  const media: Media[] = (mediaRows ?? []) as Media[]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Branding" title="Brand" titleGold="Assets" description="Your brand identity, colours, logos, typography and voice" />
      <BrandGuidePage identity={identity} media={media} />
    </div>
  )
}
