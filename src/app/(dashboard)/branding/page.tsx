import { createAdminClient } from '@/lib/supabase/admin'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { BrandingStudio } from '@/components/branding/BrandingStudio'

export default async function BrandingPage() {
  const supabase = createAdminClient()
  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const placeId: string = settingsData?.value?.google_place_id ?? ''

  return (
    <div className="bg-nw-900 min-h-screen">
      <TopBar title="Branding Studio" />
      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader eyebrow="Admin Panel" title="Branding" titleGold="Studio" />
        <BrandingStudio placeId={placeId} />
      </main>
    </div>
  )
}
