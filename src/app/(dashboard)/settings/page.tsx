import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { GlobalSettingsEditor } from '@/components/content/GlobalSettingsEditor'
import { AccountSecuritySettings } from '@/components/content/AccountSecuritySettings'
import { SocialConnections } from '@/components/settings/SocialConnections'
import { DigestPreferences } from '@/components/settings/DigestPreferences'
import { MobileSettings } from '@/components/mobile/MobileSettings'

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
      {/* Mobile layout */}
      <MobileSettings />

      {/* Desktop layout */}
      <div className="hidden lg:block">
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

        <div id="digest-preferences" className="mt-4 scroll-mt-24">
          <PageHeader
            title="Digest Preferences"
            description="Configure your daily morning digest email — who receives it and whether it's enabled."
          />
        </div>
        <DigestPreferences
          initialRecipient={settingsMap['digest_recipient'] ?? 'info@northernwarrior.co.uk'}
          initialEnabled={settingsMap['digest_enabled'] !== 'false'}
          initialSendHour={parseInt(settingsMap['digest_send_hour'] ?? '8', 10)}
          initialProcessInterval={parseInt(settingsMap['inbox_process_interval'] ?? '5', 10)}
        />

        <div className="mt-4">
          <PageHeader
            title="Account & Security"
            description="Manage your password, email address, and active sessions."
          />
        </div>
        <AccountSecuritySettings />
      </main>
      </div>
    </>
  )
}
