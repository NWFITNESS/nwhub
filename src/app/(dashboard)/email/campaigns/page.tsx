import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export default async function EmailCampaignsPage() {
  const supabase = await createClient()
  const { data: campaigns } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <TopBar title="Email Campaigns" />
      <main style={{ paddingLeft: '48px', paddingRight: '48px' }} className="flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader
          title="Email Campaigns"
          actions={
            <Link href="/email/campaigns/new">
              <Button variant="primary" size="sm"><Plus size={14} /> New Campaign</Button>
            </Link>
          }
        />
        <div className="bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Name', 'Subject', 'Status', 'Sent', 'Opened', 'Date'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!campaigns?.length ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <p className="text-sm font-medium text-white/40">No campaigns yet</p>
                        <p className="text-xs text-white/20">Create your first campaign to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors duration-200">
                      <td className="px-6 py-4 font-medium text-[#F0F0F0]">{c.name}</td>
                      <td className="px-6 py-4 text-white/50 max-w-48 truncate">{c.subject}</td>
                      <td className="px-6 py-4"><Badge variant={c.status as 'draft' | 'sent'}>{c.status}</Badge></td>
                      <td className="px-6 py-4 text-white/50">{c.stats?.sent ?? 0}</td>
                      <td className="px-6 py-4 text-white/50">{c.stats?.opened ?? 0}</td>
                      <td className="px-6 py-4 text-white/40 text-xs">
                        {c.sent_at ? format(new Date(c.sent_at), 'dd MMM yyyy') : format(new Date(c.created_at), 'dd MMM yyyy')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  )
}
