import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export default async function SmsCampaignsPage() {
  const supabase = await createClient()
  const { data: campaigns } = await supabase
    .from('sms_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <TopBar title="WhatsApp Campaigns" />
      <main className="flex flex-col gap-6 p-8 min-h-[calc(100vh-5rem)]">
        <PageHeader
          title="WhatsApp Campaigns"
          actions={<Link href="/sms/campaigns/new"><Button variant="primary" size="sm"><Plus size={14} /> New Campaign</Button></Link>}
        />
        <div className="bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Name', 'Message', 'Status', 'Sent', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!campaigns?.length ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <p className="text-sm font-medium text-white/40">No campaigns yet</p>
                        <p className="text-xs text-white/20">Create your first WhatsApp campaign to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors duration-200">
                    <td className="px-5 py-4 font-medium text-[#F0F0F0]">{c.name}</td>
                    <td className="px-5 py-4 text-white/50 max-w-64 truncate">{c.message}</td>
                    <td className="px-5 py-4"><Badge variant={c.status as 'draft' | 'sent'}>{c.status}</Badge></td>
                    <td className="px-5 py-4 text-white/50">{c.stats?.sent ?? 0}</td>
                    <td className="px-5 py-4 text-white/40 text-xs">{format(new Date(c.created_at), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  )
}
