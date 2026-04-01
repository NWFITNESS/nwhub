import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { GlobalSettingsEditor } from '@/components/content/GlobalSettingsEditor'
import { AccountSecuritySettings } from '@/components/content/AccountSecuritySettings'
import { SocialConnections } from '@/components/settings/SocialConnections'
import { DigestPreferences } from '@/components/settings/DigestPreferences'
import { MembershipGroups } from '@/components/settings/MembershipGroups'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('global_settings')
    .select('*')

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s) => [s.key, s.value])
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="System"
        title="Settings"
      />

      <Panel>
        <PanelHeader eyebrow="Members" title="Membership Groups" />
        <div className="p-4">
          <MembershipGroups initialGroups={(settingsMap['member_groups'] as string[] | undefined) ?? []} />
        </div>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="CMS" title="Global Settings" />
        <div className="p-4">
          <p className="text-[11px] text-nw-500 mb-4">Navigation, footer, contact info, and social links used across the site.</p>
          <GlobalSettingsEditor initialSettings={settingsMap} />
        </div>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Integrations" title="Social Media" />
        <div className="p-4">
          <p className="text-[11px] text-nw-500 mb-4">Connect Facebook, Instagram, and LinkedIn to publish branded posts directly from the Branding Studio.</p>
          <SocialConnections />
        </div>
      </Panel>

      <Panel id="digest-preferences" className="scroll-mt-24">
        <PanelHeader eyebrow="Automation" title="Digest Preferences" />
        <div className="p-4">
          <p className="text-[11px] text-nw-500 mb-4">Configure your daily morning digest email — who receives it and whether it&apos;s enabled.</p>
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
          <p className="text-[11px] text-nw-500 mb-4">Manage your password, email address, and active sessions.</p>
          <AccountSecuritySettings />
        </div>
      </Panel>
    </div>
  )
}
