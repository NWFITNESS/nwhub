import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { GlobalSettingsEditor } from '@/components/content/GlobalSettingsEditor'
import { AccountSecuritySettings } from '@/components/content/AccountSecuritySettings'
import { SocialConnections } from '@/components/settings/SocialConnections'
import { AppInstallSetting } from '@/components/AppInstallSetting'

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
      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader
          title="Global Settings"
          description="Navigation, footer, contact info, and social links used across the site."
        />
        <GlobalSettingsEditor initialSettings={settingsMap} />

        <div className="mt-4">
          <PageHeader
            title="Social Media"
            description="Connect Facebook, Instagram, and LinkedIn to publish branded posts directly from the Branding Studio."
          />
        </div>
        <SocialConnections />

        <div className="mt-4">
          <PageHeader
            title="App"
            description="Install NWHub to your desktop for faster, native-like access."
          />
        </div>
        <AppInstallSetting />

        <div className="mt-4">
          <PageHeader
            title="Account & Security"
            description="Manage your password, email address, and active sessions."
          />
        </div>
        <AccountSecuritySettings />
      </main>
    </>
  )
}
