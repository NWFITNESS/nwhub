import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('global_settings')
    .select('*')

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s) => [s.key, s.value])
  )

  return (
    <SettingsClient
      initialDigestRecipient={settingsMap['digest_recipient'] ?? 'info@northernwarrior.co.uk'}
      initialDigestEnabled={settingsMap['digest_enabled'] !== 'false'}
      initialDigestSendHour={parseInt(settingsMap['digest_send_hour'] ?? '8', 10)}
      initialProcessInterval={parseInt(settingsMap['inbox_process_interval'] ?? '5', 10)}
    />
  )
}
