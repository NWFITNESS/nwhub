import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { GlobalSettingsEditor } from '@/components/content/GlobalSettingsEditor'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('global_settings')
    .select('*')

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s) => [s.key, s.value])
  )

  return (
    <>
      <TopBar title="Settings" />
      <main className="p-6">
        <PageHeader
          title="Global Settings"
          description="Navigation, footer, contact info, and social links used across the site."
        />
        <GlobalSettingsEditor initialSettings={settingsMap} />
      </main>
    </>
  )
}
