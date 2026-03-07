import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mc } from '@/lib/mailchimp'
import type { MailchimpSettings, MailchimpCampaignRow } from '@/lib/types'

export async function GET() {
  const supabase = createAdminClient()
  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings = (settingsData?.value ?? {}) as Partial<MailchimpSettings>
  const { api_key, audience_id } = settings

  if (!api_key || !audience_id) {
    return NextResponse.json({ error: 'Mailchimp not configured' }, { status: 400 })
  }

  const [listRes, campaignsRes, reportsRes] = await Promise.all([
    mc(api_key, `/lists/${audience_id}`),
    mc(api_key, `/campaigns?list_id=${audience_id}&count=10&sort_field=send_time&sort_dir=DESC&status=sent`),
    mc(api_key, `/reports?list_id=${audience_id}&count=10`),
  ])

  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}))
    return NextResponse.json({ error: err.detail ?? 'Failed to load audience' }, { status: listRes.status })
  }

  const listJson = await listRes.json()
  const audience = {
    member_count: listJson.stats?.member_count ?? 0,
    open_rate: listJson.stats?.open_rate ?? 0,
    click_rate: listJson.stats?.click_rate ?? 0,
  }

  const campaignsJson = campaignsRes.ok ? await campaignsRes.json() : { campaigns: [] }
  const reportsJson = reportsRes.ok ? await reportsRes.json() : { reports: [] }

  // Build a map of report data keyed by campaign id
  const reportMap = new Map<string, { open_rate: number; unique_opens: number; click_rate: number; unique_clicks: number }>()
  for (const r of reportsJson.reports ?? []) {
    reportMap.set(r.id, {
      open_rate: r.opens?.open_rate ?? 0,
      unique_opens: r.opens?.unique_opens ?? 0,
      click_rate: r.clicks?.click_rate ?? 0,
      unique_clicks: r.clicks?.unique_clicks ?? 0,
    })
  }

  const campaigns: MailchimpCampaignRow[] = (campaignsJson.campaigns ?? []).map((c: {
    id: string
    settings: { subject_line: string; title: string }
    status: string
    send_time: string | null
    emails_sent: number
  }) => {
    const report = reportMap.get(c.id)
    return {
      id: c.id,
      settings: { subject_line: c.settings?.subject_line ?? '', title: c.settings?.title ?? '' },
      status: c.status,
      send_time: c.send_time ?? null,
      emails_sent: c.emails_sent ?? 0,
      opens: report ? { open_rate: report.open_rate, unique_opens: report.unique_opens } : undefined,
      clicks: report ? { click_rate: report.click_rate, unique_clicks: report.unique_clicks } : undefined,
    }
  })

  return NextResponse.json({ audience, campaigns })
}
