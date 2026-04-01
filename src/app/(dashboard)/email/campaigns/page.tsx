import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Card'
import { CampaignsList } from '@/components/email/CampaignsList'
import { mc, resolveApiKey } from '@/lib/mailchimp'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { MailchimpSettings, MailchimpCampaignRow } from '@/lib/types'

export default async function EmailCampaignsPage() {
  const supabase = createAdminClient()
  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings = (settingsData?.value ?? {}) as Partial<MailchimpSettings>
  const apiKey = resolveApiKey(settings.api_key)
  const audienceId = settings.audience_id ?? ''

  let campaigns: MailchimpCampaignRow[] = []

  if (apiKey && audienceId) {
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

      {!apiKey || !audienceId ? (
        <Panel>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-nw-400" style={{ fontSize: 14 }}>Connect Mailchimp to view campaigns</p>
            <Link href="/settings"><Button variant="gold" size="sm">Go to Settings</Button></Link>
          </div>
        </Panel>
      ) : (
        <CampaignsList campaigns={campaigns as MailchimpCampaignRow[]} />
      )}
    </div>
  )
}
