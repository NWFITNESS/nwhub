import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { mc, resolveApiKey } from '@/lib/mailchimp'
import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
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
            settings: c.settings as { subject_line: string; title: string },
            status: c.status as string,
            send_time: (c.send_time as string) ?? null,
            emails_sent: (c.emails_sent as number) ?? 0,
            opens: report?.opens,
            clicks: report?.clicks,
          }
        })
      }
    } catch {
      // Mailchimp API error — show empty state
    }
  }

  function statusVariant(status: string) {
    switch (status) {
      case 'sent': return 'sent' as const
      case 'draft': return 'draft' as const
      case 'schedule': case 'scheduled': return 'gold' as const
      case 'sending': return 'active' as const
      case 'paused': return 'paused' as const
      default: return 'default' as const
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
        <Panel>
          <PanelHeader eyebrow="Mailchimp" title="All Campaigns" />

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  {['Name', 'Status', 'Sent', 'Opens', 'Clicks', 'Date'].map(h => (
                    <th key={h} className="border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-left text-nw-500" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.1px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-nw-500">No campaigns yet</td></tr>
                ) : campaigns.map(c => (
                  <tr key={c.id} className="transition-colors hover:bg-[rgba(255,255,255,0.03)]">
                    <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                      <p className="font-medium text-nw-200 truncate" style={{ maxWidth: 260 }}>{c.settings.title || c.settings.subject_line}</p>
                      {c.settings.title && c.settings.subject_line && c.settings.title !== c.settings.subject_line && (
                        <p className="text-nw-500 truncate mt-0.5" style={{ fontSize: 11 }}>{c.settings.subject_line}</p>
                      )}
                    </td>
                    <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                      <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-300">{c.emails_sent > 0 ? c.emails_sent.toLocaleString() : '—'}</td>
                    <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                      {c.opens ? (
                        <span className="text-[#4ade80] font-medium">{(c.opens.open_rate * 100).toFixed(1)}%</span>
                      ) : '—'}
                    </td>
                    <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                      {c.clicks ? (
                        <span className="text-gold-300 font-medium">{(c.clicks.click_rate * 100).toFixed(1)}%</span>
                      ) : '—'}
                    </td>
                    <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-500" style={{ fontSize: 11 }}>
                      {c.send_time ? format(new Date(c.send_time), 'dd MMM yyyy') : 'Draft'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card rows */}
          <div className="md:hidden">
            {campaigns.length === 0 ? (
              <div className="px-4 py-12 text-center text-nw-500">No campaigns yet</div>
            ) : campaigns.map(c => (
              <div key={c.id} className="border-b border-[rgba(255,255,255,0.05)] p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-nw-200" style={{ fontSize: 14 }}>{c.settings.title || c.settings.subject_line}</p>
                  <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                </div>
                {c.settings.subject_line && c.settings.title !== c.settings.subject_line && (
                  <p className="text-nw-500 mb-2" style={{ fontSize: 12 }}>{c.settings.subject_line}</p>
                )}
                <div className="flex items-center gap-4" style={{ fontSize: 11 }}>
                  {c.emails_sent > 0 && <span className="text-nw-400">{c.emails_sent} sent</span>}
                  {c.opens && <span className="text-[#4ade80]">{(c.opens.open_rate * 100).toFixed(1)}% opens</span>}
                  {c.clicks && <span className="text-gold-300">{(c.clicks.click_rate * 100).toFixed(1)}% clicks</span>}
                  <span className="text-nw-500 ml-auto">{c.send_time ? format(new Date(c.send_time), 'dd MMM') : 'Draft'}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
