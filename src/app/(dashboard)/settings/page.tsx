import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Panel, PanelHeader } from '@/components/ui/Card'
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
            eyebrow="Config"
            title="Settings"
          />

          <Panel>
            <PanelHeader eyebrow="CMS" title="Global Settings" />
            <div className="p-4">
              <p className="text-xs text-nw-500 mb-4">Navigation, footer, contact info, and social links used across the site.</p>
              <GlobalSettingsEditor initialSettings={settingsMap} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader eyebrow="Integrations" title="Social Media" />
            <div className="p-4">
              <p className="text-xs text-nw-500 mb-4">Connect Facebook, Instagram, and LinkedIn to publish branded posts directly from the Branding Studio.</p>
              <SocialConnections />
            </div>
          </Panel>

          <Panel id="digest-preferences" className="scroll-mt-24">
            <PanelHeader eyebrow="Automation" title="Digest Preferences" />
            <div className="p-4">
              <p className="text-xs text-nw-500 mb-4">Configure your daily morning digest email — who receives it and whether it&apos;s enabled.</p>
              <DigestPreferences
                initialRecipient={settingsMap['digest_recipient'] ?? 'info@northernwarrior.co.uk'}
                initialEnabled={settingsMap['digest_enabled'] !== 'false'}
                initialSendHour={parseInt(settingsMap['digest_send_hour'] ?? '8', 10)}
                initialProcessInterval={parseInt(settingsMap['inbox_process_interval'] ?? '5', 10)}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader eyebrow="Auth" title="Account &amp; Security" />
            <div className="p-4">
              <p className="text-xs text-nw-500 mb-4">Manage your password, email address, and active sessions.</p>
              <AccountSecuritySettings />
            </div>
          </Panel>
        </main>
      </div>
    </>
  )
}
