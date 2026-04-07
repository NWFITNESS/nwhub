import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Card'
import { CampaignsList } from '@/components/email/CampaignsList'
import { MailchimpConnectionPanel } from '@/components/email/MailchimpConnectionPanel'
import { mc, resolveApiKey } from '@/lib/mailchimp'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { MailchimpSettings, MailchimpCampaignRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EmailCampaignsPage() {
  const supabase = createAdminClient()
  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings = (settingsData?.value ?? {}) as Partial<MailchimpSettings>
  const dbApiKey = settings.api_key ?? ''
  const apiKey = resolveApiKey(dbApiKey)
  const audienceId = settings.audience_id ?? ''

  // Detect API key source for the status panel
  const apiKeySource: 'env' | 'database' | 'none' = process.env.MAILCHIMP_API_KEY
    ? 'env'
    : dbApiKey
    ? 'database'
    : 'none'

  // Test connection by hitting the audience endpoint
  let connected = false
  let connectionError: string | null = null
  let audienceName: string | null = null
  let memberCount: number | null = null

  if (apiKey) {
    try {
      // If we have an audience selected, fetch its details to verify both key + audience
      if (audienceId) {
        const audRes = await mc(apiKey, `/lists/${audienceId}?fields=id,name,stats.member_count`)
        if (audRes.ok) {
          const data = await audRes.json()
          connected = true
          audienceName = data.name ?? null
          memberCount = data.stats?.member_count ?? null
        } else {
          const err = await audRes.json().catch(() => ({}))
          connectionError = err.detail ?? `Mailchimp returned ${audRes.status}`
        }
      } else {
        // No audience selected — just verify the key works by listing audiences
        const pingRes = await mc(apiKey, '/lists?count=1&fields=lists.id')
        if (pingRes.ok) {
          connected = true
        } else {
          const err = await pingRes.json().catch(() => ({}))
          connectionError = err.detail ?? `Mailchimp returned ${pingRes.status}`
        }
      }
    } catch (e) {
      connectionError = e instanceof Error ? e.message : 'Connection failed'
    }
  } else {
    connectionError = 'No API key configured'
  }

  let campaigns: MailchimpCampaignRow[] = []

  if (connected && apiKey && audienceId) {
    try {
      const [campaignsRes, reportsRes] = await Promise.all([
        mc(apiKey, `/campaigns?list_id=${audienceId}&count=50&sort_field=create_time&sort_dir=DESC`),
        mc(apiKey, `/reports?count=50&sort_field=send_time&sort_dir=DESC`),
      ])

      if (campaignsRes.ok) {
        const campaignsJson = await campaignsRes.json()
        const reportsJson = reportsRes.ok ? await reportsRes.json() : { reports: [] }

        const reportMap = new Map<string, { opens: { open_rate: number; unique_opens: number }; clicks: { click_rate: number; unique_clicks: number } }>()
        for (const r of reportsJson.reports ?? []) {
          reportMap.set(r.id, { opens: r.opens, clicks: r.clicks })
        }

        campaigns = (campaignsJson.campaigns ?? []).map((c: Record<string, unknown>) => {
          const report = reportMap.get(c.id as string)
          return {
            id: c.id,
            settings: c.settings as { subject_line: string; title: string; preview_text?: string },
            status: c.status as string,
            send_time: (c.send_time as string) ?? null,
            emails_sent: (c.emails_sent as number) ?? 0,
            opens: report?.opens,
            clicks: report?.clicks,
          }
        })
      }
    } catch {
      // Mailchimp API error
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Marketing"
        title="Email"
        titleGold="Campaigns"
        actions={
          <Link href="/mailchimp/create-ai">
            <Button variant="gold" size="sm"><Plus size={14} /> Create Campaign</Button>
          </Link>
        }
      />

      <MailchimpConnectionPanel
        initialConnected={connected}
        initialError={connectionError}
        apiKeySource={apiKeySource}
        initialAudienceId={audienceId}
        initialAudienceName={audienceName}
        initialMemberCount={memberCount}
        initialFromName={settings.from_name ?? ''}
        initialFromEmail={settings.from_email ?? ''}
        initialReplyTo={settings.reply_to ?? ''}
      />

      {connected && audienceId ? (
        <CampaignsList campaigns={campaigns as MailchimpCampaignRow[]} />
      ) : null}
    </div>
  )
}
