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
      <main className="p-6">
        <PageHeader
          title="WhatsApp Campaigns"
          actions={<Link href="/sms/campaigns/new"><Button variant="primary" size="sm"><Plus size={14} /> New Campaign</Button></Link>}
        />
        <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                {['Name', 'Message', 'Status', 'Sent', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!campaigns?.length ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-white/30">No campaigns yet</td></tr>
              ) : campaigns.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 text-white/60 max-w-64 truncate">{c.message}</td>
                  <td className="px-4 py-3"><Badge variant={c.status as 'draft' | 'sent'}>{c.status}</Badge></td>
                  <td className="px-4 py-3 text-white/50">{c.stats?.sent ?? 0}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{format(new Date(c.created_at), 'dd MMM yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
