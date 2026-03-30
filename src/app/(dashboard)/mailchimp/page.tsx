import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { MailchimpDashboard } from '@/components/mailchimp/MailchimpDashboard'
import { MobileAppBar } from '@/components/mobile/MobileAppBar'
import { mc } from '@/lib/mailchimp'
import type { MailchimpSettings, MailchimpAudienceStats } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Sparkles } from 'lucide-react'

const DEFAULTS: MailchimpSettings = {
  api_key: '',
  audience_id: '',
  from_name: '',
  from_email: 'info@northernwarrior.co.uk',
  reply_to: '',
}

export default async function MailchimpPage() {
  const supabase = createAdminClient()

  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const rawSettings = settingsData?.value
    ? { ...DEFAULTS, ...(settingsData.value as Partial<MailchimpSettings>) }
    : { ...DEFAULTS }

  const initialSettings: MailchimpSettings = {
    ...rawSettings,
    api_key: rawSettings.api_key ? '••••••••' : '',
  }

  let initialStats: { audience: MailchimpAudienceStats } | null = null

  if (rawSettings.api_key && rawSettings.audience_id) {
    try {
      const listRes = await mc(rawSettings.api_key, `/lists/${rawSettings.audience_id}`)
      if (listRes.ok) {
        const listJson = await listRes.json()
        initialStats = {
          audience: {
            member_count: listJson.stats?.member_count ?? 0,
            open_rate: listJson.stats?.open_rate ?? 0,
            click_rate: listJson.stats?.click_rate ?? 0,
          },
        }
      }
    } catch {
      // best-effort
    }
  }

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden flex flex-col bg-nw-950 min-h-[100dvh]">
        <MobileAppBar
          title="Marketing"
          actions={
            <Link href="/mailchimp/create-ai" className="w-9 h-9 flex items-center justify-center rounded-lg text-[#e0c97f] active:bg-white/[0.06]">
              <Sparkles size={18} />
            </Link>
          }
        />
        <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))] p-3 flex flex-col gap-3">
          {initialStats ? (
            <>
              {[
                { label: 'Subscribers',  value: initialStats.audience.member_count },
                { label: 'Open Rate',    value: `${(initialStats.audience.open_rate * 100).toFixed(1)}%` },
                { label: 'Click Rate',   value: `${(initialStats.audience.click_rate * 100).toFixed(1)}%` },
              ].map((stat) => (
                <div key={stat.label} className="bg-nw-900 rounded-xl p-4 border border-[rgba(255,255,255,0.09)]">
                  <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-[26px] font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{stat.value}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-[14px] text-[#888]">Configure Mailchimp in settings</p>
              <Link href="/settings" className="text-[12px] text-gold-300">Go to Settings</Link>
            </div>
          )}
          <Link
            href="/mailchimp/create-ai"
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-nw-950 text-[13px] font-semibold mt-2"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <Sparkles size={16} />
            AI Email Creator
          </Link>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block bg-nw-900 min-h-screen">
        <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
          <PageHeader
            eyebrow="Admin Panel"
            title="Email"
            titleGold="Marketing"
            description="Manage your email audience, sync subscribers, and send campaigns"
            actions={
              <Link href="/mailchimp/create-ai">
                <Button variant="primary" size="sm">
                  <Sparkles size={14} /> AI Email Creator
                </Button>
              </Link>
            }
          />
          <MailchimpDashboard initialSettings={initialSettings} initialStats={initialStats} />
        </main>
      </div>
    </>
  )
}
