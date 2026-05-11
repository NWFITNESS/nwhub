import { PageHeader } from '@/components/layout/PageHeader'
import { PopupBuilder } from '@/components/popup/PopupBuilder'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function PopupPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'popup_settings')
    .single()

  const initial = data?.value as { published?: unknown; draft?: unknown } | null

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Marketing"
        title="Popup"
        titleGold=" Builder"
        description="Design the promotional popup shown to visitors"
      />
      <PopupBuilder initial={initial as never} />
    </div>
  )
}
